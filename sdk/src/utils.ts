/**
 * Utility functions for FHEJanken SDK
 * @module utils
 */

import { Move, GameMode } from "./types";

/**
 * Parse a move string to Move enum
 *
 * @param moveStr - Move string (rock, paper, scissors)
 * @returns Move enum value
 * @throws {Error} If move string is invalid
 *
 * @example
 * ```typescript
 * const move = parseMoveString("rock"); // Move.Rock
 * const move2 = parseMoveString("PAPER"); // Move.Paper
 * ```
 */
export function parseMoveString(moveStr: string): Move {
  const normalized = moveStr.toLowerCase().trim();

  switch (normalized) {
    case "rock":
    case "r":
      return Move.Rock;
    case "paper":
    case "p":
      return Move.Paper;
    case "scissors":
    case "s":
      return Move.Scissors;
    default:
      throw new Error(
        `Invalid move: ${moveStr}. Use 'rock', 'paper', or 'scissors'`
      );
  }
}

/**
 * Parse a game mode string to GameMode enum
 *
 * @param modeStr - Mode string (single-player, two-player, 1p, 2p)
 * @returns GameMode enum value
 *
 * @example
 * ```typescript
 * const mode = parseGameModeString("two-player"); // GameMode.TwoPlayer
 * const mode2 = parseGameModeString("1p"); // GameMode.SinglePlayer
 * ```
 */
export function parseGameModeString(modeStr: string): GameMode {
  const normalized = modeStr.toLowerCase().trim();

  switch (normalized) {
    case "single-player":
    case "single":
    case "1p":
    case "sp":
    case "0":
      return GameMode.SinglePlayer;
    case "two-player":
    case "two":
    case "2p":
    case "tp":
    case "1":
      return GameMode.TwoPlayer;
    default:
      return GameMode.SinglePlayer;
  }
}

/**
 * Get a human-readable string for a Move
 *
 * @param move - Move enum value
 * @returns Human-readable move name
 *
 * @example
 * ```typescript
 * getMoveString(Move.Rock); // "Rock"
 * getMoveString(Move.Paper); // "Paper"
 * ```
 */
export function getMoveString(move: Move): string {
  switch (move) {
    case Move.Rock:
      return "Rock";
    case Move.Paper:
      return "Paper";
    case Move.Scissors:
      return "Scissors";
    default:
      return "Unknown";
  }
}

/**
 * Get a human-readable string for a GameMode
 *
 * @param mode - GameMode enum value
 * @returns Human-readable mode name
 *
 * @example
 * ```typescript
 * getGameModeString(GameMode.TwoPlayer); // "Two-Player"
 * getGameModeString(GameMode.SinglePlayer); // "Single-Player"
 * ```
 */
export function getGameModeString(mode: GameMode): string {
  switch (mode) {
    case GameMode.SinglePlayer:
      return "Single-Player";
    case GameMode.TwoPlayer:
      return "Two-Player";
    default:
      return "Unknown";
  }
}

/**
 * Determine the winner of a Rock-Paper-Scissors game
 * This is a client-side utility for testing/validation purposes
 *
 * @param move1 - First player's move
 * @param move2 - Second player's move
 * @returns 1 if player1 wins, 2 if player2 wins, 0 for draw
 *
 * @example
 * ```typescript
 * determineWinner(Move.Rock, Move.Scissors); // 1 (player1 wins)
 * determineWinner(Move.Paper, Move.Rock); // 1 (player1 wins)
 * determineWinner(Move.Rock, Move.Rock); // 0 (draw)
 * ```
 */
export function determineWinner(move1: Move, move2: Move): 0 | 1 | 2 {
  if (move1 === move2) {
    return 0; // Draw
  }

  // Rock beats Scissors
  if (move1 === Move.Rock && move2 === Move.Scissors) {
    return 1;
  }

  // Paper beats Rock
  if (move1 === Move.Paper && move2 === Move.Rock) {
    return 1;
  }

  // Scissors beats Paper
  if (move1 === Move.Scissors && move2 === Move.Paper) {
    return 1;
  }

  // Otherwise player 2 wins
  return 2;
}

/**
 * Check if an address is the zero address
 *
 * @param address - Address to check
 * @returns True if address is zero address
 *
 * @example
 * ```typescript
 * isZeroAddress("0x0000000000000000000000000000000000000000"); // true
 * isZeroAddress("0x1234567890123456789012345678901234567890"); // false
 * ```
 */
export function isZeroAddress(address: string): boolean {
  return address === "0x0000000000000000000000000000000000000000";
}

/**
 * Check if an address is the CPU address (used in single-player games)
 *
 * @param address - Address to check
 * @returns True if address is CPU address
 *
 * @example
 * ```typescript
 * isCpuAddress("0x0000000000000000000000000000000000000001"); // true
 * ```
 */
export function isCpuAddress(address: string): boolean {
  return address === "0x0000000000000000000000000000000000000001";
}

/**
 * Format an address for display (shortened)
 *
 * @param address - Address to format
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Formatted address (e.g., "0x1234...5678")
 *
 * @example
 * ```typescript
 * formatAddress("0x1234567890123456789012345678901234567890"); // "0x1234...7890"
 * formatAddress("0x1234567890123456789012345678901234567890", 6); // "0x123456...567890"
 * ```
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (isZeroAddress(address)) {
    return "No Player";
  }
  if (isCpuAddress(address)) {
    return "CPU";
  }

  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

/**
 * Random move generator for testing
 *
 * @returns Random Move enum value
 *
 * @example
 * ```typescript
 * const randomMove = getRandomMove(); // Move.Rock, Move.Paper, or Move.Scissors
 * ```
 */
export function getRandomMove(): Move {
  const moves = [Move.Rock, Move.Paper, Move.Scissors];
  return moves[Math.floor(Math.random() * moves.length)];
}
