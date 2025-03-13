# TypeScript Files Ranked by Testing Difficulty

This report ranks 17 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 11 | 64.7% |
| Moderate         | 5 | 29.4% |
| Hard to Test     | 1 | 5.9% |
| **Total**        | **17** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/types.ts | 0.73 | 0.82 | 2 | 0 | 16 | 122 | 5.00 |
| ./src/index.ts | 0.64 | 0.09 | 1 | 6 | 3 | 505 | 7.04 |
| ./src/util/Log.ts | 0.49 | 0.53 | 1 | 1 | 1 | 50 | 11.00 |
| ./src/util/Histogram.ts | 0.41 | 0.77 | 1 | 2 | 2 | 51 | 2.71 |
| ./src/util/TTLMap.ts | 0.39 | 0.84 | 1 | 0 | 3 | 35 | 2.50 |
| ./src/util/Encoding.ts | 0.38 | 0.86 | 1 | 0 | 2 | 6 | 2.00 |
| ./test_ecrecover.ts | 0.14 | 0.57 | 0 | 3 | 0 | 68 | 6.00 |
| ./test_multi_send.ts | 0.14 | 0.58 | 0 | 2 | 0 | 128 | 3.86 |
| ./test_lru.ts | 0.14 | 0.59 | 0 | 3 | 0 | 97 | 3.38 |
| ./test_headers.ts | 0.11 | 0.66 | 0 | 1 | 0 | 112 | 2.93 |

## Files Not Imported By Any Other File (11)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./test_server.js | 0.82 | 0 | 0 | 0 | 26 | 1.60 | 5.80 | 1 | 0 |
| ./test_client.js | 0.81 | 0 | 0 | 0 | 43 | 1.25 | 8.75 | 1 | 0 |
| ./copy-rename.js | 0.77 | 2 | 0 | 0 | 18 | 2.00 | 7.00 | 0 | 0 |
| ./setup_sender.ts | 0.77 | 1 | 0 | 0 | 42 | 1.60 | 10.00 | 1 | 0 |
| ./test_bombardment.ts | 0.73 | 1 | 0 | 0 | 112 | 1.82 | 8.45 | 2 | 0 |
| ./test_headers.ts | 0.66 | 1 | 0 | 0 | 112 | 2.93 | 11.29 | 4 | 0 |
| ./test_lru.ts | 0.59 | 3 | 0 | 0 | 97 | 3.38 | 19.00 | 3 | 0 |
| ./test_multi_send.ts | 0.58 | 2 | 0 | 0 | 128 | 3.86 | 25.00 | 3 | 0 |
| ./test_ecrecover.ts | 0.57 | 3 | 0 | 0 | 68 | 6.00 | 21.00 | 0 | 2 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./src/util/Encoding.ts | 0.86 | 0 | 2 | 1 | 6 | 2.00 | 3.00 | 0 | 0 |
| ./src/util/TTLMap.ts | 0.84 | 0 | 3 | 1 | 35 | 2.50 | 7.75 | 0 | 0 |
| ./test_server.js | 0.82 | 0 | 0 | 0 | 26 | 1.60 | 5.80 | 1 | 0 |
| ./src/types.ts | 0.82 | 0 | 16 | 2 | 122 | 5.00 | 22.00 | 0 | 0 |
| ./test_client.js | 0.81 | 0 | 0 | 0 | 43 | 1.25 | 8.75 | 1 | 0 |
| ./copy-rename.js | 0.77 | 2 | 0 | 0 | 18 | 2.00 | 7.00 | 0 | 0 |
| ./setup_sender.ts | 0.77 | 1 | 0 | 0 | 42 | 1.60 | 10.00 | 1 | 0 |
| ./src/util/Histogram.ts | 0.77 | 2 | 2 | 1 | 51 | 2.71 | 6.57 | 0 | 0 |
| ./test_bombardment.ts | 0.73 | 1 | 0 | 0 | 112 | 1.82 | 8.45 | 2 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./test_headers.ts | 0.66 | 1 | 0 | 0 | 112 | 2.93 | 11.29 | 4 | 0 |
| ./test_lru.ts | 0.59 | 3 | 0 | 0 | 97 | 3.38 | 19.00 | 3 | 0 |
| ./test_multi_send.ts | 0.58 | 2 | 0 | 0 | 128 | 3.86 | 25.00 | 3 | 0 |
| ./test_ecrecover.ts | 0.57 | 3 | 0 | 0 | 68 | 6.00 | 21.00 | 0 | 2 |
| ./src/util/Log.ts | 0.53 | 1 | 1 | 1 | 50 | 11.00 | 37.00 | 0 | 0 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/index.ts | 0.09 | 6 | 3 | 1 | 505 | 7.04 | 43.83 | 6 | 5 |

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

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 15 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/Encoding.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.38 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.13)
- **Imported By Count:** 1 (normalized: 0.50)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.90)
- **Avg. Function Length:** 3.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/TTLMap.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.39 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 3 (normalized: 0.19)
- **Imported By Count:** 1 (normalized: 0.50)
- **Lines of Code:** 35 (normalized: 0.94)
- **Complexity:** 2.50 (normalized: 0.85)
- **Avg. Function Length:** 7.75 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test_server.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 26 (normalized: 0.96)
- **Complexity:** 1.60 (normalized: 0.94)
- **Avg. Function Length:** 5.80 (normalized: 0.87)
- **Async Functions:** 1 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.73 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 16 (normalized: 1.00)
- **Imported By Count:** 2 (normalized: 1.00)
- **Lines of Code:** 122 (normalized: 0.77)
- **Complexity:** 5.00 (normalized: 0.60)
- **Avg. Function Length:** 22.00 (normalized: 0.50)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test_client.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 43 (normalized: 0.93)
- **Complexity:** 1.25 (normalized: 0.97)
- **Avg. Function Length:** 8.75 (normalized: 0.80)
- **Async Functions:** 1 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./copy-rename.js

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 2 (normalized: 0.67)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 18 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.90)
- **Avg. Function Length:** 7.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./setup_sender.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 42 (normalized: 0.93)
- **Complexity:** 1.60 (normalized: 0.94)
- **Avg. Function Length:** 10.00 (normalized: 0.77)
- **Async Functions:** 1 (normalized: 0.83)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/util/Histogram.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.41 (importance for testing)
- **Import Count:** 2 (normalized: 0.67)
- **Export Count:** 2 (normalized: 0.13)
- **Imported By Count:** 1 (normalized: 0.50)
- **Lines of Code:** 51 (normalized: 0.91)
- **Complexity:** 2.71 (normalized: 0.83)
- **Avg. Function Length:** 6.57 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test_bombardment.ts

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 112 (normalized: 0.79)
- **Complexity:** 1.82 (normalized: 0.92)
- **Avg. Function Length:** 8.45 (normalized: 0.81)
- **Async Functions:** 2 (normalized: 0.67)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test_headers.ts

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 112 (normalized: 0.79)
- **Complexity:** 2.93 (normalized: 0.81)
- **Avg. Function Length:** 11.29 (normalized: 0.74)
- **Async Functions:** 4 (normalized: 0.33)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test_lru.ts

- **Composite Score:** 0.59 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 3 (normalized: 0.50)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 97 (normalized: 0.82)
- **Complexity:** 3.38 (normalized: 0.76)
- **Avg. Function Length:** 19.00 (normalized: 0.57)
- **Async Functions:** 3 (normalized: 0.50)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test_multi_send.ts

- **Composite Score:** 0.58 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 2 (normalized: 0.67)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 128 (normalized: 0.76)
- **Complexity:** 3.86 (normalized: 0.71)
- **Avg. Function Length:** 25.00 (normalized: 0.43)
- **Async Functions:** 3 (normalized: 0.50)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test_ecrecover.ts

- **Composite Score:** 0.57 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 3 (normalized: 0.50)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 68 (normalized: 0.88)
- **Complexity:** 6.00 (normalized: 0.50)
- **Avg. Function Length:** 21.00 (normalized: 0.52)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.60)
### ./src/util/Log.ts

- **Composite Score:** 0.53 (testability)
- **Priority Score:** 0.49 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.06)
- **Imported By Count:** 1 (normalized: 0.50)
- **Lines of Code:** 50 (normalized: 0.91)
- **Complexity:** 11.00 (normalized: 0.00)
- **Avg. Function Length:** 37.00 (normalized: 0.16)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/index.ts

- **Composite Score:** 0.09 (testability)
- **Priority Score:** 0.64 (importance for testing)
- **Import Count:** 6 (normalized: 0.00)
- **Export Count:** 3 (normalized: 0.19)
- **Imported By Count:** 1 (normalized: 0.50)
- **Lines of Code:** 505 (normalized: 0.00)
- **Complexity:** 7.04 (normalized: 0.40)
- **Avg. Function Length:** 43.83 (normalized: 0.00)
- **Async Functions:** 6 (normalized: 0.00)
- **Try-Catch Blocks:** 5 (normalized: 0.00)
