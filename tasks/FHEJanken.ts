/**
 * FHEJanken Hardhat Tasks
 * CLI tasks for interacting with FHEJanken contract
 */

import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { parseMoveString, parseModeString, parsePlayerName, getPlayerName, GameMode } from "./helpers/janken-helpers";

/**
 * Tutorial: Two-Player Game
 * ========================================
 *
 *   npx hardhat --network localhost janken:create-game --mode two-player --player alice
 *   npx hardhat --network localhost janken:join-game --game-id 1 --player bob

 *   npx hardhat --network localhost janken:submit-move --game-id 1 --move rock --player alice
 *   npx hardhat --network localhost janken:submit-move --game-id 1 --move scissors --player bob
 *   
 *    npx hardhat --network localhost janken:check-winner --game-id 1
 *    npx hardhat --network localhost janken:game-info --game-id 1
 *
 */

/**
 * Create a new game
 */
task("janken:create-game", "Create a new game")
  .addOptionalParam("address", "Contract address")
  .addParam("mode", "Game mode: 'single-player' or 'two-player'")
  .addOptionalParam("player", "Player name (alice, bob) or index (default: alice)", "alice")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEJanken");

    const signers = await ethers.getSigners();
    const signerIndex = parsePlayerName(taskArguments.player);
    const signer = signers[signerIndex];
    const contract = await ethers.getContractAt("FHEJanken", deployment.address);
    const mode = parseModeString(taskArguments.mode);

  
    let tx;
    if (mode === GameMode.TwoPlayer) {
      tx = await contract.connect(signer).createTwoPlayerGame();
    } else {
      tx = await contract.connect(signer).createSinglePlayerGame();
    }

    const receipt = await tx.wait();
    console.log("New Game Created");
    console.log(`Transaction Hash: ${receipt?.hash}`);

    // Get game ID from events
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "GameCreated";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = contract.interface.parseLog(event);
      console.log(`Game ID: ${parsed?.args.gameId}`);
      console.log(`Player1: ${getPlayerName(signerIndex)} (${await signer.getAddress()})`);
    }
  });

/**
 * Join an existing game
 */
task("janken:join-game", "Join a two-player game")
  .addOptionalParam("address", "Contract address")
  .addParam("gameId", "Game ID to join")
  .addOptionalParam("player", "Player name (alice, bob) or index (default: bob)", "bob")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEJanken");

    const signers = await ethers.getSigners();
    const signerIndex = parsePlayerName(taskArguments.player);
    const signer = signers[signerIndex];
    const contract = await ethers.getContractAt("FHEJanken", deployment.address);
    const gameId = BigInt(taskArguments.gameId);

    console.log(`Player2: ${getPlayerName(signerIndex)} (${await signer.getAddress()})`);

    const tx = await contract.connect(signer).joinGame(gameId);
    const receipt = await tx.wait();

    console.log(` ${getPlayerName(signerIndex)} Joined game ${gameId}`);
    console.log(`Transaction: ${receipt?.hash}`);
  });

/**
 * Submit encrypted move
 */
task("janken:submit-move", "Submit an encrypted move")
  .addOptionalParam("address", "Contract address")
  .addParam("gameId", "Game ID")
  .addParam("move", "Move: 'rock', 'paper', or 'scissors'")
  .addOptionalParam("player", "Player name (alice, bob) or index (default: alice)", "alice")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEJanken");

    const signers = await ethers.getSigners();
    const signerIndex = parsePlayerName(taskArguments.player);
    const signer = signers[signerIndex];
    const contract = await ethers.getContractAt("FHEJanken", deployment.address);
    const gameId = BigInt(taskArguments.gameId);
    const move = parseMoveString(taskArguments.move);

    // Encrypt move
    const signerAddress = await signer.getAddress();
    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signerAddress)
      .add8(move)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .submitMove(gameId, encryptedInput.handles[0], encryptedInput.inputProof);

    const receipt = await tx.wait();

    console.log(`${getPlayerName(signerIndex)} submitted encrypted move`);
    console.log(`Transaction: ${receipt?.hash}`);
  });

/**
 * Check winner
 */
task("janken:check-winner", "Check game winner")
  .addOptionalParam("address", "Contract address")
  .addParam("gameId", "Game ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEJanken");

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("FHEJanken", deployment.address);
    const gameId = BigInt(taskArguments.gameId);

    console.log(`Checking winner for game ${gameId}...`);

    const tx = await contract.connect(signers[0]).checkWinner(gameId);
    const receipt = await tx.wait();
    console.log("Waiting for decryption oracle...");
    await fhevm.awaitDecryptionOracle();

    // Get game result
    const game = await contract.games(gameId);

    console.log("\n=== Game Result ===");
    if (game.winner === "0x0000000000000000000000000000000000000000") {
      console.log("Result: Draw");
    } else if(game.winner == "0x0000000000000000000000000000000000000001" ){
      console.log(`Winner: Computer(${game.winner})`);
    } else if (game.winner == signers[0].address){
      console.log(`Winner: Alice(${game.winner})`);
    } else {
      console.log(`Winner: Bob(${game.winner})`);
    }
  });

/**
 * Get game info
 */
task("janken:game-info", "Get game information")
  .addOptionalParam("address", "Contract address")
  .addParam("gameId", "Game ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const signers = await ethers.getSigners();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEJanken");

    const contract = await ethers.getContractAt("FHEJanken", deployment.address);
    const gameId = BigInt(taskArguments.gameId);
    const game = await contract.games(gameId);

    console.log("\n=== Game Info ===");
    console.log(`Game ID: ${gameId}`);
    console.log(`Mode: ${Number(game.mode) === 0 ? "Single-Player" : "Two-Player"}`);
    console.log(`Player 1: ${game.player1}`);
    console.log(`Player 2: ${game.player2 === "0x0000000000000000000000000000000000000000" ? "Waiting..." : game.player2}`);
    console.log(`Finished: ${game.isGamefinished ? "Yes" : "No"}`);

    if (game.isGamefinished) {
      console.log("\n=== Game Result ===");
      if (game.winner === "0x0000000000000000000000000000000000000000") {
        console.log("Result: Draw");
      } else if(game.winner == "0x0000000000000000000000000000000000000001" ){
        console.log(`Winner: Computer(${game.winner})`);
      } else if (game.winner == game.player1){
        console.log(`Winner: Player1(${game.winner})`);
      } else {
        console.log(`Winner: Player2(${game.winner})`);
      }
    }
  });


