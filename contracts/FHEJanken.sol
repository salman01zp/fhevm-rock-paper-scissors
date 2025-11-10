// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Rock-Paper-Scissors Game
/// @notice Rock-Paper-Scissors game using FHE for encrypted moves
/// @author salman01zp
contract FHEJanken is SepoliaConfig {
    /// @notice Game state
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

    /// @notice Game mode types
    enum GameMode {
        SinglePlayer,
        TwoPlayer
    }

    /// @notice Game result types
    enum GameResult {
        Draw,
        Player1Won,
        Player2Won
    }

    // Constants
    uint8 internal constant ROCK = 1;
    uint8 internal constant PAPER = 2;
    uint8 internal constant SCISSORS = 3;

    // Storage
    /// @notice Current game ID counter
    uint256 public gameId;
    /// @notice Game data by ID
    mapping(uint256 gameId => Game game) public games;
    /// @notice Maps decryption request to game ID
    mapping(uint256 requestId => uint256 gameId) public decryptionRequestToGame;

    // Events
    /// @notice Emitted when a game is created
    /// @param gameId Game ID
    /// @param player1 Creator address
    /// @param mode Game mode
    event GameCreated(uint256 indexed gameId, address indexed player1, GameMode mode);
    /// @notice Emitted when player joins
    /// @param gameId Game ID
    /// @param player2 Joiner address
    event PlayerJoined(uint256 indexed gameId, address indexed player2);
    /// @notice Emitted when move is submitted
    /// @param gameId Game ID
    /// @param player Player address
    /// @param move Encrypted move
    event MoveSubmitted(uint256 indexed gameId, address indexed player, euint8 move);
    /// @notice Emitted when game finishes
    /// @param gameId Game ID
    /// @param result Game result
    /// @param winner Winner address
    event GameFinished(uint256 indexed gameId, GameResult result, address winner);

    // Errors
    error GameAlreadyFinished();
    error CannotJoinOwnGame();
    error CannotJoinSinglePlayerGame();
    error NotAPlayer();
    error WaitingForPlayer2();
    error MoveAlreadySubmitted();

    /// @notice Create a two-player game
    /// @return Game ID
    function createTwoPlayerGame() external returns (uint256) {
        ++gameId;
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

    /// @notice Create a single-player game against CPU
    /// @return Game ID
    function createSinglePlayerGame() external returns (uint256) {
        ++gameId;
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

    /// @notice Join an existing two-player game
    /// @param _gameId Game ID to join
    function joinGame(uint256 _gameId) external {
        Game storage game = games[_gameId];

        if (game.isGamefinished) revert GameAlreadyFinished();
        if (msg.sender == game.player1) revert CannotJoinOwnGame();
        if (game.mode != GameMode.TwoPlayer) revert CannotJoinSinglePlayerGame();

        game.player2 = msg.sender;
        emit PlayerJoined(_gameId, msg.sender);
    }

    /// @notice Submit an encrypted move
    /// @param _gameId Game ID
    /// @param encryptedMove1 Encrypted move (1=Rock, 2=Paper, 3=Scissors)
    /// @param inputProof Proof for encrypted input
    function submitMove(uint256 _gameId, externalEuint8 encryptedMove1, bytes calldata inputProof) external {
        Game storage game = games[_gameId];
        if (game.isGamefinished) revert GameAlreadyFinished();

        _validatePlayer(game);
        euint8 move = FHE.fromExternal(encryptedMove1, inputProof);
        _recordMove(game, _gameId, move);

        // Auto-generate CPU move for single-player
        if (game.mode == GameMode.SinglePlayer && !game.move2Submitted) {
            _generateMove(_gameId);
        }

        // Determine winner if both moves submitted
        if (game.move1Submitted && game.move2Submitted) {
            _determineWinner(_gameId);
        }
    }

    /// @notice Validate player eligibility
    /// @param game Game reference
    function _validatePlayer(Game storage game) private {
        if (game.mode == GameMode.SinglePlayer) {
            game.player2 = address(1);
            if (msg.sender != game.player1) revert NotAPlayer();
        } else {
            if (game.player2 == address(0)) revert WaitingForPlayer2();
            if (msg.sender != game.player1 && msg.sender != game.player2) revert NotAPlayer();
        }
    }

    /// @notice Record player move
    /// @param game Game reference
    /// @param _gameId Game ID
    /// @param move Encrypted move
    function _recordMove(Game storage game, uint256 _gameId, euint8 move) private {
        if (msg.sender == game.player1) {
            if (game.move1Submitted) revert MoveAlreadySubmitted();
            game.encryptedMove1 = move;
            game.move1Submitted = true;
            FHE.allowThis(game.encryptedMove1);
        } else {
            if (game.move2Submitted) revert MoveAlreadySubmitted();
            game.encryptedMove2 = move;
            game.move2Submitted = true;
            FHE.allowThis(game.encryptedMove2);
        }
        emit MoveSubmitted(_gameId, msg.sender, move);
    }

    /// @notice Generate random CPU move
    /// @param _gameId Game ID
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

    /// @notice Determine winner from moves
    /// @param _gameId Game ID
    function _determineWinner(uint256 _gameId) private {
        Game storage game = games[_gameId];
        euint8 move1 = game.encryptedMove1;
        euint8 move2 = game.encryptedMove2;

        game.isGameDraw = FHE.eq(move1, move2);

        ebool rockBeatsScissors = FHE.and(FHE.eq(move1, FHE.asEuint8(ROCK)), FHE.eq(move2, FHE.asEuint8(SCISSORS)));
        ebool paperBeatsRock = FHE.and(FHE.eq(move1, FHE.asEuint8(PAPER)), FHE.eq(move2, FHE.asEuint8(ROCK)));
        ebool scissorsBeatsPaper = FHE.and(FHE.eq(move1, FHE.asEuint8(SCISSORS)), FHE.eq(move2, FHE.asEuint8(PAPER)));

        game.encryptedPlayer1Won = FHE.or(FHE.or(rockBeatsScissors, paperBeatsRock), scissorsBeatsPaper);
        FHE.allowThis(game.encryptedPlayer1Won);
        FHE.allowThis(game.isGameDraw);
        FHE.makePubliclyDecryptable(game.encryptedPlayer1Won);
    }

    /// @notice Request to decrypt and determine winner
    /// @param _gameId Game ID
    function checkWinner(uint256 _gameId) external {
        Game storage game = games[_gameId];
        if (game.isGamefinished) revert GameAlreadyFinished();

        bytes32[] memory cypherTexts = new bytes32[](2);
        cypherTexts[0] = FHE.toBytes32(game.isGameDraw);
        cypherTexts[1] = FHE.toBytes32(game.encryptedPlayer1Won);

        uint256 requestId = FHE.requestDecryption(cypherTexts, this.callbackWinnerDetermination.selector);

        // Store the mapping from requestId to gameId
        decryptionRequestToGame[requestId] = _gameId;
    }

    /// @notice Callback to decrypt winner info
    /// @param requestId Decryption request ID
    /// @param cleartexts Decrypted values
    /// @param decryptionProof Proof of decryption
    function callbackWinnerDetermination(
        uint256 requestId,
        bytes calldata cleartexts,
        bytes calldata decryptionProof
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
