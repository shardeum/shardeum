# TypeScript Files Ranked by Testing Difficulty

This report ranks 4 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 1 | 25.0% |
| Moderate         | 2 | 50.0% |
| Hard to Test     | 1 | 25.0% |
| **Total**        | **4** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./index.js | 0.21 | 0.38 | 0 | 0 | 11 | 277 | 4.83 |
| ./crypto.test.js | 0.14 | 0.58 | 0 | 0 | 0 | 176 | 1.00 |
| ./test.js | 0.11 | 0.67 | 0 | 0 | 0 | 16 | 2.00 |
| ./jest.config.js | 0.04 | 0.88 | 0 | 0 | 0 | 10 | 1.00 |

## Files Not Imported By Any Other File (4)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./test.js | 0.67 | 0 | 0 | 0 | 16 | 2.00 | 15.00 | 1 | 1 |
| ./crypto.test.js | 0.58 | 0 | 0 | 0 | 176 | 1.00 | 11.19 | 3 | 0 |
| ./index.js | 0.38 | 0 | 11 | 0 | 277 | 4.83 | 20.83 | 1 | 14 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./test.js | 0.67 | 0 | 0 | 0 | 16 | 2.00 | 15.00 | 1 | 1 |
| ./crypto.test.js | 0.58 | 0 | 0 | 0 | 176 | 1.00 | 11.19 | 3 | 0 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./index.js | 0.38 | 0 | 11 | 0 | 277 | 4.83 | 20.83 | 1 | 14 |

## Detailed Metrics

### ./jest.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 10 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./test.js

- **Composite Score:** 0.67 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 16 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.74)
- **Avg. Function Length:** 15.00 (normalized: 0.28)
- **Async Functions:** 1 (normalized: 0.67)
- **Try-Catch Blocks:** 1 (normalized: 0.93)
### ./crypto.test.js

- **Composite Score:** 0.58 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 176 (normalized: 0.38)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 11.19 (normalized: 0.46)
- **Async Functions:** 3 (normalized: 0.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.js

- **Composite Score:** 0.38 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 11 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 277 (normalized: 0.00)
- **Complexity:** 4.83 (normalized: 0.00)
- **Avg. Function Length:** 20.83 (normalized: 0.00)
- **Async Functions:** 1 (normalized: 0.67)
- **Try-Catch Blocks:** 14 (normalized: 0.00)
