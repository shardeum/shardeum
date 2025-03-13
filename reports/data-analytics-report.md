# TypeScript Files Ranked by Testing Difficulty

This report ranks 11 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 5 | 45.5% |
| Moderate         | 3 | 27.3% |
| Hard to Test     | 3 | 27.3% |
| **Total**        | **11** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/storage/pgStorage.ts | 0.84 | 0.48 | 5 | 3 | 9 | 126 | 1.68 |
| ./src/config/index.ts | 0.44 | 0.88 | 3 | 1 | 4 | 26 | 1.00 |
| ./sheet_data_collector.ts | 0.43 | 0.12 | 1 | 5 | 2 | 149 | 3.60 |
| ./network_activity_data_collector.ts | 0.35 | 0.35 | 1 | 1 | 4 | 147 | 1.82 |
| ./node_activity_data_collector.ts | 0.35 | 0.36 | 1 | 1 | 2 | 91 | 2.67 |
| ./metadata.ts | 0.21 | 0.76 | 1 | 1 | 2 | 11 | 1.50 |
| ./analytics_data_collector.ts | 0.15 | 0.54 | 0 | 6 | 0 | 29 | 1.00 |
| ./analytics_jobs_scheduler.ts | 0.12 | 0.64 | 0 | 2 | 0 | 19 | 1.00 |
| ./setup.ts | 0.05 | 0.84 | 0 | 0 | 0 | 10 | 1.00 |
| ./jest.config.js | 0.05 | 0.86 | 0 | 0 | 0 | 29 | 1.00 |

## Files Not Imported By Any Other File (5)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./ecosystem.config.js | 0.88 | 0 | 0 | 0 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.86 | 0 | 0 | 0 | 29 | 1.00 | 0.00 | 0 | 0 |
| ./setup.ts | 0.84 | 0 | 0 | 0 | 10 | 1.00 | 3.00 | 0 | 0 |
| ./analytics_jobs_scheduler.ts | 0.64 | 2 | 0 | 0 | 19 | 1.00 | 15.00 | 1 | 0 |
| ./analytics_data_collector.ts | 0.54 | 6 | 0 | 0 | 29 | 1.00 | 10.50 | 2 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/config/index.ts | 0.88 | 1 | 4 | 3 | 26 | 1.00 | 0.00 | 0 | 0 |
| ./ecosystem.config.js | 0.88 | 0 | 0 | 0 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.86 | 0 | 0 | 0 | 29 | 1.00 | 0.00 | 0 | 0 |
| ./setup.ts | 0.84 | 0 | 0 | 0 | 10 | 1.00 | 3.00 | 0 | 0 |
| ./metadata.ts | 0.76 | 1 | 2 | 1 | 11 | 1.50 | 5.00 | 2 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./analytics_jobs_scheduler.ts | 0.64 | 2 | 0 | 0 | 19 | 1.00 | 15.00 | 1 | 0 |
| ./analytics_data_collector.ts | 0.54 | 6 | 0 | 0 | 29 | 1.00 | 10.50 | 2 | 0 |
| ./src/storage/pgStorage.ts | 0.48 | 3 | 9 | 5 | 126 | 1.68 | 8.09 | 6 | 3 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./node_activity_data_collector.ts | 0.36 | 1 | 2 | 1 | 91 | 2.67 | 14.33 | 5 | 3 |
| ./network_activity_data_collector.ts | 0.35 | 1 | 4 | 1 | 147 | 1.82 | 12.82 | 9 | 3 |
| ./sheet_data_collector.ts | 0.12 | 5 | 2 | 1 | 149 | 3.60 | 14.80 | 7 | 2 |

## Detailed Metrics

### ./src/config/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.44 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 4 (normalized: 0.44)
- **Imported By Count:** 3 (normalized: 0.60)
- **Lines of Code:** 26 (normalized: 0.87)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ecosystem.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 8 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 29 (normalized: 0.85)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./setup.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 10 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.80)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./metadata.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 2 (normalized: 0.22)
- **Imported By Count:** 1 (normalized: 0.20)
- **Lines of Code:** 11 (normalized: 0.98)
- **Complexity:** 1.50 (normalized: 0.81)
- **Avg. Function Length:** 5.00 (normalized: 0.67)
- **Async Functions:** 2 (normalized: 0.78)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./analytics_jobs_scheduler.ts

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 2 (normalized: 0.67)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 19 (normalized: 0.92)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 15.00 (normalized: 0.00)
- **Async Functions:** 1 (normalized: 0.89)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./analytics_data_collector.ts

- **Composite Score:** 0.54 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 6 (normalized: 0.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 29 (normalized: 0.85)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 10.50 (normalized: 0.30)
- **Async Functions:** 2 (normalized: 0.78)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/pgStorage.ts

- **Composite Score:** 0.48 (testability)
- **Priority Score:** 0.84 (importance for testing)
- **Import Count:** 3 (normalized: 0.50)
- **Export Count:** 9 (normalized: 1.00)
- **Imported By Count:** 5 (normalized: 1.00)
- **Lines of Code:** 126 (normalized: 0.16)
- **Complexity:** 1.68 (normalized: 0.74)
- **Avg. Function Length:** 8.09 (normalized: 0.46)
- **Async Functions:** 6 (normalized: 0.33)
- **Try-Catch Blocks:** 3 (normalized: 0.00)
### ./node_activity_data_collector.ts

- **Composite Score:** 0.36 (testability)
- **Priority Score:** 0.35 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 2 (normalized: 0.22)
- **Imported By Count:** 1 (normalized: 0.20)
- **Lines of Code:** 91 (normalized: 0.41)
- **Complexity:** 2.67 (normalized: 0.36)
- **Avg. Function Length:** 14.33 (normalized: 0.04)
- **Async Functions:** 5 (normalized: 0.44)
- **Try-Catch Blocks:** 3 (normalized: 0.00)
### ./network_activity_data_collector.ts

- **Composite Score:** 0.35 (testability)
- **Priority Score:** 0.35 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 4 (normalized: 0.44)
- **Imported By Count:** 1 (normalized: 0.20)
- **Lines of Code:** 147 (normalized: 0.01)
- **Complexity:** 1.82 (normalized: 0.69)
- **Avg. Function Length:** 12.82 (normalized: 0.15)
- **Async Functions:** 9 (normalized: 0.00)
- **Try-Catch Blocks:** 3 (normalized: 0.00)
### ./sheet_data_collector.ts

- **Composite Score:** 0.12 (testability)
- **Priority Score:** 0.43 (importance for testing)
- **Import Count:** 5 (normalized: 0.17)
- **Export Count:** 2 (normalized: 0.22)
- **Imported By Count:** 1 (normalized: 0.20)
- **Lines of Code:** 149 (normalized: 0.00)
- **Complexity:** 3.60 (normalized: 0.00)
- **Avg. Function Length:** 14.80 (normalized: 0.01)
- **Async Functions:** 7 (normalized: 0.22)
- **Try-Catch Blocks:** 2 (normalized: 0.33)
