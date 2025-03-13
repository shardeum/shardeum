# TypeScript Files Ranked by Testing Difficulty

This report ranks 28 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 27 | 96.4% |
| Moderate         | 1 | 3.6% |
| Hard to Test     | 0 | 0.0% |
| **Total**        | **28** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/p2p/P2PTypes.ts | 0.70 | 0.90 | 13 | 0 | 10 | 66 | 1.00 |
| ./src/p2p/CycleCreatorTypes.ts | 0.38 | 0.77 | 6 | 15 | 6 | 73 | 1.00 |
| ./src/index.ts | 0.25 | 0.71 | 3 | 25 | 6 | 65 | 1.00 |
| ./src/p2p/NodeListTypes.ts | 0.25 | 0.87 | 4 | 2 | 2 | 17 | 1.00 |
| ./src/p2p/JoinTypes.ts | 0.25 | 0.88 | 4 | 3 | 9 | 64 | 1.00 |
| ./src/utils/functions/stringify.ts | 0.23 | 0.46 | 1 | 1 | 4 | 223 | 7.78 |
| ./src/p2p/ArchiversTypes.ts | 0.19 | 0.88 | 3 | 3 | 9 | 53 | 1.00 |
| ./src/p2p/SnapshotTypes.ts | 0.18 | 0.93 | 3 | 2 | 19 | 78 | 1.00 |
| ./src/state-manager/shardFunctionType... | 0.15 | 0.85 | 2 | 1 | 22 | 300 | 1.00 |
| ./src/p2p/RefreshTypes.ts | 0.14 | 0.87 | 2 | 2 | 2 | 8 | 1.00 |

## Files Not Imported By Any Other File (2)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 13 | 1.00 | 0.00 | 0 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/p2p/SnapshotTypes.ts | 0.93 | 2 | 19 | 3 | 78 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/P2PTypes.ts | 0.90 | 0 | 10 | 13 | 66 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/ServiceQueueTypes.ts | 0.90 | 1 | 7 | 2 | 28 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/LostTypes.ts | 0.90 | 1 | 9 | 2 | 53 | 1.00 | 0.00 | 0 | 0 |
| ./src/state-manager/StateManagerTypes.ts | 0.90 | 0 | 6 | 2 | 33 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/GlobalAccountsTypes.ts | 0.90 | 1 | 6 | 1 | 23 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/CycleAutoScaleTypes.ts | 0.89 | 1 | 5 | 2 | 23 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/RotationTypes.ts | 0.89 | 0 | 2 | 2 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/TemplateTypes.ts | 0.89 | 0 | 2 | 1 | 7 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/ModesTypes.ts | 0.89 | 0 | 2 | 2 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/ActiveTypes.ts | 0.89 | 1 | 4 | 2 | 18 | 1.00 | 0.00 | 0 | 0 |
| ./src/state-manager/StateMetaDataType... | 0.89 | 1 | 4 | 1 | 20 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/SafetyModeTypes.ts | 0.89 | 0 | 2 | 2 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/ArchiversTypes.ts | 0.88 | 3 | 9 | 3 | 53 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/ApoptosisTypes.ts | 0.88 | 1 | 3 | 2 | 13 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/SyncTypes.ts | 0.88 | 0 | 1 | 1 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/JoinTypes.ts | 0.88 | 3 | 9 | 4 | 64 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/LostArchiverTypes.ts | 0.88 | 3 | 6 | 2 | 35 | 1.00 | 0.00 | 0 | 0 |
| ./jest.config.js | 0.87 | 0 | 0 | 0 | 13 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/RefreshTypes.ts | 0.87 | 2 | 2 | 2 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/NodeListTypes.ts | 0.87 | 2 | 2 | 4 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/CycleParserTypes.ts | 0.87 | 2 | 1 | 1 | 7 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/CycleChainTypes.ts | 0.87 | 2 | 1 | 1 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/state-manager/shardFunctionType... | 0.85 | 1 | 22 | 2 | 300 | 1.00 | 0.00 | 0 | 0 |
| ./src/p2p/CycleCreatorTypes.ts | 0.77 | 15 | 6 | 6 | 73 | 1.00 | 0.00 | 0 | 0 |
| ./src/index.ts | 0.71 | 25 | 6 | 3 | 65 | 1.00 | 0.00 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/utils/functions/stringify.ts | 0.46 | 1 | 4 | 1 | 223 | 7.78 | 19.56 | 0 | 0 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Detailed Metrics

### ./src/p2p/SnapshotTypes.ts

- **Composite Score:** 0.93 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 19 (normalized: 0.86)
- **Imported By Count:** 3 (normalized: 0.23)
- **Lines of Code:** 78 (normalized: 0.76)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/P2PTypes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.70 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 10 (normalized: 0.45)
- **Imported By Count:** 13 (normalized: 1.00)
- **Lines of Code:** 66 (normalized: 0.80)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/ServiceQueueTypes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 7 (normalized: 0.32)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 28 (normalized: 0.93)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/LostTypes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 9 (normalized: 0.41)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 53 (normalized: 0.84)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state-manager/StateManagerTypes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 6 (normalized: 0.27)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 33 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/GlobalAccountsTypes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 6 (normalized: 0.27)
- **Imported By Count:** 1 (normalized: 0.08)
- **Lines of Code:** 23 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/CycleAutoScaleTypes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 5 (normalized: 0.23)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 23 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/RotationTypes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/TemplateTypes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.08)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/ModesTypes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/ActiveTypes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 18 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state-manager/StateMetaDataTypes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 1 (normalized: 0.08)
- **Lines of Code:** 20 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/SafetyModeTypes.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 12 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/ArchiversTypes.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 9 (normalized: 0.41)
- **Imported By Count:** 3 (normalized: 0.23)
- **Lines of Code:** 53 (normalized: 0.84)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/ApoptosisTypes.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 3 (normalized: 0.14)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 13 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/SyncTypes.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.08)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/JoinTypes.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 9 (normalized: 0.41)
- **Imported By Count:** 4 (normalized: 0.31)
- **Lines of Code:** 64 (normalized: 0.80)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
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
### ./src/p2p/LostArchiverTypes.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 3 (normalized: 0.88)
- **Export Count:** 6 (normalized: 0.27)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 35 (normalized: 0.90)
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
- **Lines of Code:** 13 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/RefreshTypes.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/NodeListTypes.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 4 (normalized: 0.31)
- **Lines of Code:** 17 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/CycleParserTypes.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.08)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/CycleChainTypes.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.92)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.08)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/state-manager/shardFunctionTypes.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 22 (normalized: 1.00)
- **Imported By Count:** 2 (normalized: 0.15)
- **Lines of Code:** 300 (normalized: 0.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/p2p/CycleCreatorTypes.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.38 (importance for testing)
- **Import Count:** 15 (normalized: 0.40)
- **Export Count:** 6 (normalized: 0.27)
- **Imported By Count:** 6 (normalized: 0.46)
- **Lines of Code:** 73 (normalized: 0.77)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/index.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 25 (normalized: 0.00)
- **Export Count:** 6 (normalized: 0.27)
- **Imported By Count:** 3 (normalized: 0.23)
- **Lines of Code:** 65 (normalized: 0.80)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/functions/stringify.ts

- **Composite Score:** 0.46 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 1 (normalized: 0.96)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 1 (normalized: 0.08)
- **Lines of Code:** 223 (normalized: 0.26)
- **Complexity:** 7.78 (normalized: 0.00)
- **Avg. Function Length:** 19.56 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
