# TypeScript Files Ranked by Testing Difficulty

This report ranks 64 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 54 | 84.4% |
| Moderate         | 9 | 14.1% |
| Hard to Test     | 1 | 1.6% |
| **Total**        | **64** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/config/index.ts | 0.73 | 0.80 | 35 | 4 | 8 | 211 | 9.50 |
| ./src/types/index.ts | 0.45 | 0.90 | 22 | 0 | 4 | 33 | 1.00 |
| ./src/storage/sqlite3storage.ts | 0.34 | 0.83 | 15 | 3 | 11 | 144 | 3.00 |
| ./src/storage/index.ts | 0.28 | 0.84 | 12 | 3 | 5 | 137 | 1.88 |
| ./src/storage/transaction.ts | 0.28 | 0.51 | 6 | 8 | 22 | 1358 | 12.88 |
| ./src/class/TxDecoder.ts | 0.28 | 0.40 | 4 | 12 | 4 | 533 | 50.67 |
| ./src/server.ts | 0.27 | 0.20 | 0 | 26 | 0 | 1405 | 33.79 |
| ./src/storage/block.ts | 0.26 | 0.68 | 8 | 10 | 13 | 238 | 3.50 |
| ./src/storage/receipt.ts | 0.25 | 0.64 | 7 | 12 | 12 | 473 | 7.67 |
| ./src/storage/account.ts | 0.24 | 0.74 | 8 | 9 | 17 | 379 | 6.78 |

## Files Not Imported By Any Other File (22)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/types/serverResponseTypes.ts | 0.91 | 1 | 9 | 0 | 57 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/string.ts | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 3.00 | 0 | 0 |
| ./src/types/block.ts | 0.88 | 1 | 2 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./log.ts | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/websocket.ts | 0.88 | 1 | 1 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/cycle.ts | 0.88 | 1 | 1 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./cycle.ts | 0.87 | 0 | 0 | 0 | 34 | 1.00 | 0.00 | 0 | 0 |
| ./pm2.config.js | 0.87 | 0 | 0 | 0 | 39 | 1.00 | 0.00 | 0 | 0 |
| ./startLogServerPM2.js | 0.86 | 0 | 0 | 0 | 43 | 1.80 | 11.00 | 0 | 0 |
| ./rpcBundlePM2.js | 0.86 | 0 | 0 | 0 | 42 | 1.60 | 12.60 | 0 | 0 |
| ./accountentry_creator.ts | 0.82 | 4 | 0 | 0 | 20 | 2.00 | 15.00 | 1 | 0 |
| ./block.ts | 0.82 | 4 | 0 | 0 | 34 | 1.00 | 25.00 | 1 | 0 |
| ./data_patcher.ts | 0.79 | 5 | 0 | 0 | 40 | 6.00 | 28.00 | 1 | 0 |
| ./accounthistorystate_creator.ts | 0.75 | 3 | 0 | 0 | 58 | 13.00 | 54.00 | 1 | 0 |
| ./repair_missing_cycle_block.ts | 0.75 | 7 | 0 | 0 | 121 | 3.08 | 11.00 | 5 | 2 |
| ./src/log_server.ts | 0.74 | 12 | 0 | 0 | 80 | 1.86 | 14.29 | 2 | 2 |
| ./repair_account_state.ts | 0.68 | 9 | 0 | 0 | 115 | 18.00 | 51.50 | 2 | 0 |
| ./transaction.ts | 0.64 | 8 | 0 | 0 | 200 | 1.00 | 187.00 | 1 | 0 |
| ./src/collector.ts | 0.54 | 26 | 1 | 0 | 523 | 5.06 | 27.72 | 8 | 2 |
| ./src/server.ts | 0.20 | 26 | 0 | 0 | 1405 | 33.79 | 135.16 | 12 | 4 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/types/transaction.ts | 0.92 | 1 | 12 | 3 | 130 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/account.ts | 0.92 | 5 | 16 | 2 | 160 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/serverResponseTypes.ts | 0.91 | 1 | 9 | 0 | 57 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/index.ts | 0.90 | 0 | 4 | 22 | 33 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/receipt.ts | 0.90 | 3 | 9 | 1 | 121 | 1.00 | 0.00 | 0 | 0 |
| ./src/log_subscription/SocketManager.ts | 0.89 | 2 | 7 | 3 | 40 | 1.29 | 4.57 | 0 | 0 |
| ./src/types/originalTxData.ts | 0.89 | 1 | 4 | 1 | 67 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/string.ts | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 3.00 | 0 | 0 |
| ./src/types/block.ts | 0.88 | 1 | 2 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./log.ts | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/number.ts | 0.88 | 0 | 1 | 1 | 6 | 2.00 | 3.00 | 0 | 0 |
| ./src/types/websocket.ts | 0.88 | 1 | 1 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/cycle.ts | 0.88 | 1 | 1 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./cycle.ts | 0.87 | 0 | 0 | 0 | 34 | 1.00 | 0.00 | 0 | 0 |
| ./pm2.config.js | 0.87 | 0 | 0 | 0 | 39 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/crypto.ts | 0.87 | 4 | 5 | 4 | 20 | 1.00 | 4.00 | 0 | 0 |
| ./src/utils/block.ts | 0.87 | 1 | 1 | 2 | 8 | 2.00 | 7.00 | 0 | 0 |
| ./startLogServerPM2.js | 0.86 | 0 | 0 | 0 | 43 | 1.80 | 11.00 | 0 | 0 |
| ./rpcBundlePM2.js | 0.86 | 0 | 0 | 0 | 42 | 1.60 | 12.60 | 0 | 0 |
| ./src/log_subscription/CollectorDataP... | 0.86 | 1 | 3 | 2 | 119 | 3.75 | 7.08 | 0 | 0 |
| ./src/utils/index.ts | 0.86 | 0 | 3 | 5 | 66 | 3.80 | 12.00 | 1 | 0 |
| ./src/log_subscription/CollectorSocke... | 0.84 | 5 | 5 | 3 | 42 | 1.50 | 8.67 | 2 | 0 |
| ./src/class/CycleDataCache.ts | 0.84 | 1 | 1 | 1 | 37 | 2.50 | 12.50 | 2 | 0 |
| ./src/routes/healthCheck.ts | 0.84 | 4 | 2 | 4 | 51 | 3.43 | 12.71 | 0 | 0 |
| ./src/storage/index.ts | 0.84 | 3 | 5 | 12 | 137 | 1.88 | 18.38 | 2 | 0 |
| ./src/storage/sqlite3storage.ts | 0.83 | 3 | 11 | 15 | 144 | 3.00 | 11.70 | 2 | 7 |
| ./src/middleware/usage.ts | 0.83 | 3 | 5 | 1 | 136 | 3.00 | 12.13 | 3 | 0 |
| ./accountentry_creator.ts | 0.82 | 4 | 0 | 0 | 20 | 2.00 | 15.00 | 1 | 0 |
| ./src/log_subscription/Handler.ts | 0.82 | 2 | 1 | 1 | 126 | 4.75 | 13.88 | 1 | 0 |
| ./src/storage/checkpoint.ts | 0.82 | 2 | 2 | 1 | 47 | 3.00 | 14.50 | 2 | 2 |
| ./src/types/abis.ts | 0.82 | 0 | 2 | 1 | 672 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/decodeEVMRawTx.ts | 0.82 | 6 | 6 | 2 | 75 | 4.75 | 14.75 | 0 | 3 |
| ./block.ts | 0.82 | 4 | 0 | 0 | 34 | 1.00 | 25.00 | 1 | 0 |
| ./src/storage/accountEntry.ts | 0.81 | 4 | 4 | 3 | 88 | 4.50 | 21.00 | 0 | 4 |
| ./src/cache/LatestBlockCache.ts | 0.81 | 5 | 2 | 2 | 58 | 2.50 | 12.50 | 2 | 1 |
| ./src/collectors/rmq_cycles.ts | 0.81 | 5 | 1 | 1 | 33 | 1.67 | 5.33 | 3 | 1 |
| ./src/collectors/rmq_original_txs.ts | 0.81 | 5 | 1 | 1 | 33 | 1.67 | 5.33 | 3 | 1 |
| ./src/collectors/rmq_receipts.ts | 0.81 | 5 | 1 | 1 | 33 | 1.67 | 5.33 | 3 | 1 |
| ./src/config/index.ts | 0.80 | 4 | 8 | 35 | 211 | 9.50 | 36.00 | 0 | 2 |
| ./src/log_subscription/CollectorListe... | 0.80 | 6 | 1 | 1 | 45 | 2.17 | 7.00 | 3 | 0 |
| ./data_patcher.ts | 0.79 | 5 | 0 | 0 | 40 | 6.00 | 28.00 | 1 | 0 |
| ./src/storage/accountHistoryState.ts | 0.79 | 5 | 5 | 3 | 125 | 4.40 | 21.20 | 2 | 4 |
| ./src/utils/patchCollector.ts | 0.76 | 2 | 1 | 1 | 74 | 14.00 | 52.00 | 1 | 1 |
| ./accounthistorystate_creator.ts | 0.75 | 3 | 0 | 0 | 58 | 13.00 | 54.00 | 1 | 0 |
| ./src/class/DataLogWriter.ts | 0.75 | 4 | 4 | 2 | 195 | 2.67 | 11.53 | 8 | 3 |
| ./repair_missing_cycle_block.ts | 0.75 | 7 | 0 | 0 | 121 | 3.08 | 11.00 | 5 | 2 |
| ./src/storage/log.ts | 0.75 | 5 | 10 | 2 | 300 | 5.25 | 16.50 | 7 | 6 |
| ./src/log_server.ts | 0.74 | 12 | 0 | 0 | 80 | 1.86 | 14.29 | 2 | 2 |
| ./src/storage/account.ts | 0.74 | 9 | 17 | 8 | 379 | 6.78 | 19.94 | 1 | 15 |
| ./src/storage/cycle.ts | 0.72 | 9 | 11 | 6 | 165 | 4.25 | 13.33 | 9 | 8 |
| ./src/class/validateData.ts | 0.71 | 10 | 2 | 5 | 74 | 14.00 | 55.00 | 1 | 0 |
| ./src/messaging/rabbitmq/consumer.ts | 0.71 | 4 | 1 | 4 | 177 | 3.46 | 14.31 | 7 | 8 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/storage/block.ts | 0.68 | 10 | 13 | 8 | 238 | 3.50 | 15.38 | 11 | 10 |
| ./repair_account_state.ts | 0.68 | 9 | 0 | 0 | 115 | 18.00 | 51.50 | 2 | 0 |
| ./src/storage/originalTxData.ts | 0.67 | 8 | 11 | 5 | 343 | 9.18 | 27.09 | 9 | 9 |
| ./src/class/DataSync.ts | 0.65 | 10 | 16 | 5 | 680 | 9.47 | 32.53 | 13 | 1 |
| ./src/storage/receipt.ts | 0.64 | 12 | 12 | 7 | 473 | 7.67 | 24.72 | 9 | 9 |
| ./transaction.ts | 0.64 | 8 | 0 | 0 | 200 | 1.00 | 187.00 | 1 | 0 |
| ./src/collector.ts | 0.54 | 26 | 1 | 0 | 523 | 5.06 | 27.72 | 8 | 2 |
| ./src/storage/transaction.ts | 0.51 | 8 | 22 | 6 | 1358 | 12.88 | 39.03 | 14 | 19 |
| ./src/class/TxDecoder.ts | 0.40 | 12 | 4 | 4 | 533 | 50.67 | 155.33 | 2 | 7 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/server.ts | 0.20 | 26 | 0 | 0 | 1405 | 33.79 | 135.16 | 12 | 4 |

## Detailed Metrics

### ./src/types/transaction.ts

- **Composite Score:** 0.92 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 12 (normalized: 0.55)
- **Imported By Count:** 3 (normalized: 0.09)
- **Lines of Code:** 130 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/account.ts

- **Composite Score:** 0.92 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 16 (normalized: 0.73)
- **Imported By Count:** 2 (normalized: 0.06)
- **Lines of Code:** 160 (normalized: 0.89)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/serverResponseTypes.ts

- **Composite Score:** 0.91 (testability)
- **Priority Score:** 0.03 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 9 (normalized: 0.41)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 57 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/index.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.45 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 22 (normalized: 0.63)
- **Lines of Code:** 33 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/receipt.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 9 (normalized: 0.41)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 121 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/log_subscription/SocketManager.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 7 (normalized: 0.32)
- **Imported By Count:** 3 (normalized: 0.09)
- **Lines of Code:** 40 (normalized: 0.97)
- **Complexity:** 1.29 (normalized: 0.99)
- **Avg. Function Length:** 4.57 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/originalTxData.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 67 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/string.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/block.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 17 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./log.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 0 (normalized: 1.00)
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
### ./jest.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 9 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/number.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 3.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/websocket.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/cycle.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./cycle.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 34 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./pm2.config.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 39 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/crypto.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 5 (normalized: 0.23)
- **Imported By Count:** 4 (normalized: 0.11)
- **Lines of Code:** 20 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/block.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 2 (normalized: 0.06)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 7.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./startLogServerPM2.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 43 (normalized: 0.97)
- **Complexity:** 1.80 (normalized: 0.98)
- **Avg. Function Length:** 11.00 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./rpcBundlePM2.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 42 (normalized: 0.97)
- **Complexity:** 1.60 (normalized: 0.99)
- **Avg. Function Length:** 12.60 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/log_subscription/CollectorDataParser.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.14)
- **Imported By Count:** 2 (normalized: 0.06)
- **Lines of Code:** 119 (normalized: 0.92)
- **Complexity:** 3.75 (normalized: 0.94)
- **Avg. Function Length:** 7.08 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/index.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 3 (normalized: 0.14)
- **Imported By Count:** 5 (normalized: 0.14)
- **Lines of Code:** 66 (normalized: 0.95)
- **Complexity:** 3.80 (normalized: 0.94)
- **Avg. Function Length:** 12.00 (normalized: 0.94)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/log_subscription/CollectorSocketconnection.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 5 (normalized: 0.23)
- **Imported By Count:** 3 (normalized: 0.09)
- **Lines of Code:** 42 (normalized: 0.97)
- **Complexity:** 1.50 (normalized: 0.99)
- **Avg. Function Length:** 8.67 (normalized: 0.95)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/CycleDataCache.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 37 (normalized: 0.97)
- **Complexity:** 2.50 (normalized: 0.97)
- **Avg. Function Length:** 12.50 (normalized: 0.93)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/healthCheck.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 4 (normalized: 0.11)
- **Lines of Code:** 51 (normalized: 0.96)
- **Complexity:** 3.43 (normalized: 0.95)
- **Avg. Function Length:** 12.71 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/index.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 5 (normalized: 0.23)
- **Imported By Count:** 12 (normalized: 0.34)
- **Lines of Code:** 137 (normalized: 0.90)
- **Complexity:** 1.88 (normalized: 0.98)
- **Avg. Function Length:** 18.38 (normalized: 0.90)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/sqlite3storage.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.34 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 11 (normalized: 0.50)
- **Imported By Count:** 15 (normalized: 0.43)
- **Lines of Code:** 144 (normalized: 0.90)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 11.70 (normalized: 0.94)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 7 (normalized: 0.63)
### ./src/middleware/usage.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 5 (normalized: 0.23)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 136 (normalized: 0.90)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 12.13 (normalized: 0.94)
- **Async Functions:** 3 (normalized: 0.79)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./accountentry_creator.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 20 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 15.00 (normalized: 0.92)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/log_subscription/Handler.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 126 (normalized: 0.91)
- **Complexity:** 4.75 (normalized: 0.92)
- **Avg. Function Length:** 13.88 (normalized: 0.93)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/checkpoint.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 47 (normalized: 0.97)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 14.50 (normalized: 0.92)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 2 (normalized: 0.89)
### ./src/types/abis.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 672 (normalized: 0.52)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/decodeEVMRawTx.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 6 (normalized: 0.77)
- **Export Count:** 6 (normalized: 0.27)
- **Imported By Count:** 2 (normalized: 0.06)
- **Lines of Code:** 75 (normalized: 0.95)
- **Complexity:** 4.75 (normalized: 0.92)
- **Avg. Function Length:** 14.75 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 3 (normalized: 0.84)
### ./block.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 34 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 25.00 (normalized: 0.87)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/accountEntry.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 3 (normalized: 0.09)
- **Lines of Code:** 88 (normalized: 0.94)
- **Complexity:** 4.50 (normalized: 0.93)
- **Avg. Function Length:** 21.00 (normalized: 0.89)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 4 (normalized: 0.79)
### ./src/cache/LatestBlockCache.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 2 (normalized: 0.06)
- **Lines of Code:** 58 (normalized: 0.96)
- **Complexity:** 2.50 (normalized: 0.97)
- **Avg. Function Length:** 12.50 (normalized: 0.93)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/collectors/rmq_cycles.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 33 (normalized: 0.98)
- **Complexity:** 1.67 (normalized: 0.99)
- **Avg. Function Length:** 5.33 (normalized: 0.97)
- **Async Functions:** 3 (normalized: 0.79)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/collectors/rmq_original_txs.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 33 (normalized: 0.98)
- **Complexity:** 1.67 (normalized: 0.99)
- **Avg. Function Length:** 5.33 (normalized: 0.97)
- **Async Functions:** 3 (normalized: 0.79)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/collectors/rmq_receipts.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 33 (normalized: 0.98)
- **Complexity:** 1.67 (normalized: 0.99)
- **Avg. Function Length:** 5.33 (normalized: 0.97)
- **Async Functions:** 3 (normalized: 0.79)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/config/index.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.73 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 8 (normalized: 0.36)
- **Imported By Count:** 35 (normalized: 1.00)
- **Lines of Code:** 211 (normalized: 0.85)
- **Complexity:** 9.50 (normalized: 0.83)
- **Avg. Function Length:** 36.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.89)
### ./src/log_subscription/CollectorListener.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 6 (normalized: 0.77)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 45 (normalized: 0.97)
- **Complexity:** 2.17 (normalized: 0.98)
- **Avg. Function Length:** 7.00 (normalized: 0.96)
- **Async Functions:** 3 (normalized: 0.79)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./data_patcher.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 40 (normalized: 0.97)
- **Complexity:** 6.00 (normalized: 0.90)
- **Avg. Function Length:** 28.00 (normalized: 0.85)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/accountHistoryState.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 5 (normalized: 0.23)
- **Imported By Count:** 3 (normalized: 0.09)
- **Lines of Code:** 125 (normalized: 0.91)
- **Complexity:** 4.40 (normalized: 0.93)
- **Avg. Function Length:** 21.20 (normalized: 0.89)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 4 (normalized: 0.79)
### ./src/utils/patchCollector.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.03)
- **Lines of Code:** 74 (normalized: 0.95)
- **Complexity:** 14.00 (normalized: 0.74)
- **Avg. Function Length:** 52.00 (normalized: 0.72)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./accounthistorystate_creator.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 58 (normalized: 0.96)
- **Complexity:** 13.00 (normalized: 0.76)
- **Avg. Function Length:** 54.00 (normalized: 0.71)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/DataLogWriter.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 2 (normalized: 0.06)
- **Lines of Code:** 195 (normalized: 0.86)
- **Complexity:** 2.67 (normalized: 0.97)
- **Avg. Function Length:** 11.53 (normalized: 0.94)
- **Async Functions:** 8 (normalized: 0.43)
- **Try-Catch Blocks:** 3 (normalized: 0.84)
### ./repair_missing_cycle_block.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 7 (normalized: 0.73)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 121 (normalized: 0.91)
- **Complexity:** 3.08 (normalized: 0.96)
- **Avg. Function Length:** 11.00 (normalized: 0.94)
- **Async Functions:** 5 (normalized: 0.64)
- **Try-Catch Blocks:** 2 (normalized: 0.89)
### ./src/storage/log.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 10 (normalized: 0.45)
- **Imported By Count:** 2 (normalized: 0.06)
- **Lines of Code:** 300 (normalized: 0.79)
- **Complexity:** 5.25 (normalized: 0.91)
- **Avg. Function Length:** 16.50 (normalized: 0.91)
- **Async Functions:** 7 (normalized: 0.50)
- **Try-Catch Blocks:** 6 (normalized: 0.68)
### ./src/log_server.ts

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 12 (normalized: 0.54)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 80 (normalized: 0.94)
- **Complexity:** 1.86 (normalized: 0.98)
- **Avg. Function Length:** 14.29 (normalized: 0.92)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 2 (normalized: 0.89)
### ./src/storage/account.ts

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 9 (normalized: 0.65)
- **Export Count:** 17 (normalized: 0.77)
- **Imported By Count:** 8 (normalized: 0.23)
- **Lines of Code:** 379 (normalized: 0.73)
- **Complexity:** 6.78 (normalized: 0.88)
- **Avg. Function Length:** 19.94 (normalized: 0.89)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 15 (normalized: 0.21)
### ./src/storage/cycle.ts

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 9 (normalized: 0.65)
- **Export Count:** 11 (normalized: 0.50)
- **Imported By Count:** 6 (normalized: 0.17)
- **Lines of Code:** 165 (normalized: 0.88)
- **Complexity:** 4.25 (normalized: 0.93)
- **Avg. Function Length:** 13.33 (normalized: 0.93)
- **Async Functions:** 9 (normalized: 0.36)
- **Try-Catch Blocks:** 8 (normalized: 0.58)
### ./src/class/validateData.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 10 (normalized: 0.62)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 5 (normalized: 0.14)
- **Lines of Code:** 74 (normalized: 0.95)
- **Complexity:** 14.00 (normalized: 0.74)
- **Avg. Function Length:** 55.00 (normalized: 0.71)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/messaging/rabbitmq/consumer.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 4 (normalized: 0.11)
- **Lines of Code:** 177 (normalized: 0.87)
- **Complexity:** 3.46 (normalized: 0.95)
- **Avg. Function Length:** 14.31 (normalized: 0.92)
- **Async Functions:** 7 (normalized: 0.50)
- **Try-Catch Blocks:** 8 (normalized: 0.58)
### ./src/storage/block.ts

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 10 (normalized: 0.62)
- **Export Count:** 13 (normalized: 0.59)
- **Imported By Count:** 8 (normalized: 0.23)
- **Lines of Code:** 238 (normalized: 0.83)
- **Complexity:** 3.50 (normalized: 0.95)
- **Avg. Function Length:** 15.38 (normalized: 0.92)
- **Async Functions:** 11 (normalized: 0.21)
- **Try-Catch Blocks:** 10 (normalized: 0.47)
### ./repair_account_state.ts

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 9 (normalized: 0.65)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 115 (normalized: 0.92)
- **Complexity:** 18.00 (normalized: 0.66)
- **Avg. Function Length:** 51.50 (normalized: 0.72)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/originalTxData.ts

- **Composite Score:** 0.67 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 8 (normalized: 0.69)
- **Export Count:** 11 (normalized: 0.50)
- **Imported By Count:** 5 (normalized: 0.14)
- **Lines of Code:** 343 (normalized: 0.76)
- **Complexity:** 9.18 (normalized: 0.84)
- **Avg. Function Length:** 27.09 (normalized: 0.86)
- **Async Functions:** 9 (normalized: 0.36)
- **Try-Catch Blocks:** 9 (normalized: 0.53)
### ./src/class/DataSync.ts

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 10 (normalized: 0.62)
- **Export Count:** 16 (normalized: 0.73)
- **Imported By Count:** 5 (normalized: 0.14)
- **Lines of Code:** 680 (normalized: 0.52)
- **Complexity:** 9.47 (normalized: 0.83)
- **Avg. Function Length:** 32.53 (normalized: 0.83)
- **Async Functions:** 13 (normalized: 0.07)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/storage/receipt.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 12 (normalized: 0.54)
- **Export Count:** 12 (normalized: 0.55)
- **Imported By Count:** 7 (normalized: 0.20)
- **Lines of Code:** 473 (normalized: 0.66)
- **Complexity:** 7.67 (normalized: 0.87)
- **Avg. Function Length:** 24.72 (normalized: 0.87)
- **Async Functions:** 9 (normalized: 0.36)
- **Try-Catch Blocks:** 9 (normalized: 0.53)
### ./transaction.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 8 (normalized: 0.69)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 200 (normalized: 0.86)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 187.00 (normalized: 0.00)
- **Async Functions:** 1 (normalized: 0.93)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/collector.ts

- **Composite Score:** 0.54 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 26 (normalized: 0.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 523 (normalized: 0.63)
- **Complexity:** 5.06 (normalized: 0.92)
- **Avg. Function Length:** 27.72 (normalized: 0.85)
- **Async Functions:** 8 (normalized: 0.43)
- **Try-Catch Blocks:** 2 (normalized: 0.89)
### ./src/storage/transaction.ts

- **Composite Score:** 0.51 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 8 (normalized: 0.69)
- **Export Count:** 22 (normalized: 1.00)
- **Imported By Count:** 6 (normalized: 0.17)
- **Lines of Code:** 1358 (normalized: 0.03)
- **Complexity:** 12.88 (normalized: 0.76)
- **Avg. Function Length:** 39.03 (normalized: 0.79)
- **Async Functions:** 14 (normalized: 0.00)
- **Try-Catch Blocks:** 19 (normalized: 0.00)
### ./src/class/TxDecoder.ts

- **Composite Score:** 0.40 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 12 (normalized: 0.54)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 4 (normalized: 0.11)
- **Lines of Code:** 533 (normalized: 0.62)
- **Complexity:** 50.67 (normalized: 0.00)
- **Avg. Function Length:** 155.33 (normalized: 0.17)
- **Async Functions:** 2 (normalized: 0.86)
- **Try-Catch Blocks:** 7 (normalized: 0.63)
### ./src/server.ts

- **Composite Score:** 0.20 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 26 (normalized: 0.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1405 (normalized: 0.00)
- **Complexity:** 33.79 (normalized: 0.34)
- **Avg. Function Length:** 135.16 (normalized: 0.28)
- **Async Functions:** 12 (normalized: 0.14)
- **Try-Catch Blocks:** 4 (normalized: 0.79)
