# TypeScript Files Ranked by Testing Difficulty

This report ranks 25 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 15 | 60.0% |
| Moderate         | 8 | 32.0% |
| Hard to Test     | 2 | 8.0% |
| **Total**        | **25** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./app.js | 0.24 | 0.29 | 0 | 0 | 0 | 2056 | 4.89 |
| ./large-network.js | 0.21 | 0.38 | 0 | 0 | 0 | 986 | 4.72 |
| ./sync-detail.js | 0.16 | 0.51 | 0 | 0 | 0 | 359 | 5.86 |
| ./node-loads.js | 0.14 | 0.58 | 0 | 0 | 0 | 119 | 5.91 |
| ./navigation.test.js | 0.12 | 0.64 | 0 | 3 | 0 | 50 | 1.00 |
| ./axios.min.js | 0.12 | 0.65 | 0 | 0 | 0 | 2 | 6.39 |
| ./history-log.js | 0.11 | 0.66 | 0 | 0 | 0 | 174 | 2.32 |
| ./vis-network-animated.js | 0.11 | 0.66 | 0 | 0 | 0 | 134 | 4.63 |
| ./history.js | 0.11 | 0.67 | 0 | 0 | 0 | 222 | 3.84 |
| ./myChart.js | 0.10 | 0.70 | 0 | 0 | 0 | 296 | 2.40 |

## Files Not Imported By Any Other File (25)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./entry.js | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./NoOp.ts | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./babel.config.js | 0.88 | 0 | 0 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 7 | 1.00 | 0.00 | 0 | 0 |
| ./log.js | 0.83 | 0 | 0 | 0 | 36 | 1.50 | 5.75 | 0 | 0 |
| ./fabric.js | 0.81 | 0 | 1 | 0 | 1 | 5.32 | 1.00 | 0 | 4 |
| ./signin.js | 0.79 | 0 | 0 | 0 | 33 | 1.67 | 7.67 | 2 | 0 |
| ./popmotion.min.js | 0.78 | 0 | 0 | 0 | 1 | 3.86 | 1.00 | 0 | 0 |
| ./monitor-events.js | 0.77 | 0 | 0 | 0 | 215 | 1.88 | 10.75 | 1 | 0 |
| ./app-versions.js | 0.75 | 0 | 0 | 0 | 158 | 2.56 | 10.88 | 1 | 0 |
| ./version.js | 0.74 | 0 | 0 | 0 | 15 | 3.00 | 14.00 | 1 | 0 |
| ./sync.js | 0.72 | 0 | 0 | 0 | 90 | 2.33 | 19.22 | 2 | 0 |
| ./chart.min.js | 0.71 | 0 | 0 | 0 | 15 | 5.54 | 1.01 | 0 | 1 |
| ./auth.js | 0.71 | 0 | 0 | 0 | 57 | 3.25 | 12.00 | 2 | 1 |
| ./myChart.js | 0.70 | 0 | 0 | 0 | 296 | 2.40 | 13.55 | 3 | 1 |
| ./history.js | 0.67 | 0 | 0 | 0 | 222 | 3.84 | 16.21 | 2 | 0 |
| ./vis-network-animated.js | 0.66 | 0 | 0 | 0 | 134 | 4.63 | 20.25 | 0 | 0 |
| ./history-log.js | 0.66 | 0 | 0 | 0 | 174 | 2.32 | 12.58 | 7 | 0 |
| ./axios.min.js | 0.65 | 0 | 0 | 0 | 2 | 6.39 | 1.00 | 0 | 4 |
| ./navigation.test.js | 0.64 | 3 | 0 | 0 | 50 | 1.00 | 13.67 | 0 | 0 |
| ./node-loads.js | 0.58 | 0 | 0 | 0 | 119 | 5.91 | 21.45 | 2 | 1 |
| ./sync-detail.js | 0.51 | 0 | 0 | 0 | 359 | 5.86 | 25.32 | 4 | 1 |
| ./large-network.js | 0.38 | 0 | 0 | 0 | 986 | 4.72 | 27.50 | 8 | 6 |
| ./app.js | 0.29 | 0 | 0 | 0 | 2056 | 4.89 | 37.21 | 4 | 9 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./entry.js | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./NoOp.ts | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./babel.config.js | 0.88 | 0 | 0 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.88 | 0 | 0 | 0 | 7 | 1.00 | 0.00 | 0 | 0 |
| ./log.js | 0.83 | 0 | 0 | 0 | 36 | 1.50 | 5.75 | 0 | 0 |
| ./fabric.js | 0.81 | 0 | 1 | 0 | 1 | 5.32 | 1.00 | 0 | 4 |
| ./signin.js | 0.79 | 0 | 0 | 0 | 33 | 1.67 | 7.67 | 2 | 0 |
| ./popmotion.min.js | 0.78 | 0 | 0 | 0 | 1 | 3.86 | 1.00 | 0 | 0 |
| ./monitor-events.js | 0.77 | 0 | 0 | 0 | 215 | 1.88 | 10.75 | 1 | 0 |
| ./app-versions.js | 0.75 | 0 | 0 | 0 | 158 | 2.56 | 10.88 | 1 | 0 |
| ./version.js | 0.74 | 0 | 0 | 0 | 15 | 3.00 | 14.00 | 1 | 0 |
| ./sync.js | 0.72 | 0 | 0 | 0 | 90 | 2.33 | 19.22 | 2 | 0 |
| ./chart.min.js | 0.71 | 0 | 0 | 0 | 15 | 5.54 | 1.01 | 0 | 1 |
| ./auth.js | 0.71 | 0 | 0 | 0 | 57 | 3.25 | 12.00 | 2 | 1 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./myChart.js | 0.70 | 0 | 0 | 0 | 296 | 2.40 | 13.55 | 3 | 1 |
| ./history.js | 0.67 | 0 | 0 | 0 | 222 | 3.84 | 16.21 | 2 | 0 |
| ./vis-network-animated.js | 0.66 | 0 | 0 | 0 | 134 | 4.63 | 20.25 | 0 | 0 |
| ./history-log.js | 0.66 | 0 | 0 | 0 | 174 | 2.32 | 12.58 | 7 | 0 |
| ./axios.min.js | 0.65 | 0 | 0 | 0 | 2 | 6.39 | 1.00 | 0 | 4 |
| ./navigation.test.js | 0.64 | 3 | 0 | 0 | 50 | 1.00 | 13.67 | 0 | 0 |
| ./node-loads.js | 0.58 | 0 | 0 | 0 | 119 | 5.91 | 21.45 | 2 | 1 |
| ./sync-detail.js | 0.51 | 0 | 0 | 0 | 359 | 5.86 | 25.32 | 4 | 1 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./large-network.js | 0.38 | 0 | 0 | 0 | 986 | 4.72 | 27.50 | 8 | 6 |
| ./app.js | 0.29 | 0 | 0 | 0 | 2056 | 4.89 | 37.21 | 4 | 9 |

## Detailed Metrics

### ./entry.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 0 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NoOp.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./babel.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./prettier.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./log.js

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 36 (normalized: 0.98)
- **Complexity:** 1.50 (normalized: 0.91)
- **Avg. Function Length:** 5.75 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./fabric.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 5.32 (normalized: 0.20)
- **Avg. Function Length:** 1.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 4 (normalized: 0.56)
### ./signin.js

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 33 (normalized: 0.98)
- **Complexity:** 1.67 (normalized: 0.88)
- **Avg. Function Length:** 7.67 (normalized: 0.79)
- **Async Functions:** 2 (normalized: 0.75)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./popmotion.min.js

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 3.86 (normalized: 0.47)
- **Avg. Function Length:** 1.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./monitor-events.js

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 215 (normalized: 0.90)
- **Complexity:** 1.88 (normalized: 0.84)
- **Avg. Function Length:** 10.75 (normalized: 0.71)
- **Async Functions:** 1 (normalized: 0.88)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./app-versions.js

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 158 (normalized: 0.92)
- **Complexity:** 2.56 (normalized: 0.71)
- **Avg. Function Length:** 10.88 (normalized: 0.71)
- **Async Functions:** 1 (normalized: 0.88)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./version.js

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 15 (normalized: 0.99)
- **Complexity:** 3.00 (normalized: 0.63)
- **Avg. Function Length:** 14.00 (normalized: 0.62)
- **Async Functions:** 1 (normalized: 0.88)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./sync.js

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 90 (normalized: 0.96)
- **Complexity:** 2.33 (normalized: 0.75)
- **Avg. Function Length:** 19.22 (normalized: 0.48)
- **Async Functions:** 2 (normalized: 0.75)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./chart.min.js

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 15 (normalized: 0.99)
- **Complexity:** 5.54 (normalized: 0.16)
- **Avg. Function Length:** 1.01 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./auth.js

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 57 (normalized: 0.97)
- **Complexity:** 3.25 (normalized: 0.58)
- **Avg. Function Length:** 12.00 (normalized: 0.68)
- **Async Functions:** 2 (normalized: 0.75)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./myChart.js

- **Composite Score:** 0.70 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 296 (normalized: 0.86)
- **Complexity:** 2.40 (normalized: 0.74)
- **Avg. Function Length:** 13.55 (normalized: 0.64)
- **Async Functions:** 3 (normalized: 0.63)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./history.js

- **Composite Score:** 0.67 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 222 (normalized: 0.89)
- **Complexity:** 3.84 (normalized: 0.47)
- **Avg. Function Length:** 16.21 (normalized: 0.56)
- **Async Functions:** 2 (normalized: 0.75)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./vis-network-animated.js

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 134 (normalized: 0.93)
- **Complexity:** 4.63 (normalized: 0.33)
- **Avg. Function Length:** 20.25 (normalized: 0.46)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./history-log.js

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 174 (normalized: 0.92)
- **Complexity:** 2.32 (normalized: 0.76)
- **Avg. Function Length:** 12.58 (normalized: 0.66)
- **Async Functions:** 7 (normalized: 0.13)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./axios.min.js

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 6.39 (normalized: 0.00)
- **Avg. Function Length:** 1.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 4 (normalized: 0.56)
### ./navigation.test.js

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 3 (normalized: 0.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 50 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 13.67 (normalized: 0.63)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node-loads.js

- **Composite Score:** 0.58 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 119 (normalized: 0.94)
- **Complexity:** 5.91 (normalized: 0.09)
- **Avg. Function Length:** 21.45 (normalized: 0.42)
- **Async Functions:** 2 (normalized: 0.75)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./sync-detail.js

- **Composite Score:** 0.51 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 359 (normalized: 0.83)
- **Complexity:** 5.86 (normalized: 0.10)
- **Avg. Function Length:** 25.32 (normalized: 0.32)
- **Async Functions:** 4 (normalized: 0.50)
- **Try-Catch Blocks:** 1 (normalized: 0.89)
### ./large-network.js

- **Composite Score:** 0.38 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 986 (normalized: 0.52)
- **Complexity:** 4.72 (normalized: 0.31)
- **Avg. Function Length:** 27.50 (normalized: 0.26)
- **Async Functions:** 8 (normalized: 0.00)
- **Try-Catch Blocks:** 6 (normalized: 0.33)
### ./app.js

- **Composite Score:** 0.29 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 2056 (normalized: 0.00)
- **Complexity:** 4.89 (normalized: 0.28)
- **Avg. Function Length:** 37.21 (normalized: 0.00)
- **Async Functions:** 4 (normalized: 0.50)
- **Try-Catch Blocks:** 9 (normalized: 0.00)
