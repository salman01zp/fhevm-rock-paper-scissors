/**
 * Simple SDK Tests for FHEJankenSDK
 *
 * Run from project root with: npx hardhat test sdk/test/FHEJankenSDK.test.ts
 */

import { expect } from "chai";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FHEJanken, FHEJanken__factory } from "../../../types";
import { FHEJankenSDK, Move, GameMode } from "../src";

// Access ethers and fhevm from Hardhat Runtime Environment
// Using any to avoid TypeScript errors with extended Hardhat types
const ethers = (hre as any).ethers;
const fhevm = (hre as any).fhevm;

describe("FHEJankenSDK - Simple Tests", function () {
  let contractAddress: string;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let sdkAlice: FHEJankenSDK;
  let sdkBob: FHEJankenSDK;

  before(async function () {
    // Skip tests if not in mock mode
    if (!fhevm.isMock) {
      this.skip();
    }

    // Get signers from Hardhat
    const signers = await ethers.getSigners();
    alice = signers[0];
    bob = signers[1];

    console.log("\n📦 Deploying FHEJanken contract...");

    // Deploy the contract
    const factory = (await ethers.getContractFactory("FHEJanken")) as FHEJanken__factory;
    const contract: FHEJanken = await factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();

    console.log(`✅ Contract deployed at: ${contractAddress}`);

    // Initialize SDK instances for Alice and Bob
    sdkAlice = new FHEJankenSDK({
      contractAddress,
      signer: alice,
      fhevm: fhevm,
    });

    sdkBob = new FHEJankenSDK({
      contractAddress,
      signer: bob,
      fhevm: fhevm,
    });

    console.log(`👤 Alice: ${await alice.getAddress()}`);
    console.log(`👤 Bob: ${await bob.getAddress()}\n`);
  });

  describe("Basic SDK Setup", () => {
    it("should create SDK instances successfully", () => {
      expect(sdkAlice).to.be.instanceOf(FHEJankenSDK);
      expect(sdkBob).to.be.instanceOf(FHEJankenSDK);
    });

    it("should have access to contract methods", () => {
      const contract = sdkAlice.getContract();
      expect(contract).to.not.be.undefined;
      expect(contract.interface).to.not.be.undefined;
    });

    it("should return current game ID (starts at 0)", async () => {
      const currentGameId = await sdkAlice.getCurrentGameId();
      expect(currentGameId).to.be.a("bigint");
    });
  });

  describe("Two-Player Game: Rock vs Scissors", () => {
    let gameId: bigint;

    it("should allow Alice to create a two-player game", async () => {
      console.log("\n🎮 Creating two-player game...");
      const result = await sdkAlice.createGame(GameMode.TwoPlayer);

      expect(result.gameId).to.be.a("bigint");
      expect(result.receipt).to.not.be.undefined;

      gameId = result.gameId;
      console.log(`✅ Game created with ID: ${gameId}`);
    });

    it("should show correct game state after creation", async () => {
      const gameInfo = await sdkAlice.getGameInfo(gameId);

      expect(gameInfo.mode).to.equal(GameMode.TwoPlayer);
      expect(gameInfo.player1).to.equal(await alice.getAddress());
      expect(gameInfo.player2).to.equal("0x0000000000000000000000000000000000000000");
      expect(gameInfo.move1Submitted).to.be.false;
      expect(gameInfo.move2Submitted).to.be.false;
      expect(gameInfo.isGameFinished).to.be.false;
    });

    it("should allow Bob to join the game", async () => {
      console.log("👥 Bob joining game...");
      const receipt = await sdkBob.joinGame(gameId);

      expect(receipt).to.not.be.undefined;
      expect(receipt.hash).to.be.a("string");

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.player2).to.equal(await bob.getAddress());
      console.log("✅ Bob joined successfully");
    });

    it("should allow Alice to submit move (Rock)", async () => {
      console.log("🪨 Alice plays Rock...");
      const result = await sdkAlice.submitMove(gameId, Move.Rock);

      expect(result.receipt).to.not.be.undefined;
      expect(result.readyToCheckWinner).to.be.false;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.move1Submitted).to.be.true;
      expect(gameInfo.move2Submitted).to.be.false;
    });

    it("should allow Bob to submit move (Scissors)", async () => {
      console.log("✂️  Bob plays Scissors...");
      const result = await sdkBob.submitMove(gameId, Move.Scissors);

      expect(result.receipt).to.not.be.undefined;
      expect(result.readyToCheckWinner).to.be.true;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.move1Submitted).to.be.true;
      expect(gameInfo.move2Submitted).to.be.true;
    });

    it("should determine Alice as winner (Rock beats Scissors)", async () => {
      console.log("🏆 Checking winner...");
      await sdkAlice.checkWinner(gameId);

      // Wait for decryption oracle in mock mode
      await fhevm.awaitDecryptionOracle();

      // Check the result after oracle processes
      const finalGameInfo = await sdkAlice.getGameInfo(gameId);

      expect(finalGameInfo.isGameFinished).to.be.true;
      expect(finalGameInfo.winner).to.equal(await alice.getAddress());
      console.log(`✅ Winner: Alice (${await alice.getAddress()})`);
    });
  });

  describe("Two-Player Game: Draw Scenario (Rock vs Rock)", () => {
    let gameId: bigint;

    it("should create game and both players join", async () => {
      console.log("\n🎮 Creating game for draw test...");
      const result = await sdkAlice.createGame(GameMode.TwoPlayer);
      gameId = result.gameId;

      await sdkBob.joinGame(gameId);
      console.log("✅ Game setup complete");
    });

    it("should allow both players to submit same move", async () => {
      console.log("🪨 Both players play Rock...");
      await sdkAlice.submitMove(gameId, Move.Rock);
      await sdkBob.submitMove(gameId, Move.Rock);
    });

    it("should result in a draw", async () => {
      console.log("🏆 Checking winner...");
      await sdkAlice.checkWinner(gameId);
      await fhevm.awaitDecryptionOracle();

      const gameInfo = await sdkAlice.getGameInfo(gameId);

      expect(gameInfo.isGameFinished).to.be.true;
      expect(gameInfo.winner).to.equal("0x0000000000000000000000000000000000000000");
      console.log("✅ Game ended in a draw");
    });
  });

  describe("Single-Player Game: Player vs CPU", () => {
    let gameId: bigint;

    it("should create a single-player game", async () => {
      console.log("\n🎮 Creating single-player game...");
      const result = await sdkAlice.createGame(GameMode.SinglePlayer);

      expect(result.gameId).to.be.a("bigint");
      gameId = result.gameId;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.mode).to.equal(GameMode.SinglePlayer);
      console.log(`✅ Single-player game created with ID: ${gameId}`);
    });

    it("should auto-generate CPU move after player submits", async () => {
      console.log("📄 Alice plays Paper...");
      const result = await sdkAlice.submitMove(gameId, Move.Paper);

      expect(result.receipt).to.not.be.undefined;
      expect(result.readyToCheckWinner).to.be.true;

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.move1Submitted).to.be.true;
      expect(gameInfo.move2Submitted).to.be.true;
      console.log("✅ CPU move auto-generated");
    });

    it("should determine winner for single-player game", async () => {
      console.log("🏆 Checking winner...");
      await sdkAlice.checkWinner(gameId);
      await fhevm.awaitDecryptionOracle();

      const gameInfo = await sdkAlice.getGameInfo(gameId);
      expect(gameInfo.isGameFinished).to.be.true;

      if (gameInfo.winner === await alice.getAddress()) {
        console.log("✅ Alice won!");
      } else if (gameInfo.winner === "0x0000000000000000000000000000000000000001") {
        console.log("✅ CPU won!");
      } else {
        console.log("✅ Draw!");
      }
    });
  });

  describe("Error Handling", () => {
    it("should prevent player from joining their own game", async () => {
      const result = await sdkAlice.createGame(GameMode.TwoPlayer);
      const gameId = result.gameId;

      try {
        await sdkAlice.joinGame(gameId);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("CannotJoinOwnGame");
      }
    });

    it("should prevent joining single-player game", async () => {
      const result = await sdkAlice.createGame(GameMode.SinglePlayer);
      const gameId = result.gameId;

      try {
        await sdkBob.joinGame(gameId);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("CannotJoinSinglePlayerGame");
      }
    });

    it("should prevent submitting move twice", async () => {
      const result = await sdkAlice.createGame(GameMode.TwoPlayer);
      const gameId = result.gameId;

      await sdkBob.joinGame(gameId);
      await sdkAlice.submitMove(gameId, Move.Rock);

      try {
        await sdkAlice.submitMove(gameId, Move.Paper);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).to.include("MoveAlreadySubmitted");
      }
    });
  });

  describe("Multiple Games", () => {
    it("should handle multiple games in parallel", async () => {
      console.log("\n🎮 Creating multiple games...");

      const game1 = await sdkAlice.createGame(GameMode.TwoPlayer);
      const game2 = await sdkAlice.createGame(GameMode.TwoPlayer);

      expect(game1.gameId).to.not.equal(game2.gameId);

      await sdkBob.joinGame(game1.gameId);
      await sdkBob.joinGame(game2.gameId);

      const info1 = await sdkAlice.getGameInfo(game1.gameId);
      const info2 = await sdkAlice.getGameInfo(game2.gameId);

      expect(info1.player2).to.equal(await bob.getAddress());
      expect(info2.player2).to.equal(await bob.getAddress());

      console.log("✅ Multiple games handled successfully");
    });
  });
});
