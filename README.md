# FHEVM Rock Paper Scissors Game

Confidential Rock-Paper-Scissors game on FHEVM

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

3. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node on seperate Terminal
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

4. **Play Rock Paper Scissor Game**

   ```bash
   # Alice Creates Game
   npx hardhat --network localhost rps:create-game --mode two-player --player alice
   # Bob Joins Game
   npx hardhat --network localhost rps:join-game --game-id 1 --player bob

   # Alice and Bob submits encrypted moves
   npx hardhat --network localhost rps:submit-move --game-id 1 --move rock --player alice
   npx hardhat --network localhost rps:submit-move --game-id 1 --move scissors --player bob

   #Check Winner of the game
   npx hardhat --network localhost rps:check-winner --game-id 1
   ```

5. **Test SDK**

   ```bash
      npx hardhat test sdk/test/FHERockPaperScissorsSDK.test.ts
   ```

   refer more docs [here](/sdk/README.md)

## 📁 Project Structure

```
fhevm-rock-paper-scissors/
├── sdk/                 # Sdk to interact with contract
├── contracts/           # Smart contract source files
│   └── FHERockPaperScissor.sol
├── deploy/              # Deployment scripts
├── tasks/               # Hardhat custom tasks
├── test/                # Test files
├── hardhat.config.ts    # Hardhat configuration
└── package.json         # Dependencies and scripts
```
