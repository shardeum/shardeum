# TypeScript Files Ranked by Testing Difficulty

This report ranks 47 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 40 | 85.1% |
| Moderate         | 6 | 12.8% |
| Hard to Test     | 1 | 2.1% |
| **Total**        | **47** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/components/proposals/ProposalPr... | 0.85 | 0.45 | 11 | 10 | 4 | 298 | 2.07 |
| ./src/utils/proposalHelper.js | 0.69 | 0.56 | 9 | 7 | 22 | 236 | 1.45 |
| ./src/config.js | 0.52 | 0.88 | 8 | 0 | 1 | 9 | 1.00 |
| ./src/utils/safeStringify.js | 0.43 | 0.61 | 5 | 1 | 4 | 177 | 6.25 |
| ./src/components/ProposalItem.js | 0.37 | 0.08 | 1 | 12 | 2 | 369 | 7.36 |
| ./src/utils/helperMethods.js | 0.32 | 0.59 | 3 | 6 | 14 | 117 | 2.22 |
| ./src/components/CreateProposalModal.js | 0.24 | 0.46 | 1 | 11 | 2 | 210 | 3.56 |
| ./src/utils/configSelection.js | 0.22 | 0.72 | 2 | 2 | 7 | 281 | 1.53 |
| ./src/App.js | 0.21 | 0.55 | 1 | 15 | 2 | 82 | 3.40 |
| ./src/utils/secureAccount.js | 0.19 | 0.80 | 2 | 2 | 2 | 15 | 1.33 |

## Files Not Imported By Any Other File (21)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/__mocks__/proposalHelper.js | 0.90 | 0 | 12 | 0 | 65 | 1.50 | 2.50 | 0 | 0 |
| ./src/__mocks__/config.js | 0.88 | 0 | 1 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/styleMock.js | 0.88 | 0 | 0 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/wagmi-config.js | 0.88 | 0 | 1 | 0 | 19 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/chains.js | 0.88 | 0 | 1 | 0 | 21 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/ProposalProvider.js | 0.88 | 0 | 2 | 0 | 26 | 1.00 | 1.00 | 0 | 0 |
| ./src/__mocks__/react-query.js | 0.87 | 0 | 0 | 0 | 5 | 1.00 | 1.00 | 0 | 0 |
| ./src/__mocks__/rainbowkit.js | 0.87 | 0 | 0 | 0 | 6 | 1.00 | 1.00 | 0 | 0 |
| ./src/__mocks__/wagmi-core.js | 0.87 | 0 | 0 | 0 | 7 | 1.00 | 1.00 | 0 | 0 |
| ./src/__mocks__/axios.js | 0.87 | 0 | 1 | 0 | 26 | 1.00 | 1.40 | 0 | 0 |
| ./jest.config.js | 0.86 | 0 | 0 | 0 | 50 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/ethers.js | 0.86 | 0 | 1 | 0 | 41 | 1.00 | 2.54 | 0 | 0 |
| ./src/__mocks__/wagmi.js | 0.86 | 0 | 0 | 0 | 17 | 1.00 | 3.50 | 0 | 0 |
| ./src/utils/proposalStore.js | 0.85 | 1 | 0 | 0 | 8 | 1.00 | 2.50 | 0 | 0 |
| ./src/__mocks__/helperMethods.js | 0.85 | 0 | 8 | 0 | 41 | 2.33 | 5.33 | 0 | 0 |
| ./src/setupTests.js | 0.83 | 1 | 0 | 0 | 25 | 1.00 | 7.50 | 0 | 0 |
| ./src/index.js | 0.81 | 5 | 0 | 0 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/ErrorMessage.test.js | 0.81 | 3 | 0 | 0 | 14 | 1.00 | 6.67 | 0 | 0 |
| ./src/components/SuccessMessage.test.js | 0.81 | 3 | 0 | 0 | 14 | 1.00 | 6.67 | 0 | 0 |
| ./config-overrides.js | 0.76 | 0 | 0 | 0 | 22 | 2.00 | 21.00 | 0 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/__mocks__/proposalHelper.js | 0.90 | 0 | 12 | 0 | 65 | 1.50 | 2.50 | 0 | 0 |
| ./src/config.js | 0.88 | 0 | 1 | 8 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/config.js | 0.88 | 0 | 1 | 0 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/styleMock.js | 0.88 | 0 | 0 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/wagmi-config.js | 0.88 | 0 | 1 | 0 | 19 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/chains.js | 0.88 | 0 | 1 | 0 | 21 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/ProposalProvider.js | 0.88 | 0 | 2 | 0 | 26 | 1.00 | 1.00 | 0 | 0 |
| ./src/__mocks__/react-query.js | 0.87 | 0 | 0 | 0 | 5 | 1.00 | 1.00 | 0 | 0 |
| ./src/__mocks__/rainbowkit.js | 0.87 | 0 | 0 | 0 | 6 | 1.00 | 1.00 | 0 | 0 |
| ./src/__mocks__/wagmi-core.js | 0.87 | 0 | 0 | 0 | 7 | 1.00 | 1.00 | 0 | 0 |
| ./src/chains.js | 0.87 | 1 | 2 | 2 | 21 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/axios.js | 0.87 | 0 | 1 | 0 | 26 | 1.00 | 1.40 | 0 | 0 |
| ./jest.config.js | 0.86 | 0 | 0 | 0 | 50 | 1.00 | 0.00 | 0 | 0 |
| ./src/__mocks__/ethers.js | 0.86 | 0 | 1 | 0 | 41 | 1.00 | 2.54 | 0 | 0 |
| ./src/__mocks__/wagmi.js | 0.86 | 0 | 0 | 0 | 17 | 1.00 | 3.50 | 0 | 0 |
| ./src/wagmi.js | 0.86 | 2 | 1 | 2 | 8 | 1.00 | 0.00 | 0 | 0 |
| ./src/utils/proposalStore.js | 0.85 | 1 | 0 | 0 | 8 | 1.00 | 2.50 | 0 | 0 |
| ./src/__mocks__/helperMethods.js | 0.85 | 0 | 8 | 0 | 41 | 2.33 | 5.33 | 0 | 0 |
| ./src/utils/networkParamSelection.js | 0.84 | 1 | 7 | 2 | 61 | 1.88 | 5.75 | 0 | 0 |
| ./src/components/proposals/SecurityCl... | 0.83 | 2 | 2 | 1 | 18 | 1.00 | 8.00 | 0 | 0 |
| ./src/setupTests.js | 0.83 | 1 | 0 | 0 | 25 | 1.00 | 7.50 | 0 | 0 |
| ./src/reportWebVitals.js | 0.82 | 0 | 2 | 1 | 12 | 2.00 | 9.00 | 0 | 0 |
| ./src/components/proposals/index.js | 0.82 | 8 | 8 | 2 | 18 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/ErrorMessage.js | 0.81 | 0 | 1 | 1 | 10 | 2.00 | 10.00 | 0 | 0 |
| ./src/components/SuccessMessage.js | 0.81 | 0 | 1 | 1 | 10 | 2.00 | 10.00 | 0 | 0 |
| ./src/index.js | 0.81 | 5 | 0 | 0 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/ErrorMessage.test.js | 0.81 | 3 | 0 | 0 | 14 | 1.00 | 6.67 | 0 | 0 |
| ./src/components/SuccessMessage.test.js | 0.81 | 3 | 0 | 0 | 14 | 1.00 | 6.67 | 0 | 0 |
| ./src/components/proposals/ExecutionT... | 0.81 | 3 | 2 | 1 | 22 | 1.00 | 9.50 | 0 | 0 |
| ./src/utils/secureAccount.js | 0.80 | 2 | 2 | 2 | 15 | 1.33 | 4.33 | 2 | 0 |
| ./src/utils/shardeumFlag.js | 0.80 | 2 | 3 | 1 | 17 | 1.20 | 3.20 | 3 | 0 |
| ./src/components/proposals/ShardeumFl... | 0.78 | 3 | 2 | 1 | 54 | 1.75 | 8.25 | 0 | 0 |
| ./config-overrides.js | 0.76 | 0 | 0 | 0 | 22 | 2.00 | 21.00 | 0 | 0 |
| ./src/components/proposals/ExecuteFun... | 0.75 | 4 | 2 | 1 | 88 | 1.85 | 10.38 | 0 | 0 |
| ./src/components/proposals/NetworkPar... | 0.74 | 4 | 2 | 1 | 65 | 1.60 | 15.80 | 0 | 0 |
| ./src/components/ProposalsList.js | 0.74 | 7 | 2 | 1 | 90 | 1.08 | 8.00 | 0 | 0 |
| ./src/components/proposals/ChangeConf... | 0.74 | 4 | 2 | 1 | 70 | 1.83 | 14.50 | 0 | 0 |
| ./src/components/proposals/SecureAcco... | 0.73 | 3 | 2 | 1 | 69 | 2.33 | 16.33 | 0 | 0 |
| ./src/utils/configSelection.js | 0.72 | 2 | 7 | 2 | 281 | 1.53 | 4.95 | 0 | 1 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/utils/safeStringify.js | 0.61 | 1 | 4 | 5 | 177 | 6.25 | 17.50 | 0 | 0 |
| ./src/utils/helperMethods.js | 0.59 | 6 | 14 | 3 | 117 | 2.22 | 11.78 | 7 | 2 |
| ./src/utils/proposalHelper.js | 0.56 | 7 | 22 | 9 | 236 | 1.45 | 16.64 | 8 | 2 |
| ./src/App.js | 0.55 | 15 | 2 | 1 | 82 | 3.40 | 17.40 | 0 | 0 |
| ./src/components/CreateProposalModal.js | 0.46 | 11 | 2 | 1 | 210 | 3.56 | 18.00 | 3 | 1 |
| ./src/components/proposals/ProposalPr... | 0.45 | 10 | 4 | 11 | 298 | 2.07 | 6.54 | 4 | 3 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/components/ProposalItem.js | 0.08 | 12 | 2 | 1 | 369 | 7.36 | 41.79 | 6 | 3 |

## Detailed Metrics

### ./src/__mocks__/proposalHelper.js

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.03 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 12 (normalized: 0.55)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 65 (normalized: 0.83)
- **Complexity:** 1.50 (normalized: 0.92)
- **Avg. Function Length:** 2.50 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.52 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 8 (normalized: 0.73)
- **Lines of Code:** 9 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 10 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/styleMock.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/wagmi-config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 19 (normalized: 0.95)
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
- **Lines of Code:** 6 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/chains.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 21 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/ProposalProvider.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 26 (normalized: 0.93)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 1.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/react-query.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 5 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 1.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/rainbowkit.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 1.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/wagmi-core.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 7 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 1.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/chains.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 2 (normalized: 0.18)
- **Lines of Code:** 21 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/axios.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 26 (normalized: 0.93)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 1.40 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./jest.config.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 50 (normalized: 0.87)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/ethers.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 41 (normalized: 0.89)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 2.54 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/wagmi.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 17 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.50 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/wagmi.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 2 (normalized: 0.87)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 2 (normalized: 0.18)
- **Lines of Code:** 8 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/proposalStore.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 8 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 2.50 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/__mocks__/helperMethods.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 8 (normalized: 0.36)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 41 (normalized: 0.89)
- **Complexity:** 2.33 (normalized: 0.79)
- **Avg. Function Length:** 5.33 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/networkParamSelection.js

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 7 (normalized: 0.32)
- **Imported By Count:** 2 (normalized: 0.18)
- **Lines of Code:** 61 (normalized: 0.84)
- **Complexity:** 1.88 (normalized: 0.86)
- **Avg. Function Length:** 5.75 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/SecurityClearanceComponent.js

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 2 (normalized: 0.87)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 18 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 8.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/setupTests.js

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 25 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.50 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/reportWebVitals.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 12 (normalized: 0.97)
- **Complexity:** 2.00 (normalized: 0.84)
- **Avg. Function Length:** 9.00 (normalized: 0.78)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/index.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 8 (normalized: 0.47)
- **Export Count:** 8 (normalized: 0.36)
- **Imported By Count:** 2 (normalized: 0.18)
- **Lines of Code:** 18 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/ErrorMessage.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 10 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.84)
- **Avg. Function Length:** 10.00 (normalized: 0.76)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/SuccessMessage.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.05)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 10 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.84)
- **Avg. Function Length:** 10.00 (normalized: 0.76)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/index.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.67)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 15 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/ErrorMessage.test.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.67 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/SuccessMessage.test.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 14 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.67 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/ExecutionTimeComponent.js

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 22 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.50 (normalized: 0.77)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/secureAccount.js

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 2 (normalized: 0.87)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 2 (normalized: 0.18)
- **Lines of Code:** 15 (normalized: 0.96)
- **Complexity:** 1.33 (normalized: 0.95)
- **Avg. Function Length:** 4.33 (normalized: 0.90)
- **Async Functions:** 2 (normalized: 0.75)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/shardeumFlag.js

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 2 (normalized: 0.87)
- **Export Count:** 3 (normalized: 0.14)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 17 (normalized: 0.96)
- **Complexity:** 1.20 (normalized: 0.97)
- **Avg. Function Length:** 3.20 (normalized: 0.92)
- **Async Functions:** 3 (normalized: 0.63)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/ShardeumFlagProposalComponent.js

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 54 (normalized: 0.86)
- **Complexity:** 1.75 (normalized: 0.88)
- **Avg. Function Length:** 8.25 (normalized: 0.80)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./config-overrides.js

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 22 (normalized: 0.95)
- **Complexity:** 2.00 (normalized: 0.84)
- **Avg. Function Length:** 21.00 (normalized: 0.50)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/ExecuteFunctionProposalComponent.js

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 4 (normalized: 0.73)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 88 (normalized: 0.77)
- **Complexity:** 1.85 (normalized: 0.87)
- **Avg. Function Length:** 10.38 (normalized: 0.75)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/NetworkParamProposalComponent.js

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 4 (normalized: 0.73)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 65 (normalized: 0.83)
- **Complexity:** 1.60 (normalized: 0.91)
- **Avg. Function Length:** 15.80 (normalized: 0.62)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/ProposalsList.js

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 7 (normalized: 0.53)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 90 (normalized: 0.76)
- **Complexity:** 1.08 (normalized: 0.99)
- **Avg. Function Length:** 8.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/ChangeConfigProposalComponent.js

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 4 (normalized: 0.73)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 70 (normalized: 0.81)
- **Complexity:** 1.83 (normalized: 0.87)
- **Avg. Function Length:** 14.50 (normalized: 0.65)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/proposals/SecureAccountTransferComponent.js

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 3 (normalized: 0.80)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 69 (normalized: 0.82)
- **Complexity:** 2.33 (normalized: 0.79)
- **Avg. Function Length:** 16.33 (normalized: 0.61)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/configSelection.js

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.22 (importance for testing)
- **Import Count:** 2 (normalized: 0.87)
- **Export Count:** 7 (normalized: 0.32)
- **Imported By Count:** 2 (normalized: 0.18)
- **Lines of Code:** 281 (normalized: 0.24)
- **Complexity:** 1.53 (normalized: 0.92)
- **Avg. Function Length:** 4.95 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.67)
### ./src/utils/safeStringify.js

- **Composite Score:** 0.61 (testability)
- **Priority Score:** 0.43 (importance for testing)
- **Import Count:** 1 (normalized: 0.93)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 5 (normalized: 0.45)
- **Lines of Code:** 177 (normalized: 0.52)
- **Complexity:** 6.25 (normalized: 0.17)
- **Avg. Function Length:** 17.50 (normalized: 0.58)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/helperMethods.js

- **Composite Score:** 0.59 (testability)
- **Priority Score:** 0.32 (importance for testing)
- **Import Count:** 6 (normalized: 0.60)
- **Export Count:** 14 (normalized: 0.64)
- **Imported By Count:** 3 (normalized: 0.27)
- **Lines of Code:** 117 (normalized: 0.69)
- **Complexity:** 2.22 (normalized: 0.81)
- **Avg. Function Length:** 11.78 (normalized: 0.72)
- **Async Functions:** 7 (normalized: 0.13)
- **Try-Catch Blocks:** 2 (normalized: 0.33)
### ./src/utils/proposalHelper.js

- **Composite Score:** 0.56 (testability)
- **Priority Score:** 0.69 (importance for testing)
- **Import Count:** 7 (normalized: 0.53)
- **Export Count:** 22 (normalized: 1.00)
- **Imported By Count:** 9 (normalized: 0.82)
- **Lines of Code:** 236 (normalized: 0.36)
- **Complexity:** 1.45 (normalized: 0.93)
- **Avg. Function Length:** 16.64 (normalized: 0.60)
- **Async Functions:** 8 (normalized: 0.00)
- **Try-Catch Blocks:** 2 (normalized: 0.33)
### ./src/App.js

- **Composite Score:** 0.55 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 15 (normalized: 0.00)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 82 (normalized: 0.78)
- **Complexity:** 3.40 (normalized: 0.62)
- **Avg. Function Length:** 17.40 (normalized: 0.58)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/CreateProposalModal.js

- **Composite Score:** 0.46 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 11 (normalized: 0.27)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 210 (normalized: 0.43)
- **Complexity:** 3.56 (normalized: 0.60)
- **Avg. Function Length:** 18.00 (normalized: 0.57)
- **Async Functions:** 3 (normalized: 0.63)
- **Try-Catch Blocks:** 1 (normalized: 0.67)
### ./src/components/proposals/ProposalProvider.js

- **Composite Score:** 0.45 (testability)
- **Priority Score:** 0.85 (importance for testing)
- **Import Count:** 10 (normalized: 0.33)
- **Export Count:** 4 (normalized: 0.18)
- **Imported By Count:** 11 (normalized: 1.00)
- **Lines of Code:** 298 (normalized: 0.19)
- **Complexity:** 2.07 (normalized: 0.83)
- **Avg. Function Length:** 6.54 (normalized: 0.84)
- **Async Functions:** 4 (normalized: 0.50)
- **Try-Catch Blocks:** 3 (normalized: 0.00)
### ./src/components/ProposalItem.js

- **Composite Score:** 0.08 (testability)
- **Priority Score:** 0.37 (importance for testing)
- **Import Count:** 12 (normalized: 0.20)
- **Export Count:** 2 (normalized: 0.09)
- **Imported By Count:** 1 (normalized: 0.09)
- **Lines of Code:** 369 (normalized: 0.00)
- **Complexity:** 7.36 (normalized: 0.00)
- **Avg. Function Length:** 41.79 (normalized: 0.00)
- **Async Functions:** 6 (normalized: 0.25)
- **Try-Catch Blocks:** 3 (normalized: 0.00)
