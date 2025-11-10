/**
 * FHEJanken Task Helpers
 * Reusable helper functions for interacting with FHEJanken contract
 */

/**
 * Move enum matching contract
 */
export enum Move {
  Rock = 1,
  Paper = 2,
  Scissors = 3,
}

/**
 * Game mode enum matching contract
 */
export enum GameMode {
  SinglePlayer = 0,
  TwoPlayer = 1,
}

/**
 * Parse move from string
 * @param moveStr - Move string (rock, paper, scissors)
 * @returns Move enum
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
      throw new Error(`Invalid move: ${moveStr}. Use 'rock', 'paper', or 'scissors'`);
  }
}

/**
 * Parse game mode from string
 * @param modeStr - Mode string (single-player, two-player)
 * @returns GameMode enum
 */
export function parseModeString(modeStr: string): GameMode {
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
 * Parse player name to signer index
 * @param playerName - Player name (alice, bob, or numeric index)
 * @returns Signer index
 */
export function parsePlayerName(playerName: string): number {
  const normalized = playerName.toLowerCase().trim();
  switch (normalized) {
    case "alice":
      return 0;
    case "bob":
      return 1;
    case "charlie":
      return 2;
    case "dave":
      return 3;
    case "eve":
      return 4;
    default:
      return 0; // Default use Alice
  }
}

/**
 * Get player name from signer index
 * @param index - Signer index
 * @returns Player name
 */
export function getPlayerName(index: number): string {
  const names = ["Alice", "Bob", "Charlie", "Dave", "Eve"];
  return names[index] || `Player ${index}`;
}
