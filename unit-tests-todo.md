# Unit Tests Coverage TODO Plan

This plan lists TypeScript files in the Shardeum project that currently lack unit test coverage, organized from simplest to most complex.

## How to Use This Plan
You can reference specific tasks by their numbers. For example:
- "Please implement Task #1-10" - Will create tests for the first 10 files
- "Please implement Task #31, #35, and #40" - Will create tests for specific files
- "Please implement all tasks in the 'Simple Utility Files' section" - Will create tests for that section

## Summary
- Total files without tests: 90
- Categories: Simple (30), Medium (34), Complex (26)
- Each task has a unique number (#1 - #90) for easy reference

## Simple Files (Type definitions, constants, simple utilities)

### Type Definition Files
- [ ] **Task #1**: `/home/marc/work/shardeum/src/utils/constants.ts` - Simple constants file (10 lines)
- [ ] **Task #2**: `/home/marc/work/shardeum/src/utils/versions.ts` - Version reading utility (28 lines)
- [ ] **Task #3**: `/home/marc/work/shardeum/src/types/DevAccount.ts` - Simple type definitions (40 lines)
- [ ] **Task #4**: `/home/marc/work/shardeum/src/storage/utils/sqlOpertors.ts` - SQL operators utility
- [ ] **Task #5**: `/home/marc/work/shardeum/src/shardeum/shardeumTypes.ts` - Type definitions and interfaces
- [ ] **Task #6**: `/home/marc/work/shardeum/src/types/NodeAccount.ts` - Node account type definitions (107 lines)
- [ ] **Task #7**: `/home/marc/work/shardeum/src/evm_v2/opcodes/codes.ts` - Opcode constants
- [ ] **Task #8**: `/home/marc/work/shardeum/src/evm_v2/exceptions.ts` - Exception definitions

### Simple Utility Files
- [ ] **Task #9**: `/home/marc/work/shardeum/src/utils/index.ts` - Utility exports
- [ ] **Task #10**: `/home/marc/work/shardeum/src/state/index.ts` - State exports
- [ ] **Task #11**: `/home/marc/work/shardeum/src/storage/models/index.ts` - Model exports
- [ ] **Task #12**: `/home/marc/work/shardeum/src/state/cache/index.ts` - Cache exports
- [ ] **Task #13**: `/home/marc/work/shardeum/src/debug/state/index.ts` - Debug state exports
- [ ] **Task #14**: `/home/marc/work/shardeum/src/config/index.ts` - Configuration exports
- [ ] **Task #15**: `/home/marc/work/shardeum/src/evm_v2/index.ts` - EVM exports
- [ ] **Task #16**: `/home/marc/work/shardeum/src/vm_v7/index.ts` - VM exports
- [ ] **Task #17**: `/home/marc/work/shardeum/src/evm_v2/opcodes/index.ts` - Opcode exports
- [ ] **Task #18**: `/home/marc/work/shardeum/src/evm_v2/precompiles/index.ts` - Precompiles exports

### Version Migration Files (Simple schema changes)
- [ ] **Task #19**: `/home/marc/work/shardeum/src/versioning/migrations/1.9.1.ts` - Version migration
- [ ] **Task #20**: `/home/marc/work/shardeum/src/versioning/migrations/1.10.2.ts` - Version migration
- [ ] **Task #21**: `/home/marc/work/shardeum/src/versioning/migrations/1.11.2.ts` - Version migration
- [ ] **Task #22**: `/home/marc/work/shardeum/src/versioning/migrations/1.11.3.ts` - Version migration
- [ ] **Task #23**: `/home/marc/work/shardeum/src/versioning/migrations/1.15.4.ts` - Version migration
- [ ] **Task #24**: `/home/marc/work/shardeum/src/versioning/migrations/1.16.3.ts` - Version migration

### Simple Storage/Model Files
- [ ] **Task #25**: `/home/marc/work/shardeum/src/storage/models/accountsEntry.ts` - Account entry model
- [ ] **Task #26**: `/home/marc/work/shardeum/src/storage/models/riAccountsCache.ts` - Cache model
- [ ] **Task #27**: `/home/marc/work/shardeum/src/vm_v7/bloom/index.ts` - Bloom filter utilities

### Basic Utility Functions
- [ ] **Task #28**: `/home/marc/work/shardeum/src/utils/customMerge.ts` - Custom merge utility
- [ ] **Task #29**: `/home/marc/work/shardeum/src/utils/ContinuationLocalStorage.ts` - CLS utility
- [ ] **Task #30**: `/home/marc/work/shardeum/src/utils/RequestContext.ts` - Request context utility

## Medium Complexity Files (Single responsibility modules, moderate logic)

### EVM Components
- [ ] **Task #31**: `/home/marc/work/shardeum/src/evm_v2/memory.ts` - EVM memory management
- [ ] **Task #32**: `/home/marc/work/shardeum/src/evm_v2/stack.ts` - EVM stack implementation
- [ ] **Task #33**: `/home/marc/work/shardeum/src/evm_v2/transientStorage.ts` - Transient storage
- [ ] **Task #34**: `/home/marc/work/shardeum/src/evm_v2/eof.ts` - EOF validation
- [ ] **Task #35**: `/home/marc/work/shardeum/src/evm_v2/journal.ts` - State journal
- [ ] **Task #36**: `/home/marc/work/shardeum/src/evm_v2/message.ts` - EVM message handling

### Precompiled Contracts
- [ ] **Task #37**: `/home/marc/work/shardeum/src/evm_v2/precompiles/01-ecrecover.ts` - ECRECOVER precompile
- [ ] **Task #38**: `/home/marc/work/shardeum/src/evm_v2/precompiles/02-sha256.ts` - SHA256 precompile
- [ ] **Task #39**: `/home/marc/work/shardeum/src/evm_v2/precompiles/03-ripemd160.ts` - RIPEMD160 precompile
- [ ] **Task #40**: `/home/marc/work/shardeum/src/evm_v2/precompiles/04-identity.ts` - Identity precompile
- [ ] **Task #41**: `/home/marc/work/shardeum/src/evm_v2/precompiles/05-modexp.ts` - MODEXP precompile
- [ ] **Task #42**: `/home/marc/work/shardeum/src/evm_v2/precompiles/06-ecadd.ts` - ECADD precompile
- [ ] **Task #43**: `/home/marc/work/shardeum/src/evm_v2/precompiles/07-ecmul.ts` - ECMUL precompile
- [ ] **Task #44**: `/home/marc/work/shardeum/src/evm_v2/precompiles/08-ecpairing.ts` - ECPAIRING precompile
- [ ] **Task #45**: `/home/marc/work/shardeum/src/evm_v2/precompiles/09-blake2f.ts` - BLAKE2F precompile
- [ ] **Task #46**: `/home/marc/work/shardeum/src/evm_v2/precompiles/0a-kzg-point-evaluation.ts` - KZG precompile

### Transaction Handling
- [ ] **Task #47**: `/home/marc/work/shardeum/src/tx/penalty/violation.ts` - Violation handling
- [ ] **Task #48**: `/home/marc/work/shardeum/src/tx/penalty/penaltyFunctions.ts` - Penalty calculations
- [ ] **Task #49**: `/home/marc/work/shardeum/src/tx/staking/verifyStake.ts` - Stake verification
- [ ] **Task #50**: `/home/marc/work/shardeum/src/setup/validateTxnFields.ts` - Transaction field validation

### Utility Modules
- [ ] **Task #51**: `/home/marc/work/shardeum/src/utils/requests.ts` - HTTP request utilities
- [ ] **Task #52**: `/home/marc/work/shardeum/src/utils/transaction.ts` - Transaction utilities
- [ ] **Task #53**: `/home/marc/work/shardeum/src/utils/multisig.ts` - Multisig utilities
- [ ] **Task #54**: `/home/marc/work/shardeum/src/handlers/adminCertificate.ts` - Admin certificate handling
- [ ] **Task #55**: `/home/marc/work/shardeum/src/middleware/externalApiMiddleware.ts` - API middleware

### Storage and Cache
- [ ] **Task #56**: `/home/marc/work/shardeum/src/storage/riAccountsCache.ts` - Account cache implementation
- [ ] **Task #57**: `/home/marc/work/shardeum/src/state/cache/originalStorageCache.ts` - Storage cache
- [ ] **Task #58**: `/home/marc/work/shardeum/src/storage/sqlite3storage.ts` - SQLite storage layer

### Debug Utilities
- [ ] **Task #59**: `/home/marc/work/shardeum/src/debug/trace/traceStorageMap.ts` - Trace storage mapping
- [ ] **Task #60**: `/home/marc/work/shardeum/src/debug/trace/traceDataFactory.ts` - Trace data factory
- [ ] **Task #61**: `/home/marc/work/shardeum/src/debug/db/index.ts` - Debug database utilities

### Setup and Environment
- [ ] **Task #62**: `/home/marc/work/shardeum/src/setup/environment.ts` - Environment setup
- [ ] **Task #63**: `/home/marc/work/shardeum/src/setup/ticket-manager/index.ts` - Ticket manager
- [ ] **Task #64**: `/home/marc/work/shardeum/src/versioning/index.ts` - Versioning system

## Complex Files (Core logic, multiple dependencies, state management)

### Core EVM Implementation
- [ ] **Task #65**: `/home/marc/work/shardeum/src/evm_v2/opcodes/util.ts` - Opcode utilities
- [ ] **Task #66**: `/home/marc/work/shardeum/src/evm_v2/opcodes/gas.ts` - Gas calculations
- [ ] **Task #67**: `/home/marc/work/shardeum/src/evm_v2/opcodes/EIP1283.ts` - EIP-1283 implementation
- [ ] **Task #68**: `/home/marc/work/shardeum/src/evm_v2/opcodes/EIP2200.ts` - EIP-2200 implementation
- [ ] **Task #69**: `/home/marc/work/shardeum/src/evm_v2/opcodes/EIP2929.ts` - EIP-2929 implementation
- [ ] **Task #70**: `/home/marc/work/shardeum/src/evm_v2/opcodes/functions.ts` - Opcode functions
- [ ] **Task #71**: `/home/marc/work/shardeum/src/evm_v2/interpreter.ts` - EVM interpreter
- [ ] **Task #72**: `/home/marc/work/shardeum/src/evm_v2/evm.ts` - Main EVM implementation (947 lines)

### State Management
- [ ] **Task #73**: `/home/marc/work/shardeum/src/state/transactionState.ts` - Transaction state management
- [ ] **Task #74**: `/home/marc/work/shardeum/src/state/shardeumState.ts` - Core state implementation (926 lines)
- [ ] **Task #75**: `/home/marc/work/shardeum/src/debug/state/shardeumState.ts` - Debug state implementation
- [ ] **Task #76**: `/home/marc/work/shardeum/src/debug/state/transactionState.ts` - Debug transaction state

### Virtual Machine
- [ ] **Task #77**: `/home/marc/work/shardeum/src/vm_v7/buildBlock.ts` - Block building logic
- [ ] **Task #78**: `/home/marc/work/shardeum/src/vm_v7/runBlock.ts` - Block execution
- [ ] **Task #79**: `/home/marc/work/shardeum/src/vm_v7/runTx.ts` - Transaction execution (674 lines)
- [ ] **Task #80**: `/home/marc/work/shardeum/src/vm_v7/vm.ts` - VM implementation

### Transaction Processing
- [ ] **Task #81**: `/home/marc/work/shardeum/src/tx/penalty/transaction.ts` - Penalty transaction processing
- [ ] **Task #82**: `/home/marc/work/shardeum/src/setup/validateTransaction.ts` - Transaction validation
- [ ] **Task #83**: `/home/marc/work/shardeum/src/setup/sync.ts` - Sync mechanism

### Debug and Replay
- [ ] **Task #84**: `/home/marc/work/shardeum/src/debug/replayTX.ts` - Transaction replay functionality
- [ ] **Task #85**: `/home/marc/work/shardeum/src/debug/estimateGas/estimateGas.ts` - Gas estimation
- [ ] **Task #86**: `/home/marc/work/shardeum/src/debug/evmSetup/index.ts` - EVM setup for debugging

### Data Management
- [ ] **Task #87**: `/home/marc/work/shardeum/src/debug/block/blockchain.ts` - Debug blockchain
- [ ] **Task #88**: `/home/marc/work/shardeum/src/shardeum/debugRestoreAccounts.ts` - Account restoration (252 lines)
- [ ] **Task #89**: `/home/marc/work/shardeum/src/block/blockchain.ts` - Blockchain implementation
- [ ] **Task #90**: `/home/marc/work/shardeum/src/setup/index.ts` - Main setup module

## Testing Strategy Recommendations

1. **Start with Simple Files**: Begin with type definitions and constants as they are easiest to test and provide quick wins.

2. **Focus on Utilities Next**: Utility functions typically have clear inputs/outputs making them straightforward to test.

3. **Test Critical Path**: Prioritize testing transaction processing, state management, and EVM implementation as these are core to the system.

4. **Use Existing Test Patterns**: Follow patterns from existing test files in the codebase for consistency.

5. **Mock Dependencies**: For complex files, create appropriate mocks for external dependencies.

6. **Coverage Goals**: Aim for at least 80% coverage for utility files and 90%+ for critical business logic.

## Notes
- Files in the `debug/` directory may be lower priority as they're development tools
- Migration files may only need basic validation tests
- Some export-only index files may not need dedicated tests
- The plan is saved at `/home/marc/.claude/tasks/unit-tests-todo.md`

## Quick Reference
- **Tasks #1-30**: Simple files (constants, types, exports)
- **Tasks #31-64**: Medium complexity (single responsibility modules)
- **Tasks #65-90**: Complex files (core system components)