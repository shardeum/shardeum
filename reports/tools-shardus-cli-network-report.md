# TypeScript Files Ranked by Testing Difficulty

This report ranks 27 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 24 | 88.9% |
| Moderate         | 3 | 11.1% |
| Hard to Test     | 0 | 0.0% |
| **Total**        | **27** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/lib/start.js | 0.19 | 0.44 | 0 | 0 | 0 | 138 | 7.67 |
| ./src/actions/create.js | 0.17 | 0.48 | 0 | 0 | 0 | 285 | 3.61 |
| ./src/lib/create.js | 0.15 | 0.54 | 0 | 0 | 0 | 44 | 8.00 |
| ./src/lib/clean.js | 0.10 | 0.71 | 0 | 0 | 0 | 30 | 3.00 |
| ./src/lib/restart.js | 0.10 | 0.71 | 0 | 0 | 0 | 154 | 2.53 |
| ./src/lib/util.js | 0.09 | 0.72 | 0 | 0 | 13 | 142 | 1.88 |
| ./src/lib/stop.js | 0.09 | 0.73 | 0 | 0 | 0 | 86 | 3.00 |
| ./src/commands.js | 0.08 | 0.77 | 0 | 0 | 1 | 101 | 2.00 |
| ./src/lib/config.js | 0.07 | 0.78 | 0 | 0 | 0 | 17 | 2.00 |
| ./cli.test.js | 0.07 | 0.78 | 0 | 0 | 0 | 64 | 1.00 |

## Files Not Imported By Any Other File (27)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./index.js | 0.88 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/actions/index.js | 0.87 | 0 | 0 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./src/lib/index.js | 0.87 | 0 | 0 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./index.js | 0.87 | 0 | 0 | 0 | 11 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 14 | 1.00 | 0.00 | 0 | 0 |
| ./src/configs/default-network-config.js | 0.86 | 0 | 0 | 0 | 29 | 1.00 | 0.00 | 0 | 0 |
| ./src/configs/default-server-config.js | 0.86 | 0 | 0 | 0 | 31 | 1.00 | 0.00 | 0 | 0 |
| ./src/actions/pm2.js | 0.86 | 0 | 0 | 0 | 7 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/clean.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/list.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/restart.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/stop.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/lib/list.js | 0.85 | 0 | 0 | 0 | 4 | 1.00 | 3.00 | 1 | 0 |
| ./src/configs/archiver-config.js | 0.85 | 0 | 0 | 0 | 52 | 1.00 | 0.00 | 0 | 0 |
| ./src/lib/pm2.js | 0.85 | 0 | 0 | 0 | 5 | 1.00 | 4.00 | 1 | 0 |
| ./src/actions/config.js | 0.81 | 0 | 0 | 0 | 28 | 2.33 | 6.67 | 0 | 0 |
| ./src/actions/start.js | 0.78 | 0 | 0 | 0 | 13 | 2.00 | 8.00 | 0 | 1 |
| ./cli.test.js | 0.78 | 0 | 0 | 0 | 64 | 1.00 | 18.00 | 0 | 0 |
| ./src/lib/config.js | 0.78 | 0 | 0 | 0 | 17 | 2.00 | 15.00 | 1 | 0 |
| ./src/commands.js | 0.77 | 0 | 1 | 0 | 101 | 2.00 | 12.13 | 0 | 0 |
| ./src/lib/stop.js | 0.73 | 0 | 0 | 0 | 86 | 3.00 | 13.57 | 1 | 0 |
| ./src/lib/util.js | 0.72 | 0 | 13 | 0 | 142 | 1.88 | 7.75 | 10 | 1 |
| ./src/lib/restart.js | 0.71 | 0 | 0 | 0 | 154 | 2.53 | 11.40 | 1 | 0 |
| ./src/lib/clean.js | 0.71 | 0 | 0 | 0 | 30 | 3.00 | 27.00 | 1 | 0 |
| ./src/lib/create.js | 0.54 | 0 | 0 | 0 | 44 | 8.00 | 36.00 | 1 | 0 |
| ./src/actions/create.js | 0.48 | 0 | 0 | 0 | 285 | 3.61 | 18.33 | 2 | 3 |
| ./src/lib/start.js | 0.44 | 0 | 0 | 0 | 138 | 7.67 | 45.00 | 1 | 1 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./index.js | 0.88 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/actions/index.js | 0.87 | 0 | 0 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./src/lib/index.js | 0.87 | 0 | 0 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./index.js | 0.87 | 0 | 0 | 0 | 11 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 14 | 1.00 | 0.00 | 0 | 0 |
| ./src/configs/default-network-config.js | 0.86 | 0 | 0 | 0 | 29 | 1.00 | 0.00 | 0 | 0 |
| ./src/configs/default-server-config.js | 0.86 | 0 | 0 | 0 | 31 | 1.00 | 0.00 | 0 | 0 |
| ./src/actions/pm2.js | 0.86 | 0 | 0 | 0 | 7 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/clean.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/list.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/restart.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/actions/stop.js | 0.86 | 0 | 0 | 0 | 8 | 1.00 | 4.00 | 0 | 0 |
| ./src/lib/list.js | 0.85 | 0 | 0 | 0 | 4 | 1.00 | 3.00 | 1 | 0 |
| ./src/configs/archiver-config.js | 0.85 | 0 | 0 | 0 | 52 | 1.00 | 0.00 | 0 | 0 |
| ./src/lib/pm2.js | 0.85 | 0 | 0 | 0 | 5 | 1.00 | 4.00 | 1 | 0 |
| ./src/actions/config.js | 0.81 | 0 | 0 | 0 | 28 | 2.33 | 6.67 | 0 | 0 |
| ./src/actions/start.js | 0.78 | 0 | 0 | 0 | 13 | 2.00 | 8.00 | 0 | 1 |
| ./cli.test.js | 0.78 | 0 | 0 | 0 | 64 | 1.00 | 18.00 | 0 | 0 |
| ./src/lib/config.js | 0.78 | 0 | 0 | 0 | 17 | 2.00 | 15.00 | 1 | 0 |
| ./src/commands.js | 0.77 | 0 | 1 | 0 | 101 | 2.00 | 12.13 | 0 | 0 |
| ./src/lib/stop.js | 0.73 | 0 | 0 | 0 | 86 | 3.00 | 13.57 | 1 | 0 |
| ./src/lib/util.js | 0.72 | 0 | 13 | 0 | 142 | 1.88 | 7.75 | 10 | 1 |
| ./src/lib/restart.js | 0.71 | 0 | 0 | 0 | 154 | 2.53 | 11.40 | 1 | 0 |
| ./src/lib/clean.js | 0.71 | 0 | 0 | 0 | 30 | 3.00 | 27.00 | 1 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/lib/create.js | 0.54 | 0 | 0 | 0 | 44 | 8.00 | 36.00 | 1 | 0 |
| ./src/actions/create.js | 0.48 | 0 | 0 | 0 | 285 | 3.61 | 18.33 | 2 | 3 |
| ./src/lib/start.js | 0.44 | 0 | 0 | 0 | 138 | 7.67 | 45.00 | 1 | 1 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Detailed Metrics

### ./index.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/index.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 10 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/index.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 10 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 11 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 14 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/configs/default-network-config.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 29 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/configs/default-server-config.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 31 (normalized: 0.90)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/pm2.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 7 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/clean.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/list.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/restart.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/stop.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/list.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.93)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/configs/archiver-config.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 52 (normalized: 0.83)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/pm2.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.91)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/config.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 28 (normalized: 0.91)
- **Complexity:** 2.33 (normalized: 0.81)
- **Avg. Function Length:** 6.67 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/start.js

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 13 (normalized: 0.97)
- **Complexity:** 2.00 (normalized: 0.86)
- **Avg. Function Length:** 8.00 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.67)
### ./cli.test.js

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 64 (normalized: 0.79)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 18.00 (normalized: 0.60)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/config.js

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 17 (normalized: 0.95)
- **Complexity:** 2.00 (normalized: 0.86)
- **Avg. Function Length:** 15.00 (normalized: 0.67)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/commands.js

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 101 (normalized: 0.65)
- **Complexity:** 2.00 (normalized: 0.86)
- **Avg. Function Length:** 12.13 (normalized: 0.73)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/stop.js

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 86 (normalized: 0.71)
- **Complexity:** 3.00 (normalized: 0.71)
- **Avg. Function Length:** 13.57 (normalized: 0.70)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/util.js

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 13 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 142 (normalized: 0.51)
- **Complexity:** 1.88 (normalized: 0.88)
- **Avg. Function Length:** 7.75 (normalized: 0.83)
- **Async Functions:** 10 (normalized: 0.00)
- **Try-Catch Blocks:** 1 (normalized: 0.67)
### ./src/lib/restart.js

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 154 (normalized: 0.47)
- **Complexity:** 2.53 (normalized: 0.78)
- **Avg. Function Length:** 11.40 (normalized: 0.75)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/clean.js

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 30 (normalized: 0.91)
- **Complexity:** 3.00 (normalized: 0.71)
- **Avg. Function Length:** 27.00 (normalized: 0.40)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/lib/create.js

- **Composite Score:** 0.54 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 44 (normalized: 0.86)
- **Complexity:** 8.00 (normalized: 0.00)
- **Avg. Function Length:** 36.00 (normalized: 0.20)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/actions/create.js

- **Composite Score:** 0.48 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 285 (normalized: 0.00)
- **Complexity:** 3.61 (normalized: 0.63)
- **Avg. Function Length:** 18.33 (normalized: 0.59)
- **Async Functions:** 2 (normalized: 0.80)
- **Try-Catch Blocks:** 3 (normalized: 0.00)
### ./src/lib/start.js

- **Composite Score:** 0.44 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 138 (normalized: 0.52)
- **Complexity:** 7.67 (normalized: 0.05)
- **Avg. Function Length:** 45.00 (normalized: 0.00)
- **Async Functions:** 1 (normalized: 0.90)
- **Try-Catch Blocks:** 1 (normalized: 0.67)
