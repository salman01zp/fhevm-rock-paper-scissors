import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHEJanken, FHEJanken__factory } from "../types";
import { expect } from "chai";

describe("FHEJanken", function () {
  let janken: FHEJanken;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const signers = await ethers.getSigners();
    alice = signers[0];
    bob = signers[1];

    const factory = (await ethers.getContractFactory("FHEJanken")) as FHEJanken__factory;
    janken = await factory.deploy();
    await janken.waitForDeployment();
  });

  it("Two player game where Rock beats Sissors", async function () {
    // 1. Alice create Game
    const gameId = await janken.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await janken.gameId();

    // 2. Player2 Bob joins the game
    await janken.connect(bob).joinGame(id);

    const jankenAddress = await janken.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Rock (1), Bob plays Scissors (3) -> Alice should win
    const aliceMove = await fhevm.createEncryptedInput(jankenAddress, alice.address).add8(1).encrypt();
    await janken.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(jankenAddress, bob.address).add8(3).encrypt();
    await janken.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await janken.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Rock (1), Bob plays Scissors (3) -> Alice should win
    let game = await janken.games(id);
    game = await janken.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq(alice.address);
  });

  it("Two player game where Paper beats Rock", async function () {
    // 1. Alice create Game
    const gameId = await janken.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await janken.gameId();

    // 2. Player2 Bob joins the game
    await janken.connect(bob).joinGame(id);

    const jankenAddress = await janken.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Rock (1), Bob plays Paper (2) -> Bob should win
    const aliceMove = await fhevm.createEncryptedInput(jankenAddress, alice.address).add8(1).encrypt();
    await janken.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(jankenAddress, bob.address).add8(2).encrypt();
    await janken.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await janken.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Rock (1), Bob plays Paper (2) -> Bob should win
    let game = await janken.games(id);
    game = await janken.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq(bob.address);
  });

  it("Two player game where Sissors beats Paper", async function () {
    // 1. Alice create Game
    const gameId = await janken.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await janken.gameId();

    // 2. Player2 Bob joins the game
    await janken.connect(bob).joinGame(id);

    const jankenAddress = await janken.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Scissors (3), Bob plays Paper (2) -> Alice should win
    const aliceMove = await fhevm.createEncryptedInput(jankenAddress, alice.address).add8(1).encrypt();
    await janken.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(jankenAddress, bob.address).add8(2).encrypt();
    await janken.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await janken.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Scissors (3), Bob plays Paper (2) -> Alice should win
    let game = await janken.games(id);
    game = await janken.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq(alice.address);
  });

  it("Two player game where is Draw", async function () {
    // 1. Alice create Game
    const gameId = await janken.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await janken.gameId();

    // 2. Player2 Bob joins the game
    await janken.connect(bob).joinGame(id);

    const jankenAddress = await janken.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Paper (2), Bob plays Paper (2) -> Game is draw
    const aliceMove = await fhevm.createEncryptedInput(jankenAddress, alice.address).add8(2).encrypt();
    await janken.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(jankenAddress, bob.address).add8(2).encrypt();
    await janken.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await janken.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Paper (2), Bob plays Paper (2) -> Game is draw so no winner
    let game = await janken.games(id);
    game = await janken.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq("0x0000000000000000000000000000000000000000");
  });

  it("Single player game Player vs CPU", async function () {
    // 1. Alice create Game
    const gameId = await janken.connect(alice).createSinglePlayerGame();
    await gameId.wait();

    const id = await janken.gameId();
    const jankenAddress = await janken.getAddress();

    // 3. Alice player Rock and submits encrypted move
    const aliceMove = await fhevm.createEncryptedInput(jankenAddress, alice.address).add8(1).encrypt();
    await janken.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await janken.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    let game = await janken.games(id);
    game = await janken.games(id);
    expect(game.isGamefinished).to.eq(true);
    console.log("Game winner : ", game.winner);
  });
});
