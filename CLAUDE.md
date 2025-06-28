# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Use Tree.md file to quickly navigate project files structure.

## Development Commands

### Building
- `npm run compile` - Compile TypeScript to JavaScript in dist/
- `npm run prepare` - Compile TypeScript (runs automatically before npm install)
- `npm run clean` - Clean build artifacts using scripts/clean.js

### Testing
- `npm test` - Run all Jest tests
- `npm test -- path/to/test.test.ts` - Run a specific test file
- `npm test -- --testNamePattern="test name"` - Run tests matching a pattern

### Linting and Formatting
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run format-check` - Check Prettier formatting
- `npm run format-fix` - Auto-fix Prettier formatting

### Local Network Setup
- `npm start` - Start a local Shardeum network (requires Shardus CLI)
- `npm run stop` - Stop the local network
- Use config files in `debug-*.config.json` for different network sizes

### Prerequisites
- Node.js 18.19.1 (enforced by engines field)
- Rust 1.74.1+ (for crypto dependencies)
- Shardus CLI (`npm i -g @shardus/cli` for local testing)

## Architecture Overview

Shardeum is an EVM-compatible blockchain built on the Shardus Core distributed ledger framework. It combines Shardus's dynamic sharding and consensus with Ethereum's execution environment.

### Key Integration Layers

1. **Shardus Core Foundation**
   - Provides P2P networking, consensus, and sharding capabilities
   - Shardeum implements Shardus interfaces for transaction handling
   - Initialized via `shardusFactory()` with custom configuration

2. **EVM Integration (`src/evm_v2/` and `src/vm_v7/`)**
   - Custom EVM implementation forked from @ethereumjs/evm
   - VM layer wraps EVM for transaction execution
   - `ShardeumState` bridges Shardus state with EVM requirements
   - Supports all standard EVM opcodes and precompiles

3. **Account Model**
   - **WrappedEVMAccount**: Wraps Ethereum accounts with Shardeum metadata
   - **NetworkAccount**: Stores global network parameters
   - **NodeAccount**: Tracks validator nodes and staking
   - **SecureAccount**: Administrative accounts for governance
   - Uses both Shardeum addresses (64-char hex) and Ethereum addresses (40-char hex)

4. **Transaction Types**
   - **EVM Transactions**: Standard Ethereum transactions (legacy, EIP-2930, EIP-1559)
   - **Internal Transactions**: stake, unstake, claim_reward, penalty, setCertTime
   - **Debug Transactions**: set_account_data (development only)
   - **Governance**: change_config, apply_network_param

### State Management

- **TransactionState** (`src/state/transactionState.ts`): Per-transaction execution context
- **ShardeumState** (`src/state/shardeumState.ts`): EVM-compatible state interface
- **Account Cache**: Multi-level caching system for performance
- **Storage**: SQLite3 backend with models in `src/storage/models/`

### Network Configuration

- Environment configs in `environments/` (local, devnet, testnet, stagenet, mainnet)
- Genesis files define initial accounts and parameters
- Network parameters stored in special NetworkAccount at address 0x0...0
- Dynamic updates via governance transactions

### Key Files to Understand

- `src/index.ts` - Main entry point and Shardus handler registration
- `src/setup/validateTransaction.ts` - Transaction validation logic
- `src/vm_v7/runTx.ts` - EVM transaction execution
- `src/shardeum/wrappedEVMAccountFunctions.ts` - Account state transitions
- `src/state/transactionState.ts` - Transaction execution context
- `src/config/index.ts` - Configuration management

### Testing Guidelines

- Unit tests mirror source structure in `test/unit/src/`
- Integration tests in `test/integration/`
- Many test files have `.disabled` suffix - these are historical tests
- Mock Shardus dependencies when testing in isolation
- Test files use `.test.ts` extension
