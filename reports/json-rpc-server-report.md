# TypeScript Files Ranked by Testing Difficulty

This report ranks 40 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 27 | 67.5% |
| Moderate         | 12 | 30.0% |
| Hard to Test     | 1 | 2.5% |
| **Total**        | **40** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/config.ts | 0.71 | 0.87 | 19 | 1 | 2 | 260 | 1.00 |
| ./src/api.ts | 0.53 | 0.16 | 7 | 26 | 12 | 3908 | 6.35 |
| ./src/utils/nestedCounters.ts | 0.45 | 0.81 | 11 | 1 | 3 | 87 | 2.60 |
| ./src/websocket/index.ts | 0.29 | 0.54 | 4 | 11 | 3 | 422 | 6.57 |
| ./src/utils.ts | 0.29 | 0.67 | 5 | 21 | 42 | 1281 | 3.12 |
| ./src/external/Collector.ts | 0.27 | 0.60 | 4 | 14 | 4 | 632 | 4.36 |
| ./src/storage/sqliteStorage.ts | 0.23 | 0.82 | 5 | 2 | 3 | 43 | 1.50 |
| ./src/websocket/log_server.ts | 0.23 | 0.62 | 3 | 6 | 4 | 193 | 5.91 |
| ./src/types.ts | 0.22 | 0.97 | 6 | 0 | 37 | 350 | 1.00 |
| ./src/external/ServiceValidator.ts | 0.20 | 0.61 | 2 | 8 | 1 | 213 | 6.33 |

## Files Not Imported By Any Other File (7)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./jest.setup.js | 0.86 | 0 | 0 | 0 | 4 | 1.00 | 4.00 | 0 | 0 |
| ./invokeMessage.js | 0.85 | 0 | 0 | 0 | 11 | 1.00 | 9.00 | 0 | 0 |
| ./pm2.js | 0.82 | 0 | 0 | 0 | 40 | 1.80 | 10.60 | 0 | 0 |
| ./src/websocket/explorer.deprecated.ts | 0.68 | 4 | 2 | 0 | 93 | 4.67 | 28.50 | 0 | 2 |
| ./src/utils/profiler.ts | 0.63 | 1 | 7 | 0 | 204 | 8.00 | 32.00 | 0 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/types.ts | 0.97 | 0 | 37 | 6 | 350 | 1.00 | 0.00 | 0 | 0 |
| ./src/middlewares/rateLimit/types.ts | 0.90 | 0 | 7 | 2 | 29 | 1.00 | 0.00 | 0 | 0 |
| ./src/middlewares/rateLimit/constants.ts | 0.89 | 1 | 6 | 3 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./src/config.ts | 0.87 | 1 | 2 | 19 | 260 | 1.00 | 0.00 | 0 | 0 |
| ./src/external/Err.ts | 0.87 | 0 | 6 | 3 | 27 | 1.60 | 3.80 | 1 | 1 |
| ./jest.setup.js | 0.86 | 0 | 0 | 0 | 4 | 1.00 | 4.00 | 0 | 0 |
| ./invokeMessage.js | 0.85 | 0 | 0 | 0 | 11 | 1.00 | 9.00 | 0 | 0 |
| ./src/websocket/clients.ts | 0.84 | 1 | 3 | 4 | 75 | 1.86 | 6.86 | 0 | 0 |
| ./src/utils/TTLMap.ts | 0.83 | 0 | 3 | 2 | 34 | 2.50 | 7.75 | 0 | 0 |
| ./src/utils/logger.ts | 0.83 | 1 | 2 | 1 | 40 | 1.67 | 10.67 | 0 | 0 |
| ./pm2.js | 0.82 | 0 | 0 | 0 | 40 | 1.80 | 10.60 | 0 | 0 |
| ./src/service/gasEstimate.ts | 0.82 | 1 | 5 | 1 | 64 | 2.50 | 8.33 | 0 | 0 |
| ./src/storage/sqliteStorage.ts | 0.82 | 2 | 3 | 5 | 43 | 1.50 | 10.00 | 3 | 1 |
| ./src/external/Archiver.ts | 0.82 | 1 | 2 | 1 | 23 | 2.00 | 8.00 | 2 | 2 |
| ./src/external/BaseExternal.ts | 0.81 | 1 | 3 | 2 | 31 | 3.00 | 7.00 | 1 | 1 |
| ./src/utils/nestedCounters.ts | 0.81 | 1 | 3 | 11 | 87 | 2.60 | 10.40 | 0 | 0 |
| ./src/middlewares/rejectSubscription.ts | 0.79 | 1 | 2 | 1 | 15 | 3.00 | 13.00 | 0 | 0 |
| ./src/routes/healthCheck.ts | 0.79 | 4 | 1 | 1 | 24 | 2.50 | 9.50 | 0 | 0 |
| ./src/middlewares/rateLimit/index.ts | 0.78 | 9 | 6 | 2 | 50 | 2.20 | 7.60 | 3 | 1 |
| ./src/middlewares/debugMiddleware.ts | 0.78 | 7 | 7 | 2 | 102 | 2.63 | 10.38 | 0 | 2 |
| ./src/middlewares/injectIP.ts | 0.77 | 2 | 2 | 1 | 15 | 4.00 | 12.00 | 0 | 0 |
| ./src/middlewares/requestLogger.ts | 0.76 | 4 | 2 | 1 | 74 | 2.67 | 16.33 | 0 | 1 |
| ./src/logger.ts | 0.75 | 6 | 7 | 3 | 229 | 3.15 | 10.41 | 3 | 5 |
| ./src/middlewares/rateLimit/utils.ts | 0.75 | 6 | 6 | 2 | 93 | 3.50 | 10.00 | 0 | 5 |
| ./src/middlewares/methodWhitelist.ts | 0.73 | 2 | 1 | 1 | 30 | 5.00 | 15.50 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/middlewares/rateLimit/Requester... | 0.69 | 6 | 1 | 1 | 464 | 4.68 | 13.90 | 2 | 4 |
| ./src/websocket/explorer.deprecated.ts | 0.68 | 4 | 2 | 0 | 93 | 4.67 | 28.50 | 0 | 2 |
| ./src/utils/servicePoints.ts | 0.67 | 2 | 2 | 1 | 38 | 5.00 | 34.00 | 0 | 0 |
| ./src/utils.ts | 0.67 | 21 | 42 | 5 | 1281 | 3.12 | 14.13 | 27 | 9 |
| ./src/routes/log.ts | 0.64 | 5 | 1 | 1 | 368 | 5.58 | 24.42 | 9 | 4 |
| ./src/utils/profiler.ts | 0.63 | 1 | 7 | 0 | 204 | 8.00 | 32.00 | 0 | 0 |
| ./src/server.ts | 0.62 | 27 | 1 | 1 | 196 | 2.75 | 10.92 | 0 | 0 |
| ./src/websocket/log_server.ts | 0.62 | 6 | 4 | 3 | 193 | 5.91 | 32.73 | 0 | 7 |
| ./src/external/ServiceValidator.ts | 0.61 | 8 | 1 | 2 | 213 | 6.33 | 21.22 | 9 | 8 |
| ./src/external/Collector.ts | 0.60 | 14 | 4 | 4 | 632 | 4.36 | 16.82 | 13 | 14 |
| ./src/websocket/index.ts | 0.54 | 11 | 3 | 4 | 422 | 6.57 | 35.00 | 6 | 8 |
| ./src/cache/BlockCacheManager.ts | 0.53 | 2 | 1 | 1 | 137 | 9.00 | 50.00 | 0 | 0 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/api.ts | 0.16 | 26 | 12 | 7 | 3908 | 6.35 | 31.21 | 88 | 46 |

## Detailed Metrics

### ./src/types.ts

- **Composite Score:** 0.97 (testability)
- **Priority Score:** 0.22 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 37 (normalized: 0.88)
- **Imported By Count:** 6 (normalized: 0.32)
- **Lines of Code:** 350 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middlewares/rateLimit/types.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 7 (normalized: 0.17)
- **Imported By Count:** 2 (normalized: 0.11)
- **Lines of Code:** 29 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middlewares/rateLimit/constants.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 6 (normalized: 0.14)
- **Imported By Count:** 3 (normalized: 0.16)
- **Lines of Code:** 15 (normalized: 1.00)
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
- **Lines of Code:** 17 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/config.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.71 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 19 (normalized: 1.00)
- **Lines of Code:** 260 (normalized: 0.93)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/external/Err.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 6 (normalized: 0.14)
- **Imported By Count:** 3 (normalized: 0.16)
- **Lines of Code:** 27 (normalized: 0.99)
- **Complexity:** 1.60 (normalized: 0.93)
- **Avg. Function Length:** 3.80 (normalized: 0.92)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.98)
### ./jest.setup.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./invokeMessage.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 11 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.00 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/websocket/clients.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.07)
- **Imported By Count:** 4 (normalized: 0.21)
- **Lines of Code:** 75 (normalized: 0.98)
- **Complexity:** 1.86 (normalized: 0.89)
- **Avg. Function Length:** 6.86 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/TTLMap.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 3 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.11)
- **Lines of Code:** 34 (normalized: 0.99)
- **Complexity:** 2.50 (normalized: 0.81)
- **Avg. Function Length:** 7.75 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/logger.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 40 (normalized: 0.99)
- **Complexity:** 1.67 (normalized: 0.92)
- **Avg. Function Length:** 10.67 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./pm2.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 40 (normalized: 0.99)
- **Complexity:** 1.80 (normalized: 0.90)
- **Avg. Function Length:** 10.60 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/service/gasEstimate.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 5 (normalized: 0.12)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 64 (normalized: 0.98)
- **Complexity:** 2.50 (normalized: 0.81)
- **Avg. Function Length:** 8.33 (normalized: 0.83)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/sqliteStorage.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 3 (normalized: 0.07)
- **Imported By Count:** 5 (normalized: 0.26)
- **Lines of Code:** 43 (normalized: 0.99)
- **Complexity:** 1.50 (normalized: 0.94)
- **Avg. Function Length:** 10.00 (normalized: 0.80)
- **Async Functions:** 3 (normalized: 0.97)
- **Try-Catch Blocks:** 1 (normalized: 0.98)
### ./src/external/Archiver.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 23 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.88)
- **Avg. Function Length:** 8.00 (normalized: 0.84)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 2 (normalized: 0.96)
### ./src/external/BaseExternal.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.11)
- **Lines of Code:** 31 (normalized: 0.99)
- **Complexity:** 3.00 (normalized: 0.75)
- **Avg. Function Length:** 7.00 (normalized: 0.86)
- **Async Functions:** 1 (normalized: 0.99)
- **Try-Catch Blocks:** 1 (normalized: 0.98)
### ./src/utils/nestedCounters.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.45 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.07)
- **Imported By Count:** 11 (normalized: 0.58)
- **Lines of Code:** 87 (normalized: 0.98)
- **Complexity:** 2.60 (normalized: 0.80)
- **Avg. Function Length:** 10.40 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middlewares/rejectSubscription.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 15 (normalized: 1.00)
- **Complexity:** 3.00 (normalized: 0.75)
- **Avg. Function Length:** 13.00 (normalized: 0.74)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/healthCheck.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 24 (normalized: 0.99)
- **Complexity:** 2.50 (normalized: 0.81)
- **Avg. Function Length:** 9.50 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middlewares/rateLimit/index.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 9 (normalized: 0.67)
- **Export Count:** 6 (normalized: 0.14)
- **Imported By Count:** 2 (normalized: 0.11)
- **Lines of Code:** 50 (normalized: 0.99)
- **Complexity:** 2.20 (normalized: 0.85)
- **Avg. Function Length:** 7.60 (normalized: 0.85)
- **Async Functions:** 3 (normalized: 0.97)
- **Try-Catch Blocks:** 1 (normalized: 0.98)
### ./src/middlewares/debugMiddleware.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 7 (normalized: 0.74)
- **Export Count:** 7 (normalized: 0.17)
- **Imported By Count:** 2 (normalized: 0.11)
- **Lines of Code:** 102 (normalized: 0.97)
- **Complexity:** 2.63 (normalized: 0.80)
- **Avg. Function Length:** 10.38 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.96)
### ./src/middlewares/injectIP.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 15 (normalized: 1.00)
- **Complexity:** 4.00 (normalized: 0.63)
- **Avg. Function Length:** 12.00 (normalized: 0.76)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middlewares/requestLogger.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 74 (normalized: 0.98)
- **Complexity:** 2.67 (normalized: 0.79)
- **Avg. Function Length:** 16.33 (normalized: 0.67)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.98)
### ./src/logger.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 6 (normalized: 0.78)
- **Export Count:** 7 (normalized: 0.17)
- **Imported By Count:** 3 (normalized: 0.16)
- **Lines of Code:** 229 (normalized: 0.94)
- **Complexity:** 3.15 (normalized: 0.73)
- **Avg. Function Length:** 10.41 (normalized: 0.79)
- **Async Functions:** 3 (normalized: 0.97)
- **Try-Catch Blocks:** 5 (normalized: 0.89)
### ./src/middlewares/rateLimit/utils.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 6 (normalized: 0.78)
- **Export Count:** 6 (normalized: 0.14)
- **Imported By Count:** 2 (normalized: 0.11)
- **Lines of Code:** 93 (normalized: 0.98)
- **Complexity:** 3.50 (normalized: 0.69)
- **Avg. Function Length:** 10.00 (normalized: 0.80)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 5 (normalized: 0.89)
### ./src/middlewares/methodWhitelist.ts

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 30 (normalized: 0.99)
- **Complexity:** 5.00 (normalized: 0.50)
- **Avg. Function Length:** 15.50 (normalized: 0.69)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middlewares/rateLimit/RequestersList.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 6 (normalized: 0.78)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 464 (normalized: 0.88)
- **Complexity:** 4.68 (normalized: 0.54)
- **Avg. Function Length:** 13.90 (normalized: 0.72)
- **Async Functions:** 2 (normalized: 0.98)
- **Try-Catch Blocks:** 4 (normalized: 0.91)
### ./src/websocket/explorer.deprecated.ts

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 4 (normalized: 0.85)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 93 (normalized: 0.98)
- **Complexity:** 4.67 (normalized: 0.54)
- **Avg. Function Length:** 28.50 (normalized: 0.43)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.96)
### ./src/utils/servicePoints.ts

- **Composite Score:** 0.67 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 38 (normalized: 0.99)
- **Complexity:** 5.00 (normalized: 0.50)
- **Avg. Function Length:** 34.00 (normalized: 0.32)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils.ts

- **Composite Score:** 0.67 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 21 (normalized: 0.22)
- **Export Count:** 42 (normalized: 1.00)
- **Imported By Count:** 5 (normalized: 0.26)
- **Lines of Code:** 1281 (normalized: 0.67)
- **Complexity:** 3.12 (normalized: 0.74)
- **Avg. Function Length:** 14.13 (normalized: 0.72)
- **Async Functions:** 27 (normalized: 0.69)
- **Try-Catch Blocks:** 9 (normalized: 0.80)
### ./src/routes/log.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 5 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 368 (normalized: 0.91)
- **Complexity:** 5.58 (normalized: 0.43)
- **Avg. Function Length:** 24.42 (normalized: 0.51)
- **Async Functions:** 9 (normalized: 0.90)
- **Try-Catch Blocks:** 4 (normalized: 0.91)
### ./src/utils/profiler.ts

- **Composite Score:** 0.63 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 7 (normalized: 0.17)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 204 (normalized: 0.95)
- **Complexity:** 8.00 (normalized: 0.13)
- **Avg. Function Length:** 32.00 (normalized: 0.36)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/server.ts

- **Composite Score:** 0.62 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 27 (normalized: 0.00)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 196 (normalized: 0.95)
- **Complexity:** 2.75 (normalized: 0.78)
- **Avg. Function Length:** 10.92 (normalized: 0.78)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/websocket/log_server.ts

- **Composite Score:** 0.62 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 6 (normalized: 0.78)
- **Export Count:** 4 (normalized: 0.10)
- **Imported By Count:** 3 (normalized: 0.16)
- **Lines of Code:** 193 (normalized: 0.95)
- **Complexity:** 5.91 (normalized: 0.39)
- **Avg. Function Length:** 32.73 (normalized: 0.35)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 7 (normalized: 0.85)
### ./src/external/ServiceValidator.ts

- **Composite Score:** 0.61 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 8 (normalized: 0.70)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 2 (normalized: 0.11)
- **Lines of Code:** 213 (normalized: 0.95)
- **Complexity:** 6.33 (normalized: 0.33)
- **Avg. Function Length:** 21.22 (normalized: 0.58)
- **Async Functions:** 9 (normalized: 0.90)
- **Try-Catch Blocks:** 8 (normalized: 0.83)
### ./src/external/Collector.ts

- **Composite Score:** 0.60 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 14 (normalized: 0.48)
- **Export Count:** 4 (normalized: 0.10)
- **Imported By Count:** 4 (normalized: 0.21)
- **Lines of Code:** 632 (normalized: 0.84)
- **Complexity:** 4.36 (normalized: 0.58)
- **Avg. Function Length:** 16.82 (normalized: 0.66)
- **Async Functions:** 13 (normalized: 0.85)
- **Try-Catch Blocks:** 14 (normalized: 0.70)
### ./src/websocket/index.ts

- **Composite Score:** 0.54 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 11 (normalized: 0.59)
- **Export Count:** 3 (normalized: 0.07)
- **Imported By Count:** 4 (normalized: 0.21)
- **Lines of Code:** 422 (normalized: 0.89)
- **Complexity:** 6.57 (normalized: 0.30)
- **Avg. Function Length:** 35.00 (normalized: 0.30)
- **Async Functions:** 6 (normalized: 0.93)
- **Try-Catch Blocks:** 8 (normalized: 0.83)
### ./src/cache/BlockCacheManager.ts

- **Composite Score:** 0.53 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.02)
- **Imported By Count:** 1 (normalized: 0.05)
- **Lines of Code:** 137 (normalized: 0.97)
- **Complexity:** 9.00 (normalized: 0.00)
- **Avg. Function Length:** 50.00 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/api.ts

- **Composite Score:** 0.16 (testability)
- **Priority Score:** 0.53 (importance for testing)
- **Import Count:** 26 (normalized: 0.04)
- **Export Count:** 12 (normalized: 0.29)
- **Imported By Count:** 7 (normalized: 0.37)
- **Lines of Code:** 3908 (normalized: 0.00)
- **Complexity:** 6.35 (normalized: 0.33)
- **Avg. Function Length:** 31.21 (normalized: 0.38)
- **Async Functions:** 88 (normalized: 0.00)
- **Try-Catch Blocks:** 46 (normalized: 0.00)
