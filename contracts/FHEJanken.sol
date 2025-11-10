// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "hardhat/console.sol";

contract FHEJanken is SepoliaConfig {
    // Game
    struct Game {
        GameMode mode;
        address player1;
        address player2;
        euint8 encryptedMove1;
        euint8 encryptedMove2;
        ebool encryptedPlayer1Won;
        ebool isGameDraw;
        bool move1Submitted;
        bool move2Submitted;
        bool isGamefinished;
        address winner;
    }

    // Game mode
    enum GameMode {
        SinglePlayer,
        TwoPlayer
    }

    // GameResult
    enum GameResult {
        Draw,
        Player1Won,
        Player2Won
    }

    // Game move constants:  1 = Rock, 2 = Paper, 3 = Scissors
    uint8 constant ROCK = 1;
    uint8 constant PAPER = 2;
    uint8 constant SCISSORS = 3;

    // Storage
    uint256 public gameId;
    mapping(uint256 => Game) public games;

    // Decryption request tracking
    mapping(uint256 => uint256) public decryptionRequestToGame; // requestId => gameId

    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, GameMode mode);
    event PlayerJoined(uint256 gameId, address indexed player2);
    event MoveSubmitted(uint256 indexed gameId, address indexed player, euint8 move);
    event GameFinished(uint256 indexed gameId, GameResult result, address winner);

    function createTwoPlayerGame() external returns (uint256) {
        gameId++;
        uint256 newGameId = gameId;
        games[newGameId] = Game({
            mode: GameMode.TwoPlayer,
            player1: msg.sender,
            player2: address(0),
            encryptedMove1: FHE.asEuint8(0),
            encryptedMove2: FHE.asEuint8(0),
            encryptedPlayer1Won: FHE.asEbool(false),
            isGameDraw: FHE.asEbool(false),
            move1Submitted: false,
            move2Submitted: false,
            isGamefinished: false,
            winner: address(0)
        });
        emit GameCreated(newGameId, msg.sender, GameMode.TwoPlayer);
        return newGameId;
    }

    function createSinglePlayerGame() external returns (uint256) {
        gameId++;
        uint256 newGameId = gameId;
        games[newGameId] = Game({
            mode: GameMode.SinglePlayer,
            player1: msg.sender,
            player2: address(0),
            encryptedMove1: FHE.asEuint8(0),
            encryptedMove2: FHE.asEuint8(0),
            encryptedPlayer1Won: FHE.asEbool(false),
            isGameDraw: FHE.asEbool(false),
            move1Submitted: false,
            move2Submitted: false,
            isGamefinished: false,
            winner: address(0)
        });
        emit GameCreated(newGameId, msg.sender, GameMode.SinglePlayer);
        return newGameId;
    }

    function joinGame(uint256 _gameId) external {
        Game storage game = games[_gameId];

        require(!game.isGamefinished, "Game already finished");
        require(msg.sender != game.player1, "Cannot join your own game");
        require(game.mode == GameMode.TwoPlayer, "Cannot join single-player game");

        game.player2 = msg.sender;
        emit PlayerJoined(_gameId, msg.sender);
    }

    function submitMove(uint256 _gameId, externalEuint8 encryptedMove1, bytes calldata inputProof) external {
        Game storage game = games[_gameId];

        require(!game.isGamefinished, "Game already finished");

        // Single-player mode
        if (game.mode == GameMode.SinglePlayer) {
            // Set CPU address as player 2
            game.player2 = address(1);
            require(msg.sender == game.player1, "Not a player in this game");
        } else {
            // For two-player mode, ensure game has two players
            require(game.player2 != address(0), "Waiting for second player to join");
            require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player in this game");
        }

        euint8 move = FHE.fromExternal(encryptedMove1, inputProof);

        if (msg.sender == game.player1) {
            require(!game.move1Submitted, "Move already submitted");
            game.encryptedMove1 = move;
            game.move1Submitted = true;
            FHE.allowThis(game.encryptedMove1);
            emit MoveSubmitted(_gameId, msg.sender, move);
        } else {
            require(!game.move2Submitted, "Move already submitted");
            game.encryptedMove2 = move;
            game.move2Submitted = true;
            FHE.allowThis(game.encryptedMove2);
            emit MoveSubmitted(_gameId, msg.sender, move);
        }

        // If single-player mode generate second player random move
        if (game.mode == GameMode.SinglePlayer && !game.move2Submitted) {
            _generateMove(_gameId);
        }
        if (game.move1Submitted && game.move2Submitted) {
            _determineWinner(_gameId);
        }
    }

    function _generateMove(uint256 _gameId) private {
        Game storage game = games[_gameId];
        euint8 randomValue = FHE.randEuint8();

        // Map random value to 1, 2, or 3 (Rock, Paper, Scissors)
        // Use modulo 3 to get 0, 1, or 2, then add 1 to get 1, 2, or 3
        euint8 mod3 = FHE.rem(randomValue, 3);
        euint8 move = FHE.add(mod3, FHE.asEuint8(1));
        game.encryptedMove2 = move;
        game.move2Submitted = true;
        FHE.allowThis(game.encryptedMove2);
        emit MoveSubmitted(_gameId, address(this), move);
    }

    function _determineWinner(uint256 _gameId) private {
        Game storage game = games[_gameId];

        euint8 move1 = game.encryptedMove1;
        euint8 move2 = game.encryptedMove2;

        ebool isDraw = FHE.eq(move1, move2);

        ebool rockBeatsScissors = FHE.and(FHE.eq(move1, FHE.asEuint8(ROCK)), FHE.eq(move2, FHE.asEuint8(SCISSORS)));

        ebool paperBeatsRock = FHE.and(FHE.eq(move1, FHE.asEuint8(PAPER)), FHE.eq(move2, FHE.asEuint8(ROCK)));

        ebool scissorsBeatsPaper = FHE.and(FHE.eq(move1, FHE.asEuint8(SCISSORS)), FHE.eq(move2, FHE.asEuint8(PAPER)));

        ebool player1Wins = FHE.or(FHE.or(rockBeatsScissors, paperBeatsRock), scissorsBeatsPaper);
        game.encryptedPlayer1Won = player1Wins;
        game.isGameDraw = isDraw;
        FHE.allowThis(game.encryptedPlayer1Won);
        FHE.allowThis(game.isGameDraw);
        FHE.makePubliclyDecryptable(game.encryptedPlayer1Won);
    }

    function checkWinner(uint256 _gameId) external {
        Game storage game = games[_gameId];

        require(!game.isGamefinished, "Game already finished");

        bytes32[] memory cypherTexts = new bytes32[](2);
        cypherTexts[0] = FHE.toBytes32(game.isGameDraw);
        cypherTexts[1] = FHE.toBytes32(game.encryptedPlayer1Won);

        uint256 requestId = FHE.requestDecryption(cypherTexts, this.callbackWinnerDetermination.selector);

        // Store the mapping from requestId to gameId
        decryptionRequestToGame[requestId] = _gameId;
    }

    function callbackWinnerDetermination(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify the decryption proof
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        (bool _clearIsGameDraw, bool _clearPlayer1Won) = abi.decode(cleartexts, (bool, bool));

        uint256 _gameId = decryptionRequestToGame[requestId];
        Game storage game = games[_gameId];

        if (_clearIsGameDraw) {
            emit GameFinished(_gameId, GameResult.Draw, address(0)); // No winner
        } else if (_clearPlayer1Won) {
            game.winner = game.player1;
            emit GameFinished(_gameId, GameResult.Player1Won, game.player1); // Player1 Won
        } else {
            game.winner = game.player2;
            emit GameFinished(_gameId, GameResult.Player2Won, game.player2); // Player2 Won
        }
        game.isGamefinished = true;
        delete decryptionRequestToGame[requestId];
    }
}
