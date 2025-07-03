# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shardeum is an EVM-compliant blockchain platform using dynamic state sharding for scalability. The codebase implements a custom EVM, state management, and sharding mechanisms while maintaining Ethereum compatibility.

## Essential Commands

### Development Setup
```bash
# Install dependencies (use npm ci, not npm install)
npm ci

# Compile TypeScript
npm run prepare
# or
npm run compile

# Start local network (requires shardus CLI)
shardus start 10  # Start with 10 nodes
shardus stop      # Stop network
shardus clean     # Clean network data
```

### Code Quality
```bash
# Lint check
npm run lint

# Format check
npm run format-check

# Auto-fix formatting
npm run format-fix

# Run unit tests
npm test

# Run specific test
npm test -- path/to/test.ts

# Run smoke tests with coverage
npm run test:smoke
```

### Development Workflow
```bash
# Full restart cycle (compile, stop, clean, start)
npm run restart
```

## Code Architecture

### Core Components

1. **EVM Implementation** (`/src/evm_v2/`)
   - `evm.ts` - Main EVM execution engine
   - `opcodes/` - Individual opcode implementations
   - `precompiles/` - Precompiled contracts

2. **Virtual Machine** (`/src/vm_v7/`)
   - `vm.ts` - VM class compatible with EthereumJS
   - `runTx.ts` - Transaction execution logic
   - `runBlock.ts` - Block processing

3. **State Management** (`/src/state/`)
   - `shardeumState.ts` - Core state implementation
   - `transactionState.ts` - Transaction-specific state handling
   - `cache/` - Performance caching layer

4. **Account System** (`/src/types/`)
   - `WrappedEVMAccount.ts` - Standard EVM accounts
   - `NetworkAccount.ts` - System accounts for network operations
   - `NodeAccount.ts` - Validator node accounts
   - Account manipulation utilities in `/src/shardeum/wrappedEVMAccountFunctions.ts`

5. **Transaction Types** (`/src/tx/`)
   - Standard EVM transactions
   - Custom transactions: staking, unstaking, claim rewards, penalties
   - Transaction validation and processing

6. **Storage Layer** (`/src/storage/`)
   - SQLite-based persistence
   - Account data storage and caching

### Key Patterns

- **Account Types**: Different account types (EVM, Network, Node) extend base interfaces
- **Transaction Processing**: Custom transaction types are handled in `/src/tx/` with specific validators
- **State Access**: Always use `shardeumState` for state operations, not direct EVM state
- **Configuration**: Network-specific configs in `/src/config/genesis-*.json`
- **Debug Features**: Controlled via `ShardeumFlags` in `/src/shardeum/shardeumFlags.ts`

### Important Files

- `/src/shardeum/shardeumConstants.ts` - Network constants and addresses
- `/src/shardeum/evmAddress.ts` - Address conversion utilities
- `/src/config/multisig.json` - Multisig permissions configuration
- `/src/setup/validateConfigs.ts` - Configuration validation

## Testing

- Unit tests in `/test/unit/`
- Test files should follow `*.test.ts` pattern
- Jest configuration in root directory
- Mock implementations available in test directories

## Common Tasks

### Adding New Transaction Type
1. Create handler in `/src/tx/`
2. Add transaction type to relevant enums
3. Implement validation logic
4. Add unit tests

### Modifying EVM Behavior
1. Check `/src/evm_v2/opcodes/` for opcode implementations
2. Consider impacts on state management
3. Ensure compatibility with existing contracts

### Working with Accounts
1. Use utilities in `/src/shardeum/wrappedEVMAccountFunctions.ts`
2. Follow existing patterns for account creation/modification
3. Ensure proper account type handling

## Important Considerations

- Always use `npm ci` instead of `npm install`
- Run lint and format checks before committing
- Test with local network before submitting PRs
- Follow existing code patterns and structure
- Check `ShardeumFlags` for debug/development features
- Network genesis configs determine initial state