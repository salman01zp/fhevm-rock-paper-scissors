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
 */
export function parseMoveString(moveStr: string): Move {
  const normalized = moveStr.toLowerCase().trim();

  switch (normalized) {
    case "rock":
      return Move.Rock;
    case "paper":
      return Move.Paper;
    case "scissors":
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
 */
export function parseGameModeString(modeStr: string): GameMode {
  const normalized = modeStr.toLowerCase().trim();

  switch (normalized) {
    case "single-player":
      return GameMode.SinglePlayer;
    case "two-player":
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




