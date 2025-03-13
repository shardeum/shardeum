# TypeScript Files Ranked by Testing Difficulty

This report ranks 8 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 7 | 87.5% |
| Moderate         | 1 | 12.5% |
| Hard to Test     | 0 | 0.0% |
| **Total**        | **8** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./PageHeader.spec.js | 0.13 | 0.62 | 0 | 2 | 0 | 25 | 1.00 |
| ./App.spec.js | 0.10 | 0.70 | 0 | 2 | 0 | 26 | 1.00 |
| ./src/main.js | 0.09 | 0.73 | 0 | 4 | 0 | 17 | 1.00 |
| ./jest.config.js | 0.03 | 0.90 | 0 | 0 | 0 | 19 | 1.00 |
| ./setup.js | 0.02 | 0.94 | 0 | 1 | 0 | 3 | 1.00 |
| ./babel.config.js | 0.01 | 0.98 | 0 | 0 | 0 | 5 | 1.00 |
| ./vue.config.js | 0.01 | 0.98 | 0 | 0 | 0 | 4 | 1.00 |
| ./entry.js | 0.00 | 1.00 | 0 | 0 | 0 | 1 | 1.00 |

## Files Not Imported By Any Other File (8)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./entry.js | 1.00 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./vue.config.js | 0.98 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./babel.config.js | 0.98 | 0 | 0 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./setup.js | 0.94 | 1 | 0 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.90 | 0 | 0 | 0 | 19 | 1.00 | 0.00 | 0 | 0 |
| ./src/main.js | 0.73 | 4 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./App.spec.js | 0.70 | 2 | 0 | 0 | 26 | 1.00 | 6.40 | 0 | 0 |
| ./PageHeader.spec.js | 0.62 | 2 | 0 | 0 | 25 | 1.00 | 14.67 | 0 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./entry.js | 1.00 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./vue.config.js | 0.98 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./babel.config.js | 0.98 | 0 | 0 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./setup.js | 0.94 | 1 | 0 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.90 | 0 | 0 | 0 | 19 | 1.00 | 0.00 | 0 | 0 |
| ./src/main.js | 0.73 | 4 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./App.spec.js | 0.70 | 2 | 0 | 0 | 26 | 1.00 | 6.40 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./PageHeader.spec.js | 0.62 | 2 | 0 | 0 | 25 | 1.00 | 14.67 | 0 | 0 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Detailed Metrics

### ./entry.js

- **Composite Score:** 1.00 (testability)
- **Priority Score:** 0.00 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./vue.config.js

- **Composite Score:** 0.98 (testability)
- **Priority Score:** 0.01 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 4 (normalized: 0.88)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./babel.config.js

- **Composite Score:** 0.98 (testability)
- **Priority Score:** 0.01 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 5 (normalized: 0.84)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./setup.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.02 (importance for testing)
- **Import Count:** 1 (normalized: 0.75)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 3 (normalized: 0.92)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.03 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 19 (normalized: 0.28)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/main.js

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 4 (normalized: 0.00)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 17 (normalized: 0.36)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./App.spec.js

- **Composite Score:** 0.70 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.50)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 26 (normalized: 0.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.40 (normalized: 0.56)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./PageHeader.spec.js

- **Composite Score:** 0.62 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 2 (normalized: 0.50)
- **Export Count:** 0 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 25 (normalized: 0.04)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 14.67 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
