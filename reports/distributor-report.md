# TypeScript Files Ranked by Testing Difficulty

This report ranks 31 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 19 | 61.3% |
| Moderate         | 11 | 35.5% |
| Hard to Test     | 1 | 3.2% |
| **Total**        | **31** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/Config.ts | 0.75 | 0.74 | 17 | 5 | 8 | 151 | 9.00 |
| ./src/Logger.ts | 0.62 | 0.80 | 14 | 8 | 9 | 163 | 2.00 |
| ./src/api.ts | 0.37 | 0.14 | 2 | 15 | 7 | 814 | 32.45 |
| ./src/dbstore/sqlite3storage.ts | 0.33 | 0.71 | 6 | 7 | 8 | 132 | 2.56 |
| ./src/dbstore/index.ts | 0.32 | 0.85 | 7 | 3 | 7 | 31 | 1.00 |
| ./src/dbstore/cycles.ts | 0.31 | 0.65 | 5 | 6 | 9 | 149 | 4.11 |
| ./src/utils/serialization.ts | 0.29 | 0.84 | 6 | 1 | 2 | 19 | 2.00 |
| ./src/dbstore/receipts.ts | 0.28 | 0.64 | 4 | 7 | 18 | 275 | 3.29 |
| ./src/dbstore/originalTxsData.ts | 0.27 | 0.65 | 4 | 6 | 10 | 168 | 4.20 |
| ./src/distributor/rmq_data_publisher.ts | 0.25 | 0.47 | 2 | 11 | 1 | 359 | 5.25 |

## Files Not Imported By Any Other File (6)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./socket_sig_tester.ts | 0.83 | 3 | 0 | 0 | 40 | 1.00 | 3.00 | 0 | 0 |
| ./api_tester.ts | 0.82 | 3 | 0 | 0 | 32 | 1.50 | 4.00 | 1 | 0 |
| ./src/rmq_api_server.ts | 0.64 | 13 | 1 | 0 | 87 | 1.67 | 12.44 | 4 | 1 |
| ./src/distributor.ts | 0.58 | 15 | 0 | 0 | 151 | 2.08 | 13.85 | 7 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./src/routes/healthCheck.ts | 0.86 | 1 | 1 | 1 | 11 | 1.00 | 5.67 | 0 | 0 |
| ./src/distributor/utils.ts | 0.86 | 3 | 10 | 3 | 118 | 3.50 | 15.30 | 0 | 0 |
| ./src/utils/Crypto.ts | 0.85 | 4 | 5 | 4 | 20 | 1.67 | 4.00 | 0 | 0 |
| ./src/dbstore/index.ts | 0.85 | 3 | 7 | 7 | 31 | 1.00 | 11.50 | 2 | 0 |
| ./src/utils/Utils.ts | 0.84 | 1 | 4 | 3 | 80 | 3.50 | 11.17 | 1 | 0 |
| ./src/utils/serialization.ts | 0.84 | 1 | 2 | 6 | 19 | 2.00 | 9.00 | 0 | 2 |
| ./socket_sig_tester.ts | 0.83 | 3 | 0 | 0 | 40 | 1.00 | 3.00 | 0 | 0 |
| ./src/messaging/rabbitmq/conn.ts | 0.82 | 2 | 1 | 1 | 19 | 3.00 | 10.00 | 1 | 0 |
| ./api_tester.ts | 0.82 | 3 | 0 | 0 | 32 | 1.50 | 4.00 | 1 | 0 |
| ./src/metrics/index.ts | 0.82 | 3 | 5 | 3 | 54 | 1.00 | 4.60 | 4 | 0 |
| ./src/utils/index.ts | 0.81 | 6 | 5 | 3 | 48 | 1.25 | 7.50 | 0 | 1 |
| ./src/Logger.ts | 0.80 | 8 | 9 | 14 | 163 | 2.00 | 8.40 | 0 | 0 |
| ./src/dbstore/checkpoints.ts | 0.79 | 2 | 2 | 3 | 62 | 1.80 | 9.00 | 5 | 0 |
| ./src/child-process/child.ts | 0.75 | 7 | 3 | 1 | 131 | 3.27 | 19.45 | 0 | 1 |
| ./src/Config.ts | 0.74 | 5 | 8 | 17 | 151 | 9.00 | 36.50 | 0 | 2 |
| ./src/distributor/rmq_healthcheck_ser... | 0.72 | 8 | 1 | 1 | 58 | 1.86 | 12.71 | 3 | 1 |
| ./src/dbstore/sqlite3storage.ts | 0.71 | 7 | 8 | 6 | 132 | 2.56 | 12.00 | 5 | 3 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/distributor/rmq_healthcheck_ser... | 0.69 | 6 | 1 | 2 | 116 | 3.40 | 17.80 | 4 | 2 |
| ./src/dbstore/originalTxsData.ts | 0.65 | 6 | 10 | 4 | 168 | 4.20 | 15.10 | 7 | 7 |
| ./src/dbstore/cycles.ts | 0.65 | 6 | 9 | 5 | 149 | 4.11 | 15.44 | 7 | 7 |
| ./src/rmq_api_server.ts | 0.64 | 13 | 1 | 0 | 87 | 1.67 | 12.44 | 4 | 1 |
| ./src/dbstore/receipts.ts | 0.64 | 7 | 18 | 4 | 275 | 3.29 | 13.21 | 9 | 9 |
| ./src/log-reader/index.ts | 0.63 | 6 | 2 | 2 | 199 | 6.91 | 39.36 | 4 | 3 |
| ./src/child-process/index.ts | 0.62 | 14 | 3 | 1 | 129 | 1.83 | 14.75 | 3 | 3 |
| ./src/dbstore/accounts.ts | 0.62 | 5 | 11 | 3 | 186 | 4.83 | 14.17 | 9 | 9 |
| ./src/dbstore/transactions.ts | 0.61 | 5 | 11 | 2 | 204 | 5.08 | 15.83 | 9 | 9 |
| ./src/distributor.ts | 0.58 | 15 | 0 | 0 | 151 | 2.08 | 13.85 | 7 | 0 |
| ./src/distributor/rmq_data_publisher.ts | 0.47 | 11 | 1 | 2 | 359 | 5.25 | 22.06 | 11 | 4 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/api.ts | 0.14 | 15 | 7 | 2 | 814 | 32.45 | 129.55 | 7 | 5 |

## Detailed Metrics

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
- **Lines of Code:** 9 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/healthCheck.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 11 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.67 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/distributor/utils.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 10 (normalized: 0.56)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 118 (normalized: 0.86)
- **Complexity:** 3.50 (normalized: 0.92)
- **Avg. Function Length:** 15.30 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/Crypto.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 4 (normalized: 0.73)
- **Export Count:** 5 (normalized: 0.28)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 20 (normalized: 0.98)
- **Complexity:** 1.67 (normalized: 0.98)
- **Avg. Function Length:** 4.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/dbstore/index.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.32 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 7 (normalized: 0.39)
- **Imported By Count:** 7 (normalized: 0.41)
- **Lines of Code:** 31 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 11.50 (normalized: 0.91)
- **Async Functions:** 2 (normalized: 0.82)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/Utils.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 4 (normalized: 0.22)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 80 (normalized: 0.91)
- **Complexity:** 3.50 (normalized: 0.92)
- **Avg. Function Length:** 11.17 (normalized: 0.91)
- **Async Functions:** 1 (normalized: 0.91)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/serialization.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.11)
- **Imported By Count:** 6 (normalized: 0.35)
- **Lines of Code:** 19 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.97)
- **Avg. Function Length:** 9.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.78)
### ./socket_sig_tester.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 40 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/messaging/rabbitmq/conn.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.87)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 19 (normalized: 0.98)
- **Complexity:** 3.00 (normalized: 0.94)
- **Avg. Function Length:** 10.00 (normalized: 0.92)
- **Async Functions:** 1 (normalized: 0.91)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./api_tester.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 32 (normalized: 0.97)
- **Complexity:** 1.50 (normalized: 0.98)
- **Avg. Function Length:** 4.00 (normalized: 0.97)
- **Async Functions:** 1 (normalized: 0.91)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/metrics/index.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 5 (normalized: 0.28)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 54 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.60 (normalized: 0.96)
- **Async Functions:** 4 (normalized: 0.64)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/index.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 6 (normalized: 0.60)
- **Export Count:** 5 (normalized: 0.28)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 48 (normalized: 0.95)
- **Complexity:** 1.25 (normalized: 0.99)
- **Avg. Function Length:** 7.50 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./src/Logger.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.62 (importance for testing)
- **Import Count:** 8 (normalized: 0.47)
- **Export Count:** 9 (normalized: 0.50)
- **Imported By Count:** 14 (normalized: 0.82)
- **Lines of Code:** 163 (normalized: 0.81)
- **Complexity:** 2.00 (normalized: 0.97)
- **Avg. Function Length:** 8.40 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/dbstore/checkpoints.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 2 (normalized: 0.87)
- **Export Count:** 2 (normalized: 0.11)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 62 (normalized: 0.93)
- **Complexity:** 1.80 (normalized: 0.97)
- **Avg. Function Length:** 9.00 (normalized: 0.93)
- **Async Functions:** 5 (normalized: 0.55)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/child-process/child.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 7 (normalized: 0.53)
- **Export Count:** 3 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 131 (normalized: 0.85)
- **Complexity:** 3.27 (normalized: 0.93)
- **Avg. Function Length:** 19.45 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./src/Config.ts

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.75 (importance for testing)
- **Import Count:** 5 (normalized: 0.67)
- **Export Count:** 8 (normalized: 0.44)
- **Imported By Count:** 17 (normalized: 1.00)
- **Lines of Code:** 151 (normalized: 0.82)
- **Complexity:** 9.00 (normalized: 0.75)
- **Avg. Function Length:** 36.50 (normalized: 0.72)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.78)
### ./src/distributor/rmq_healthcheck_server.ts

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 8 (normalized: 0.47)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 58 (normalized: 0.94)
- **Complexity:** 1.86 (normalized: 0.97)
- **Avg. Function Length:** 12.71 (normalized: 0.90)
- **Async Functions:** 3 (normalized: 0.73)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./src/dbstore/sqlite3storage.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.33 (importance for testing)
- **Import Count:** 7 (normalized: 0.53)
- **Export Count:** 8 (normalized: 0.44)
- **Imported By Count:** 6 (normalized: 0.35)
- **Lines of Code:** 132 (normalized: 0.84)
- **Complexity:** 2.56 (normalized: 0.95)
- **Avg. Function Length:** 12.00 (normalized: 0.91)
- **Async Functions:** 5 (normalized: 0.55)
- **Try-Catch Blocks:** 3 (normalized: 0.67)
### ./src/distributor/rmq_healthcheck_service.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 6 (normalized: 0.60)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 116 (normalized: 0.86)
- **Complexity:** 3.40 (normalized: 0.92)
- **Avg. Function Length:** 17.80 (normalized: 0.86)
- **Async Functions:** 4 (normalized: 0.64)
- **Try-Catch Blocks:** 2 (normalized: 0.78)
### ./src/dbstore/originalTxsData.ts

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 6 (normalized: 0.60)
- **Export Count:** 10 (normalized: 0.56)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 168 (normalized: 0.80)
- **Complexity:** 4.20 (normalized: 0.90)
- **Avg. Function Length:** 15.10 (normalized: 0.88)
- **Async Functions:** 7 (normalized: 0.36)
- **Try-Catch Blocks:** 7 (normalized: 0.22)
### ./src/dbstore/cycles.ts

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 6 (normalized: 0.60)
- **Export Count:** 9 (normalized: 0.50)
- **Imported By Count:** 5 (normalized: 0.29)
- **Lines of Code:** 149 (normalized: 0.82)
- **Complexity:** 4.11 (normalized: 0.90)
- **Avg. Function Length:** 15.44 (normalized: 0.88)
- **Async Functions:** 7 (normalized: 0.36)
- **Try-Catch Blocks:** 7 (normalized: 0.22)
### ./src/rmq_api_server.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 13 (normalized: 0.13)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 87 (normalized: 0.90)
- **Complexity:** 1.67 (normalized: 0.98)
- **Avg. Function Length:** 12.44 (normalized: 0.90)
- **Async Functions:** 4 (normalized: 0.64)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./src/dbstore/receipts.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 7 (normalized: 0.53)
- **Export Count:** 18 (normalized: 1.00)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 275 (normalized: 0.67)
- **Complexity:** 3.29 (normalized: 0.93)
- **Avg. Function Length:** 13.21 (normalized: 0.90)
- **Async Functions:** 9 (normalized: 0.18)
- **Try-Catch Blocks:** 9 (normalized: 0.00)
### ./src/log-reader/index.ts

- **Composite Score:** 0.63 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 6 (normalized: 0.60)
- **Export Count:** 2 (normalized: 0.11)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 199 (normalized: 0.76)
- **Complexity:** 6.91 (normalized: 0.81)
- **Avg. Function Length:** 39.36 (normalized: 0.70)
- **Async Functions:** 4 (normalized: 0.64)
- **Try-Catch Blocks:** 3 (normalized: 0.67)
### ./src/child-process/index.ts

- **Composite Score:** 0.62 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 14 (normalized: 0.07)
- **Export Count:** 3 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 129 (normalized: 0.85)
- **Complexity:** 1.83 (normalized: 0.97)
- **Avg. Function Length:** 14.75 (normalized: 0.89)
- **Async Functions:** 3 (normalized: 0.73)
- **Try-Catch Blocks:** 3 (normalized: 0.67)
### ./src/dbstore/accounts.ts

- **Composite Score:** 0.62 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 5 (normalized: 0.67)
- **Export Count:** 11 (normalized: 0.61)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 186 (normalized: 0.78)
- **Complexity:** 4.83 (normalized: 0.88)
- **Avg. Function Length:** 14.17 (normalized: 0.89)
- **Async Functions:** 9 (normalized: 0.18)
- **Try-Catch Blocks:** 9 (normalized: 0.00)
### ./src/dbstore/transactions.ts

- **Composite Score:** 0.61 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 5 (normalized: 0.67)
- **Export Count:** 11 (normalized: 0.61)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 204 (normalized: 0.75)
- **Complexity:** 5.08 (normalized: 0.87)
- **Avg. Function Length:** 15.83 (normalized: 0.88)
- **Async Functions:** 9 (normalized: 0.18)
- **Try-Catch Blocks:** 9 (normalized: 0.00)
### ./src/distributor.ts

- **Composite Score:** 0.58 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 15 (normalized: 0.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 151 (normalized: 0.82)
- **Complexity:** 2.08 (normalized: 0.97)
- **Avg. Function Length:** 13.85 (normalized: 0.89)
- **Async Functions:** 7 (normalized: 0.36)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/distributor/rmq_data_publisher.ts

- **Composite Score:** 0.47 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 11 (normalized: 0.27)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 359 (normalized: 0.56)
- **Complexity:** 5.25 (normalized: 0.86)
- **Avg. Function Length:** 22.06 (normalized: 0.83)
- **Async Functions:** 11 (normalized: 0.00)
- **Try-Catch Blocks:** 4 (normalized: 0.56)
### ./src/api.ts

- **Composite Score:** 0.14 (testability)
- **Priority Score:** 0.37 (importance for testing)
- **Import Count:** 15 (normalized: 0.00)
- **Export Count:** 7 (normalized: 0.39)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 814 (normalized: 0.00)
- **Complexity:** 32.45 (normalized: 0.00)
- **Avg. Function Length:** 129.55 (normalized: 0.00)
- **Async Functions:** 7 (normalized: 0.36)
- **Try-Catch Blocks:** 5 (normalized: 0.44)
