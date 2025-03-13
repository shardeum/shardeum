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
| Easy to Test     | 4 | 50.0% |
| Moderate         | 3 | 37.5% |
| Hard to Test     | 1 | 12.5% |
| **Total**        | **8** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/utils.ts | 0.80 | 0.61 | 3 | 2 | 4 | 44 | 2.20 |
| ./src/types.ts | 0.69 | 0.93 | 3 | 1 | 3 | 15 | 1.00 |
| ./src/helpers.ts | 0.41 | 0.44 | 1 | 3 | 4 | 57 | 3.40 |
| ./src/sources.ts | 0.40 | 0.47 | 1 | 4 | 3 | 59 | 2.50 |
| ./src/index.ts | 0.27 | 0.18 | 0 | 6 | 4 | 121 | 3.75 |
| ./src/config/projectFlags.ts | 0.25 | 0.91 | 1 | 0 | 1 | 6 | 1.00 |
| ./prettier.config.js | 0.04 | 0.87 | 0 | 0 | 0 | 6 | 1.00 |
| ./jest.config.js | 0.04 | 0.88 | 0 | 0 | 0 | 4 | 1.00 |

## Files Not Imported By Any Other File (3)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.87 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/index.ts | 0.18 | 6 | 4 | 0 | 121 | 3.75 | 17.50 | 3 | 1 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/types.ts | 0.93 | 1 | 3 | 3 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./src/config/projectFlags.ts | 0.91 | 0 | 1 | 1 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.87 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/utils.ts | 0.61 | 2 | 4 | 3 | 44 | 2.20 | 8.20 | 2 | 1 |
| ./src/sources.ts | 0.47 | 4 | 3 | 1 | 59 | 2.50 | 9.67 | 2 | 1 |
| ./src/helpers.ts | 0.44 | 3 | 4 | 1 | 57 | 3.40 | 11.60 | 1 | 2 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/index.ts | 0.18 | 6 | 4 | 0 | 121 | 3.75 | 17.50 | 3 | 1 |

## Detailed Metrics

### ./src/types.ts

- **Composite Score:** 0.93 (testability)
- **Priority Score:** 0.69 (importance for testing)
- **Import Count:** 1 (normalized: 0.83)
- **Export Count:** 3 (normalized: 0.75)
- **Imported By Count:** 3 (normalized: 1.00)
- **Lines of Code:** 15 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/config/projectFlags.ts

- **Composite Score:** 0.91 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.25)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 6 (normalized: 0.98)
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
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./prettier.config.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils.ts

- **Composite Score:** 0.61 (testability)
- **Priority Score:** 0.80 (importance for testing)
- **Import Count:** 2 (normalized: 0.67)
- **Export Count:** 4 (normalized: 1.00)
- **Imported By Count:** 3 (normalized: 1.00)
- **Lines of Code:** 44 (normalized: 0.66)
- **Complexity:** 2.20 (normalized: 0.56)
- **Avg. Function Length:** 8.20 (normalized: 0.53)
- **Async Functions:** 2 (normalized: 0.33)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./src/sources.ts

- **Composite Score:** 0.47 (testability)
- **Priority Score:** 0.40 (importance for testing)
- **Import Count:** 4 (normalized: 0.33)
- **Export Count:** 3 (normalized: 0.75)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 59 (normalized: 0.53)
- **Complexity:** 2.50 (normalized: 0.45)
- **Avg. Function Length:** 9.67 (normalized: 0.45)
- **Async Functions:** 2 (normalized: 0.33)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./src/helpers.ts

- **Composite Score:** 0.44 (testability)
- **Priority Score:** 0.41 (importance for testing)
- **Import Count:** 3 (normalized: 0.50)
- **Export Count:** 4 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 57 (normalized: 0.55)
- **Complexity:** 3.40 (normalized: 0.13)
- **Avg. Function Length:** 11.60 (normalized: 0.34)
- **Async Functions:** 1 (normalized: 0.67)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./src/index.ts

- **Composite Score:** 0.18 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 6 (normalized: 0.00)
- **Export Count:** 4 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 121 (normalized: 0.00)
- **Complexity:** 3.75 (normalized: 0.00)
- **Avg. Function Length:** 17.50 (normalized: 0.00)
- **Async Functions:** 3 (normalized: 0.00)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
