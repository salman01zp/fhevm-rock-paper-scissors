# fhevm-rock-paper-scissors

[![npm version](https://img.shields.io/npm/v/fhevm-rock-paper-scissors.svg)](https://www.npmjs.com/package/fhevm-rock-paper-scissors)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript SDK for interacting with the FHE-based (Fully Homomorphic Encryption) Rock-Paper-Scissors smart contract built on Zama's FHEVM.

## Features

- 🔐 **Privacy-Preserving**: All moves are encrypted using FHE, keeping them secret until winner determination
- 🎮 **Two Game Modes**: Single-player (vs CPU) and two-player modes
- 📦 **Easy Integration**: Simple, intuitive API for seamless integration
- 🔄 **Full Game Lifecycle**: Create games, join, submit moves, and determine winners
- 📝 **TypeScript Support**: Fully typed for excellent developer experience
- ✅ **Well Tested**: Comprehensive test suite with 19 passing tests

## Installation

```bash
npm install fhevm-rock-paper-scissors ethers @zama-fhe/relayer-sdk
```

## Prerequisites

- Node.js >= 18.0.0
- ethers.js v6
- Access to a Zama FHEVM-compatible network (Sepolia testnet or local)

## Quick Start

```typescript
import { FHEJankenSDK, Move, GameMode } from 'fhevm-rock-paper-scissors';
import { ethers } from 'ethers';
import { createInstance } from '@zama-fhe/relayer-sdk/node';

// Setup provider and signer
const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_KEY");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Create FHEVM instance for encryption
const fhevm = await createInstance({
  chainId: 11155111, // Sepolia
  provider
});

// Initialize SDK
const sdk = new FHEJankenSDK({
  contractAddress: "0x...", // Your deployed contract address
  signer: signer,
  fhevm: fhevm
});

// Create a two-player game
const { gameId } = await sdk.createGame(GameMode.TwoPlayer);
console.log(`Game created with ID: ${gameId}`);

// Player 2 joins (using a different SDK instance with different signer)
await sdk2.joinGame(gameId);

// Player 1 submits move
await sdk.submitMove(gameId, Move.Rock);

// Player 2 submits move
await sdk2.submitMove(gameId, Move.Scissors);

// Check winner
const result = await sdk.checkWinner(gameId);
console.log(result.isDraw ? "It's a draw!" : `Winner: ${result.winner}`);
```

## API Reference

### FHEJankenSDK

Main SDK class for interacting with the FHEJanken contract.

#### Constructor

```typescript
new FHEJankenSDK(config: FHEJankenSDKConfig)
```

**Parameters:**
- `config.contractAddress`: Address of the deployed FHEJanken contract
- `config.signer`: ethers.js Signer instance
- `config.fhevm`: FHEVM instance for encryption operations

#### Methods

##### createGame(mode: GameMode): Promise<CreateGameResult>

Create a new game.

```typescript
const { gameId, receipt } = await sdk.createGame(GameMode.TwoPlayer);
```

**Parameters:**
- `mode`: Either `GameMode.SinglePlayer` or `GameMode.TwoPlayer`

**Returns:**
- `gameId`: Unique identifier for the created game
- `receipt`: Transaction receipt

##### joinGame(gameId: bigint): Promise<ContractTransactionReceipt>

Join an existing two-player game.

```typescript
await sdk.joinGame(gameId);
```

**Parameters:**
- `gameId`: ID of the game to join

**Throws:**
- Error if game is single-player
- Error if trying to join own game
- Error if game is already full

##### submitMove(gameId: bigint, move: Move): Promise<SubmitMoveResult>

Submit an encrypted move for a game.

```typescript
const { receipt, readyToCheckWinner } = await sdk.submitMove(gameId, Move.Rock);
```

**Parameters:**
- `gameId`: ID of the game
- `move`: One of `Move.Rock`, `Move.Paper`, or `Move.Scissors`

**Returns:**
- `receipt`: Transaction receipt
- `readyToCheckWinner`: Boolean indicating if both players have submitted moves

**Throws:**
- Error if move already submitted
- Error if game is finished

##### checkWinner(gameId: bigint): Promise<GameResult>

Determine the winner of a game (triggers FHE decryption).

```typescript
const result = await sdk.checkWinner(gameId);
```

**Parameters:**
- `gameId`: ID of the game

**Returns:**
- `isDraw`: Boolean indicating if game ended in a draw
- `winner`: Address of the winner (undefined if draw)
- `player1Won`: Boolean indicating if player 1 won
- `player2Won`: Boolean indicating if player 2 won
- `cpuWon`: Boolean indicating if CPU won (single-player only)

##### getGameInfo(gameId: bigint): Promise<GameInfo>

Get current information about a game.

```typescript
const info = await sdk.getGameInfo(gameId);
```

**Returns:**
- `mode`: Game mode (single or two-player)
- `player1`: Address of player 1
- `player2`: Address of player 2 (or zero address if not joined)
- `move1Submitted`: Whether player 1 has submitted their move
- `move2Submitted`: Whether player 2 has submitted their move
- `isGameFinished`: Whether the game has finished
- `winner`: Address of the winner

##### getCurrentGameId(): Promise<bigint>

Get the current game ID counter.

```typescript
const currentId = await sdk.getCurrentGameId();
```

##### getContract(): FHEJanken

Get direct access to the underlying contract instance for advanced operations.

```typescript
const contract = sdk.getContract();
```

### Enums

#### Move

```typescript
enum Move {
  Rock = 1,
  Paper = 2,
  Scissors = 3
}
```

#### GameMode

```typescript
enum GameMode {
  SinglePlayer = 0,  // Play against CPU
  TwoPlayer = 1      // Play against another player
}
```

### Utility Functions

The SDK also exports utility functions:

```typescript
import {
  parseMoveString,      // Parse move from string
  getMoveString,        // Convert move enum to string
  parseGameModeString,  // Parse game mode from string
  getGameModeString,    // Convert game mode enum to string
  determineWinner,      // Determine winner from two moves
  isZeroAddress,        // Check if address is zero
  isCpuAddress,         // Check if address is CPU
  formatAddress,        // Format address for display
  getRandomMove         // Get random move for testing
} from 'fhevm-rock-paper-scissors';
```

## Examples

### Single-Player Game (vs CPU)

```typescript
// Create single-player game
const { gameId } = await sdk.createGame(GameMode.SinglePlayer);

// Submit your move (CPU move is auto-generated)
await sdk.submitMove(gameId, Move.Paper);

// Check winner
const result = await sdk.checkWinner(gameId);
if (result.player1Won) {
  console.log("You won!");
} else if (result.cpuWon) {
  console.log("CPU won!");
} else {
  console.log("It's a draw!");
}
```

### Two-Player Game

```typescript
// Player 1: Create game
const { gameId } = await sdkPlayer1.createGame(GameMode.TwoPlayer);

// Player 2: Join game
await sdkPlayer2.joinGame(gameId);

// Both players submit moves
await sdkPlayer1.submitMove(gameId, Move.Rock);
await sdkPlayer2.submitMove(gameId, Move.Scissors);

// Either player can check winner
const result = await sdkPlayer1.checkWinner(gameId);
console.log(`Winner: ${result.winner}`);
```

### Listening to Game Events

```typescript
const contract = sdk.getContract();

// Listen for game created events
contract.on("GameCreated", (gameId, player1, mode) => {
  console.log(`New game ${gameId} created by ${player1}`);
});

// Listen for moves submitted
contract.on("MoveSubmitted", (gameId, player, move) => {
  console.log(`Move submitted for game ${gameId}`);
});

// Listen for game finished
contract.on("GameFinished", (gameId, winner) => {
  console.log(`Game ${gameId} finished. Winner: ${winner}`);
});
```

## Testing

The SDK includes a comprehensive test suite:

```bash
# Run tests from project root
npx hardhat test sdk/test/FHEJankenSDK.test.ts
```

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Clean build artifacts
npm run clean

# Run tests
npm test
```

## Contract Deployment

Before using the SDK, you need to deploy the FHEJanken contract. See the main project README for deployment instructions.

## Security Considerations

- **Private Keys**: Never commit private keys or expose them in client-side code
- **FHE Encryption**: All moves are encrypted using FHE and remain private until winner determination
- **Gas Costs**: FHE operations are more expensive than regular transactions
- **Network**: Ensure you're connected to a FHEVM-compatible network

## Network Support

- **Sepolia Testnet**: Fully supported (recommended for testing)
- **Local Hardhat**: Supported with mock FHEVM mode
- **Other Networks**: Any Zama FHEVM-compatible network

## Troubleshooting

### "Module not found" errors

Make sure all peer dependencies are installed:
```bash
npm install ethers@^6.15.0 @zama-fhe/relayer-sdk
```

### "Contract address is invalid"

Ensure the contract is deployed and you're using the correct network.

### "Transaction failed"

Common causes:
- Insufficient gas
- Contract not deployed on the network
- Invalid game state (e.g., trying to submit move twice)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Links

- [GitHub Repository](https://github.com/salman01zp/RPS-game)
- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Issue Tracker](https://github.com/salman01zp/RPS-game/issues)

## Credits

Built with [Zama's FHEVM](https://www.zama.ai/) technology for fully homomorphic encryption on Ethereum.

---

**Made with ❤️ by salman01zp**
