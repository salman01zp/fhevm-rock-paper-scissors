/**
 * Simple SDK Tests for FHERockPaperScissorsSDK
 *
 */

import { expect } from "chai";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FHERockPaperScissors, FHERockPaperScissors__factory } from "../../types";
import { FHERockPaperScissorsSDK, Move, GameMode } from "../src";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ethers = (hre as any).ethers;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fhevm = (hre as any).fhevm;

describe("FHERockPaperScissorsSDK - Simple Tests", function () {
  let contractAddress: string;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let sdkAlice: FHERockPaperScissorsSDK;
  let sdkBob: FHERockPaperScissorsSDK;

  before(async function () {
    // Skip tests if not in mock mode
    if (!fhevm.isMock) {
      this.skip();
    }

    // Get signers from Hardhat
    const signers = await ethers.getSigners();
    alice = signers[0];
    bob = signers[1];

    // Deploy the contract
    const factory = (await ethers.getContractFactory("FHERockPaperScissors")) as FHERockPaperScissors__factory;
    const contract: FHERockPaperScissors = await factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();

    console.log(`Contract deployed at: ${contractAddress}`);

    // Initialize SDK instances for Alice and Bob
    sdkAlice = new FHERockPaperScissorsSDK({
      contractAddress,
      signer: alice,
      fhevm: fhevm,
    });

    sdkBob = new FHERockPaperScissorsSDK({
      contractAddress,
      signer: bob,
      fhevm: fhevm,
    });

    console.log(`Alice: ${await alice.getAddress()}`);
    console.log(`Bob: ${await bob.getAddress()}\n`);
  });

  describe("Two-Player Game: Rock vs Scissors", () => {
    let gameId: bigint;

    it("should allow Alice to create a two-player game", async () => {
      const result = await sdkAlice.createGame(GameMode.TwoPlayer);

      expect(result.receipt).to.not.be.undefined;
      expect(result.gameId).to.be.a("bigint");

      gameId = result.gameId;
      console.log(`Game created with ID: ${gameId}`);
    });

    it("should allow Bob to join the game", async () => {
      const receipt = await sdkBob.joinGame(gameId);
      expect(receipt).to.not.be.undefined;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.player2).to.equal(await bob.getAddress());
      console.log("Bob joined successfully");
    });

    it("should allow Alice to submit move (Rock)", async () => {
      const result = await sdkAlice.submitMove(gameId, Move.Rock);
      expect(result.receipt).to.not.be.undefined;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.move1Submitted).to.be.true;
      expect(gameInfo.move2Submitted).to.be.false;
    });

    it("should allow Bob to submit move (Scissors)", async () => {
      const result = await sdkBob.submitMove(gameId, Move.Scissors);
      expect(result.receipt).to.not.be.undefined;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.move1Submitted).to.be.true;
      expect(gameInfo.move2Submitted).to.be.true;
    });

    it("should determine Alice as winner (Rock beats Scissors)", async () => {
      const result = await sdkAlice.checkWinner(gameId);
      expect(result).to.not.be.undefined;

      // Wait for decryption oracle in mock mode
      await fhevm.awaitDecryptionOracle();

      // Check the result after oracle processes
      const finalGameInfo = await sdkAlice.getGameInfo(gameId);

      expect(finalGameInfo.isGameFinished).to.be.true;
      expect(finalGameInfo.winner).to.equal(await alice.getAddress());
      console.log(`Winner: Alice (${await alice.getAddress()})`);
    });
  });

  describe("Single-Player Game: Player vs CPU", () => {
    let gameId: bigint;

    it("should create a single-player game", async () => {
      const result = await sdkAlice.createGame(GameMode.SinglePlayer);

      gameId = result.gameId;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.mode).to.equal(GameMode.SinglePlayer);
      console.log(`Single-player game created with ID: ${gameId}`);
    });

    it("should auto-generate CPU move after player submits", async () => {
      console.log("Alice plays Paper...");
      const result = await sdkAlice.submitMove(gameId, Move.Paper);
      expect(result.receipt).to.not.be.undefined;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.move1Submitted).to.be.true;
      expect(gameInfo.move2Submitted).to.be.true;
    });

    it("should determine winner for single-player game", async () => {
      const result = await sdkAlice.checkWinner(gameId);
      expect(result).to.not.be.undefined;
      await fhevm.awaitDecryptionOracle();

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.isGameFinished).to.be.true;

      if (gameInfo.winner === (await alice.getAddress())) {
        console.log("Alice won!");
      } else if (gameInfo.winner === "0x0000000000000000000000000000000000000001") {
        console.log("CPU won!");
      } else {
        console.log("Draw!");
      }
    });
  });
});
