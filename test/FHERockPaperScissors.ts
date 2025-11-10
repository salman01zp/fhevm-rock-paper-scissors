import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHERockPaperScissors, FHERockPaperScissors__factory } from "../types";
import { expect } from "chai";

describe("FHERockPaperScissors", function () {
  let contract: FHERockPaperScissors;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const signers = await ethers.getSigners();
    alice = signers[0];
    bob = signers[1];

    const factory = (await ethers.getContractFactory("FHERockPaperScissors")) as FHERockPaperScissors__factory;
    contract = await factory.deploy();
    await contract.waitForDeployment();
  });

  it("Two player game where Rock beats Sissors", async function () {
    // 1. Alice create Game
    const gameId = await contract.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await contract.gameId();

    // 2. Player2 Bob joins the game
    await contract.connect(bob).joinGame(id);

    const contractAddress = await contract.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Rock (1), Bob plays Scissors (3) -> Alice should win
    const aliceMove = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(1).encrypt();
    await contract.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(contractAddress, bob.address).add8(3).encrypt();
    await contract.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await contract.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Rock (1), Bob plays Scissors (3) -> Alice should win
    let game = await contract.games(id);
    game = await contract.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq(alice.address);
  });

  it("Two player game where Paper beats Rock", async function () {
    // 1. Alice create Game
    const gameId = await contract.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await contract.gameId();

    // 2. Player2 Bob joins the game
    await contract.connect(bob).joinGame(id);

    const contractAddress = await contract.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Rock (1), Bob plays Paper (2) -> Bob should win
    const aliceMove = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(1).encrypt();
    await contract.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(contractAddress, bob.address).add8(2).encrypt();
    await contract.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await contract.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Rock (1), Bob plays Paper (2) -> Bob should win
    let game = await contract.games(id);
    game = await contract.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq(bob.address);
  });

  it("Two player game where Sissors beats Paper", async function () {
    // 1. Alice create Game
    const gameId = await contract.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await contract.gameId();

    // 2. Player2 Bob joins the game
    await contract.connect(bob).joinGame(id);

    const contractAddress = await contract.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Scissors (3), Bob plays Paper (2) -> Alice should win
    const aliceMove = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(3).encrypt();
    await contract.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(contractAddress, bob.address).add8(2).encrypt();
    await contract.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await contract.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Scissors (3), Bob plays Paper (2) -> Alice should win
    let game = await contract.games(id);
    game = await contract.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq(alice.address);
  });

  it("Two player game where is Draw", async function () {
    // 1. Alice create Game
    const gameId = await contract.connect(alice).createTwoPlayerGame();
    await gameId.wait();

    const id = await contract.gameId();

    // 2. Player2 Bob joins the game
    await contract.connect(bob).joinGame(id);

    const contractAddress = await contract.getAddress();
    // 3. Submit encrypted moves
    // Alice plays Paper (2), Bob plays Paper (2) -> Game is draw
    const aliceMove = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(2).encrypt();
    await contract.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    const bobMove = await fhevm.createEncryptedInput(contractAddress, bob.address).add8(2).encrypt();
    await contract.connect(bob).submitMove(id, bobMove.handles[0], bobMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await contract.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    // Alice plays Paper (2), Bob plays Paper (2) -> Game is draw so no winner
    let game = await contract.games(id);
    game = await contract.games(id);
    expect(game.isGamefinished).to.eq(true);
    expect(game.winner).to.eq("0x0000000000000000000000000000000000000000");
  });

  it("Single player game Player vs CPU", async function () {
    // 1. Alice create Game
    const gameId = await contract.connect(alice).createSinglePlayerGame();
    await gameId.wait();

    const id = await contract.gameId();
    const contractAddress = await contract.getAddress();

    // 3. Alice player Rock and submits encrypted move
    const aliceMove = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(1).encrypt();
    await contract.connect(alice).submitMove(id, aliceMove.handles[0], aliceMove.inputProof);

    // 4. Check winner
    const checkWinnerTx = await contract.checkWinner(id);
    await checkWinnerTx.wait();
    await fhevm.awaitDecryptionOracle();

    let game = await contract.games(id);
    game = await contract.games(id);
    expect(game.isGamefinished).to.eq(true);
    console.log("Game winner : ", game.winner);
  });
});
