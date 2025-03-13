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
| Easy to Test     | 6 | 100.0% |
| Moderate         | 0 | 0.0% |
| Hard to Test     | 0 | 0.0% |
| **Total**        | **6** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./bin.test.js | 0.10 | 0.71 | 0 | 0 | 0 | 62 | 1.00 |
| ./index.test.js | 0.09 | 0.73 | 0 | 0 | 0 | 51 | 1.00 |
| ./jest.config.js | 0.01 | 0.97 | 0 | 0 | 0 | 18 | 1.00 |
| ./index.js | 0.01 | 0.98 | 0 | 0 | 0 | 12 | 1.00 |
| ./index.js | 0.01 | 0.98 | 0 | 0 | 0 | 12 | 1.00 |
| ./prettier.config.js | 0.00 | 1.00 | 0 | 0 | 0 | 6 | 1.00 |

## Files Not Imported By Any Other File (6)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 1.00 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./index.js | 0.98 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./index.js | 0.98 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.97 | 0 | 0 | 0 | 18 | 1.00 | 0.00 | 0 | 0 |
| ./index.test.js | 0.73 | 0 | 0 | 0 | 51 | 1.00 | 8.92 | 0 | 0 |
| ./bin.test.js | 0.71 | 0 | 0 | 0 | 62 | 1.00 | 8.40 | 0 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 1.00 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./index.js | 0.98 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./index.js | 0.98 | 0 | 0 | 0 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.97 | 0 | 0 | 0 | 18 | 1.00 | 0.00 | 0 | 0 |
| ./index.test.js | 0.73 | 0 | 0 | 0 | 51 | 1.00 | 8.92 | 0 | 0 |
| ./bin.test.js | 0.71 | 0 | 0 | 0 | 62 | 1.00 | 8.40 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Detailed Metrics

### ./prettier.config.js

- **Composite Score:** 1.00 (testability)
- **Priority Score:** 0.00 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.js

- **Composite Score:** 0.98 (testability)
- **Priority Score:** 0.01 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 12 (normalized: 0.89)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.js

- **Composite Score:** 0.98 (testability)
- **Priority Score:** 0.01 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 12 (normalized: 0.89)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.97 (testability)
- **Priority Score:** 0.01 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 18 (normalized: 0.79)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.test.js

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 51 (normalized: 0.20)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 8.92 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./bin.test.js

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 62 (normalized: 0.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 8.40 (normalized: 0.06)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
