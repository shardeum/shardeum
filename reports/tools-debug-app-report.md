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
| Moderate         | 2 | 7.4% |
| Hard to Test     | 1 | 3.7% |
| **Total**        | **27** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./eth-tx-1.3.3.js | 0.23 | 0.30 | 0 | 0 | 0 | 18873 | 10.32 |
| ./index.js | 0.14 | 0.59 | 0 | 0 | 2 | 1018 | 3.59 |
| ./index.js | 0.11 | 0.66 | 0 | 0 | 0 | 991 | 2.63 |
| ./cli.js | 0.09 | 0.72 | 0 | 0 | 2 | 550 | 4.21 |
| ./cli.test.js | 0.09 | 0.73 | 0 | 0 | 0 | 630 | 2.94 |
| ./decodeRawTx.js | 0.09 | 0.74 | 0 | 0 | 0 | 23 | 5.00 |
| ./getNodeReport.js | 0.09 | 0.74 | 0 | 0 | 1 | 274 | 3.54 |
| ./scan.js | 0.08 | 0.75 | 0 | 0 | 11 | 642 | 4.70 |
| ./rpc.js | 0.08 | 0.76 | 0 | 0 | 1 | 72 | 3.75 |
| ./lib.js | 0.08 | 0.77 | 0 | 0 | 27 | 865 | 4.20 |

## Files Not Imported By Any Other File (27)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./app.js | 0.88 | 0 | 1 | 0 | 28 | 1.00 | 0.00 | 0 | 0 |
| ./archiver-latestcycle-consensus.ts | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./key.config.json.js | 0.88 | 0 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./samples.js | 0.88 | 0 | 0 | 0 | 30 | 1.00 | 0.00 | 0 | 0 |
| ./users.js | 0.87 | 0 | 1 | 0 | 7 | 1.00 | 3.00 | 0 | 0 |
| ./setup.js | 0.84 | 0 | 0 | 0 | 40 | 2.00 | 6.00 | 0 | 0 |
| ./getNodesPerIP.js | 0.84 | 0 | 0 | 0 | 138 | 1.64 | 7.18 | 2 | 0 |
| ./cpuPlot.js | 0.82 | 0 | 0 | 0 | 116 | 2.33 | 10.58 | 1 | 0 |
| ./nodeinfo-from-list.js | 0.82 | 0 | 0 | 0 | 73 | 2.00 | 13.13 | 1 | 1 |
| ./scan.js | 0.80 | 0 | 0 | 0 | 230 | 1.96 | 8.54 | 5 | 2 |
| ./getReadableAccountInfo.js | 0.80 | 0 | 0 | 0 | 17 | 3.00 | 16.00 | 0 | 0 |
| ./genCertList.js | 0.80 | 0 | 0 | 0 | 48 | 3.25 | 13.50 | 0 | 1 |
| ./ipPlot.js | 0.79 | 0 | 0 | 0 | 91 | 2.20 | 16.40 | 3 | 1 |
| ./archiver-nodelist-consensus.ts | 0.79 | 0 | 0 | 0 | 154 | 2.70 | 15.50 | 2 | 2 |
| ./cycles-report.js | 0.78 | 0 | 0 | 0 | 212 | 2.09 | 19.18 | 4 | 1 |
| ./rpc.js | 0.78 | 0 | 0 | 0 | 107 | 1.38 | 5.00 | 15 | 2 |
| ./lib.js | 0.77 | 0 | 27 | 0 | 865 | 4.20 | 15.89 | 16 | 11 |
| ./rpc.js | 0.76 | 0 | 1 | 0 | 72 | 3.75 | 16.00 | 4 | 2 |
| ./scan.js | 0.75 | 0 | 11 | 0 | 642 | 4.70 | 24.24 | 3 | 6 |
| ./getNodeReport.js | 0.74 | 0 | 1 | 0 | 274 | 3.54 | 20.77 | 5 | 3 |
| ./decodeRawTx.js | 0.74 | 0 | 0 | 0 | 23 | 5.00 | 21.00 | 0 | 2 |
| ./cli.test.js | 0.73 | 0 | 0 | 0 | 630 | 2.94 | 22.20 | 1 | 12 |
| ./cli.js | 0.72 | 0 | 2 | 0 | 550 | 4.21 | 12.00 | 13 | 2 |
| ./index.js | 0.66 | 0 | 0 | 0 | 991 | 2.63 | 10.16 | 24 | 10 |
| ./index.js | 0.59 | 0 | 2 | 0 | 1018 | 3.59 | 18.74 | 26 | 18 |
| ./eth-tx-1.3.3.js | 0.30 | 0 | 0 | 0 | 18873 | 10.32 | 62.70 | 0 | 26 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./app.js | 0.88 | 0 | 1 | 0 | 28 | 1.00 | 0.00 | 0 | 0 |
| ./archiver-latestcycle-consensus.ts | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./key.config.json.js | 0.88 | 0 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./samples.js | 0.88 | 0 | 0 | 0 | 30 | 1.00 | 0.00 | 0 | 0 |
| ./users.js | 0.87 | 0 | 1 | 0 | 7 | 1.00 | 3.00 | 0 | 0 |
| ./setup.js | 0.84 | 0 | 0 | 0 | 40 | 2.00 | 6.00 | 0 | 0 |
| ./getNodesPerIP.js | 0.84 | 0 | 0 | 0 | 138 | 1.64 | 7.18 | 2 | 0 |
| ./cpuPlot.js | 0.82 | 0 | 0 | 0 | 116 | 2.33 | 10.58 | 1 | 0 |
| ./nodeinfo-from-list.js | 0.82 | 0 | 0 | 0 | 73 | 2.00 | 13.13 | 1 | 1 |
| ./scan.js | 0.80 | 0 | 0 | 0 | 230 | 1.96 | 8.54 | 5 | 2 |
| ./getReadableAccountInfo.js | 0.80 | 0 | 0 | 0 | 17 | 3.00 | 16.00 | 0 | 0 |
| ./genCertList.js | 0.80 | 0 | 0 | 0 | 48 | 3.25 | 13.50 | 0 | 1 |
| ./ipPlot.js | 0.79 | 0 | 0 | 0 | 91 | 2.20 | 16.40 | 3 | 1 |
| ./archiver-nodelist-consensus.ts | 0.79 | 0 | 0 | 0 | 154 | 2.70 | 15.50 | 2 | 2 |
| ./cycles-report.js | 0.78 | 0 | 0 | 0 | 212 | 2.09 | 19.18 | 4 | 1 |
| ./rpc.js | 0.78 | 0 | 0 | 0 | 107 | 1.38 | 5.00 | 15 | 2 |
| ./lib.js | 0.77 | 0 | 27 | 0 | 865 | 4.20 | 15.89 | 16 | 11 |
| ./rpc.js | 0.76 | 0 | 1 | 0 | 72 | 3.75 | 16.00 | 4 | 2 |
| ./scan.js | 0.75 | 0 | 11 | 0 | 642 | 4.70 | 24.24 | 3 | 6 |
| ./getNodeReport.js | 0.74 | 0 | 1 | 0 | 274 | 3.54 | 20.77 | 5 | 3 |
| ./decodeRawTx.js | 0.74 | 0 | 0 | 0 | 23 | 5.00 | 21.00 | 0 | 2 |
| ./cli.test.js | 0.73 | 0 | 0 | 0 | 630 | 2.94 | 22.20 | 1 | 12 |
| ./cli.js | 0.72 | 0 | 2 | 0 | 550 | 4.21 | 12.00 | 13 | 2 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./index.js | 0.66 | 0 | 0 | 0 | 991 | 2.63 | 10.16 | 24 | 10 |
| ./index.js | 0.59 | 0 | 2 | 0 | 1018 | 3.59 | 18.74 | 26 | 18 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./eth-tx-1.3.3.js | 0.30 | 0 | 0 | 0 | 18873 | 10.32 | 62.70 | 0 | 26 |

## Detailed Metrics

### ./app.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.04)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 28 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./archiver-latestcycle-consensus.ts

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
### ./key.config.json.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 17 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./samples.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 30 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./users.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.04)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./setup.js

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 40 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 6.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./getNodesPerIP.js

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 138 (normalized: 0.99)
- **Complexity:** 1.64 (normalized: 0.93)
- **Avg. Function Length:** 7.18 (normalized: 0.89)
- **Async Functions:** 2 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./cpuPlot.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 116 (normalized: 0.99)
- **Complexity:** 2.33 (normalized: 0.86)
- **Avg. Function Length:** 10.58 (normalized: 0.83)
- **Async Functions:** 1 (normalized: 0.96)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./nodeinfo-from-list.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 73 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 13.13 (normalized: 0.79)
- **Async Functions:** 1 (normalized: 0.96)
- **Try-Catch Blocks:** 1 (normalized: 0.96)
### ./scan.js

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 230 (normalized: 0.99)
- **Complexity:** 1.96 (normalized: 0.90)
- **Avg. Function Length:** 8.54 (normalized: 0.86)
- **Async Functions:** 5 (normalized: 0.81)
- **Try-Catch Blocks:** 2 (normalized: 0.92)
### ./getReadableAccountInfo.js

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 17 (normalized: 1.00)
- **Complexity:** 3.00 (normalized: 0.79)
- **Avg. Function Length:** 16.00 (normalized: 0.74)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./genCertList.js

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 48 (normalized: 1.00)
- **Complexity:** 3.25 (normalized: 0.76)
- **Avg. Function Length:** 13.50 (normalized: 0.78)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.96)
### ./ipPlot.js

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 91 (normalized: 1.00)
- **Complexity:** 2.20 (normalized: 0.87)
- **Avg. Function Length:** 16.40 (normalized: 0.74)
- **Async Functions:** 3 (normalized: 0.88)
- **Try-Catch Blocks:** 1 (normalized: 0.96)
### ./archiver-nodelist-consensus.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 154 (normalized: 0.99)
- **Complexity:** 2.70 (normalized: 0.82)
- **Avg. Function Length:** 15.50 (normalized: 0.75)
- **Async Functions:** 2 (normalized: 0.92)
- **Try-Catch Blocks:** 2 (normalized: 0.92)
### ./cycles-report.js

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 212 (normalized: 0.99)
- **Complexity:** 2.09 (normalized: 0.88)
- **Avg. Function Length:** 19.18 (normalized: 0.69)
- **Async Functions:** 4 (normalized: 0.85)
- **Try-Catch Blocks:** 1 (normalized: 0.96)
### ./rpc.js

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 107 (normalized: 0.99)
- **Complexity:** 1.38 (normalized: 0.96)
- **Avg. Function Length:** 5.00 (normalized: 0.92)
- **Async Functions:** 15 (normalized: 0.42)
- **Try-Catch Blocks:** 2 (normalized: 0.92)
### ./lib.js

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 27 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 865 (normalized: 0.95)
- **Complexity:** 4.20 (normalized: 0.66)
- **Avg. Function Length:** 15.89 (normalized: 0.75)
- **Async Functions:** 16 (normalized: 0.38)
- **Try-Catch Blocks:** 11 (normalized: 0.58)
### ./rpc.js

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.04)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 72 (normalized: 1.00)
- **Complexity:** 3.75 (normalized: 0.70)
- **Avg. Function Length:** 16.00 (normalized: 0.74)
- **Async Functions:** 4 (normalized: 0.85)
- **Try-Catch Blocks:** 2 (normalized: 0.92)
### ./scan.js

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 11 (normalized: 0.41)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 642 (normalized: 0.97)
- **Complexity:** 4.70 (normalized: 0.60)
- **Avg. Function Length:** 24.24 (normalized: 0.61)
- **Async Functions:** 3 (normalized: 0.88)
- **Try-Catch Blocks:** 6 (normalized: 0.77)
### ./getNodeReport.js

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.04)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 274 (normalized: 0.99)
- **Complexity:** 3.54 (normalized: 0.73)
- **Avg. Function Length:** 20.77 (normalized: 0.67)
- **Async Functions:** 5 (normalized: 0.81)
- **Try-Catch Blocks:** 3 (normalized: 0.88)
### ./decodeRawTx.js

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 23 (normalized: 1.00)
- **Complexity:** 5.00 (normalized: 0.57)
- **Avg. Function Length:** 21.00 (normalized: 0.67)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.92)
### ./cli.test.js

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 630 (normalized: 0.97)
- **Complexity:** 2.94 (normalized: 0.79)
- **Avg. Function Length:** 22.20 (normalized: 0.65)
- **Async Functions:** 1 (normalized: 0.96)
- **Try-Catch Blocks:** 12 (normalized: 0.54)
### ./cli.js

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 550 (normalized: 0.97)
- **Complexity:** 4.21 (normalized: 0.66)
- **Avg. Function Length:** 12.00 (normalized: 0.81)
- **Async Functions:** 13 (normalized: 0.50)
- **Try-Catch Blocks:** 2 (normalized: 0.92)
### ./index.js

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 991 (normalized: 0.95)
- **Complexity:** 2.63 (normalized: 0.82)
- **Avg. Function Length:** 10.16 (normalized: 0.84)
- **Async Functions:** 24 (normalized: 0.08)
- **Try-Catch Blocks:** 10 (normalized: 0.62)
### ./index.js

- **Composite Score:** 0.59 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 1018 (normalized: 0.95)
- **Complexity:** 3.59 (normalized: 0.72)
- **Avg. Function Length:** 18.74 (normalized: 0.70)
- **Async Functions:** 26 (normalized: 0.00)
- **Try-Catch Blocks:** 18 (normalized: 0.31)
### ./eth-tx-1.3.3.js

- **Composite Score:** 0.30 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 1.00)
- **Lines of Code:** 18873 (normalized: 0.00)
- **Complexity:** 10.32 (normalized: 0.00)
- **Avg. Function Length:** 62.70 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 26 (normalized: 0.00)
