# TypeScript Files Ranked by Testing Difficulty

This report ranks 6 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 4 | 66.7% |
| Moderate         | 1 | 16.7% |
| Hard to Test     | 1 | 16.7% |
| **Total**        | **6** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/index.ts | 0.92 | 0.25 | 1 | 3 | 32 | 502 | 3.10 |
| ./test-sign-obj.js | 0.11 | 0.68 | 0 | 0 | 0 | 62 | 1.67 |
| ./test-tag-obj.js | 0.09 | 0.73 | 0 | 0 | 0 | 35 | 1.00 |
| ./setup.ts | 0.06 | 0.82 | 0 | 1 | 0 | 3 | 1.00 |
| ./jest.config.js | 0.04 | 0.87 | 0 | 0 | 0 | 12 | 1.00 |
| ./prettier.config.js | 0.04 | 0.88 | 0 | 0 | 0 | 6 | 1.00 |

## Files Not Imported By Any Other File (5)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./setup.ts | 0.82 | 1 | 0 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./test-tag-obj.js | 0.73 | 0 | 0 | 0 | 35 | 1.00 | 12.00 | 0 | 0 |
| ./test-sign-obj.js | 0.68 | 0 | 0 | 0 | 62 | 1.67 | 9.50 | 0 | 1 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./setup.ts | 0.82 | 1 | 0 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./test-tag-obj.js | 0.73 | 0 | 0 | 0 | 35 | 1.00 | 12.00 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./test-sign-obj.js | 0.68 | 0 | 0 | 0 | 62 | 1.67 | 9.50 | 0 | 1 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/index.ts | 0.25 | 3 | 32 | 1 | 502 | 3.10 | 13.76 | 0 | 8 |

## Detailed Metrics

### ./prettier.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 0.99)
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
- **Lines of Code:** 12 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./setup.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.67)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test-tag-obj.js

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 35 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 12.00 (normalized: 0.13)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test-sign-obj.js

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 62 (normalized: 0.88)
- **Complexity:** 1.67 (normalized: 0.68)
- **Avg. Function Length:** 9.50 (normalized: 0.31)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.88)
### ./src/index.ts

- **Composite Score:** 0.25 (testability)
- **Priority Score:** 0.92 (importance for testing)
- **Import Count:** 3 (normalized: 0.00)
- **Export Count:** 32 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 1.00)
- **Lines of Code:** 502 (normalized: 0.00)
- **Complexity:** 3.10 (normalized: 0.00)
- **Avg. Function Length:** 13.76 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 8 (normalized: 0.00)
