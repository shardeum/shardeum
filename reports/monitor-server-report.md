# TypeScript Files Ranked by Testing Difficulty

This report ranks 48 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 45 | 93.8% |
| Moderate         | 3 | 6.3% |
| Hard to Test     | 0 | 0.0% |
| **Total**        | **48** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/class/node.ts | 0.80 | 0.44 | 21 | 6 | 1 | 1250 | 4.17 |
| ./src/interface/interface.ts | 0.68 | 0.96 | 23 | 2 | 16 | 158 | 1.00 |
| ./src/server.ts | 0.22 | 0.43 | 1 | 13 | 2 | 616 | 2.69 |
| ./src/config/index.ts | 0.19 | 0.88 | 5 | 1 | 2 | 28 | 1.00 |
| ./src/class/logger.ts | 0.16 | 0.88 | 4 | 2 | 9 | 135 | 2.11 |
| ./src/middleware/validateReport.ts | 0.16 | 0.53 | 0 | 0 | 0 | 120 | 24.50 |
| ./src/controller/notifyActionStarted.ts | 0.13 | 0.71 | 1 | 5 | 1 | 27 | 6.00 |
| ./src/class/profiler/Statistics.ts | 0.12 | 0.81 | 2 | 2 | 4 | 374 | 2.22 |
| ./src/controller/foundation.ts | 0.12 | 0.74 | 1 | 3 | 1 | 51 | 1.80 |
| ./src/utils/index.ts | 0.11 | 0.84 | 2 | 0 | 9 | 281 | 4.95 |

## Files Not Imported By Any Other File (31)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/NoOp.ts | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 30 | 1.00 | 0.00 | 0 | 0 |
| ./src/middleware/field-existance.ts | 0.84 | 0 | 0 | 0 | 16 | 1.67 | 10.00 | 0 | 0 |
| ./src/controller/report.ts | 0.83 | 2 | 0 | 0 | 9 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/version.ts | 0.82 | 3 | 0 | 0 | 12 | 1.00 | 4.00 | 0 | 0 |
| ./src/services/passport.ts | 0.82 | 1 | 0 | 0 | 39 | 2.67 | 9.00 | 0 | 0 |
| ./src/controller/getScaleReports.ts | 0.82 | 3 | 0 | 0 | 13 | 1.00 | 5.00 | 0 | 0 |
| ./10k-heartbeat.js | 0.82 | 0 | 0 | 0 | 26 | 1.50 | 10.50 | 1 | 0 |
| ./src/controller/getRemoved.ts | 0.82 | 3 | 0 | 0 | 10 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/getSyncReports.ts | 0.82 | 3 | 0 | 0 | 14 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/txCoverage.ts | 0.82 | 3 | 0 | 0 | 14 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/flush.ts | 0.81 | 3 | 0 | 0 | 12 | 1.00 | 8.00 | 0 | 0 |
| ./src/controller/rareCounter.ts | 0.81 | 3 | 0 | 0 | 14 | 2.00 | 6.00 | 0 | 0 |
| ./src/controller/active.ts | 0.81 | 3 | 0 | 0 | 13 | 1.00 | 9.00 | 0 | 0 |
| ./src/controller/removed.ts | 0.81 | 3 | 0 | 0 | 13 | 1.00 | 9.00 | 0 | 0 |
| ./src/api/index.ts | 0.81 | 3 | 0 | 0 | 75 | 1.50 | 6.00 | 0 | 0 |
| ./src/controller/authentication.ts | 0.81 | 1 | 0 | 0 | 30 | 2.33 | 9.00 | 1 | 0 |
| ./src/controller/joining.ts | 0.81 | 3 | 0 | 0 | 15 | 1.00 | 11.00 | 0 | 0 |
| ./src/controller/mock.ts | 0.80 | 3 | 0 | 0 | 12 | 3.00 | 6.00 | 0 | 0 |
| ./src/controller/resetRareCounter.ts | 0.80 | 3 | 0 | 0 | 13 | 1.00 | 5.00 | 1 | 0 |
| ./src/controller/history.ts | 0.79 | 3 | 0 | 0 | 14 | 2.00 | 9.00 | 0 | 1 |
| ./src/controller/appVersions.ts | 0.78 | 4 | 0 | 0 | 14 | 2.00 | 9.00 | 0 | 1 |
| ./src/controller/invalidIPs.ts | 0.78 | 4 | 0 | 0 | 14 | 2.00 | 9.00 | 0 | 1 |
| ./src/controller/joined.ts | 0.77 | 3 | 0 | 0 | 21 | 2.00 | 16.00 | 0 | 1 |
| ./src/class/profiler/StringifyReduce.ts | 0.77 | 0 | 1 | 0 | 122 | 6.83 | 20.00 | 0 | 0 |
| ./src/class/mock.ts | 0.77 | 0 | 0 | 0 | 119 | 2.33 | 29.67 | 0 | 0 |
| ./src/controller/syncReport.ts | 0.77 | 3 | 0 | 0 | 27 | 3.00 | 18.00 | 0 | 0 |
| ./src/controller/countedEvents.ts | 0.75 | 4 | 0 | 0 | 20 | 4.00 | 15.00 | 0 | 1 |
| ./src/controller/heartbeat.ts | 0.71 | 3 | 0 | 0 | 31 | 7.00 | 25.00 | 0 | 1 |
| ./src/middleware/validateReport.ts | 0.53 | 0 | 0 | 0 | 120 | 24.50 | 58.00 | 0 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/interface/interface.ts | 0.96 | 2 | 16 | 23 | 158 | 1.00 | 0.00 | 0 | 0 |
| ./src/middleware/index.ts | 0.88 | 0 | 1 | 1 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/config/monitor-log.ts | 0.88 | 0 | 1 | 1 | 41 | 1.00 | 0.00 | 0 | 0 |
| ./src/NoOp.ts | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/class/logger.ts | 0.88 | 2 | 9 | 4 | 135 | 2.11 | 7.11 | 0 | 0 |
| ./src/config/index.ts | 0.88 | 1 | 2 | 5 | 28 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 30 | 1.00 | 0.00 | 0 | 0 |
| ./src/class/profiler/nestedCounters.ts | 0.86 | 0 | 6 | 2 | 135 | 2.00 | 13.89 | 0 | 0 |
| ./src/controller/index.ts | 0.85 | 2 | 1 | 1 | 46 | 1.00 | 0.00 | 0 | 0 |
| ./src/routes/healthCheck.ts | 0.84 | 2 | 1 | 1 | 12 | 1.00 | 4.50 | 0 | 0 |
| ./src/middleware/field-existance.ts | 0.84 | 0 | 0 | 0 | 16 | 1.67 | 10.00 | 0 | 0 |
| ./src/class/user.ts | 0.84 | 1 | 1 | 1 | 41 | 2.10 | 7.30 | 0 | 0 |
| ./src/class/profiler/MemoryReporting.ts | 0.84 | 1 | 4 | 1 | 163 | 1.83 | 12.42 | 0 | 0 |
| ./src/utils/index.ts | 0.84 | 0 | 9 | 2 | 281 | 4.95 | 11.95 | 0 | 2 |
| ./src/controller/report.ts | 0.83 | 2 | 0 | 0 | 9 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/version.ts | 0.82 | 3 | 0 | 0 | 12 | 1.00 | 4.00 | 0 | 0 |
| ./src/services/passport.ts | 0.82 | 1 | 0 | 0 | 39 | 2.67 | 9.00 | 0 | 0 |
| ./src/controller/getScaleReports.ts | 0.82 | 3 | 0 | 0 | 13 | 1.00 | 5.00 | 0 | 0 |
| ./10k-heartbeat.js | 0.82 | 0 | 0 | 0 | 26 | 1.50 | 10.50 | 1 | 0 |
| ./src/controller/getRemoved.ts | 0.82 | 3 | 0 | 0 | 10 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/getSyncReports.ts | 0.82 | 3 | 0 | 0 | 14 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/txCoverage.ts | 0.82 | 3 | 0 | 0 | 14 | 1.00 | 6.00 | 0 | 0 |
| ./src/controller/flush.ts | 0.81 | 3 | 0 | 0 | 12 | 1.00 | 8.00 | 0 | 0 |
| ./src/controller/rareCounter.ts | 0.81 | 3 | 0 | 0 | 14 | 2.00 | 6.00 | 0 | 0 |
| ./src/class/profiler/Statistics.ts | 0.81 | 2 | 4 | 2 | 374 | 2.22 | 6.97 | 0 | 0 |
| ./src/controller/active.ts | 0.81 | 3 | 0 | 0 | 13 | 1.00 | 9.00 | 0 | 0 |
| ./src/controller/removed.ts | 0.81 | 3 | 0 | 0 | 13 | 1.00 | 9.00 | 0 | 0 |
| ./src/api/index.ts | 0.81 | 3 | 0 | 0 | 75 | 1.50 | 6.00 | 0 | 0 |
| ./src/controller/authentication.ts | 0.81 | 1 | 0 | 0 | 30 | 2.33 | 9.00 | 1 | 0 |
| ./src/controller/joining.ts | 0.81 | 3 | 0 | 0 | 15 | 1.00 | 11.00 | 0 | 0 |
| ./src/controller/mock.ts | 0.80 | 3 | 0 | 0 | 12 | 3.00 | 6.00 | 0 | 0 |
| ./src/controller/resetRareCounter.ts | 0.80 | 3 | 0 | 0 | 13 | 1.00 | 5.00 | 1 | 0 |
| ./src/class/profiler/profiler.ts | 0.80 | 0 | 3 | 1 | 202 | 5.00 | 18.50 | 0 | 0 |
| ./src/controller/history.ts | 0.79 | 3 | 0 | 0 | 14 | 2.00 | 9.00 | 0 | 1 |
| ./src/controller/appVersions.ts | 0.78 | 4 | 0 | 0 | 14 | 2.00 | 9.00 | 0 | 1 |
| ./src/controller/invalidIPs.ts | 0.78 | 4 | 0 | 0 | 14 | 2.00 | 9.00 | 0 | 1 |
| ./src/controller/joined.ts | 0.77 | 3 | 0 | 0 | 21 | 2.00 | 16.00 | 0 | 1 |
| ./src/class/profiler/StringifyReduce.ts | 0.77 | 0 | 1 | 0 | 122 | 6.83 | 20.00 | 0 | 0 |
| ./src/class/mock.ts | 0.77 | 0 | 0 | 0 | 119 | 2.33 | 29.67 | 0 | 0 |
| ./src/controller/syncReport.ts | 0.77 | 3 | 0 | 0 | 27 | 3.00 | 18.00 | 0 | 0 |
| ./src/controller/countedEvents.ts | 0.75 | 4 | 0 | 0 | 20 | 4.00 | 15.00 | 0 | 1 |
| ./src/controller/foundation.ts | 0.74 | 3 | 1 | 1 | 51 | 1.80 | 14.40 | 2 | 2 |
| ./src/controller/heartbeat.ts | 0.71 | 3 | 0 | 0 | 31 | 7.00 | 25.00 | 0 | 1 |
| ./src/controller/notifyActionStarted.ts | 0.71 | 5 | 1 | 1 | 27 | 6.00 | 18.00 | 1 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/middleware/validateReport.ts | 0.53 | 0 | 0 | 0 | 120 | 24.50 | 58.00 | 0 | 0 |
| ./src/class/node.ts | 0.44 | 6 | 1 | 21 | 1250 | 4.17 | 20.86 | 2 | 12 |
| ./src/server.ts | 0.43 | 13 | 2 | 1 | 616 | 2.69 | 12.60 | 6 | 5 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Detailed Metrics

### ./src/interface/interface.ts

- **Composite Score:** 0.96 (testability)
- **Priority Score:** 0.68 (importance for testing)
- **Import Count:** 2 (normalized: 0.85)
- **Export Count:** 16 (normalized: 1.00)
- **Imported By Count:** 23 (normalized: 1.00)
- **Lines of Code:** 158 (normalized: 0.87)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middleware/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/config/monitor-log.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 41 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/NoOp.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
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
### ./src/class/logger.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 2 (normalized: 0.85)
- **Export Count:** 9 (normalized: 0.56)
- **Imported By Count:** 4 (normalized: 0.17)
- **Lines of Code:** 135 (normalized: 0.89)
- **Complexity:** 2.11 (normalized: 0.95)
- **Avg. Function Length:** 7.11 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/config/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 1 (normalized: 0.92)
- **Export Count:** 2 (normalized: 0.13)
- **Imported By Count:** 5 (normalized: 0.22)
- **Lines of Code:** 28 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 30 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/profiler/nestedCounters.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 6 (normalized: 0.38)
- **Imported By Count:** 2 (normalized: 0.09)
- **Lines of Code:** 135 (normalized: 0.89)
- **Complexity:** 2.00 (normalized: 0.96)
- **Avg. Function Length:** 13.89 (normalized: 0.76)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/index.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 2 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 46 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/healthCheck.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 2 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.50 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middleware/field-existance.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 16 (normalized: 0.99)
- **Complexity:** 1.67 (normalized: 0.97)
- **Avg. Function Length:** 10.00 (normalized: 0.83)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/user.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.92)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 41 (normalized: 0.97)
- **Complexity:** 2.10 (normalized: 0.95)
- **Avg. Function Length:** 7.30 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/profiler/MemoryReporting.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.92)
- **Export Count:** 4 (normalized: 0.25)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 163 (normalized: 0.87)
- **Complexity:** 1.83 (normalized: 0.96)
- **Avg. Function Length:** 12.42 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/index.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 9 (normalized: 0.56)
- **Imported By Count:** 2 (normalized: 0.09)
- **Lines of Code:** 281 (normalized: 0.78)
- **Complexity:** 4.95 (normalized: 0.83)
- **Avg. Function Length:** 11.95 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.83)
### ./src/controller/report.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 2 (normalized: 0.85)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 9 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/version.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/services/passport.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.92)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 39 (normalized: 0.97)
- **Complexity:** 2.67 (normalized: 0.93)
- **Avg. Function Length:** 9.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/getScaleReports.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./10k-heartbeat.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 26 (normalized: 0.98)
- **Complexity:** 1.50 (normalized: 0.98)
- **Avg. Function Length:** 10.50 (normalized: 0.82)
- **Async Functions:** 1 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/getRemoved.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 10 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/getSyncReports.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/txCoverage.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/flush.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 8.00 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/rareCounter.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.96)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/profiler/Statistics.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 2 (normalized: 0.85)
- **Export Count:** 4 (normalized: 0.25)
- **Imported By Count:** 2 (normalized: 0.09)
- **Lines of Code:** 374 (normalized: 0.70)
- **Complexity:** 2.22 (normalized: 0.95)
- **Avg. Function Length:** 6.97 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/active.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/removed.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/api/index.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 75 (normalized: 0.94)
- **Complexity:** 1.50 (normalized: 0.98)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/authentication.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.92)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 30 (normalized: 0.98)
- **Complexity:** 2.33 (normalized: 0.94)
- **Avg. Function Length:** 9.00 (normalized: 0.84)
- **Async Functions:** 1 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/joining.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 15 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 11.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/mock.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 3.00 (normalized: 0.91)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/resetRareCounter.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.91)
- **Async Functions:** 1 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/profiler/profiler.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 3 (normalized: 0.19)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 202 (normalized: 0.84)
- **Complexity:** 5.00 (normalized: 0.83)
- **Avg. Function Length:** 18.50 (normalized: 0.68)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/history.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.96)
- **Avg. Function Length:** 9.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.92)
### ./src/controller/appVersions.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.69)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.96)
- **Avg. Function Length:** 9.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.92)
### ./src/controller/invalidIPs.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.69)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.96)
- **Avg. Function Length:** 9.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.92)
### ./src/controller/joined.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 21 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.96)
- **Avg. Function Length:** 16.00 (normalized: 0.72)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.92)
### ./src/class/profiler/StringifyReduce.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 122 (normalized: 0.90)
- **Complexity:** 6.83 (normalized: 0.75)
- **Avg. Function Length:** 20.00 (normalized: 0.66)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/mock.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 119 (normalized: 0.91)
- **Complexity:** 2.33 (normalized: 0.94)
- **Avg. Function Length:** 29.67 (normalized: 0.49)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/syncReport.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 27 (normalized: 0.98)
- **Complexity:** 3.00 (normalized: 0.91)
- **Avg. Function Length:** 18.00 (normalized: 0.69)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/controller/countedEvents.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 4 (normalized: 0.69)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 20 (normalized: 0.98)
- **Complexity:** 4.00 (normalized: 0.87)
- **Avg. Function Length:** 15.00 (normalized: 0.74)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.92)
### ./src/controller/foundation.ts

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 51 (normalized: 0.96)
- **Complexity:** 1.80 (normalized: 0.97)
- **Avg. Function Length:** 14.40 (normalized: 0.75)
- **Async Functions:** 2 (normalized: 0.67)
- **Try-Catch Blocks:** 2 (normalized: 0.83)
### ./src/controller/heartbeat.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 3 (normalized: 0.77)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 31 (normalized: 0.98)
- **Complexity:** 7.00 (normalized: 0.74)
- **Avg. Function Length:** 25.00 (normalized: 0.57)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.92)
### ./src/controller/notifyActionStarted.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 5 (normalized: 0.62)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 27 (normalized: 0.98)
- **Complexity:** 6.00 (normalized: 0.79)
- **Avg. Function Length:** 18.00 (normalized: 0.69)
- **Async Functions:** 1 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middleware/validateReport.ts

- **Composite Score:** 0.53 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 120 (normalized: 0.90)
- **Complexity:** 24.50 (normalized: 0.00)
- **Avg. Function Length:** 58.00 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/node.ts

- **Composite Score:** 0.44 (testability)
- **Priority Score:** 0.80 (importance for testing)
- **Import Count:** 6 (normalized: 0.54)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 21 (normalized: 0.91)
- **Lines of Code:** 1250 (normalized: 0.00)
- **Complexity:** 4.17 (normalized: 0.86)
- **Avg. Function Length:** 20.86 (normalized: 0.64)
- **Async Functions:** 2 (normalized: 0.67)
- **Try-Catch Blocks:** 12 (normalized: 0.00)
### ./src/server.ts

- **Composite Score:** 0.43 (testability)
- **Priority Score:** 0.22 (importance for testing)
- **Import Count:** 13 (normalized: 0.00)
- **Export Count:** 2 (normalized: 0.13)
- **Imported By Count:** 1 (normalized: 0.04)
- **Lines of Code:** 616 (normalized: 0.51)
- **Complexity:** 2.69 (normalized: 0.93)
- **Avg. Function Length:** 12.60 (normalized: 0.78)
- **Async Functions:** 6 (normalized: 0.00)
- **Try-Catch Blocks:** 5 (normalized: 0.58)
