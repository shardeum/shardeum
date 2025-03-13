# TypeScript Files Ranked by Testing Difficulty

This report ranks 177 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

## Metrics Used

- **Import Count**: Number of import statements (lower is better)
- **Export Count**: Number of exported symbols (higher is better, as it indicates better modularity)
- **Imported By Count**: Number of files that import this file (higher means more critical to test thoroughly)
- **Lines of Code (LOC)**: Non-empty lines of code (lower is better)
- **Complexity**: Average cyclomatic complexity (lower is better)
- **Avg. Function Length**: Average number of lines per function (lower is better)
- **Async Functions**: Number of async functions (lower is better)
- **Try-Catch Blocks**: Number of try-catch blocks (lower is better)

Note: The "Imported By Count" metric is not used in the testability score calculation, but is factored into the priority score.

## Summary

| Difficulty Level | Number of Files | Percentage |
|------------------|-----------------|------------|
| Easy to Test     | 175 | 98.9% |
| Moderate         | 1 | 0.6% |
| Hard to Test     | 1 | 0.6% |
| **Total**        | **177** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/shardeum/shardeumTypes.ts | 0.68 | 0.97 | 55 | 7 | 60 | 478 | 3.00 |
| ./src/shardeum/shardeumFlags.ts | 0.56 | 0.86 | 42 | 1 | 5 | 327 | 8.50 |
| ./src/index.ts | 0.55 | 0.33 | 27 | 68 | 18 | 7603 | 15.05 |
| ./src/utils/index.ts | 0.31 | 0.88 | 22 | 0 | 0 | 5 | 1.00 |
| ./src/utils/serialization/SchemaHelpe... | 0.30 | 0.88 | 21 | 1 | 3 | 32 | 2.00 |
| ./src/types/enum/AJVSchemaEnum.ts | 0.29 | 0.88 | 21 | 0 | 1 | 27 | 1.00 |
| ./src/storage/accountStorage.ts | 0.20 | 0.85 | 12 | 12 | 17 | 237 | 3.29 |
| ./src/shardeum/evmAddress.ts | 0.19 | 0.82 | 11 | 4 | 3 | 237 | 20.67 |
| ./src/shardeum/wrappedEVMAccountFunct... | 0.19 | 0.87 | 12 | 7 | 9 | 128 | 3.90 |
| ./src/types/ajv/SignSchema.ts | 0.19 | 0.87 | 12 | 2 | 2 | 21 | 1.00 |

## Files Not Imported By Any Other File (69)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/evm_v2/opcodes/util.ts | 0.89 | 7 | 18 | 0 | 238 | 2.50 | 8.78 | 0 | 0 |
| ./src/state/cache/types.ts | 0.88 | 0 | 2 | 0 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/constants.ts | 0.88 | 1 | 3 | 0 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/evm_v2/exceptions.ts | 0.88 | 0 | 2 | 0 | 45 | 1.00 | 0.00 | 0 | 0 |
| ./src/evm_v2/opcodes/index.ts | 0.88 | 0 | 0 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./src/tests/getKeys.js | 0.88 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./generateWallet.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./setup.ts | 0.88 | 0 | 0 | 0 | 2 | 1.00 | 1.00 | 0 | 0 |
| ./src/shardeum/__mocks__/debugRestore... | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 3.00 | 1 | 0 |
| ./mockShardusConfig.ts | 0.88 | 0 | 1 | 0 | 200 | 1.00 | 0.00 | 0 | 0 |
| ./index.ts | 0.87 | 5 | 5 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/evm_v2/message.ts | 0.87 | 2 | 2 | 0 | 103 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/serialization/VectorBuffe... | 0.87 | 0 | 1 | 0 | 182 | 1.09 | 5.41 | 0 | 0 |
| ./src/state/cache/cache.ts | 0.87 | 2 | 1 | 0 | 30 | 1.00 | 0.00 | 0 | 0 |
| ./src/evm_v2/precompiles/types.ts | 0.87 | 3 | 2 | 0 | 13 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/ajv/QueryCertReq.ts | 0.87 | 2 | 1 | 0 | 20 | 1.00 | 3.33 | 0 | 0 |
| ./stop.js | 0.87 | 0 | 0 | 0 | 10 | 2.00 | 8.00 | 1 | 1 |
| ./src/vm_v7/bloom/index.ts | 0.87 | 2 | 1 | 0 | 64 | 1.80 | 6.60 | 0 | 0 |
| ./src/evm_v2/memory.ts | 0.87 | 1 | 1 | 0 | 70 | 2.75 | 10.25 | 0 | 0 |
| ./clean.js | 0.87 | 0 | 0 | 0 | 13 | 2.00 | 11.00 | 1 | 1 |
| ./src/utils/ContinuationLocalStorage.ts | 0.87 | 1 | 1 | 0 | 30 | 1.50 | 7.17 | 2 | 1 |
| ./start.js | 0.87 | 0 | 0 | 0 | 16 | 2.00 | 12.00 | 1 | 1 |
| ./src/versioning/migrations/1.16.3.ts | 0.87 | 3 | 1 | 0 | 13 | 1.00 | 5.00 | 1 | 0 |
| ./src/versioning/migrations/1.10.2.ts | 0.87 | 3 | 1 | 0 | 13 | 1.00 | 6.00 | 1 | 0 |
| ./src/versioning/migrations/1.11.3.ts | 0.87 | 3 | 1 | 0 | 13 | 1.00 | 6.00 | 1 | 0 |
| ./src/versioning/migrations/1.15.4.ts | 0.87 | 3 | 1 | 0 | 14 | 1.00 | 6.00 | 1 | 0 |
| ./src/versioning/migrations/1.9.1.ts | 0.87 | 3 | 1 | 0 | 14 | 1.00 | 6.00 | 1 | 0 |
| ./src/utils/retry.ts | 0.87 | 1 | 3 | 0 | 27 | 4.00 | 17.00 | 1 | 1 |
| ./src/evm_v2/eof.ts | 0.87 | 1 | 7 | 0 | 98 | 8.33 | 28.33 | 0 | 0 |
| ./src/evm_v2/stack.ts | 0.87 | 2 | 1 | 0 | 94 | 2.67 | 9.33 | 0 | 0 |
| ./src/tests/prettyPrint.js | 0.87 | 1 | 0 | 0 | 22 | 2.00 | 15.00 | 0 | 1 |
| ./src/tests/cleanLogs.js | 0.87 | 1 | 0 | 0 | 23 | 2.00 | 15.00 | 0 | 1 |
| ./src/evm_v2/transientStorage.ts | 0.86 | 3 | 1 | 0 | 113 | 2.43 | 9.00 | 0 | 0 |
| ./src/versioning/migrations/1.11.2.ts | 0.86 | 4 | 1 | 0 | 17 | 1.00 | 9.00 | 1 | 0 |
| ./src/utils/transaction.ts | 0.86 | 6 | 5 | 0 | 83 | 2.71 | 10.00 | 0 | 1 |
| ./src/utils/versions.ts | 0.86 | 3 | 3 | 0 | 24 | 3.00 | 19.00 | 0 | 2 |
| ./src/evm_v2/opcodes/EIP2929.ts | 0.86 | 3 | 3 | 0 | 95 | 5.33 | 15.67 | 0 | 0 |
| ./failedTxCheck.ts | 0.86 | 3 | 0 | 0 | 192 | 2.35 | 6.95 | 1 | 0 |
| ./dupeTxNonceCheck.ts | 0.86 | 3 | 0 | 0 | 229 | 2.95 | 8.15 | 1 | 0 |
| ./src/state/cache.ts | 0.86 | 3 | 1 | 0 | 195 | 2.14 | 7.86 | 4 | 0 |
| ./src/evm_v2/precompiles/04-identity.ts | 0.85 | 4 | 1 | 0 | 29 | 5.00 | 25.00 | 0 | 0 |
| ./src/evm_v2/precompiles/02-sha256.ts | 0.85 | 5 | 1 | 0 | 31 | 5.00 | 26.00 | 0 | 0 |
| ./src/evm_v2/precompiles/03-ripemd160.ts | 0.85 | 5 | 1 | 0 | 31 | 5.00 | 26.00 | 0 | 0 |
| ./src/evm_v2/precompiles/09-blake2f.ts | 0.85 | 5 | 2 | 0 | 205 | 4.33 | 27.33 | 0 | 0 |
| ./src/evm_v2/precompiles/index.ts | 0.85 | 14 | 16 | 0 | 170 | 10.00 | 25.00 | 0 | 0 |
| ./src/evm_v2/precompiles/05-modexp.ts | 0.85 | 4 | 2 | 0 | 164 | 6.60 | 30.60 | 0 | 1 |
| ./src/evm_v2/precompiles/06-ecadd.ts | 0.85 | 5 | 1 | 0 | 37 | 7.00 | 32.00 | 0 | 0 |
| ./src/evm_v2/precompiles/07-ecmul.ts | 0.85 | 5 | 1 | 0 | 38 | 7.00 | 33.00 | 0 | 0 |
| ./src/state/cache/account.ts | 0.85 | 8 | 1 | 0 | 242 | 3.45 | 14.55 | 0 | 0 |
| ./src/evm_v2/precompiles/08-ecpairing.ts | 0.84 | 5 | 1 | 0 | 42 | 7.00 | 37.00 | 0 | 0 |
| ./dataRestore.ts | 0.84 | 4 | 0 | 0 | 194 | 2.59 | 12.12 | 6 | 3 |
| ./debugCycleRecords.ts | 0.84 | 0 | 0 | 0 | 164 | 11.50 | 43.75 | 0 | 0 |
| ./src/evm_v2/journal.ts | 0.84 | 6 | 1 | 0 | 254 | 3.06 | 11.13 | 6 | 0 |
| ./src/state/cache/storage.ts | 0.84 | 8 | 1 | 0 | 324 | 4.17 | 19.25 | 0 | 0 |
| ./dbHistory.ts | 0.84 | 6 | 0 | 0 | 162 | 2.75 | 13.44 | 6 | 2 |
| ./src/evm_v2/opcodes/EIP1283.ts | 0.84 | 3 | 1 | 0 | 75 | 10.00 | 57.00 | 0 | 0 |
| ./src/evm_v2/opcodes/codes.ts | 0.83 | 8 | 3 | 0 | 383 | 8.00 | 36.50 | 0 | 0 |
| ./src/evm_v2/precompiles/01-ecrecover.ts | 0.83 | 4 | 1 | 0 | 73 | 11.00 | 61.00 | 0 | 1 |
| ./src/evm_v2/opcodes/EIP2200.ts | 0.83 | 6 | 1 | 0 | 82 | 11.00 | 60.00 | 0 | 0 |
| ./src/vm_v7/buildBlock.ts | 0.83 | 12 | 3 | 0 | 321 | 2.77 | 14.38 | 9 | 0 |
| ./src/evm_v2/precompiles/0a-kzg-point... | 0.82 | 5 | 2 | 0 | 86 | 14.00 | 69.00 | 1 | 1 |
| ./src/evm_v2/opcodes/functions.ts | 0.82 | 6 | 4 | 0 | 1132 | 1.93 | 8.65 | 16 | 1 |
| ./src/vm_v7/runBlock.ts | 0.82 | 11 | 5 | 0 | 611 | 5.31 | 31.31 | 9 | 1 |
| ./src/evm_v2/opcodes/gas.ts | 0.80 | 9 | 3 | 0 | 581 | 3.33 | 16.07 | 27 | 0 |
| ./src/state/shardeumState.ts | 0.80 | 12 | 4 | 0 | 833 | 2.10 | 10.04 | 27 | 0 |
| ./src/evm_v2/evm.ts | 0.79 | 21 | 7 | 0 | 884 | 5.65 | 26.27 | 10 | 3 |
| ./src/vm_v7/runTx.ts | 0.78 | 13 | 2 | 0 | 625 | 16.14 | 78.14 | 3 | 1 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/shardeum/shardeumTypes.ts | 0.97 | 7 | 60 | 55 | 478 | 3.00 | 3.00 | 0 | 0 |
| ./src/evm_v2/opcodes/util.ts | 0.89 | 7 | 18 | 0 | 238 | 2.50 | 8.78 | 0 | 0 |
| ./src/shardeum/shardeumConstants.ts | 0.89 | 2 | 7 | 8 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./src/evm_v2/index.ts | 0.88 | 7 | 12 | 6 | 21 | 1.00 | 0.00 | 0 | 0 |
| ./src/vm_v7/types.ts | 0.88 | 8 | 16 | 1 | 376 | 1.00 | 0.00 | 0 | 0 |
| ./src/state/index.ts | 0.88 | 0 | 2 | 4 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/debug/state/index.ts | 0.88 | 0 | 2 | 4 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/state/cache/types.ts | 0.88 | 0 | 2 | 0 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./types.ts | 0.88 | 0 | 2 | 1 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./src/storage/utils/schemaDefintions.ts | 0.88 | 0 | 2 | 3 | 18 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/constants.ts | 0.88 | 1 | 3 | 0 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/evm_v2/exceptions.ts | 0.88 | 0 | 2 | 0 | 45 | 1.00 | 0.00 | 0 | 0 |
| ./src/versioning/types.ts | 0.88 | 0 | 1 | 7 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/storage/utils/sqlOpertors.ts | 0.88 | 0 | 1 | 2 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/enum/TypeIdentifierEnum.ts | 0.88 | 0 | 1 | 8 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/general.ts | 0.88 | 2 | 9 | 1 | 162 | 3.27 | 12.00 | 0 | 1 |
| ./src/types/enum/AJVSchemaEnum.ts | 0.88 | 0 | 1 | 21 | 27 | 1.00 | 0.00 | 0 | 0 |
| ./src/storage/models/riAccountsCache.ts | 0.88 | 1 | 2 | 1 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./src/storage/models/accountsEntry.ts | 0.88 | 1 | 2 | 1 | 11 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/ajv/PenaltyTXSchema.ts | 0.88 | 3 | 6 | 1 | 87 | 1.00 | 5.00 | 0 | 0 |
| ./src/evm_v2/opcodes/index.ts | 0.88 | 0 | 0 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./src/state/cache/index.ts | 0.88 | 0 | 0 | 2 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./src/tests/getKeys.js | 0.88 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/index.ts | 0.88 | 0 | 0 | 22 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./generateWallet.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./setup.ts | 0.88 | 0 | 0 | 0 | 2 | 1.00 | 1.00 | 0 | 0 |
| ./src/shardeum/__mocks__/debugRestore... | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 3.00 | 1 | 0 |
| ./testUtils.ts | 0.88 | 1 | 16 | 5 | 229 | 2.79 | 9.14 | 13 | 2 |
| ./src/utils/serialization/SchemaHelpe... | 0.88 | 1 | 3 | 21 | 32 | 2.00 | 6.50 | 0 | 0 |
| ./src/vm_v7/index.ts | 0.88 | 4 | 5 | 2 | 37 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/keyUtils.ts | 0.88 | 0 | 1 | 2 | 12 | 1.50 | 6.50 | 0 | 0 |
| ./src/storage/models/index.ts | 0.88 | 2 | 2 | 1 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/serialization.ts | 0.88 | 2 | 7 | 2 | 102 | 4.13 | 12.38 | 0 | 0 |
| ./mockShardusConfig.ts | 0.88 | 0 | 1 | 0 | 200 | 1.00 | 0.00 | 0 | 0 |
| ./src/setup/index.ts | 0.88 | 3 | 3 | 1 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/ajv/SignSchema.ts | 0.87 | 2 | 2 | 12 | 21 | 1.00 | 3.33 | 0 | 0 |
| ./src/utils/RequestContext.ts | 0.87 | 1 | 4 | 2 | 35 | 1.38 | 8.63 | 2 | 1 |
| ./index.ts | 0.87 | 5 | 5 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/requests.ts | 0.87 | 2 | 8 | 3 | 128 | 2.00 | 5.91 | 6 | 0 |
| ./src/evm_v2/message.ts | 0.87 | 2 | 2 | 0 | 103 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/serialization/VectorBuffe... | 0.87 | 0 | 1 | 0 | 182 | 1.09 | 5.41 | 0 | 0 |
| ./src/state/cache/cache.ts | 0.87 | 2 | 1 | 0 | 30 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/BaseAccount.ts | 0.87 | 2 | 3 | 6 | 23 | 2.00 | 8.50 | 0 | 0 |
| ./src/evm_v2/precompiles/types.ts | 0.87 | 3 | 2 | 0 | 13 | 1.00 | 0.00 | 0 | 0 |
| ./nodeReward.ts | 0.87 | 1 | 1 | 1 | 8 | 1.00 | 6.00 | 1 | 0 |
| ./src/evm_v2/types.ts | 0.87 | 10 | 15 | 2 | 339 | 1.00 | 4.33 | 1 | 0 |
| ./src/debug/trace/traceStorageMap.ts | 0.87 | 1 | 1 | 1 | 10 | 2.00 | 7.00 | 0 | 0 |
| ./src/types/ajv/QueryCertReq.ts | 0.87 | 2 | 1 | 0 | 20 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/InjectTxReq.ts | 0.87 | 2 | 1 | 1 | 25 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/StakeResp.ts | 0.87 | 2 | 1 | 1 | 49 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/RemoveNodeCert.ts | 0.87 | 3 | 2 | 1 | 27 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/StakeCert.ts | 0.87 | 3 | 2 | 2 | 29 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/JoinAppData.ts | 0.87 | 4 | 3 | 1 | 33 | 1.00 | 3.00 | 0 | 0 |
| ./src/utils/multisig.ts | 0.87 | 2 | 6 | 2 | 168 | 3.55 | 11.45 | 0 | 2 |
| ./src/types/EVMAccount.ts | 0.87 | 2 | 3 | 1 | 41 | 2.00 | 16.00 | 0 | 0 |
| ./stop.js | 0.87 | 0 | 0 | 0 | 10 | 2.00 | 8.00 | 1 | 1 |
| ./src/debug/db/index.ts | 0.87 | 5 | 7 | 3 | 88 | 2.89 | 12.56 | 0 | 0 |
| ./src/types/ajv/InitNetworkTxSchema.ts | 0.87 | 3 | 1 | 1 | 31 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/ApplyChangeConfigTxSc... | 0.87 | 3 | 1 | 1 | 33 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/ApplyNetworkParamTxSc... | 0.87 | 3 | 1 | 1 | 33 | 1.00 | 3.33 | 0 | 0 |
| ./src/vm_v7/bloom/index.ts | 0.87 | 2 | 1 | 0 | 64 | 1.80 | 6.60 | 0 | 0 |
| ./stop.ts | 0.87 | 2 | 1 | 1 | 12 | 1.00 | 9.00 | 1 | 0 |
| ./src/evm_v2/memory.ts | 0.87 | 1 | 1 | 0 | 70 | 2.75 | 10.25 | 0 | 0 |
| ./src/types/DevAccount.ts | 0.87 | 3 | 3 | 1 | 35 | 2.00 | 13.00 | 0 | 0 |
| ./clean.js | 0.87 | 0 | 0 | 0 | 13 | 2.00 | 11.00 | 1 | 1 |
| ./src/utils/ContinuationLocalStorage.ts | 0.87 | 1 | 1 | 0 | 30 | 1.50 | 7.17 | 2 | 1 |
| ./start.js | 0.87 | 0 | 0 | 0 | 16 | 2.00 | 12.00 | 1 | 1 |
| ./src/state/cache/originalStorageCach... | 0.87 | 2 | 1 | 2 | 43 | 1.00 | 10.67 | 1 | 0 |
| ./src/versioning/migrations/1.16.3.ts | 0.87 | 3 | 1 | 0 | 13 | 1.00 | 5.00 | 1 | 0 |
| ./src/shardeum/initialNetworkParamete... | 0.87 | 4 | 1 | 1 | 47 | 1.00 | 0.00 | 0 | 0 |
| ./src/versioning/migrations/1.10.2.ts | 0.87 | 3 | 1 | 0 | 13 | 1.00 | 6.00 | 1 | 0 |
| ./src/versioning/migrations/1.11.3.ts | 0.87 | 3 | 1 | 0 | 13 | 1.00 | 6.00 | 1 | 0 |
| ./src/versioning/migrations/1.15.4.ts | 0.87 | 3 | 1 | 0 | 14 | 1.00 | 6.00 | 1 | 0 |
| ./src/versioning/migrations/1.9.1.ts | 0.87 | 3 | 1 | 0 | 14 | 1.00 | 6.00 | 1 | 0 |
| ./src/debug/utils/wrappedEVMAccountFu... | 0.87 | 5 | 7 | 3 | 109 | 4.38 | 12.25 | 0 | 0 |
| ./src/utils/retry.ts | 0.87 | 1 | 3 | 0 | 27 | 4.00 | 17.00 | 1 | 1 |
| ./src/shardeum/wrappedEVMAccountFunct... | 0.87 | 7 | 9 | 12 | 128 | 3.90 | 11.10 | 0 | 0 |
| ./src/types/ajv/SetCertTimeTxSchema.ts | 0.87 | 4 | 1 | 1 | 36 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/StakeTxSchema.ts | 0.87 | 4 | 1 | 1 | 36 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/UnstakeTxSchema.ts | 0.87 | 4 | 1 | 1 | 36 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/ChangeConfigTxSchema.ts | 0.87 | 4 | 1 | 1 | 39 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/ChangeNetworkParamTxS... | 0.87 | 4 | 1 | 1 | 39 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/TransferFromSecureAcc... | 0.87 | 4 | 1 | 1 | 41 | 1.00 | 3.33 | 0 | 0 |
| ./src/evm_v2/eof.ts | 0.87 | 1 | 7 | 0 | 98 | 8.33 | 28.33 | 0 | 0 |
| ./src/types/ajv/InitRewardTimesTxSche... | 0.87 | 4 | 1 | 1 | 46 | 1.00 | 3.33 | 0 | 0 |
| ./src/types/ajv/ClaimRewardTxSchema.ts | 0.87 | 4 | 1 | 1 | 52 | 1.00 | 3.33 | 0 | 0 |
| ./src/evm_v2/stack.ts | 0.87 | 2 | 1 | 0 | 94 | 2.67 | 9.33 | 0 | 0 |
| ./src/utils/safeMath.ts | 0.87 | 2 | 1 | 2 | 20 | 4.00 | 8.00 | 0 | 0 |
| ./src/middleware/externalApiMiddlewar... | 0.87 | 2 | 1 | 1 | 29 | 3.00 | 12.25 | 0 | 0 |
| ./src/tests/prettyPrint.js | 0.87 | 1 | 0 | 0 | 22 | 2.00 | 15.00 | 0 | 1 |
| ./src/tests/cleanLogs.js | 0.87 | 1 | 0 | 0 | 23 | 2.00 | 15.00 | 0 | 1 |
| ./src/debug/block/blockchain.ts | 0.87 | 4 | 3 | 3 | 58 | 2.00 | 10.00 | 1 | 0 |
| ./src/block/blockchain.ts | 0.87 | 3 | 1 | 1 | 35 | 1.50 | 10.00 | 1 | 0 |
| ./src/debug/trace/traceDataFactory.ts | 0.86 | 0 | 2 | 2 | 383 | 3.00 | 19.71 | 0 | 0 |
| ./src/evm_v2/transientStorage.ts | 0.86 | 3 | 1 | 0 | 113 | 2.43 | 9.00 | 0 | 0 |
| ./src/versioning/migrations/1.11.2.ts | 0.86 | 4 | 1 | 0 | 17 | 1.00 | 9.00 | 1 | 0 |
| ./src/utils/transaction.ts | 0.86 | 6 | 5 | 0 | 83 | 2.71 | 10.00 | 0 | 1 |
| ./src/utils/versions.ts | 0.86 | 3 | 3 | 0 | 24 | 3.00 | 19.00 | 0 | 2 |
| ./src/evm_v2/opcodes/EIP2929.ts | 0.86 | 3 | 3 | 0 | 95 | 5.33 | 15.67 | 0 | 0 |
| ./src/debug/evmSetup/index.ts | 0.86 | 8 | 7 | 3 | 84 | 1.50 | 20.50 | 1 | 0 |
| ./failedTxCheck.ts | 0.86 | 3 | 0 | 0 | 192 | 2.35 | 6.95 | 1 | 0 |
| ./src/setup/helpers.ts | 0.86 | 8 | 9 | 10 | 139 | 5.25 | 12.75 | 0 | 2 |
| ./src/tx/penalty/penaltyFunctions.ts | 0.86 | 6 | 2 | 2 | 41 | 2.00 | 15.50 | 0 | 0 |
| ./dupeTxNonceCheck.ts | 0.86 | 3 | 0 | 0 | 229 | 2.95 | 8.15 | 1 | 0 |
| ./src/shardeum/shardeumFlags.ts | 0.86 | 1 | 5 | 42 | 327 | 8.50 | 21.50 | 0 | 2 |
| ./src/state/cache.ts | 0.86 | 3 | 1 | 0 | 195 | 2.14 | 7.86 | 4 | 0 |
| ./src/setup/ticket-manager/index.ts | 0.86 | 9 | 9 | 2 | 140 | 3.07 | 11.00 | 2 | 2 |
| ./src/versioning/index.ts | 0.86 | 2 | 1 | 1 | 36 | 5.00 | 22.00 | 1 | 1 |
| ./src/config/index.ts | 0.86 | 7 | 3 | 8 | 436 | 1.00 | 1.00 | 0 | 1 |
| ./src/evm_v2/precompiles/04-identity.ts | 0.85 | 4 | 1 | 0 | 29 | 5.00 | 25.00 | 0 | 0 |
| ./src/types/NodeAccount.ts | 0.85 | 5 | 3 | 1 | 93 | 3.50 | 33.50 | 0 | 0 |
| ./src/types/NetworkAccount.ts | 0.85 | 5 | 3 | 2 | 86 | 4.00 | 32.00 | 0 | 0 |
| ./transactions.ts | 0.85 | 4 | 1 | 1 | 59 | 1.00 | 34.00 | 2 | 0 |
| ./accountsSyncCheck.ts | 0.85 | 5 | 10 | 1 | 197 | 2.95 | 12.20 | 12 | 3 |
| ./start.ts | 0.85 | 4 | 1 | 1 | 30 | 5.00 | 22.00 | 1 | 1 |
| ./src/evm_v2/precompiles/02-sha256.ts | 0.85 | 5 | 1 | 0 | 31 | 5.00 | 26.00 | 0 | 0 |
| ./src/evm_v2/precompiles/03-ripemd160.ts | 0.85 | 5 | 1 | 0 | 31 | 5.00 | 26.00 | 0 | 0 |
| ./src/evm_v2/precompiles/09-blake2f.ts | 0.85 | 5 | 2 | 0 | 205 | 4.33 | 27.33 | 0 | 0 |
| ./src/evm_v2/precompiles/index.ts | 0.85 | 14 | 16 | 0 | 170 | 10.00 | 25.00 | 0 | 0 |
| ./src/handlers/adminCertificate.ts | 0.85 | 6 | 4 | 2 | 62 | 7.50 | 20.50 | 1 | 2 |
| ./src/evm_v2/precompiles/05-modexp.ts | 0.85 | 4 | 2 | 0 | 164 | 6.60 | 30.60 | 0 | 1 |
| ./src/storage/accountStorage.ts | 0.85 | 12 | 17 | 12 | 237 | 3.29 | 14.50 | 13 | 3 |
| ./src/evm_v2/precompiles/06-ecadd.ts | 0.85 | 5 | 1 | 0 | 37 | 7.00 | 32.00 | 0 | 0 |
| ./src/types/SecureAccount.ts | 0.85 | 6 | 2 | 1 | 80 | 7.00 | 24.00 | 0 | 1 |
| ./src/evm_v2/precompiles/07-ecmul.ts | 0.85 | 5 | 1 | 0 | 38 | 7.00 | 33.00 | 0 | 0 |
| ./src/state/cache/account.ts | 0.85 | 8 | 1 | 0 | 242 | 3.45 | 14.55 | 0 | 0 |
| ./src/tx/penalty/violation.ts | 0.84 | 5 | 1 | 1 | 33 | 9.00 | 28.00 | 0 | 0 |
| ./src/types/Helpers.ts | 0.84 | 10 | 4 | 1 | 110 | 4.75 | 22.50 | 0 | 0 |
| ./src/evm_v2/precompiles/08-ecpairing.ts | 0.84 | 5 | 1 | 0 | 42 | 7.00 | 37.00 | 0 | 0 |
| ./dataRestore.ts | 0.84 | 4 | 0 | 0 | 194 | 2.59 | 12.12 | 6 | 3 |
| ./debugCycleRecords.ts | 0.84 | 0 | 0 | 0 | 164 | 11.50 | 43.75 | 0 | 0 |
| ./src/evm_v2/journal.ts | 0.84 | 6 | 1 | 0 | 254 | 3.06 | 11.13 | 6 | 0 |
| ./src/state/cache/storage.ts | 0.84 | 8 | 1 | 0 | 324 | 4.17 | 19.25 | 0 | 0 |
| ./dbHistory.ts | 0.84 | 6 | 0 | 0 | 162 | 2.75 | 13.44 | 6 | 2 |
| ./src/evm_v2/opcodes/EIP1283.ts | 0.84 | 3 | 1 | 0 | 75 | 10.00 | 57.00 | 0 | 0 |
| ./src/storage/riAccountsCache.ts | 0.84 | 8 | 2 | 2 | 55 | 8.50 | 23.50 | 2 | 2 |
| ./src/debug/estimateGas/estimateGas.ts | 0.83 | 12 | 2 | 1 | 110 | 4.00 | 25.25 | 1 | 0 |
| ./src/evm_v2/opcodes/codes.ts | 0.83 | 8 | 3 | 0 | 383 | 8.00 | 36.50 | 0 | 0 |
| ./src/tx/initRewardTimes.ts | 0.83 | 9 | 5 | 3 | 209 | 11.60 | 35.60 | 1 | 0 |
| ./src/evm_v2/precompiles/01-ecrecover.ts | 0.83 | 4 | 1 | 0 | 73 | 11.00 | 61.00 | 0 | 1 |
| ./src/handlers/queryCertificate.ts | 0.83 | 12 | 10 | 4 | 320 | 3.93 | 21.79 | 9 | 4 |
| ./archiver.ts | 0.83 | 4 | 1 | 1 | 151 | 8.50 | 47.33 | 5 | 1 |
| ./src/shardeum/secureAccounts.ts | 0.83 | 16 | 9 | 6 | 301 | 6.00 | 29.88 | 1 | 1 |
| ./src/evm_v2/opcodes/EIP2200.ts | 0.83 | 6 | 1 | 0 | 82 | 11.00 | 60.00 | 0 | 0 |
| ./src/vm_v7/buildBlock.ts | 0.83 | 12 | 3 | 0 | 321 | 2.77 | 14.38 | 9 | 0 |
| ./src/debug/utils/evmAddress.ts | 0.82 | 2 | 2 | 4 | 138 | 20.00 | 66.00 | 0 | 0 |
| ./src/shardeum/services/networkAccoun... | 0.82 | 4 | 4 | 1 | 153 | 14.33 | 75.00 | 1 | 2 |
| ./src/types/ajv/Helpers.ts | 0.82 | 21 | 3 | 3 | 84 | 1.78 | 8.89 | 0 | 0 |
| ./src/vm_v7/vm.ts | 0.82 | 14 | 1 | 2 | 230 | 2.22 | 9.22 | 7 | 1 |
| ./src/evm_v2/precompiles/0a-kzg-point... | 0.82 | 5 | 2 | 0 | 86 | 14.00 | 69.00 | 1 | 1 |
| ./src/utils/account.ts | 0.82 | 7 | 1 | 1 | 54 | 16.00 | 47.00 | 1 | 0 |
| ./src/evm_v2/opcodes/functions.ts | 0.82 | 6 | 4 | 0 | 1132 | 1.93 | 8.65 | 16 | 1 |
| ./src/debug/state/transactionState.ts | 0.82 | 12 | 10 | 1 | 927 | 5.54 | 26.86 | 10 | 0 |
| ./src/types/WrappedEVMAccount.ts | 0.82 | 8 | 3 | 1 | 137 | 16.50 | 53.00 | 0 | 0 |
| ./src/storage/sqlite3storage.ts | 0.82 | 9 | 3 | 1 | 531 | 3.19 | 18.03 | 7 | 9 |
| ./src/state/transactionState.ts | 0.82 | 13 | 11 | 2 | 950 | 5.82 | 27.21 | 10 | 0 |
| ./src/vm_v7/runBlock.ts | 0.82 | 11 | 5 | 0 | 611 | 5.31 | 31.31 | 9 | 1 |
| ./src/shardeum/evmAddress.ts | 0.82 | 4 | 3 | 11 | 237 | 20.67 | 74.00 | 0 | 0 |
| ./src/tx/penalty/transaction.ts | 0.81 | 15 | 4 | 2 | 310 | 7.57 | 37.43 | 2 | 1 |
| ./src/setup/validateTransaction.ts | 0.81 | 13 | 1 | 1 | 171 | 10.17 | 40.00 | 0 | 1 |
| ./src/setup/sync.ts | 0.81 | 17 | 3 | 1 | 321 | 4.50 | 23.19 | 5 | 0 |
| ./src/tx/setCertTime.ts | 0.81 | 17 | 7 | 3 | 292 | 9.67 | 40.67 | 1 | 2 |
| ./src/storage/storage.ts | 0.81 | 7 | 4 | 3 | 296 | 2.45 | 11.23 | 21 | 12 |
| ./src/shardeum/debugRestoreAccounts.ts | 0.81 | 10 | 4 | 1 | 227 | 12.50 | 59.50 | 3 | 5 |
| ./src/tx/staking/verifyStake.ts | 0.80 | 10 | 3 | 1 | 248 | 18.33 | 72.00 | 0 | 0 |
| ./src/evm_v2/opcodes/gas.ts | 0.80 | 9 | 3 | 0 | 581 | 3.33 | 16.07 | 27 | 0 |
| ./src/evm_v2/interpreter.ts | 0.80 | 16 | 7 | 1 | 993 | 2.67 | 12.12 | 16 | 1 |
| ./src/debug/state/shardeumState.ts | 0.80 | 11 | 4 | 1 | 832 | 2.10 | 9.47 | 27 | 0 |
| ./src/state/shardeumState.ts | 0.80 | 12 | 4 | 0 | 833 | 2.10 | 10.04 | 27 | 0 |
| ./src/tx/claimReward.ts | 0.79 | 11 | 4 | 2 | 359 | 18.25 | 78.75 | 2 | 1 |
| ./src/debug/replayTX.ts | 0.79 | 21 | 1 | 1 | 386 | 4.31 | 32.06 | 6 | 1 |
| ./src/evm_v2/evm.ts | 0.79 | 21 | 7 | 0 | 884 | 5.65 | 26.27 | 10 | 3 |
| ./src/vm_v7/runTx.ts | 0.78 | 13 | 2 | 0 | 625 | 16.14 | 78.14 | 3 | 1 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/setup/validateTxnFields.ts | 0.48 | 19 | 1 | 1 | 548 | 122.00 | 473.50 | 0 | 3 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/index.ts | 0.33 | 68 | 18 | 27 | 7603 | 15.05 | 70.35 | 88 | 78 |

## Detailed Metrics

### ./src/shardeum/shardeumTypes.ts

- **Composite Score:** 0.97 (testability)
- **Priority Score:** 0.68 (importance for testing)
- **Import Count:** 7 (normalized: 0.90)
- **Export Count:** 60 (normalized: 1.00)
- **Imported By Count:** 55 (normalized: 1.00)
- **Lines of Code:** 478 (normalized: 0.94)
- **Complexity:** 3.00 (normalized: 0.98)
- **Avg. Function Length:** 3.00 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/opcodes/util.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 7 (normalized: 0.90)
- **Export Count:** 18 (normalized: 0.30)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 238 (normalized: 0.97)
- **Complexity:** 2.50 (normalized: 0.99)
- **Avg. Function Length:** 8.78 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/shardeum/shardeumConstants.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 8 (normalized: 0.15)
- **Lines of Code:** 12 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 7 (normalized: 0.90)
- **Export Count:** 12 (normalized: 0.20)
- **Imported By Count:** 6 (normalized: 0.11)
- **Lines of Code:** 21 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/vm_v7/types.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 16 (normalized: 0.27)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 376 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 4 (normalized: 0.07)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/debug/state/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 4 (normalized: 0.07)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state/cache/types.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 8 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./types.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 15 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/utils/schemaDefintions.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 18 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/constants.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 8 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/exceptions.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 45 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/versioning/types.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 7 (normalized: 0.13)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/utils/sqlOpertors.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/enum/TypeIdentifierEnum.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 8 (normalized: 0.15)
- **Lines of Code:** 12 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/general.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 9 (normalized: 0.15)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 162 (normalized: 0.98)
- **Complexity:** 3.27 (normalized: 0.98)
- **Avg. Function Length:** 12.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/types/enum/AJVSchemaEnum.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 21 (normalized: 0.38)
- **Lines of Code:** 27 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/models/riAccountsCache.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 10 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/models/accountsEntry.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 11 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/PenaltyTXSchema.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 6 (normalized: 0.10)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 87 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/opcodes/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state/cache/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/tests/getKeys.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 22 (normalized: 0.40)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./prettier.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./generateWallet.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 12 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./setup.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 1.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/shardeum/__mocks__/debugRestoreAccounts.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./testUtils.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 16 (normalized: 0.27)
- **Imported By Count:** 5 (normalized: 0.09)
- **Lines of Code:** 229 (normalized: 0.97)
- **Complexity:** 2.79 (normalized: 0.99)
- **Avg. Function Length:** 9.14 (normalized: 0.98)
- **Async Functions:** 13 (normalized: 0.85)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/utils/serialization/SchemaHelpers.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.30 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 21 (normalized: 0.38)
- **Lines of Code:** 32 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 6.50 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/vm_v7/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 5 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 37 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/keyUtils.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 12 (normalized: 1.00)
- **Complexity:** 1.50 (normalized: 1.00)
- **Avg. Function Length:** 6.50 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/models/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/serialization.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 102 (normalized: 0.99)
- **Complexity:** 4.13 (normalized: 0.97)
- **Avg. Function Length:** 12.38 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./mockShardusConfig.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 200 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/setup/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/SignSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 12 (normalized: 0.22)
- **Lines of Code:** 21 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/RequestContext.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 35 (normalized: 1.00)
- **Complexity:** 1.38 (normalized: 1.00)
- **Avg. Function Length:** 8.63 (normalized: 0.98)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./index.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 5 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/requests.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 8 (normalized: 0.13)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 128 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 5.91 (normalized: 0.99)
- **Async Functions:** 6 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/message.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 103 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/serialization/VectorBufferStream.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 182 (normalized: 0.98)
- **Complexity:** 1.09 (normalized: 1.00)
- **Avg. Function Length:** 5.41 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state/cache/cache.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 30 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/BaseAccount.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 6 (normalized: 0.11)
- **Lines of Code:** 23 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 8.50 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/precompiles/types.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./nodeReward.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 8 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/types.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 10 (normalized: 0.85)
- **Export Count:** 15 (normalized: 0.25)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 339 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.33 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/debug/trace/traceStorageMap.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 10 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 7.00 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/QueryCertReq.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 20 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/InjectTxReq.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 25 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/StakeResp.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 49 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/RemoveNodeCert.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 27 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/StakeCert.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 29 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/JoinAppData.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 33 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/multisig.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 6 (normalized: 0.10)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 168 (normalized: 0.98)
- **Complexity:** 3.55 (normalized: 0.98)
- **Avg. Function Length:** 11.45 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/types/EVMAccount.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 41 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 16.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./stop.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 10 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 8.00 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/debug/db/index.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 88 (normalized: 0.99)
- **Complexity:** 2.89 (normalized: 0.98)
- **Avg. Function Length:** 12.56 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/InitNetworkTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 31 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/ApplyChangeConfigTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 33 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/ApplyNetworkParamTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 33 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/vm_v7/bloom/index.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 64 (normalized: 0.99)
- **Complexity:** 1.80 (normalized: 0.99)
- **Avg. Function Length:** 6.60 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./stop.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 12 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.00 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/memory.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 70 (normalized: 0.99)
- **Complexity:** 2.75 (normalized: 0.99)
- **Avg. Function Length:** 10.25 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/DevAccount.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 35 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 13.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./clean.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 11.00 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/utils/ContinuationLocalStorage.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 30 (normalized: 1.00)
- **Complexity:** 1.50 (normalized: 1.00)
- **Avg. Function Length:** 7.17 (normalized: 0.98)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./start.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 16 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 12.00 (normalized: 0.97)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/state/cache/originalStorageCache.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 43 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 10.67 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/versioning/migrations/1.16.3.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/shardeum/initialNetworkParameters.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 47 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/versioning/migrations/1.10.2.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/versioning/migrations/1.11.3.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/versioning/migrations/1.15.4.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/versioning/migrations/1.9.1.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/debug/utils/wrappedEVMAccountFunctions.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 109 (normalized: 0.99)
- **Complexity:** 4.38 (normalized: 0.97)
- **Avg. Function Length:** 12.25 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/retry.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 27 (normalized: 1.00)
- **Complexity:** 4.00 (normalized: 0.98)
- **Avg. Function Length:** 17.00 (normalized: 0.96)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/shardeum/wrappedEVMAccountFunctions.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 7 (normalized: 0.90)
- **Export Count:** 9 (normalized: 0.15)
- **Imported By Count:** 12 (normalized: 0.22)
- **Lines of Code:** 128 (normalized: 0.98)
- **Complexity:** 3.90 (normalized: 0.98)
- **Avg. Function Length:** 11.10 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/SetCertTimeTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 36 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/StakeTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 36 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/UnstakeTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 36 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/ChangeConfigTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 39 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/ChangeNetworkParamTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 39 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/TransferFromSecureAccountTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 41 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/eof.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 98 (normalized: 0.99)
- **Complexity:** 8.33 (normalized: 0.94)
- **Avg. Function Length:** 28.33 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/InitRewardTimesTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 46 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/ajv/ClaimRewardTxSchema.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 52 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.33 (normalized: 0.99)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/stack.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 94 (normalized: 0.99)
- **Complexity:** 2.67 (normalized: 0.99)
- **Avg. Function Length:** 9.33 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/safeMath.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 20 (normalized: 1.00)
- **Complexity:** 4.00 (normalized: 0.98)
- **Avg. Function Length:** 8.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middleware/externalApiMiddleware.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 29 (normalized: 1.00)
- **Complexity:** 3.00 (normalized: 0.98)
- **Avg. Function Length:** 12.25 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/tests/prettyPrint.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 22 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 15.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/tests/cleanLogs.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 23 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 15.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/debug/block/blockchain.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 58 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 10.00 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/block/blockchain.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 35 (normalized: 1.00)
- **Complexity:** 1.50 (normalized: 1.00)
- **Avg. Function Length:** 10.00 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/debug/trace/traceDataFactory.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 383 (normalized: 0.95)
- **Complexity:** 3.00 (normalized: 0.98)
- **Avg. Function Length:** 19.71 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/transientStorage.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 113 (normalized: 0.99)
- **Complexity:** 2.43 (normalized: 0.99)
- **Avg. Function Length:** 9.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/versioning/migrations/1.11.2.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 17 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.00 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/transaction.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 5 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 83 (normalized: 0.99)
- **Complexity:** 2.71 (normalized: 0.99)
- **Avg. Function Length:** 10.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/utils/versions.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 24 (normalized: 1.00)
- **Complexity:** 3.00 (normalized: 0.98)
- **Avg. Function Length:** 19.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/evm_v2/opcodes/EIP2929.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 95 (normalized: 0.99)
- **Complexity:** 5.33 (normalized: 0.96)
- **Avg. Function Length:** 15.67 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/debug/evmSetup/index.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 84 (normalized: 0.99)
- **Complexity:** 1.50 (normalized: 1.00)
- **Avg. Function Length:** 20.50 (normalized: 0.96)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./failedTxCheck.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 192 (normalized: 0.97)
- **Complexity:** 2.35 (normalized: 0.99)
- **Avg. Function Length:** 6.95 (normalized: 0.99)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/setup/helpers.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 9 (normalized: 0.15)
- **Imported By Count:** 10 (normalized: 0.18)
- **Lines of Code:** 139 (normalized: 0.98)
- **Complexity:** 5.25 (normalized: 0.96)
- **Avg. Function Length:** 12.75 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/tx/penalty/penaltyFunctions.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 41 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.99)
- **Avg. Function Length:** 15.50 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./dupeTxNonceCheck.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 229 (normalized: 0.97)
- **Complexity:** 2.95 (normalized: 0.98)
- **Avg. Function Length:** 8.15 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/shardeum/shardeumFlags.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.56 (importance for testing)
- **Import Count:** 1 (normalized: 0.99)
- **Export Count:** 5 (normalized: 0.08)
- **Imported By Count:** 42 (normalized: 0.76)
- **Lines of Code:** 327 (normalized: 0.96)
- **Complexity:** 8.50 (normalized: 0.94)
- **Avg. Function Length:** 21.50 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/state/cache.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 195 (normalized: 0.97)
- **Complexity:** 2.14 (normalized: 0.99)
- **Avg. Function Length:** 7.86 (normalized: 0.98)
- **Async Functions:** 4 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/setup/ticket-manager/index.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 9 (normalized: 0.87)
- **Export Count:** 9 (normalized: 0.15)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 140 (normalized: 0.98)
- **Complexity:** 3.07 (normalized: 0.98)
- **Avg. Function Length:** 11.00 (normalized: 0.98)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/versioning/index.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 36 (normalized: 1.00)
- **Complexity:** 5.00 (normalized: 0.97)
- **Avg. Function Length:** 22.00 (normalized: 0.95)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/config/index.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 7 (normalized: 0.90)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 8 (normalized: 0.15)
- **Lines of Code:** 436 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 1.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/evm_v2/precompiles/04-identity.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 29 (normalized: 1.00)
- **Complexity:** 5.00 (normalized: 0.97)
- **Avg. Function Length:** 25.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/NodeAccount.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 93 (normalized: 0.99)
- **Complexity:** 3.50 (normalized: 0.98)
- **Avg. Function Length:** 33.50 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/NetworkAccount.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 86 (normalized: 0.99)
- **Complexity:** 4.00 (normalized: 0.98)
- **Avg. Function Length:** 32.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./transactions.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 59 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 34.00 (normalized: 0.93)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./accountsSyncCheck.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 10 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 197 (normalized: 0.97)
- **Complexity:** 2.95 (normalized: 0.98)
- **Avg. Function Length:** 12.20 (normalized: 0.97)
- **Async Functions:** 12 (normalized: 0.86)
- **Try-Catch Blocks:** 3 (normalized: 0.96)
### ./start.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 30 (normalized: 1.00)
- **Complexity:** 5.00 (normalized: 0.97)
- **Avg. Function Length:** 22.00 (normalized: 0.95)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/evm_v2/precompiles/02-sha256.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 31 (normalized: 1.00)
- **Complexity:** 5.00 (normalized: 0.97)
- **Avg. Function Length:** 26.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/precompiles/03-ripemd160.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 31 (normalized: 1.00)
- **Complexity:** 5.00 (normalized: 0.97)
- **Avg. Function Length:** 26.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/precompiles/09-blake2f.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 205 (normalized: 0.97)
- **Complexity:** 4.33 (normalized: 0.97)
- **Avg. Function Length:** 27.33 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/precompiles/index.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 14 (normalized: 0.79)
- **Export Count:** 16 (normalized: 0.27)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 170 (normalized: 0.98)
- **Complexity:** 10.00 (normalized: 0.93)
- **Avg. Function Length:** 25.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/handlers/adminCertificate.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 62 (normalized: 0.99)
- **Complexity:** 7.50 (normalized: 0.95)
- **Avg. Function Length:** 20.50 (normalized: 0.96)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/evm_v2/precompiles/05-modexp.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 164 (normalized: 0.98)
- **Complexity:** 6.60 (normalized: 0.95)
- **Avg. Function Length:** 30.60 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/storage/accountStorage.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 12 (normalized: 0.82)
- **Export Count:** 17 (normalized: 0.28)
- **Imported By Count:** 12 (normalized: 0.22)
- **Lines of Code:** 237 (normalized: 0.97)
- **Complexity:** 3.29 (normalized: 0.98)
- **Avg. Function Length:** 14.50 (normalized: 0.97)
- **Async Functions:** 13 (normalized: 0.85)
- **Try-Catch Blocks:** 3 (normalized: 0.96)
### ./src/evm_v2/precompiles/06-ecadd.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 37 (normalized: 1.00)
- **Complexity:** 7.00 (normalized: 0.95)
- **Avg. Function Length:** 32.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/SecureAccount.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 80 (normalized: 0.99)
- **Complexity:** 7.00 (normalized: 0.95)
- **Avg. Function Length:** 24.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/evm_v2/precompiles/07-ecmul.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 38 (normalized: 1.00)
- **Complexity:** 7.00 (normalized: 0.95)
- **Avg. Function Length:** 33.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state/cache/account.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 242 (normalized: 0.97)
- **Complexity:** 3.45 (normalized: 0.98)
- **Avg. Function Length:** 14.55 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/tx/penalty/violation.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 33 (normalized: 1.00)
- **Complexity:** 9.00 (normalized: 0.93)
- **Avg. Function Length:** 28.00 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/Helpers.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 10 (normalized: 0.85)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 110 (normalized: 0.99)
- **Complexity:** 4.75 (normalized: 0.97)
- **Avg. Function Length:** 22.50 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/precompiles/08-ecpairing.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 42 (normalized: 0.99)
- **Complexity:** 7.00 (normalized: 0.95)
- **Avg. Function Length:** 37.00 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./dataRestore.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 194 (normalized: 0.97)
- **Complexity:** 2.59 (normalized: 0.99)
- **Avg. Function Length:** 12.12 (normalized: 0.97)
- **Async Functions:** 6 (normalized: 0.93)
- **Try-Catch Blocks:** 3 (normalized: 0.96)
### ./debugCycleRecords.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 164 (normalized: 0.98)
- **Complexity:** 11.50 (normalized: 0.91)
- **Avg. Function Length:** 43.75 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/journal.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 254 (normalized: 0.97)
- **Complexity:** 3.06 (normalized: 0.98)
- **Avg. Function Length:** 11.13 (normalized: 0.98)
- **Async Functions:** 6 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state/cache/storage.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 324 (normalized: 0.96)
- **Complexity:** 4.17 (normalized: 0.97)
- **Avg. Function Length:** 19.25 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./dbHistory.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 162 (normalized: 0.98)
- **Complexity:** 2.75 (normalized: 0.99)
- **Avg. Function Length:** 13.44 (normalized: 0.97)
- **Async Functions:** 6 (normalized: 0.93)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/evm_v2/opcodes/EIP1283.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 75 (normalized: 0.99)
- **Complexity:** 10.00 (normalized: 0.93)
- **Avg. Function Length:** 57.00 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/riAccountsCache.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 55 (normalized: 0.99)
- **Complexity:** 8.50 (normalized: 0.94)
- **Avg. Function Length:** 23.50 (normalized: 0.95)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/debug/estimateGas/estimateGas.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 12 (normalized: 0.82)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 110 (normalized: 0.99)
- **Complexity:** 4.00 (normalized: 0.98)
- **Avg. Function Length:** 25.25 (normalized: 0.95)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/opcodes/codes.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 383 (normalized: 0.95)
- **Complexity:** 8.00 (normalized: 0.94)
- **Avg. Function Length:** 36.50 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/tx/initRewardTimes.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 9 (normalized: 0.87)
- **Export Count:** 5 (normalized: 0.08)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 209 (normalized: 0.97)
- **Complexity:** 11.60 (normalized: 0.91)
- **Avg. Function Length:** 35.60 (normalized: 0.92)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/precompiles/01-ecrecover.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 73 (normalized: 0.99)
- **Complexity:** 11.00 (normalized: 0.92)
- **Avg. Function Length:** 61.00 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/handlers/queryCertificate.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 12 (normalized: 0.82)
- **Export Count:** 10 (normalized: 0.17)
- **Imported By Count:** 4 (normalized: 0.07)
- **Lines of Code:** 320 (normalized: 0.96)
- **Complexity:** 3.93 (normalized: 0.98)
- **Avg. Function Length:** 21.79 (normalized: 0.95)
- **Async Functions:** 9 (normalized: 0.90)
- **Try-Catch Blocks:** 4 (normalized: 0.95)
### ./archiver.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 151 (normalized: 0.98)
- **Complexity:** 8.50 (normalized: 0.94)
- **Avg. Function Length:** 47.33 (normalized: 0.90)
- **Async Functions:** 5 (normalized: 0.94)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/shardeum/secureAccounts.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 16 (normalized: 0.76)
- **Export Count:** 9 (normalized: 0.15)
- **Imported By Count:** 6 (normalized: 0.11)
- **Lines of Code:** 301 (normalized: 0.96)
- **Complexity:** 6.00 (normalized: 0.96)
- **Avg. Function Length:** 29.88 (normalized: 0.94)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/evm_v2/opcodes/EIP2200.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 82 (normalized: 0.99)
- **Complexity:** 11.00 (normalized: 0.92)
- **Avg. Function Length:** 60.00 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/vm_v7/buildBlock.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 12 (normalized: 0.82)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 321 (normalized: 0.96)
- **Complexity:** 2.77 (normalized: 0.99)
- **Avg. Function Length:** 14.38 (normalized: 0.97)
- **Async Functions:** 9 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/debug/utils/evmAddress.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 2 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 4 (normalized: 0.07)
- **Lines of Code:** 138 (normalized: 0.98)
- **Complexity:** 20.00 (normalized: 0.84)
- **Avg. Function Length:** 66.00 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/shardeum/services/networkAccountService.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 153 (normalized: 0.98)
- **Complexity:** 14.33 (normalized: 0.89)
- **Avg. Function Length:** 75.00 (normalized: 0.84)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/types/ajv/Helpers.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 21 (normalized: 0.69)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 84 (normalized: 0.99)
- **Complexity:** 1.78 (normalized: 0.99)
- **Avg. Function Length:** 8.89 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/vm_v7/vm.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 14 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 230 (normalized: 0.97)
- **Complexity:** 2.22 (normalized: 0.99)
- **Avg. Function Length:** 9.22 (normalized: 0.98)
- **Async Functions:** 7 (normalized: 0.92)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/evm_v2/precompiles/0a-kzg-point-evaluation.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 86 (normalized: 0.99)
- **Complexity:** 14.00 (normalized: 0.89)
- **Avg. Function Length:** 69.00 (normalized: 0.85)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/utils/account.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 7 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 54 (normalized: 0.99)
- **Complexity:** 16.00 (normalized: 0.88)
- **Avg. Function Length:** 47.00 (normalized: 0.90)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/opcodes/functions.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.91)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1132 (normalized: 0.85)
- **Complexity:** 1.93 (normalized: 0.99)
- **Avg. Function Length:** 8.65 (normalized: 0.98)
- **Async Functions:** 16 (normalized: 0.82)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/debug/state/transactionState.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 12 (normalized: 0.82)
- **Export Count:** 10 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 927 (normalized: 0.88)
- **Complexity:** 5.54 (normalized: 0.96)
- **Avg. Function Length:** 26.86 (normalized: 0.94)
- **Async Functions:** 10 (normalized: 0.89)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/WrappedEVMAccount.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 8 (normalized: 0.88)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 137 (normalized: 0.98)
- **Complexity:** 16.50 (normalized: 0.87)
- **Avg. Function Length:** 53.00 (normalized: 0.89)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/sqlite3storage.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 9 (normalized: 0.87)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 531 (normalized: 0.93)
- **Complexity:** 3.19 (normalized: 0.98)
- **Avg. Function Length:** 18.03 (normalized: 0.96)
- **Async Functions:** 7 (normalized: 0.92)
- **Try-Catch Blocks:** 9 (normalized: 0.88)
### ./src/state/transactionState.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 13 (normalized: 0.81)
- **Export Count:** 11 (normalized: 0.18)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 950 (normalized: 0.88)
- **Complexity:** 5.82 (normalized: 0.96)
- **Avg. Function Length:** 27.21 (normalized: 0.94)
- **Async Functions:** 10 (normalized: 0.89)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/vm_v7/runBlock.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 11 (normalized: 0.84)
- **Export Count:** 5 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 611 (normalized: 0.92)
- **Complexity:** 5.31 (normalized: 0.96)
- **Avg. Function Length:** 31.31 (normalized: 0.93)
- **Async Functions:** 9 (normalized: 0.90)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/shardeum/evmAddress.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 4 (normalized: 0.94)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 11 (normalized: 0.20)
- **Lines of Code:** 237 (normalized: 0.97)
- **Complexity:** 20.67 (normalized: 0.84)
- **Avg. Function Length:** 74.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/tx/penalty/transaction.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 15 (normalized: 0.78)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 310 (normalized: 0.96)
- **Complexity:** 7.57 (normalized: 0.95)
- **Avg. Function Length:** 37.43 (normalized: 0.92)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/setup/validateTransaction.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 13 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 171 (normalized: 0.98)
- **Complexity:** 10.17 (normalized: 0.92)
- **Avg. Function Length:** 40.00 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/setup/sync.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 17 (normalized: 0.75)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 321 (normalized: 0.96)
- **Complexity:** 4.50 (normalized: 0.97)
- **Avg. Function Length:** 23.19 (normalized: 0.95)
- **Async Functions:** 5 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/tx/setCertTime.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 17 (normalized: 0.75)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 292 (normalized: 0.96)
- **Complexity:** 9.67 (normalized: 0.93)
- **Avg. Function Length:** 40.67 (normalized: 0.91)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 2 (normalized: 0.97)
### ./src/storage/storage.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 7 (normalized: 0.90)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 3 (normalized: 0.05)
- **Lines of Code:** 296 (normalized: 0.96)
- **Complexity:** 2.45 (normalized: 0.99)
- **Avg. Function Length:** 11.23 (normalized: 0.98)
- **Async Functions:** 21 (normalized: 0.76)
- **Try-Catch Blocks:** 12 (normalized: 0.85)
### ./src/shardeum/debugRestoreAccounts.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 10 (normalized: 0.85)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 227 (normalized: 0.97)
- **Complexity:** 12.50 (normalized: 0.90)
- **Avg. Function Length:** 59.50 (normalized: 0.87)
- **Async Functions:** 3 (normalized: 0.97)
- **Try-Catch Blocks:** 5 (normalized: 0.94)
### ./src/tx/staking/verifyStake.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 10 (normalized: 0.85)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 248 (normalized: 0.97)
- **Complexity:** 18.33 (normalized: 0.86)
- **Avg. Function Length:** 72.00 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/opcodes/gas.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 9 (normalized: 0.87)
- **Export Count:** 3 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 581 (normalized: 0.92)
- **Complexity:** 3.33 (normalized: 0.98)
- **Avg. Function Length:** 16.07 (normalized: 0.97)
- **Async Functions:** 27 (normalized: 0.69)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/evm_v2/interpreter.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 16 (normalized: 0.76)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 993 (normalized: 0.87)
- **Complexity:** 2.67 (normalized: 0.99)
- **Avg. Function Length:** 12.12 (normalized: 0.97)
- **Async Functions:** 16 (normalized: 0.82)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/debug/state/shardeumState.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 11 (normalized: 0.84)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 832 (normalized: 0.89)
- **Complexity:** 2.10 (normalized: 0.99)
- **Avg. Function Length:** 9.47 (normalized: 0.98)
- **Async Functions:** 27 (normalized: 0.69)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state/shardeumState.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 12 (normalized: 0.82)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 833 (normalized: 0.89)
- **Complexity:** 2.10 (normalized: 0.99)
- **Avg. Function Length:** 10.04 (normalized: 0.98)
- **Async Functions:** 27 (normalized: 0.69)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/tx/claimReward.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 11 (normalized: 0.84)
- **Export Count:** 4 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 359 (normalized: 0.95)
- **Complexity:** 18.25 (normalized: 0.86)
- **Avg. Function Length:** 78.75 (normalized: 0.83)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/debug/replayTX.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 21 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 386 (normalized: 0.95)
- **Complexity:** 4.31 (normalized: 0.97)
- **Avg. Function Length:** 32.06 (normalized: 0.93)
- **Async Functions:** 6 (normalized: 0.93)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/evm_v2/evm.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 21 (normalized: 0.69)
- **Export Count:** 7 (normalized: 0.12)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 884 (normalized: 0.88)
- **Complexity:** 5.65 (normalized: 0.96)
- **Avg. Function Length:** 26.27 (normalized: 0.94)
- **Async Functions:** 10 (normalized: 0.89)
- **Try-Catch Blocks:** 3 (normalized: 0.96)
### ./src/vm_v7/runTx.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 13 (normalized: 0.81)
- **Export Count:** 2 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 625 (normalized: 0.92)
- **Complexity:** 16.14 (normalized: 0.87)
- **Avg. Function Length:** 78.14 (normalized: 0.83)
- **Async Functions:** 3 (normalized: 0.97)
- **Try-Catch Blocks:** 1 (normalized: 0.99)
### ./src/setup/validateTxnFields.ts

- **Composite Score:** 0.48 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 19 (normalized: 0.72)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 548 (normalized: 0.93)
- **Complexity:** 122.00 (normalized: 0.00)
- **Avg. Function Length:** 473.50 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 3 (normalized: 0.96)
### ./src/index.ts

- **Composite Score:** 0.33 (testability)
- **Priority Score:** 0.55 (importance for testing)
- **Import Count:** 68 (normalized: 0.00)
- **Export Count:** 18 (normalized: 0.30)
- **Imported By Count:** 27 (normalized: 0.49)
- **Lines of Code:** 7603 (normalized: 0.00)
- **Complexity:** 15.05 (normalized: 0.88)
- **Avg. Function Length:** 70.35 (normalized: 0.85)
- **Async Functions:** 88 (normalized: 0.00)
- **Try-Catch Blocks:** 78 (normalized: 0.00)
