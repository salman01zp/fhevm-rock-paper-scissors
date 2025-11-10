/**
 * FHEJanken Hardhat Tasks
 * CLI tasks for interacting with FHEJanken contract
 */

import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import {
  getContract,
  initializeFHEVM,
  getSigner,
  createTwoPlayerGame,
  createSinglePlayerGame,
  joinGame,
  submitMove,
  checkWinner,
  getGame,
  getCurrentGameId,
  parseMoveString,
  parseModeString,
  formatGameInfo,
  validateGameId,
  playTwoPlayerGame,
  playSinglePlayerGame,
  Move,
  GameMode,
} from "./helpers/janken-helpers";
import { fhevm } from "hardhat";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *    npx hardhat node
 *
 * 2. Deploy the FHEJanken contract
 *    npx hardhat --network localhost deploy
 *
 * 3. Interact with the FHEJanken contract
 *    npx hardhat --network localhost janken:create-game --mode two-player
 */

/**
 * Create a new game
 * Example: npx hardhat --network localhost janken:create-game --mode two-player
 */
task("janken:create-game", "Create a new game")
  .addOptionalParam("address", "Contract address")
  .addParam("mode", "Game mode: 'single-player' or 'two-player'")
  .addOptionalParam("signerIndex", "Signer index to use (default: 0)", "0")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const FHEJankenDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHEJanken");
    const address = FHEJankenDeployement.address;
    const signers = await ethers.getSigners();
    console.log(`FHEJanken: ${address}`);
    const mode = parseModeString(taskArguments.mode);

    const fheJankenContract = await ethers.getContractAt("FHEJanken", address);


    const player1 = signers[0];
    let receipt;

    if (mode === GameMode.TwoPlayer) {
      const tx = await fheJankenContract.connect(player1).createTwoPlayerGame();
      const receipt = await tx.wait();
      console.log(`Game created! Transaction: ${receipt?.hash}`);

      // Get game ID from events
      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = fheJankenContract.interface.parseLog(log);
          return parsed?.name === "GameCreated";
        } catch {
          return false;
        }
      });
    
      if (event) {
        const parsed = fheJankenContract.interface.parseLog(event);
        console.log(`Game ID: ${parsed?.args.gameId}`);
      }
    }

  });



