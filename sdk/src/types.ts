/**
 * Type definitions for FHEJanken SDK
 * @module types
 */

import type { ContractTransactionReceipt, Signer } from "ethers";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/node";

/**
 * Move options in Rock-Paper-Scissors game
 */
export enum Move {
  /** Rock beats Scissors */
  Rock = 1,
  /** Paper beats Rock */
  Paper = 2,
  /** Scissors beats Paper */
  Scissors = 3,
}

/**
 * Game mode types
 */
export enum GameMode {
  /** Single player game against CPU */
  SinglePlayer = 0,
  /** Two player game between users */
  TwoPlayer = 1,
}

/**
 * Simplified game state information
 */
export interface GameInfo {
  /** Game mode (single or two player) */
  mode: GameMode;
  /** Address of player 1 (game creator) */
  player1: string;
  /** Address of player 2 (or address(0) if waiting) */
  player2: string;
  /** Whether player 1 submitted their move */
  move1Submitted: boolean;
  /** Whether player 2 submitted their move */
  move2Submitted: boolean;
  /** Whether the game has finished */
  isGameFinished: boolean;
  /** Winner address (address(0) for draw, address(1) for CPU win) */
  winner: string;
}

/**
 * Result from creating a game
 */
export interface CreateGameResult {
  /** The newly created game ID */
  gameId: bigint;
  /** Transaction receipt */
  receipt: ContractTransactionReceipt;
}

/**
 * Result from submitting a move
 */
export interface SubmitMoveResult {
  /** Transaction receipt */
  receipt: ContractTransactionReceipt;
  /** Whether the game is ready to determine winner */
  readyToCheckWinner: boolean;
}

/**
 * Game result after checking winner
 */
export interface GameResult {
  /** Whether the game ended in a draw */
  isDraw: boolean;
  /** Winner address (undefined for draw) */
  winner?: string;
  /** Whether player1 won */
  player1Won: boolean;
  /** Whether player2 won */
  player2Won: boolean;
  /** Whether CPU won (for single player games) */
  cpuWon: boolean;
}

/**
 * Configuration options for the SDK
 */
export interface FHEJankenSDKConfig {
  /** Contract address */
  contractAddress: string;
  /** Signer for transactions */
  signer: Signer;
  /** FheVM instance for encryption */
  fhevm: FhevmInstance;

}
