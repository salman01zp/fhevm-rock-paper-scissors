# fhevm-rock-paper-scissors

A TypeScript SDK for interacting with the FHE-based (Fully Homomorphic Encryption) Rock-Paper-Scissors smart contract built on Zama's FHEVM.

## Quick Start

```typescript
import { FHERockPaperScissorsSDK, Move, GameMode } from 'fhevm-rock-paper-scissors';
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
const sdk = new FHERockPaperScissorsSDK({
  contractAddress: "0x...", // Your deployed contract address
  signer: signer,
  fhevm: fhevm
});

// Create a two-player game
const { gameId } = await sdk.createGame(GameMode.TwoPlayer);
console.log(`Game created with ID: ${gameId}`);

// Player 2 joins (using a different SDK instance with different signer)
await sdk2.joinGame(gameId);

// Player 1 submits encrypted move
await sdk.submitMove(gameId, Move.Rock);

// Player 2 submits encrypted move
await sdk2.submitMove(gameId, Move.Scissors);

// Check winner
const result = await sdk.checkWinner(gameId);
console.log(result.isDraw ? "It's a draw!" : `Winner: ${result.winner}`);
```



## Examples

### Single-Player Game (vs CPU)

```typescript
// Create single-player game
const { gameId } = await sdk.createGame(GameMode.SinglePlayer);

// Submit encrypted move (CPU encrypted move is auto-generated)
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

// Both players submit encrypted moves
await sdkPlayer1.submitMove(gameId, Move.Rock);
await sdkPlayer2.submitMove(gameId, Move.Scissors);

// Either player can check winner
const result = await sdkPlayer1.checkWinner(gameId);
console.log(`Winner: ${result.winner}`);
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

