/**
 * FHEJanken SDK - TypeScript SDK for FHEJanken Contract
 * @module FHEJankenSDK
 */

import type { FhevmInstance } from "@zama-fhe/relayer-sdk/node";
import { ethers, type ContractTransactionReceipt } from "ethers";
import type { FHEJanken } from "../../types";
import { FHEJanken__factory } from "../../types/factories/contracts/FHEJanken__factory";
import type {
  FHEJankenSDKConfig,
  CreateGameResult,
  SubmitMoveResult,
  GameResult,
  GameInfo,
  Move,
  GameMode,
} from "./types";
import { GameMode as GameModeEnum } from "./types";

/**
 * Main SDK class for interacting with the FHEJanken contract
 */
export class FHEJankenSDK {
  private contract: FHEJanken;
  private signer: ethers.Signer;
  private fhevm: FhevmInstance;
  private contractAddress: string;

  /**
   * Create a new FHEJankenSDK instance
   *
   * @param config - SDK configuration options
   * @throws {Error} If contract address is invalid
   */
  constructor(config: FHEJankenSDKConfig) {
    this.contractAddress = config.contractAddress;
    this.signer = config.signer;
    this.fhevm = config.fhevm;

    // Create contract instance
    this.contract = FHEJanken__factory.connect(
      this.contractAddress,
      this.signer
    );
  }

  /**
   * Create a new game
   *
   * @param mode - Game mode (SinglePlayer or TwoPlayer)
   * @returns Promise containing the game ID and transaction receipt
   * @throws {Error} If transaction fails
   */
  async createGame(mode: GameMode): Promise<CreateGameResult> {
    let tx;
    if (mode === GameModeEnum.TwoPlayer) {
      tx = await this.contract.createTwoPlayerGame();
    } else {
      tx = await this.contract.createSinglePlayerGame();
    }

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction failed: no receipt");
    }

    // Extract game ID from GameCreated event
    const gameId = await this.extractGameIdFromReceipt(receipt);
    console.log("Game created", { gameId: gameId.toString(), txHash: receipt.hash })

    return { gameId, receipt };
  }

  /**
   * Join an existing two-player game
   *
   * @param gameId - The ID of the game to join
   * @returns Promise containing the transaction receipt
   * @throws {Error} If game doesn't exist, is not two-player, or is already full
   *
   */
  async joinGame(gameId: bigint): Promise<ContractTransactionReceipt> {
    
    const tx = await this.contract.joinGame(gameId);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction failed: no receipt");
    }

    console.log("Joined game", { gameId: gameId.toString(), txHash: receipt.hash });

    return receipt;
  }

  /**
   * Submit an encrypted move for a game
   *
   * @param gameId - The ID of the game
   * @param move - The move to submit (Rock, Paper, or Scissors)
   * @returns Promise containing transaction receipt and game readiness status
   * @throws {Error} If move already submitted or game is finished
   *
   */
  async submitMove(
    gameId: bigint,
    move: Move
  ): Promise<SubmitMoveResult> {
  
    // Get signer address for encryption
    const signerAddress = await this.signer.getAddress();

    // Create encrypted input
    const encryptedInput = await this.fhevm
      .createEncryptedInput(this.contractAddress, signerAddress)
      .add8(move)
      .encrypt();

    // Submit move
    const tx = await this.contract.submitMove(
      gameId,
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction failed: no receipt");
    }

    // Check if game is ready for winner determination
    const gameInfo = await this.getGameInfo(gameId);
    const readyToCheckWinner = gameInfo.move1Submitted && gameInfo.move2Submitted;

    console.log("Encrypted Move submitted", {
      gameId: gameId.toString(),
      txHash: receipt.hash,
    });

    return { receipt, readyToCheckWinner };
  }

  /**
   * Check the winner of a game (triggers decryption)
   *
   * @param gameId - The ID of the game
   * @returns Promise containing the game result
   * @throws {Error} If both moves haven't been submitted
   *
   */
  async checkWinner(
    gameId: bigint,
  ): Promise<GameResult> {
    console.log(`Checking winner for game ${gameId}`);

    const tx = await this.contract.checkWinner(gameId);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction failed: no receipt");
    }
    // Get final game state
    const gameInfo = await this.getGameInfo(gameId);

    const result = this.parseGameResult(gameInfo);

    console.log("Winner determined", {
      gameId: gameId.toString(),
      isDraw: result.isDraw,
      winner: result.winner,
    });

    return result;
  }

  /**
   * Get information about a game
   *
   * @param gameId - The ID of the game
   * @returns Promise containing game information
   *
   */
  async getGameInfo(gameId: bigint): Promise<GameInfo> {
    console.log(`Getting game info for ${gameId}`);

    const game = await this.contract.games(gameId);

    const gameInfo: GameInfo = {
      mode: Number(game.mode) as GameMode,
      player1: game.player1,
      player2: game.player2,
      move1Submitted: game.move1Submitted,
      move2Submitted: game.move2Submitted,
      isGameFinished: game.isGamefinished,
      winner: game.winner,
    };

    console.log("Game info retrieved", { gameId: gameId.toString(), gameInfo });

    return gameInfo;
  }

  /**
   * Get the current game ID counter (total games created)
   *
   * @returns Promise containing the current game ID counter
   *
   * @example
   * ```typescript
   * const currentGameId = await sdk.getCurrentGameId();
   * console.log(`Total games created: ${currentGameId}`);
   * ```
   */
  async getCurrentGameId(): Promise<bigint> {
    const gameId = await this.contract.gameId();
    console.log("Current game ID", { gameId: gameId.toString() });
    return gameId;
  }
  /**
   * Get the contract instance
   *
   * @returns The FHEJanken contract instance
   *
   * @example
   * ```typescript
   * const contract = sdk.getContract();
   * // Use contract directly for advanced operations
   * ```
   */
  getContract(): FHEJanken {
    return this.contract;
  }

  /**
   * Extract game ID from transaction receipt
   * @private
   */
  private async extractGameIdFromReceipt(
    receipt: ContractTransactionReceipt
  ): Promise<bigint> {
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed?.name === "GameCreated") {
          return parsed.args.gameId;
        }
      } catch {
        // Skip logs that can't be parsed
        continue;
      }
    }

    throw new Error("GameCreated event not found in transaction receipt");
  }

  /**
   * Parse game result from game info
   * @private
   */
  private parseGameResult(gameInfo: GameInfo): GameResult {
    const CPU_ADDRESS = "0x0000000000000000000000000000000000000001";
    const ZERO_ADDRESS = ethers.ZeroAddress;

    const isDraw = gameInfo.winner === ZERO_ADDRESS;
    const cpuWon = gameInfo.winner === CPU_ADDRESS;
    const player1Won = gameInfo.winner === gameInfo.player1;
    const player2Won =
      !isDraw && !cpuWon && gameInfo.winner === gameInfo.player2;

    return {
      isDraw,
      winner: isDraw ? undefined : gameInfo.winner,
      player1Won,
      player2Won,
      cpuWon,
    };
  }
}
