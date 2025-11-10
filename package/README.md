# FHE Rock-Paper-Scissors Package

This package contains the complete FHE-based Rock-Paper-Scissors game implementation with organized directories for contracts and SDK.

## Package Structure

```
package/
├── contracts/          # Smart contracts and Hardhat setup
│   ├── contracts/     # Solidity smart contracts
│   ├── test/          # Contract tests
│   ├── deploy/        # Deployment scripts
│   ├── hardhat.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── tasks/             # Hardhat tasks for contract interaction
│   ├── accounts.ts   # Account management tasks
│   ├── FHEJanken.ts  # Game interaction tasks
│   └── helpers/      # Task helper functions
│
├── sdk/               # TypeScript SDK (npm package: fhevm-rock-paper-scissors)
│   ├── src/          # SDK source code
│   ├── test/         # SDK tests
│   ├── dist/         # Compiled SDK (after build)
│   ├── package.json
│   └── README.md
│
└── README.md         # This file
```

## Getting Started

### Contracts

The contracts directory contains all smart contract code and testing infrastructure using Hardhat.

```bash
cd package/contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run contract tests
npm test

# Deploy to Sepolia
npm run deploy:sepolia
```

See [contracts/README.md](contracts/README.md) for detailed documentation.

### SDK

The SDK directory contains the TypeScript/JavaScript SDK for interacting with the deployed contracts.

```bash
cd package/sdk

# Install dependencies
npm install

# Build the SDK
npm run build

# Run SDK tests (requires contracts to be compiled in parent)
npm test
```

See [sdk/README.md](sdk/README.md) for detailed API documentation.

## Development Workflow

1. **Develop Contracts**: Work in `package/contracts`
   - Write contracts in `contracts/`
   - Add tests in `test/`
   - Run tests with `npm test`

2. **Build SDK**: Work in `package/sdk`
   - Develop SDK features in `src/`
   - Build with `npm run build`
   - Test with `npm test`

3. **Deploy**: Deploy contracts from `package/contracts`
   - Configure network in `hardhat.config.ts`
   - Deploy with `npm run deploy:sepolia`

4. **Publish SDK**: Publish SDK from `package/sdk`
   - Build with `npm run build`
   - Publish with `npm publish`

## Features

- 🔐 **Privacy-Preserving**: Uses FHE for encrypted game moves
- 🎮 **Two Game Modes**: Single-player (vs CPU) and two-player
- 📦 **Modular**: Separate contracts and SDK packages
- ✅ **Well-Tested**: Comprehensive test suites for both contracts and SDK
- 📝 **TypeScript**: Full TypeScript support throughout

## License

MIT License - see LICENSE file for details
