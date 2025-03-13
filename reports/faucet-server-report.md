# TypeScript Files Ranked by Testing Difficulty

This report ranks 53 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 42 | 79.2% |
| Moderate         | 10 | 18.9% |
| Hard to Test     | 1 | 1.9% |
| **Total**        | **53** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/repositories/dao.ts | 0.74 | 0.79 | 10 | 1 | 1 | 89 | 1.75 |
| ./src/repositories/faucetClaim.repo.ts | 0.72 | 0.65 | 9 | 2 | 1 | 157 | 1.20 |
| ./src/error/Err.ts | 0.69 | 0.93 | 10 | 0 | 5 | 24 | 1.75 |
| ./src/models/faucetClaim.ts | 0.56 | 0.91 | 8 | 1 | 2 | 36 | 1.00 |
| ./src/services/faucetClaim.service.ts | 0.37 | 0.48 | 3 | 13 | 1 | 201 | 4.25 |
| ./src/services/faucetConfig.service.ts | 0.32 | 0.64 | 3 | 4 | 2 | 100 | 4.17 |
| ./src/faucet/faucetTxTask.ts | 0.31 | 0.26 | 1 | 11 | 1 | 544 | 4.30 |
| ./src/util/date.util.ts | 0.31 | 0.87 | 4 | 0 | 1 | 20 | 1.00 |
| ./src/util/time.util.ts | 0.31 | 0.88 | 4 | 0 | 1 | 7 | 1.00 |
| ./src/logger.ts | 0.29 | 0.74 | 3 | 0 | 0 | 16 | 4.00 |

## Files Not Imported By Any Other File (13)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 20 | 1.00 | 0.00 | 0 | 0 |
| ./register.ts | 0.87 | 0 | 0 | 0 | 24 | 1.00 | 0.00 | 0 | 0 |
| ./setup.ts | 0.85 | 1 | 0 | 0 | 20 | 1.00 | 3.67 | 0 | 0 |
| ./backfillBalance.ts | 0.83 | 2 | 0 | 0 | 22 | 1.00 | 4.00 | 1 | 0 |
| ./periodicBackfillBalance.ts | 0.81 | 3 | 0 | 0 | 18 | 1.00 | 6.50 | 1 | 0 |
| ./createFaucetAccounts.ts | 0.75 | 1 | 1 | 0 | 83 | 2.43 | 12.43 | 2 | 1 |
| ./dataMigrationToSQLite.ts | 0.72 | 3 | 0 | 0 | 68 | 2.17 | 9.67 | 2 | 1 |
| ./archiveData.ts | 0.72 | 5 | 0 | 0 | 66 | 1.67 | 12.17 | 3 | 0 |
| ./src/index.ts | 0.71 | 16 | 1 | 0 | 63 | 1.00 | 0.00 | 0 | 0 |
| ./syncToAnalyticsInstance.ts | 0.69 | 6 | 0 | 0 | 64 | 2.20 | 10.60 | 1 | 1 |
| ./dumpFaucetClaimsForAnalytics.ts | 0.55 | 8 | 0 | 0 | 159 | 2.80 | 14.90 | 3 | 4 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/error/Err.ts | 0.93 | 0 | 5 | 10 | 24 | 1.75 | 4.00 | 1 | 1 |
| ./src/models/faucetClaim.ts | 0.91 | 1 | 2 | 8 | 36 | 1.00 | 0.00 | 0 | 0 |
| ./src/routes/discord.routes.ts | 0.90 | 2 | 2 | 1 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./src/routes/twitter.routes.ts | 0.90 | 2 | 2 | 1 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./src/routes/faucetClaim.routes.ts | 0.90 | 2 | 2 | 1 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/routes/health.routes.ts | 0.90 | 2 | 2 | 1 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/models/faucetConfig.ts | 0.90 | 0 | 1 | 3 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./src/models/faucetClaimArchive.ts | 0.90 | 0 | 1 | 2 | 29 | 1.00 | 0.00 | 0 | 0 |
| ./src/routes/admin.routes.ts | 0.89 | 3 | 2 | 1 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/models/faucetTx.ts | 0.89 | 1 | 1 | 3 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./src/util/time.util.ts | 0.88 | 0 | 1 | 4 | 7 | 1.00 | 5.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/util/date.util.ts | 0.87 | 0 | 1 | 4 | 20 | 1.00 | 5.67 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 20 | 1.00 | 0.00 | 0 | 0 |
| ./register.ts | 0.87 | 0 | 0 | 0 | 24 | 1.00 | 0.00 | 0 | 0 |
| ./src/external/recaptcha.external.ts | 0.86 | 1 | 1 | 1 | 11 | 1.00 | 6.00 | 1 | 0 |
| ./src/util/address.util.ts | 0.86 | 1 | 1 | 3 | 12 | 1.50 | 4.50 | 0 | 0 |
| ./src/util/ratelimthelper.ts | 0.85 | 0 | 4 | 1 | 60 | 2.75 | 12.50 | 1 | 0 |
| ./src/repositories/postgres.ts | 0.85 | 1 | 1 | 2 | 26 | 1.50 | 4.50 | 0 | 0 |
| ./setup.ts | 0.85 | 1 | 0 | 0 | 20 | 1.00 | 3.67 | 0 | 0 |
| ./src/controllers/health.controller.ts | 0.85 | 2 | 1 | 1 | 13 | 1.00 | 4.50 | 2 | 0 |
| ./src/faucet/faucetTxQueue.ts | 0.84 | 1 | 2 | 3 | 69 | 2.00 | 7.25 | 0 | 0 |
| ./backfillBalance.ts | 0.83 | 2 | 0 | 0 | 22 | 1.00 | 4.00 | 1 | 0 |
| ./src/services/ip.service.ts | 0.82 | 1 | 1 | 2 | 26 | 2.25 | 6.50 | 1 | 0 |
| ./src/util/error.util.ts | 0.81 | 1 | 1 | 3 | 8 | 3.00 | 5.00 | 0 | 0 |
| ./periodicBackfillBalance.ts | 0.81 | 3 | 0 | 0 | 18 | 1.00 | 6.50 | 1 | 0 |
| ./src/repositories/faucetConfig.repo.ts | 0.79 | 2 | 1 | 1 | 28 | 1.33 | 8.00 | 3 | 1 |
| ./src/repositories/dao.ts | 0.79 | 1 | 1 | 10 | 89 | 1.75 | 14.42 | 0 | 0 |
| ./src/repositories/faucetTx.repo.ts | 0.78 | 3 | 1 | 3 | 30 | 1.33 | 8.33 | 3 | 1 |
| ./src/middlewares/authorize.ts | 0.77 | 2 | 2 | 1 | 22 | 3.50 | 13.00 | 0 | 0 |
| ./src/external/rpcServer.external.ts | 0.77 | 5 | 1 | 3 | 29 | 1.33 | 6.67 | 3 | 1 |
| ./src/repositories/faucetClaimArchive... | 0.75 | 2 | 1 | 1 | 22 | 2.00 | 18.00 | 1 | 1 |
| ./createFaucetAccounts.ts | 0.75 | 1 | 1 | 0 | 83 | 2.43 | 12.43 | 2 | 1 |
| ./src/logger.ts | 0.74 | 0 | 0 | 3 | 16 | 4.00 | 12.00 | 0 | 0 |
| ./src/services/twitter.service.ts | 0.73 | 3 | 1 | 1 | 65 | 3.40 | 10.20 | 1 | 0 |
| ./dataMigrationToSQLite.ts | 0.72 | 3 | 0 | 0 | 68 | 2.17 | 9.67 | 2 | 1 |
| ./archiveData.ts | 0.72 | 5 | 0 | 0 | 66 | 1.67 | 12.17 | 3 | 0 |
| ./src/controllers/faucetClaim.control... | 0.71 | 3 | 1 | 1 | 56 | 3.50 | 13.50 | 2 | 0 |
| ./src/util/request.util.ts | 0.71 | 1 | 1 | 1 | 17 | 5.00 | 14.00 | 0 | 0 |
| ./src/index.ts | 0.71 | 16 | 1 | 0 | 63 | 1.00 | 0.00 | 0 | 0 |
| ./src/controllers/admin.controller.ts | 0.71 | 7 | 1 | 1 | 43 | 2.33 | 11.33 | 3 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./syncToAnalyticsInstance.ts | 0.69 | 6 | 0 | 0 | 64 | 2.20 | 10.60 | 1 | 1 |
| ./backfillUtil.ts | 0.69 | 6 | 2 | 2 | 132 | 2.20 | 11.40 | 6 | 1 |
| ./src/external/twitter.external.ts | 0.65 | 2 | 2 | 1 | 35 | 5.00 | 25.00 | 1 | 1 |
| ./src/repositories/faucetClaim.repo.ts | 0.65 | 2 | 1 | 9 | 157 | 1.20 | 7.15 | 18 | 2 |
| ./src/services/faucetConfig.service.ts | 0.64 | 4 | 2 | 3 | 100 | 4.17 | 15.00 | 4 | 2 |
| ./src/services/health.service.ts | 0.64 | 2 | 1 | 2 | 25 | 6.00 | 21.00 | 1 | 0 |
| ./dumpFaucetClaimsForAnalytics.ts | 0.55 | 8 | 0 | 0 | 159 | 2.80 | 14.90 | 3 | 4 |
| ./src/controllers/discord.controller.ts | 0.53 | 5 | 1 | 1 | 46 | 6.00 | 39.00 | 1 | 0 |
| ./src/controllers/twitter.controller.ts | 0.50 | 7 | 1 | 1 | 42 | 7.00 | 33.00 | 1 | 0 |
| ./src/services/faucetClaim.service.ts | 0.48 | 13 | 1 | 3 | 201 | 4.25 | 22.25 | 6 | 0 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/faucet/faucetTxTask.ts | 0.26 | 11 | 1 | 1 | 544 | 4.30 | 25.20 | 12 | 6 |

## Detailed Metrics

### ./src/error/Err.ts

- **Composite Score:** 0.93 (testability)
- **Priority Score:** 0.69 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 5 (normalized: 1.00)
- **Imported By Count:** 10 (normalized: 1.00)
- **Lines of Code:** 24 (normalized: 0.96)
- **Complexity:** 1.75 (normalized: 0.88)
- **Avg. Function Length:** 4.00 (normalized: 0.90)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./src/models/faucetClaim.ts

- **Composite Score:** 0.91 (testability)
- **Priority Score:** 0.56 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 8 (normalized: 0.80)
- **Lines of Code:** 36 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/discord.routes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/twitter.routes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/faucetClaim.routes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/health.routes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/models/faucetConfig.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 15 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/models/faucetClaimArchive.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 2 (normalized: 0.20)
- **Lines of Code:** 29 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/admin.routes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 3 (normalized: 0.81)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/models/faucetTx.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/time.util.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 4 (normalized: 0.40)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.87)
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
### ./src/prettier.config.js

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
### ./src/util/date.util.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 4 (normalized: 0.40)
- **Lines of Code:** 20 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.67 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 20 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./register.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 24 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/external/recaptcha.external.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 11 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.85)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/address.util.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.50 (normalized: 0.92)
- **Avg. Function Length:** 4.50 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/ratelimthelper.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 4 (normalized: 0.80)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 60 (normalized: 0.90)
- **Complexity:** 2.75 (normalized: 0.71)
- **Avg. Function Length:** 12.50 (normalized: 0.68)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/repositories/postgres.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 2 (normalized: 0.20)
- **Lines of Code:** 26 (normalized: 0.96)
- **Complexity:** 1.50 (normalized: 0.92)
- **Avg. Function Length:** 4.50 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./setup.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 20 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.67 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controllers/health.controller.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 13 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.50 (normalized: 0.88)
- **Async Functions:** 2 (normalized: 0.89)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/faucet/faucetTxQueue.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 69 (normalized: 0.88)
- **Complexity:** 2.00 (normalized: 0.83)
- **Avg. Function Length:** 7.25 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./backfillBalance.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 22 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.90)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/services/ip.service.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 2 (normalized: 0.20)
- **Lines of Code:** 26 (normalized: 0.96)
- **Complexity:** 2.25 (normalized: 0.79)
- **Avg. Function Length:** 6.50 (normalized: 0.83)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/error.util.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 3.00 (normalized: 0.67)
- **Avg. Function Length:** 5.00 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./periodicBackfillBalance.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.81)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 18 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.50 (normalized: 0.83)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/repositories/faucetConfig.repo.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 28 (normalized: 0.96)
- **Complexity:** 1.33 (normalized: 0.94)
- **Avg. Function Length:** 8.00 (normalized: 0.79)
- **Async Functions:** 3 (normalized: 0.83)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./src/repositories/dao.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.74 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 10 (normalized: 1.00)
- **Lines of Code:** 89 (normalized: 0.84)
- **Complexity:** 1.75 (normalized: 0.88)
- **Avg. Function Length:** 14.42 (normalized: 0.63)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/repositories/faucetTx.repo.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 3 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 30 (normalized: 0.95)
- **Complexity:** 1.33 (normalized: 0.94)
- **Avg. Function Length:** 8.33 (normalized: 0.79)
- **Async Functions:** 3 (normalized: 0.83)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./src/middlewares/authorize.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 22 (normalized: 0.97)
- **Complexity:** 3.50 (normalized: 0.58)
- **Avg. Function Length:** 13.00 (normalized: 0.67)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/external/rpcServer.external.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 5 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 29 (normalized: 0.96)
- **Complexity:** 1.33 (normalized: 0.94)
- **Avg. Function Length:** 6.67 (normalized: 0.83)
- **Async Functions:** 3 (normalized: 0.83)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./src/repositories/faucetClaimArchive.repo.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 22 (normalized: 0.97)
- **Complexity:** 2.00 (normalized: 0.83)
- **Avg. Function Length:** 18.00 (normalized: 0.54)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./createFaucetAccounts.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 83 (normalized: 0.86)
- **Complexity:** 2.43 (normalized: 0.76)
- **Avg. Function Length:** 12.43 (normalized: 0.68)
- **Async Functions:** 2 (normalized: 0.89)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./src/logger.ts

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 16 (normalized: 0.98)
- **Complexity:** 4.00 (normalized: 0.50)
- **Avg. Function Length:** 12.00 (normalized: 0.69)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/services/twitter.service.ts

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 3 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 65 (normalized: 0.89)
- **Complexity:** 3.40 (normalized: 0.60)
- **Avg. Function Length:** 10.20 (normalized: 0.74)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./dataMigrationToSQLite.ts

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 3 (normalized: 0.81)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 68 (normalized: 0.88)
- **Complexity:** 2.17 (normalized: 0.81)
- **Avg. Function Length:** 9.67 (normalized: 0.75)
- **Async Functions:** 2 (normalized: 0.89)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./archiveData.ts

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 5 (normalized: 0.69)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 66 (normalized: 0.89)
- **Complexity:** 1.67 (normalized: 0.89)
- **Avg. Function Length:** 12.17 (normalized: 0.69)
- **Async Functions:** 3 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controllers/faucetClaim.controller.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 3 (normalized: 0.81)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 56 (normalized: 0.91)
- **Complexity:** 3.50 (normalized: 0.58)
- **Avg. Function Length:** 13.50 (normalized: 0.65)
- **Async Functions:** 2 (normalized: 0.89)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/request.util.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 1 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 17 (normalized: 0.98)
- **Complexity:** 5.00 (normalized: 0.33)
- **Avg. Function Length:** 14.00 (normalized: 0.64)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/index.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 16 (normalized: 0.00)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 63 (normalized: 0.89)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controllers/admin.controller.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 7 (normalized: 0.56)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 43 (normalized: 0.93)
- **Complexity:** 2.33 (normalized: 0.78)
- **Avg. Function Length:** 11.33 (normalized: 0.71)
- **Async Functions:** 3 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./syncToAnalyticsInstance.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 6 (normalized: 0.63)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 64 (normalized: 0.89)
- **Complexity:** 2.20 (normalized: 0.80)
- **Avg. Function Length:** 10.60 (normalized: 0.73)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./backfillUtil.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 6 (normalized: 0.63)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 2 (normalized: 0.20)
- **Lines of Code:** 132 (normalized: 0.76)
- **Complexity:** 2.20 (normalized: 0.80)
- **Avg. Function Length:** 11.40 (normalized: 0.71)
- **Async Functions:** 6 (normalized: 0.67)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./src/external/twitter.external.ts

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 35 (normalized: 0.94)
- **Complexity:** 5.00 (normalized: 0.33)
- **Avg. Function Length:** 25.00 (normalized: 0.36)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 1 (normalized: 0.83)
### ./src/repositories/faucetClaim.repo.ts

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.72 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 9 (normalized: 0.90)
- **Lines of Code:** 157 (normalized: 0.72)
- **Complexity:** 1.20 (normalized: 0.97)
- **Avg. Function Length:** 7.15 (normalized: 0.82)
- **Async Functions:** 18 (normalized: 0.00)
- **Try-Catch Blocks:** 2 (normalized: 0.67)
### ./src/services/faucetConfig.service.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.32 (importance for testing)
- **Import Count:** 4 (normalized: 0.75)
- **Export Count:** 2 (normalized: 0.40)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 100 (normalized: 0.82)
- **Complexity:** 4.17 (normalized: 0.47)
- **Avg. Function Length:** 15.00 (normalized: 0.62)
- **Async Functions:** 4 (normalized: 0.78)
- **Try-Catch Blocks:** 2 (normalized: 0.67)
### ./src/services/health.service.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 2 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 2 (normalized: 0.20)
- **Lines of Code:** 25 (normalized: 0.96)
- **Complexity:** 6.00 (normalized: 0.17)
- **Avg. Function Length:** 21.00 (normalized: 0.46)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./dumpFaucetClaimsForAnalytics.ts

- **Composite Score:** 0.55 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 8 (normalized: 0.50)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 159 (normalized: 0.71)
- **Complexity:** 2.80 (normalized: 0.70)
- **Avg. Function Length:** 14.90 (normalized: 0.62)
- **Async Functions:** 3 (normalized: 0.83)
- **Try-Catch Blocks:** 4 (normalized: 0.33)
### ./src/controllers/discord.controller.ts

- **Composite Score:** 0.53 (testability)
- **Priority Score:** 0.22 (importance for testing)
- **Import Count:** 5 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 46 (normalized: 0.92)
- **Complexity:** 6.00 (normalized: 0.17)
- **Avg. Function Length:** 39.00 (normalized: 0.00)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controllers/twitter.controller.ts

- **Composite Score:** 0.50 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 7 (normalized: 0.56)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 42 (normalized: 0.93)
- **Complexity:** 7.00 (normalized: 0.00)
- **Avg. Function Length:** 33.00 (normalized: 0.15)
- **Async Functions:** 1 (normalized: 0.94)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/services/faucetClaim.service.ts

- **Composite Score:** 0.48 (testability)
- **Priority Score:** 0.37 (importance for testing)
- **Import Count:** 13 (normalized: 0.19)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.30)
- **Lines of Code:** 201 (normalized: 0.64)
- **Complexity:** 4.25 (normalized: 0.46)
- **Avg. Function Length:** 22.25 (normalized: 0.43)
- **Async Functions:** 6 (normalized: 0.67)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/faucet/faucetTxTask.ts

- **Composite Score:** 0.26 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 11 (normalized: 0.31)
- **Export Count:** 1 (normalized: 0.20)
- **Imported By Count:** 1 (normalized: 0.10)
- **Lines of Code:** 544 (normalized: 0.00)
- **Complexity:** 4.30 (normalized: 0.45)
- **Avg. Function Length:** 25.20 (normalized: 0.35)
- **Async Functions:** 12 (normalized: 0.33)
- **Try-Catch Blocks:** 6 (normalized: 0.00)
