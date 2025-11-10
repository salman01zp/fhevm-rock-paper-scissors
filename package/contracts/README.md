# FHE Rock-Paper-Scissors Contracts

Smart contracts for the FHE-based Rock-Paper-Scissors game built with Zama's FHEVM.

## Structure

```
contracts/
├── contracts/         # Solidity smart contracts
│   └── FHEJanken.sol # Main game contract
├── test/             # Contract tests
│   └── FHEJanken.ts  # Test suite
├── tasks/            # Hardhat tasks
│   ├── accounts.ts   # Account management tasks
│   └── FHEJanken.ts  # Game-specific tasks
├── deploy/           # Deployment scripts
│   └── deploy.ts     # Deployment configuration
├── hardhat.config.ts # Hardhat configuration
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Installation

```bash
npm install
```

## Available Scripts

### Development

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run tests on Sepolia
npm run test:sepolia

# Clean build artifacts
npm run clean

# Run linter
npm run lint

# Format code
npm run prettier:write
```

### Deployment

```bash
# Deploy to localhost
npm run deploy:localhost

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts on Sepolia
npm run verify:sepolia
```

### Hardhat Tasks

```bash
# List all accounts
npx hardhat accounts

# Create a new game
npx hardhat create-game --network sepolia

# Submit a move
npx hardhat submit-move --game-id 1 --move rock --network sepolia

# Check winner
npx hardhat check-winner --game-id 1 --network sepolia
```

## Contract: FHEJanken

### Features

- **Two Game Modes**:
  - Single Player: Play against CPU with randomly generated moves
  - Two Player: Play against another address

- **Privacy-Preserving**: All moves are encrypted using FHE
- **Fair**: Winner is determined after both moves are submitted
- **Transparent**: All game states are publicly viewable (except encrypted moves)

### Contract Functions

#### Creating Games

```solidity
// Create a two-player game
function createTwoPlayerGame() external returns (uint256 gameId)

// Create a single-player game (vs CPU)
function createSinglePlayerGame() external returns (uint256 gameId)
```

#### Joining and Playing

```solidity
// Join an existing two-player game
function joinGame(uint256 _gameId) external

// Submit an encrypted move
function submitMove(
    uint256 _gameId,
    externalEuint8 encryptedMove,
    bytes calldata inputProof
) external

// Check winner (triggers decryption)
function checkWinner(uint256 _gameId) external
```

#### View Functions

```solidity
// Get current game ID counter
function gameId() external view returns (uint256)

// Get game details
function games(uint256 gameId) external view returns (Game memory)
```

### Game Flow

#### Two-Player Game

1. Player 1 creates a game: `createTwoPlayerGame()`
2. Player 2 joins: `joinGame(gameId)`
3. Both players submit encrypted moves: `submitMove(gameId, encryptedMove, proof)`
4. Either player checks winner: `checkWinner(gameId)`
5. Winner is determined via FHE decryption

#### Single-Player Game

1. Player creates a game: `createSinglePlayerGame()`
2. Player submits encrypted move: `submitMove(gameId, encryptedMove, proof)`
3. CPU move is auto-generated (random)
4. Player checks winner: `checkWinner(gameId)`
5. Winner is determined via FHE decryption

### Move Values

- `1` = Rock
- `2` = Paper
- `3` = Scissors

### Events

```solidity
event GameCreated(uint256 indexed gameId, address indexed player1, GameMode mode);
event PlayerJoined(uint256 indexed gameId, address indexed player2);
event MoveSubmitted(uint256 indexed gameId, address indexed player, euint8 move);
event GameFinished(uint256 indexed gameId, address indexed winner);
```

## Testing

The test suite covers:

- ✅ Two-player games (all move combinations)
- ✅ Single-player games (vs CPU)
- ✅ Draw scenarios
- ✅ Error handling (invalid states, unauthorized access)
- ✅ Game state transitions

Run tests:

```bash
npm test
```

## Deployment

### Local Deployment

1. Start a local Hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npm run deploy:localhost
```

### Sepolia Testnet Deployment

1. Set up environment variables:
```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

2. Deploy:
```bash
npm run deploy:sepolia
```

3. Verify:
```bash
npm run verify:sepolia
```

## Network Configuration

### Supported Networks

- **Hardhat**: Local development network with FHEVM mock
- **Sepolia**: Ethereum testnet with FHEVM support
- **Anvil**: Alternative local network

### Network Settings

Configure networks in `hardhat.config.ts`:

```typescript
networks: {
  sepolia: {
    chainId: 11155111,
    url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    accounts: {
      mnemonic: MNEMONIC,
      path: "m/44'/60'/0'/0/",
      count: 10
    }
  }
}
```

## Gas Optimization

FHE operations are computationally expensive. Consider:

- Batch operations when possible
- Minimize encrypted state reads
- Use appropriate FHE types (euint8 for moves)

## Security Considerations

- **Move Privacy**: Moves are encrypted and remain private until decryption
- **Fairness**: Both moves must be submitted before winner determination
- **Access Control**: Only game participants can submit moves
- **Replay Protection**: Moves cannot be submitted twice

## Troubleshooting

### "Mock mode required"

Tests require mock FHEVM mode. Ensure `fhevm.isMock` is true in test environment.

### "Compilation failed"

Make sure all dependencies are installed:
```bash
npm install
npm run compile
```

### "Network timeout"

Increase timeout in `hardhat.config.ts` or use a faster RPC endpoint.

## Contributing

1. Write tests for new features
2. Follow Solidity style guide
3. Run linter before committing
4. Update documentation

## License

MIT License - see LICENSE file for details

## Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
