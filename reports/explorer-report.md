# TypeScript Files Ranked by Testing Difficulty

This report ranks 242 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 234 | 96.7% |
| Moderate         | 6 | 2.5% |
| Hard to Test     | 2 | 0.8% |
| **Total**        | **242** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/types/index.ts | 0.71 | 0.88 | 46 | 0 | 2 | 21 | 1.00 |
| ./src/config/index.ts | 0.43 | 0.89 | 27 | 0 | 4 | 61 | 1.00 |
| ./src/frontend/components/index.ts | 0.35 | 1.00 | 24 | 0 | 30 | 22 | 1.00 |
| ./src/frontend/types/index.ts | 0.31 | 0.93 | 20 | 0 | 12 | 14 | 1.00 |
| ./src/frontend/components/Icon/index.ts | 0.27 | 0.89 | 16 | 0 | 2 | 1 | 1.00 |
| ./src/class/TxDecoder.ts | 0.25 | 0.39 | 3 | 12 | 4 | 553 | 51.33 |
| ./src/server.ts | 0.24 | 0.27 | 0 | 29 | 0 | 1571 | 28.71 |
| ./src/storage/transaction.ts | 0.24 | 0.49 | 5 | 8 | 22 | 1436 | 12.77 |
| ./src/frontend/api/index.ts | 0.23 | 0.93 | 14 | 0 | 12 | 12 | 1.00 |
| ./src/storage/sqlite3storage.ts | 0.21 | 0.82 | 10 | 3 | 8 | 102 | 2.25 |

## Files Not Imported By Any Other File (148)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/frontend/transaction/Transactio... | 0.90 | 0 | 6 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/serverResponseTypes.ts | 0.90 | 1 | 8 | 0 | 53 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chart/index.ts | 0.90 | 0 | 5 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/index.ts | 0.90 | 0 | 5 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/index.ts | 0.89 | 0 | 4 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.89 | 0 | 4 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/cycle/index.ts | 0.89 | 0 | 2 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/transaction_line_chart.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/validator_line_chart.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/contract/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/log/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/token/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction-line-chart... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/validator-line-chart/i... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/account/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/account/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/address/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/address/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/block/[id].ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/block/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/contract/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/cycle/[id].ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/cycle/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/log/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/token/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/transaction/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/transaction/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/tx/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/tx/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/Account/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/AccountDetail/... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Card/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chip/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/ContentLayo... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Dropdown/in... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Dropdownold... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Dropdownt/i... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/ExpandableL... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Layout/inde... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/NavDropdown... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Pagination/... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/PaginationP... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/TopBarDropd... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/cycle/Cycle/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/cycle/CycleDetail/inde... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Butt... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Copy... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Icon... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Sort... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chart/BarCh... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/cycle.ts | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/routes.ts | 0.88 | 0 | 1 | 0 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/contract.ts | 0.88 | 1 | 2 | 0 | 16 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/404.tsx | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 3.00 | 0 | 0 |
| ./src/frontend/api/useAccountDetail.ts | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/api/useTotalData.ts | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/Dashboard/in... | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/websocket.ts | 0.88 | 1 | 1 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./account.ts | 0.88 | 0 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./cycle.ts | 0.87 | 0 | 0 | 0 | 34 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/api/hello.ts | 0.87 | 1 | 1 | 0 | 8 | 1.00 | 3.00 | 0 | 0 |
| ./src/frontend/components/Spacer/Spac... | 0.87 | 1 | 1 | 0 | 8 | 2.00 | 3.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.86 | 2 | 1 | 0 | 12 | 1.00 | 7.00 | 0 | 0 |
| ./src/frontend/components/Chip/Chip.tsx | 0.86 | 3 | 1 | 0 | 13 | 1.00 | 4.00 | 0 | 0 |
| ./startLogServerPM2.js | 0.86 | 0 | 0 | 0 | 43 | 1.80 | 11.00 | 0 | 0 |
| ./src/frontend/api/web3.ts | 0.86 | 1 | 1 | 0 | 12 | 2.00 | 10.00 | 0 | 1 |
| ./src/frontend/components/Button/Butt... | 0.86 | 3 | 1 | 0 | 32 | 1.00 | 8.00 | 0 | 0 |
| ./src/frontend/api/useTransactionDeta... | 0.85 | 4 | 2 | 0 | 16 | 1.00 | 9.00 | 0 | 0 |
| ./src/frontend/components/ExpandableL... | 0.85 | 3 | 1 | 0 | 40 | 1.80 | 7.40 | 0 | 0 |
| ./src/frontend/components/Tab/Tab.tsx | 0.85 | 3 | 1 | 0 | 37 | 2.00 | 8.00 | 0 | 0 |
| ./next.config.js | 0.85 | 0 | 1 | 0 | 55 | 1.00 | 20.50 | 1 | 0 |
| ./src/frontend/transaction/Transactio... | 0.85 | 3 | 1 | 0 | 17 | 2.00 | 11.00 | 0 | 0 |
| ./src/frontend/components/SearchBar/S... | 0.85 | 4 | 1 | 0 | 24 | 1.00 | 8.67 | 0 | 0 |
| ./src/frontend/api/useCycle.ts | 0.85 | 5 | 2 | 0 | 17 | 2.00 | 8.00 | 0 | 0 |
| ./src/frontend/components/Button/Copy... | 0.85 | 4 | 1 | 0 | 28 | 2.00 | 9.67 | 0 | 0 |
| ./src/frontend/components/Card/Card.tsx | 0.84 | 4 | 1 | 0 | 26 | 1.00 | 14.00 | 0 | 0 |
| ./src/frontend/components/AnchorLink/... | 0.84 | 4 | 1 | 0 | 19 | 3.00 | 8.00 | 0 | 0 |
| ./src/frontend/components/Menu/menu.tsx | 0.84 | 3 | 1 | 0 | 54 | 2.25 | 13.00 | 0 | 0 |
| ./src/frontend/account/DetailCard/Det... | 0.84 | 3 | 1 | 0 | 32 | 2.50 | 14.50 | 0 | 0 |
| ./src/pages/_app.tsx | 0.84 | 5 | 1 | 0 | 18 | 1.00 | 13.00 | 0 | 0 |
| ./src/frontend/components/Dropdownt/D... | 0.84 | 4 | 1 | 0 | 78 | 2.00 | 9.40 | 0 | 0 |
| ./src/frontend/components/Button/Sort... | 0.84 | 4 | 1 | 0 | 30 | 2.50 | 12.50 | 0 | 0 |
| ./src/frontend/components/TopBarDropd... | 0.84 | 4 | 1 | 0 | 74 | 2.00 | 10.88 | 0 | 0 |
| ./src/frontend/components/NavDropdown... | 0.84 | 5 | 1 | 0 | 63 | 1.43 | 9.57 | 0 | 0 |
| ./src/frontend/components/Button/Icon... | 0.84 | 4 | 1 | 0 | 31 | 4.00 | 9.00 | 0 | 0 |
| ./src/frontend/components/Layout/Layo... | 0.84 | 6 | 2 | 0 | 39 | 1.80 | 10.20 | 0 | 0 |
| ./src/frontend/validator-line-chart/V... | 0.84 | 5 | 1 | 0 | 44 | 1.33 | 13.67 | 0 | 0 |
| ./src/frontend/api/useCycleDetail.ts | 0.84 | 4 | 1 | 0 | 20 | 4.00 | 13.00 | 0 | 0 |
| ./src/frontend/api/useReceiptDetail.ts | 0.83 | 4 | 1 | 0 | 31 | 4.00 | 13.50 | 0 | 0 |
| ./src/frontend/dashboard/SearchBox/Se... | 0.83 | 6 | 1 | 0 | 36 | 1.67 | 11.00 | 0 | 0 |
| ./src/frontend/components/Breadcrumb/... | 0.83 | 5 | 1 | 0 | 32 | 3.00 | 16.00 | 0 | 0 |
| ./src/frontend/components/Dropdownold... | 0.83 | 7 | 2 | 0 | 84 | 1.50 | 10.50 | 0 | 0 |
| ./src/frontend/components/Dropdown/Dr... | 0.83 | 7 | 2 | 0 | 85 | 1.50 | 10.63 | 0 | 0 |
| ./src/frontend/api/useContract.ts | 0.83 | 6 | 1 | 0 | 22 | 4.00 | 10.00 | 0 | 0 |
| ./src/frontend/account/TokenDropdown/... | 0.83 | 6 | 1 | 0 | 81 | 1.50 | 15.00 | 0 | 0 |
| ./src/frontend/api/useList.ts | 0.83 | 3 | 1 | 0 | 66 | 3.00 | 22.00 | 0 | 1 |
| ./src/frontend/components/MenuItem/Me... | 0.83 | 4 | 1 | 0 | 48 | 3.50 | 22.00 | 0 | 0 |
| ./src/frontend/cycle/Cycle/Cycle.tsx | 0.83 | 8 | 1 | 0 | 80 | 1.90 | 3.90 | 0 | 0 |
| ./src/frontend/dashboard/LatestCycle/... | 0.83 | 6 | 2 | 0 | 55 | 1.00 | 24.33 | 0 | 0 |
| ./src/frontend/transaction-line-chart... | 0.83 | 5 | 1 | 0 | 30 | 2.00 | 25.00 | 0 | 0 |
| ./src/frontend/api/useAccount.ts | 0.82 | 6 | 2 | 0 | 32 | 5.00 | 13.50 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.82 | 7 | 1 | 0 | 70 | 2.75 | 9.63 | 0 | 0 |
| ./src/frontend/components/PaginationP... | 0.82 | 6 | 2 | 0 | 42 | 1.00 | 30.00 | 0 | 0 |
| ./src/frontend/log/Log.tsx | 0.82 | 7 | 1 | 0 | 41 | 2.00 | 17.00 | 0 | 0 |
| ./getStakeTxs.ts | 0.82 | 4 | 0 | 0 | 35 | 3.50 | 19.50 | 1 | 0 |
| ./getUnstakeTxs.ts | 0.82 | 4 | 0 | 0 | 35 | 3.50 | 19.50 | 1 | 0 |
| ./src/frontend/components/Header/Head... | 0.82 | 7 | 1 | 0 | 86 | 1.78 | 16.33 | 0 | 0 |
| ./src/frontend/components/Pagination/... | 0.82 | 7 | 2 | 0 | 84 | 3.00 | 16.67 | 0 | 0 |
| ./src/frontend/components/Footer/Foot... | 0.82 | 6 | 1 | 0 | 74 | 1.00 | 26.00 | 0 | 0 |
| ./src/frontend/contract/Contract.tsx | 0.82 | 9 | 1 | 0 | 79 | 1.43 | 9.57 | 0 | 0 |
| ./src/frontend/account/DetailCard/use... | 0.82 | 3 | 1 | 0 | 61 | 4.00 | 15.40 | 3 | 0 |
| ./src/frontend/dashboard/LatestTransa... | 0.82 | 6 | 2 | 0 | 68 | 1.00 | 33.00 | 0 | 0 |
| ./src/frontend/account/Account/Accoun... | 0.81 | 10 | 1 | 0 | 75 | 1.67 | 7.67 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.81 | 6 | 1 | 0 | 52 | 2.33 | 29.33 | 0 | 0 |
| ./src/frontend/cycle/CycleDetail/Cycl... | 0.81 | 7 | 1 | 0 | 151 | 2.10 | 17.30 | 0 | 0 |
| ./getTotalRewardByAddress.ts | 0.81 | 4 | 0 | 0 | 76 | 3.00 | 26.50 | 1 | 0 |
| ./src/frontend/components/ContentLayo... | 0.81 | 8 | 1 | 0 | 52 | 4.00 | 15.00 | 0 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.81 | 5 | 1 | 0 | 152 | 2.17 | 29.00 | 0 | 0 |
| ./src/pages/_document.tsx | 0.81 | 3 | 1 | 0 | 45 | 5.00 | 40.00 | 0 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.81 | 4 | 1 | 0 | 236 | 3.46 | 24.54 | 0 | 0 |
| ./getNodeAccountByAddress.ts | 0.80 | 4 | 0 | 0 | 82 | 5.25 | 20.50 | 2 | 0 |
| ./src/frontend/api/useTransaction.ts | 0.80 | 6 | 1 | 0 | 37 | 8.50 | 20.50 | 0 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.80 | 4 | 1 | 0 | 209 | 2.83 | 36.17 | 0 | 0 |
| ./data_patcher.ts | 0.80 | 7 | 0 | 0 | 41 | 4.00 | 24.00 | 1 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.80 | 6 | 1 | 0 | 204 | 4.36 | 25.09 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.80 | 7 | 1 | 0 | 72 | 4.00 | 34.00 | 0 | 0 |
| ./src/frontend/components/Chart/BarCh... | 0.79 | 3 | 1 | 0 | 76 | 1.00 | 68.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.79 | 8 | 1 | 0 | 294 | 2.44 | 17.09 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.79 | 12 | 1 | 0 | 74 | 2.60 | 20.60 | 0 | 0 |
| ./src/log_server.ts | 0.78 | 9 | 0 | 0 | 80 | 1.86 | 13.86 | 2 | 2 |
| ./src/frontend/dashboard/Dashboard/Da... | 0.77 | 12 | 1 | 0 | 70 | 3.00 | 33.00 | 0 | 0 |
| ./accountsDataToCsv.ts | 0.77 | 7 | 0 | 0 | 192 | 2.23 | 12.23 | 4 | 2 |
| ./data_sync_checker.ts | 0.77 | 6 | 0 | 0 | 60 | 8.00 | 46.00 | 1 | 0 |
| ./transactionsDataToCsv.ts | 0.76 | 8 | 1 | 0 | 253 | 2.67 | 15.33 | 4 | 2 |
| ./cyclesDataToCsv.ts | 0.76 | 7 | 0 | 0 | 235 | 2.81 | 18.88 | 4 | 2 |
| ./src/frontend/token/Token.tsx | 0.76 | 10 | 1 | 0 | 229 | 4.00 | 40.00 | 0 | 0 |
| ./src/frontend/account/AccountDetail/... | 0.75 | 14 | 1 | 0 | 281 | 3.33 | 30.89 | 0 | 0 |
| ./src/frontend/dashboard/CardDetail/C... | 0.74 | 4 | 2 | 0 | 132 | 1.00 | 115.00 | 0 | 0 |
| ./src/aggregator.ts | 0.73 | 12 | 0 | 0 | 88 | 9.00 | 36.00 | 2 | 0 |
| ./src/frontend/api/useStats.ts | 0.71 | 5 | 1 | 0 | 93 | 19.00 | 74.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.71 | 11 | 1 | 0 | 383 | 7.67 | 57.44 | 0 | 0 |
| ./src/frontend/components/Icon/Icon.tsx | 0.70 | 34 | 3 | 0 | 79 | 1.00 | 6.00 | 0 | 0 |
| ./src/collector.ts | 0.68 | 17 | 1 | 0 | 269 | 5.00 | 25.17 | 6 | 2 |
| ./src/server.ts | 0.27 | 29 | 0 | 0 | 1571 | 28.71 | 119.92 | 15 | 3 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/frontend/components/index.ts | 1.00 | 0 | 30 | 24 | 22 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/api/index.ts | 0.93 | 0 | 12 | 14 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/index.ts | 0.93 | 0 | 12 | 20 | 14 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/transaction.ts | 0.91 | 1 | 13 | 3 | 135 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.90 | 0 | 6 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/serverResponseTypes.ts | 0.90 | 1 | 8 | 0 | 53 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/account.ts | 0.90 | 5 | 15 | 2 | 153 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chart/index.ts | 0.90 | 0 | 5 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/index.ts | 0.90 | 0 | 5 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/transaction.ts | 0.89 | 1 | 7 | 2 | 75 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/index.ts | 0.89 | 0 | 4 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/inde... | 0.89 | 0 | 4 | 6 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.89 | 0 | 4 | 0 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/index.ts | 0.89 | 0 | 3 | 3 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./src/config/index.ts | 0.89 | 0 | 4 | 27 | 61 | 1.00 | 0.00 | 0 | 0 |
| ./src/logSubscription/SocketManager.ts | 0.89 | 2 | 7 | 3 | 40 | 1.29 | 4.57 | 0 | 0 |
| ./src/frontend/components/Icon/index.ts | 0.89 | 0 | 2 | 16 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/TableComp/i... | 0.89 | 0 | 2 | 4 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/cycle/index.ts | 0.89 | 0 | 2 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/receipt.ts | 0.88 | 3 | 8 | 1 | 109 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/index.ts | 0.88 | 0 | 2 | 46 | 21 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/transaction_line_chart.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/validator_line_chart.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/contract/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/log/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/token/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction-line-chart... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/validator-line-chart/i... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/account/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/account/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/address/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/address/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/block/[id].ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/block/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/contract/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/cycle/[id].ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/cycle/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/log/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/token/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/transaction/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/transaction/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/tx/[id].tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/tx/index.tsx | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/Account/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/AccountDetail/... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/DetailCard/ind... | 0.88 | 0 | 1 | 2 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/account/TokenDropdown/... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Breadcrumb/... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Card/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chip/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/ContentLayo... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Dropdown/in... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Dropdownold... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Dropdownt/i... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/ExpandableL... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Footer/inde... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Header/inde... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Layout/inde... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Menu/index.ts | 0.88 | 0 | 1 | 3 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/MenuItem/in... | 0.88 | 0 | 1 | 2 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/NavDropdown... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Pagination/... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/PaginationP... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/SearchBar/i... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Spacer/inde... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Tab/index.ts | 0.88 | 0 | 1 | 2 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/TopBarDropd... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/cycle/Cycle/index.ts | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/cycle/CycleDetail/inde... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/SearchBox/in... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Butt... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Copy... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Icon... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Button/Sort... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/components/Chart/BarCh... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.88 | 0 | 1 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/cycle.ts | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/modes.ts | 0.88 | 0 | 1 | 2 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/routes.ts | 0.88 | 0 | 1 | 0 | 9 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/account.ts | 0.88 | 1 | 2 | 2 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/types/contract.ts | 0.88 | 1 | 2 | 0 | 16 | 1.00 | 0.00 | 0 | 0 |
| ./src/pages/404.tsx | 0.88 | 0 | 1 | 0 | 3 | 1.00 | 3.00 | 0 | 0 |
| ./src/utils/time.ts | 0.88 | 0 | 1 | 1 | 3 | 1.00 | 3.00 | 0 | 0 |
| ./src/types/originalTxData.ts | 0.88 | 1 | 3 | 1 | 72 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/api/useAccountDetail.ts | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/api/useTotalData.ts | 0.88 | 0 | 0 | 0 | 0 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/CardDetail/i... | 0.88 | 0 | 0 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/ChartDetail/... | 0.88 | 0 | 0 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/Dashboard/in... | 0.88 | 0 | 0 | 0 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/LatestCycle/... | 0.88 | 0 | 0 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/dashboard/LatestTransa... | 0.88 | 0 | 0 | 1 | 1 | 1.00 | 0.00 | 0 | 0 |
| ./prettier.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/websocket.ts | 0.88 | 1 | 1 | 0 | 2 | 1.00 | 0.00 | 0 | 0 |
| ./account.ts | 0.88 | 0 | 0 | 0 | 17 | 1.00 | 0.00 | 0 | 0 |
| ./src/types/cycle.ts | 0.88 | 1 | 1 | 1 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./cycle.ts | 0.87 | 0 | 0 | 0 | 34 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/api/paths.ts | 0.87 | 1 | 1 | 10 | 24 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/utils/debounce.ts | 0.87 | 0 | 1 | 1 | 11 | 1.00 | 7.67 | 0 | 0 |
| ./src/pages/api/hello.ts | 0.87 | 1 | 1 | 0 | 8 | 1.00 | 3.00 | 0 | 0 |
| ./src/class/cache_per_cycle.ts | 0.87 | 2 | 4 | 1 | 52 | 1.25 | 6.50 | 0 | 0 |
| ./src/routes/healthCheck.ts | 0.87 | 1 | 1 | 1 | 11 | 1.00 | 5.67 | 0 | 0 |
| ./src/frontend/components/Spacer/Spac... | 0.87 | 1 | 1 | 0 | 8 | 2.00 | 3.00 | 0 | 0 |
| ./src/frontend/components/TableComp/T... | 0.87 | 3 | 5 | 3 | 53 | 1.67 | 8.17 | 0 | 0 |
| ./src/frontend/utils/fromWeiNoTrailin... | 0.87 | 1 | 1 | 3 | 34 | 2.00 | 4.00 | 0 | 0 |
| ./src/frontend/api/fetcher.ts | 0.87 | 1 | 1 | 8 | 5 | 1.00 | 4.00 | 1 | 0 |
| ./src/frontend/api/axios.ts | 0.86 | 2 | 2 | 3 | 46 | 1.57 | 4.57 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.86 | 2 | 1 | 0 | 12 | 1.00 | 7.00 | 0 | 0 |
| ./src/frontend/components/Chip/Chip.tsx | 0.86 | 3 | 1 | 0 | 13 | 1.00 | 4.00 | 0 | 0 |
| ./startLogServerPM2.js | 0.86 | 0 | 0 | 0 | 43 | 1.80 | 11.00 | 0 | 0 |
| ./src/logSubscription/CollectorDataPa... | 0.86 | 1 | 3 | 2 | 119 | 3.75 | 7.08 | 0 | 0 |
| ./src/frontend/api/web3.ts | 0.86 | 1 | 1 | 0 | 12 | 2.00 | 10.00 | 0 | 1 |
| ./src/frontend/components/Button/Butt... | 0.86 | 3 | 1 | 0 | 32 | 1.00 | 8.00 | 0 | 0 |
| ./src/frontend/api/useTransactionDeta... | 0.85 | 4 | 2 | 0 | 16 | 1.00 | 9.00 | 0 | 0 |
| ./src/utils/index.ts | 0.85 | 0 | 4 | 4 | 87 | 4.83 | 13.50 | 1 | 0 |
| ./src/frontend/components/ExpandableL... | 0.85 | 3 | 1 | 0 | 40 | 1.80 | 7.40 | 0 | 0 |
| ./src/frontend/components/Tab/Tab.tsx | 0.85 | 3 | 1 | 0 | 37 | 2.00 | 8.00 | 0 | 0 |
| ./src/logSubscription/CollectorSocket... | 0.85 | 4 | 5 | 3 | 41 | 1.50 | 8.67 | 2 | 0 |
| ./next.config.js | 0.85 | 0 | 1 | 0 | 55 | 1.00 | 20.50 | 1 | 0 |
| ./src/frontend/transaction/Transactio... | 0.85 | 3 | 1 | 0 | 17 | 2.00 | 11.00 | 0 | 0 |
| ./src/frontend/components/SearchBar/S... | 0.85 | 4 | 1 | 0 | 24 | 1.00 | 8.67 | 0 | 0 |
| ./src/frontend/components/Pagination/... | 0.85 | 1 | 2 | 1 | 44 | 4.50 | 15.75 | 0 | 0 |
| ./src/frontend/utils/getSearchRoute.ts | 0.85 | 3 | 2 | 1 | 15 | 2.00 | 6.00 | 2 | 0 |
| ./src/frontend/dashboard/NetworkMode/... | 0.85 | 4 | 2 | 2 | 74 | 1.33 | 10.33 | 0 | 0 |
| ./src/frontend/api/useCycle.ts | 0.85 | 5 | 2 | 0 | 17 | 2.00 | 8.00 | 0 | 0 |
| ./src/frontend/utils/transformChartDa... | 0.85 | 2 | 2 | 3 | 92 | 1.20 | 20.60 | 0 | 0 |
| ./src/frontend/components/Button/Copy... | 0.85 | 4 | 1 | 0 | 28 | 2.00 | 9.67 | 0 | 0 |
| ./src/frontend/components/Card/Card.tsx | 0.84 | 4 | 1 | 0 | 26 | 1.00 | 14.00 | 0 | 0 |
| ./src/frontend/components/AnchorLink/... | 0.84 | 4 | 1 | 0 | 19 | 3.00 | 8.00 | 0 | 0 |
| ./src/frontend/components/Menu/menu.tsx | 0.84 | 3 | 1 | 0 | 54 | 2.25 | 13.00 | 0 | 0 |
| ./src/frontend/account/DetailCard/Det... | 0.84 | 3 | 1 | 0 | 32 | 2.50 | 14.50 | 0 | 0 |
| ./src/frontend/utils/useLayoutBreakpo... | 0.84 | 1 | 1 | 1 | 48 | 5.00 | 15.25 | 0 | 0 |
| ./src/stats/metadata.ts | 0.84 | 1 | 6 | 3 | 48 | 2.75 | 10.00 | 3 | 3 |
| ./src/pages/_app.tsx | 0.84 | 5 | 1 | 0 | 18 | 1.00 | 13.00 | 0 | 0 |
| ./src/frontend/components/Dropdownt/D... | 0.84 | 4 | 1 | 0 | 78 | 2.00 | 9.40 | 0 | 0 |
| ./src/frontend/components/Button/Sort... | 0.84 | 4 | 1 | 0 | 30 | 2.50 | 12.50 | 0 | 0 |
| ./src/frontend/components/TopBarDropd... | 0.84 | 4 | 1 | 0 | 74 | 2.00 | 10.88 | 0 | 0 |
| ./src/frontend/components/NavDropdown... | 0.84 | 5 | 1 | 0 | 63 | 1.43 | 9.57 | 0 | 0 |
| ./src/frontend/components/Button/Icon... | 0.84 | 4 | 1 | 0 | 31 | 4.00 | 9.00 | 0 | 0 |
| ./src/frontend/components/Layout/Layo... | 0.84 | 6 | 2 | 0 | 39 | 1.80 | 10.20 | 0 | 0 |
| ./src/frontend/cycle/Cycle/useCycleHo... | 0.84 | 3 | 1 | 1 | 42 | 1.67 | 16.00 | 1 | 0 |
| ./src/frontend/validator-line-chart/V... | 0.84 | 5 | 1 | 0 | 44 | 1.33 | 13.67 | 0 | 0 |
| ./src/frontend/utils/calculateValue.ts | 0.84 | 5 | 7 | 5 | 86 | 4.13 | 9.50 | 0 | 3 |
| ./src/frontend/api/useCycleDetail.ts | 0.84 | 4 | 1 | 0 | 20 | 4.00 | 13.00 | 0 | 0 |
| ./src/frontend/api/useReceiptDetail.ts | 0.83 | 4 | 1 | 0 | 31 | 4.00 | 13.50 | 0 | 0 |
| ./src/frontend/dashboard/SearchBox/Se... | 0.83 | 6 | 1 | 0 | 36 | 1.67 | 11.00 | 0 | 0 |
| ./src/frontend/components/Breadcrumb/... | 0.83 | 5 | 1 | 0 | 32 | 3.00 | 16.00 | 0 | 0 |
| ./src/frontend/components/Dropdownold... | 0.83 | 7 | 2 | 0 | 84 | 1.50 | 10.50 | 0 | 0 |
| ./src/frontend/components/Dropdown/Dr... | 0.83 | 7 | 2 | 0 | 85 | 1.50 | 10.63 | 0 | 0 |
| ./src/frontend/api/useContract.ts | 0.83 | 6 | 1 | 0 | 22 | 4.00 | 10.00 | 0 | 0 |
| ./src/collectors/rmq/cycles.ts | 0.83 | 4 | 1 | 1 | 32 | 1.33 | 5.33 | 3 | 1 |
| ./src/collectors/rmq/original_txs.ts | 0.83 | 4 | 1 | 1 | 32 | 1.33 | 5.33 | 3 | 1 |
| ./src/collectors/rmq/receipts.ts | 0.83 | 4 | 1 | 1 | 32 | 1.33 | 5.33 | 3 | 1 |
| ./src/logSubscription/Handler.ts | 0.83 | 2 | 1 | 1 | 126 | 4.75 | 13.88 | 1 | 0 |
| ./src/frontend/account/TokenDropdown/... | 0.83 | 6 | 1 | 0 | 81 | 1.50 | 15.00 | 0 | 0 |
| ./src/frontend/api/useList.ts | 0.83 | 3 | 1 | 0 | 66 | 3.00 | 22.00 | 0 | 1 |
| ./src/frontend/components/MenuItem/Me... | 0.83 | 4 | 1 | 0 | 48 | 3.50 | 22.00 | 0 | 0 |
| ./src/frontend/cycle/Cycle/Cycle.tsx | 0.83 | 8 | 1 | 0 | 80 | 1.90 | 3.90 | 0 | 0 |
| ./src/frontend/dashboard/LatestCycle/... | 0.83 | 6 | 2 | 0 | 55 | 1.00 | 24.33 | 0 | 0 |
| ./src/middleware/usage.ts | 0.83 | 4 | 5 | 1 | 145 | 3.13 | 13.13 | 3 | 0 |
| ./src/frontend/transaction/Transactio... | 0.83 | 3 | 1 | 1 | 64 | 3.00 | 15.83 | 2 | 0 |
| ./src/types/abis.ts | 0.83 | 0 | 2 | 1 | 673 | 1.00 | 0.00 | 0 | 0 |
| ./src/frontend/transaction-line-chart... | 0.83 | 5 | 1 | 0 | 30 | 2.00 | 25.00 | 0 | 0 |
| ./src/frontend/api/useAccount.ts | 0.82 | 6 | 2 | 0 | 32 | 5.00 | 13.50 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.82 | 7 | 1 | 0 | 70 | 2.75 | 9.63 | 0 | 0 |
| ./src/utils/decodeEVMRawTx.ts | 0.82 | 4 | 4 | 2 | 71 | 4.75 | 15.00 | 0 | 3 |
| ./src/frontend/dashboard/ChartDetail/... | 0.82 | 8 | 3 | 1 | 100 | 1.40 | 15.20 | 0 | 0 |
| ./src/frontend/components/PaginationP... | 0.82 | 6 | 2 | 0 | 42 | 1.00 | 30.00 | 0 | 0 |
| ./src/frontend/log/Log.tsx | 0.82 | 7 | 1 | 0 | 41 | 2.00 | 17.00 | 0 | 0 |
| ./getStakeTxs.ts | 0.82 | 4 | 0 | 0 | 35 | 3.50 | 19.50 | 1 | 0 |
| ./getUnstakeTxs.ts | 0.82 | 4 | 0 | 0 | 35 | 3.50 | 19.50 | 1 | 0 |
| ./src/frontend/components/Header/Head... | 0.82 | 7 | 1 | 0 | 86 | 1.78 | 16.33 | 0 | 0 |
| ./src/frontend/components/Pagination/... | 0.82 | 7 | 2 | 0 | 84 | 3.00 | 16.67 | 0 | 0 |
| ./src/frontend/components/Footer/Foot... | 0.82 | 6 | 1 | 0 | 74 | 1.00 | 26.00 | 0 | 0 |
| ./src/storage/sqlite3storage.ts | 0.82 | 3 | 8 | 10 | 102 | 2.25 | 10.88 | 6 | 3 |
| ./src/frontend/contract/Contract.tsx | 0.82 | 9 | 1 | 0 | 79 | 1.43 | 9.57 | 0 | 0 |
| ./src/frontend/account/DetailCard/use... | 0.82 | 3 | 1 | 0 | 61 | 4.00 | 15.40 | 3 | 0 |
| ./src/frontend/dashboard/LatestTransa... | 0.82 | 6 | 2 | 0 | 68 | 1.00 | 33.00 | 0 | 0 |
| ./src/storage/index.ts | 0.82 | 3 | 3 | 5 | 103 | 1.80 | 22.40 | 4 | 0 |
| ./src/stats/coinStats.ts | 0.81 | 3 | 5 | 4 | 64 | 2.60 | 10.60 | 4 | 4 |
| ./src/stats/validatorStats.ts | 0.81 | 3 | 6 | 7 | 89 | 3.75 | 9.38 | 4 | 4 |
| ./src/stats/nodeStats.ts | 0.81 | 1 | 7 | 3 | 93 | 3.33 | 13.67 | 5 | 5 |
| ./src/frontend/account/Account/Accoun... | 0.81 | 10 | 1 | 0 | 75 | 1.67 | 7.67 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.81 | 6 | 1 | 0 | 52 | 2.33 | 29.33 | 0 | 0 |
| ./src/logSubscription/CollectorListen... | 0.81 | 7 | 1 | 1 | 46 | 2.17 | 7.00 | 3 | 0 |
| ./src/frontend/cycle/CycleDetail/Cycl... | 0.81 | 7 | 1 | 0 | 151 | 2.10 | 17.30 | 0 | 0 |
| ./getTotalRewardByAddress.ts | 0.81 | 4 | 0 | 0 | 76 | 3.00 | 26.50 | 1 | 0 |
| ./src/frontend/components/ContentLayo... | 0.81 | 8 | 1 | 0 | 52 | 4.00 | 15.00 | 0 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.81 | 5 | 1 | 0 | 152 | 2.17 | 29.00 | 0 | 0 |
| ./src/frontend/components/SearchBar/u... | 0.81 | 3 | 1 | 2 | 39 | 7.00 | 26.50 | 1 | 0 |
| ./src/pages/_document.tsx | 0.81 | 3 | 1 | 0 | 45 | 5.00 | 40.00 | 0 | 0 |
| ./src/frontend/log/useLogHook.ts | 0.81 | 3 | 1 | 1 | 89 | 7.00 | 18.00 | 2 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.81 | 4 | 1 | 0 | 236 | 3.46 | 24.54 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.81 | 4 | 1 | 1 | 68 | 2.00 | 47.00 | 0 | 0 |
| ./src/stats/index.ts | 0.81 | 1 | 1 | 3 | 62 | 1.00 | 61.00 | 1 | 0 |
| ./src/stats/transactionStats.ts | 0.80 | 3 | 6 | 7 | 107 | 3.00 | 10.50 | 5 | 5 |
| ./getNodeAccountByAddress.ts | 0.80 | 4 | 0 | 0 | 82 | 5.25 | 20.50 | 2 | 0 |
| ./src/frontend/api/useTransaction.ts | 0.80 | 6 | 1 | 0 | 37 | 8.50 | 20.50 | 0 | 0 |
| ./src/stats/sqlite3storage.ts | 0.80 | 8 | 7 | 6 | 89 | 2.31 | 10.23 | 5 | 2 |
| ./src/frontend/components/Chart/LineC... | 0.80 | 4 | 1 | 0 | 209 | 2.83 | 36.17 | 0 | 0 |
| ./data_patcher.ts | 0.80 | 7 | 0 | 0 | 41 | 4.00 | 24.00 | 1 | 0 |
| ./src/frontend/components/Chart/LineC... | 0.80 | 6 | 1 | 0 | 204 | 4.36 | 25.09 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.80 | 7 | 1 | 0 | 72 | 4.00 | 34.00 | 0 | 0 |
| ./src/frontend/components/Chart/BarCh... | 0.79 | 3 | 1 | 0 | 76 | 1.00 | 68.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.79 | 8 | 1 | 0 | 294 | 2.44 | 17.09 | 0 | 0 |
| ./src/frontend/account/AccountDetail/... | 0.79 | 4 | 2 | 1 | 103 | 7.17 | 24.67 | 3 | 0 |
| ./src/messaging/rabbitmq/consumer.ts | 0.79 | 1 | 1 | 3 | 107 | 2.89 | 13.89 | 7 | 3 |
| ./src/frontend/transaction/Transactio... | 0.79 | 12 | 1 | 0 | 74 | 2.60 | 20.60 | 0 | 0 |
| ./src/frontend/token/useTokenHook.ts | 0.79 | 3 | 1 | 1 | 150 | 7.50 | 25.50 | 3 | 0 |
| ./src/log_server.ts | 0.78 | 9 | 0 | 0 | 80 | 1.86 | 13.86 | 2 | 2 |
| ./src/storage/log.ts | 0.78 | 4 | 9 | 2 | 218 | 4.46 | 14.23 | 6 | 6 |
| ./src/frontend/dashboard/Dashboard/Da... | 0.77 | 12 | 1 | 0 | 70 | 3.00 | 33.00 | 0 | 0 |
| ./accountsDataToCsv.ts | 0.77 | 7 | 0 | 0 | 192 | 2.23 | 12.23 | 4 | 2 |
| ./data_sync_checker.ts | 0.77 | 6 | 0 | 0 | 60 | 8.00 | 46.00 | 1 | 0 |
| ./src/class/validateData.ts | 0.76 | 7 | 2 | 5 | 57 | 11.00 | 41.00 | 1 | 0 |
| ./transactionsDataToCsv.ts | 0.76 | 8 | 1 | 0 | 253 | 2.67 | 15.33 | 4 | 2 |
| ./cyclesDataToCsv.ts | 0.76 | 7 | 0 | 0 | 235 | 2.81 | 18.88 | 4 | 2 |
| ./src/frontend/token/Token.tsx | 0.76 | 10 | 1 | 0 | 229 | 4.00 | 40.00 | 0 | 0 |
| ./src/frontend/utils/showMethod.ts | 0.76 | 1 | 2 | 2 | 56 | 26.00 | 31.00 | 0 | 0 |
| ./src/storage/cycle.ts | 0.75 | 7 | 11 | 6 | 160 | 4.00 | 13.08 | 9 | 8 |
| ./src/frontend/account/AccountDetail/... | 0.75 | 14 | 1 | 0 | 281 | 3.33 | 30.89 | 0 | 0 |
| ./src/frontend/dashboard/CardDetail/C... | 0.74 | 4 | 2 | 0 | 132 | 1.00 | 115.00 | 0 | 0 |
| ./src/aggregator.ts | 0.73 | 12 | 0 | 0 | 88 | 9.00 | 36.00 | 2 | 0 |
| ./src/frontend/api/useStats.ts | 0.71 | 5 | 1 | 0 | 93 | 19.00 | 74.00 | 0 | 0 |
| ./src/frontend/transaction/Transactio... | 0.71 | 11 | 1 | 0 | 383 | 7.67 | 57.44 | 0 | 0 |
| ./src/storage/originalTxData.ts | 0.70 | 7 | 10 | 5 | 319 | 9.90 | 27.70 | 8 | 8 |
| ./src/frontend/components/Icon/Icon.tsx | 0.70 | 34 | 3 | 0 | 79 | 1.00 | 6.00 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/class/StatsFunctions.ts | 0.70 | 13 | 9 | 2 | 614 | 5.24 | 21.53 | 8 | 2 |
| ./src/class/DataSync.ts | 0.69 | 10 | 16 | 3 | 644 | 9.05 | 31.05 | 13 | 1 |
| ./src/storage/receipt.ts | 0.69 | 10 | 13 | 5 | 444 | 6.89 | 23.17 | 10 | 9 |
| ./src/collector.ts | 0.68 | 17 | 1 | 0 | 269 | 5.00 | 25.17 | 6 | 2 |
| ./src/storage/account.ts | 0.66 | 7 | 17 | 5 | 377 | 6.50 | 19.33 | 16 | 15 |
| ./src/storage/transaction.ts | 0.49 | 8 | 22 | 5 | 1436 | 12.77 | 38.97 | 20 | 20 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/class/TxDecoder.ts | 0.39 | 12 | 4 | 3 | 553 | 51.33 | 162.33 | 2 | 8 |
| ./src/server.ts | 0.27 | 29 | 0 | 0 | 1571 | 28.71 | 119.92 | 15 | 3 |

## Detailed Metrics

### ./src/frontend/components/index.ts

- **Composite Score:** 1.00 (testability)
- **Priority Score:** 0.35 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 30 (normalized: 1.00)
- **Imported By Count:** 24 (normalized: 0.52)
- **Lines of Code:** 22 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/index.ts

- **Composite Score:** 0.93 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 12 (normalized: 0.40)
- **Imported By Count:** 14 (normalized: 0.30)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/types/index.ts

- **Composite Score:** 0.93 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 12 (normalized: 0.40)
- **Imported By Count:** 20 (normalized: 0.43)
- **Lines of Code:** 14 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/transaction.ts

- **Composite Score:** 0.91 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 13 (normalized: 0.43)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 135 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/index.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.03 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 6 (normalized: 0.20)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/serverResponseTypes.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.03 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 8 (normalized: 0.27)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 53 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/account.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 15 (normalized: 0.50)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 153 (normalized: 0.90)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chart/index.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.03 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 5 (normalized: 0.17)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/index.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.03 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 5 (normalized: 0.17)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/types/transaction.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 7 (normalized: 0.23)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 75 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 6 (normalized: 0.13)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chart/LineChart/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 3 (normalized: 0.10)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/config/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.43 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 27 (normalized: 0.59)
- **Lines of Code:** 61 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/logSubscription/SocketManager.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 2 (normalized: 0.94)
- **Export Count:** 7 (normalized: 0.23)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 40 (normalized: 0.97)
- **Complexity:** 1.29 (normalized: 0.99)
- **Avg. Function Length:** 4.57 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Icon/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 16 (normalized: 0.35)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/TableComp/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 4 (normalized: 0.09)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/cycle/index.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/receipt.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 8 (normalized: 0.27)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 109 (normalized: 0.93)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.71 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 46 (normalized: 1.00)
- **Lines of Code:** 21 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/transaction_line_chart.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/validator_line_chart.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/contract/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/log/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/token/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction-line-chart/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/validator-line-chart/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/account/[id].tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/account/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/address/[id].tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/address/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/block/[id].ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/block/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/contract/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/cycle/[id].ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/cycle/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/log/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/token/[id].tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/transaction/[id].tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/transaction/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/tx/[id].tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/tx/index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/Account/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/AccountDetail/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/DetailCard/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/TokenDropdown/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Breadcrumb/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Card/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chip/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/ContentLayout/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Dropdown/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Dropdownold/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Dropdownt/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/ExpandableList/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Footer/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Header/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Layout/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Menu/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/MenuItem/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/NavDropdown/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Pagination/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/PaginationPrevNext/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/SearchBar/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Spacer/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Tab/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/TopBarDropdown/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/cycle/Cycle/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/cycle/CycleDetail/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/SearchBox/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/Transaction/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionTable/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/Button/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/CopyButton/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/IconButton/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/SortButton/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chart/BarChart/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/AccountInfo/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Detail/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/JsonView/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Logs/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Overview/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Receipt/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/types/cycle.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/types/modes.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 9 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/types/routes.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 9 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/types/account.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/types/contract.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 16 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/404.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/time.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/originalTxData.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 3 (normalized: 0.10)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 72 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useAccountDetail.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 0 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useTotalData.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 0 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/CardDetail/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/ChartDetail/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/Dashboard/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/LatestCycle/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 1 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/LatestTransaction/index.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 1 (normalized: 0.02)
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
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/websocket.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 2 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./account.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 17 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/cycle.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./cycle.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 34 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/paths.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 10 (normalized: 0.22)
- **Lines of Code:** 24 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/utils/debounce.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 11 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.67 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/api/hello.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 3.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/cache_per_cycle.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 2 (normalized: 0.94)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 52 (normalized: 0.97)
- **Complexity:** 1.25 (normalized: 1.00)
- **Avg. Function Length:** 6.50 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/routes/healthCheck.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 11 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.67 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Spacer/Spacer.tsx

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 3.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/TableComp/Table.tsx

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 5 (normalized: 0.17)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 53 (normalized: 0.97)
- **Complexity:** 1.67 (normalized: 0.99)
- **Avg. Function Length:** 8.17 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/utils/fromWeiNoTrailingComma.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 34 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 4.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/fetcher.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 8 (normalized: 0.17)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.98)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/axios.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 2 (normalized: 0.94)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 46 (normalized: 0.97)
- **Complexity:** 1.57 (normalized: 0.99)
- **Avg. Function Length:** 4.57 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Receipt/Receipt.tsx

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 2 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chip/Chip.tsx

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 13 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./startLogServerPM2.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 43 (normalized: 0.97)
- **Complexity:** 1.80 (normalized: 0.98)
- **Avg. Function Length:** 11.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/logSubscription/CollectorDataParser.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 3 (normalized: 0.10)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 119 (normalized: 0.92)
- **Complexity:** 3.75 (normalized: 0.95)
- **Avg. Function Length:** 7.08 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/web3.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 10.00 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/frontend/components/Button/Button/Button.tsx

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 32 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 8.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useTransactionDetail.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 16 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.00 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/index.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 4 (normalized: 0.09)
- **Lines of Code:** 87 (normalized: 0.94)
- **Complexity:** 4.83 (normalized: 0.92)
- **Avg. Function Length:** 13.50 (normalized: 0.92)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/ExpandableList/ExpandableList.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 40 (normalized: 0.97)
- **Complexity:** 1.80 (normalized: 0.98)
- **Avg. Function Length:** 7.40 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Tab/Tab.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 37 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 8.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/logSubscription/CollectorSocketconnection.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 5 (normalized: 0.17)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 41 (normalized: 0.97)
- **Complexity:** 1.50 (normalized: 0.99)
- **Avg. Function Length:** 8.67 (normalized: 0.95)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./next.config.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 55 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 20.50 (normalized: 0.87)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/JsonView/JsonView.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 17 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 11.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/SearchBar/SearchBar.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 24 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 8.67 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Pagination/usePagination.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 44 (normalized: 0.97)
- **Complexity:** 4.50 (normalized: 0.93)
- **Avg. Function Length:** 15.75 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/utils/getSearchRoute.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 15 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 6.00 (normalized: 0.96)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/NetworkMode/NetworkMode.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 74 (normalized: 0.95)
- **Complexity:** 1.33 (normalized: 0.99)
- **Avg. Function Length:** 10.33 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useCycle.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 17 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 8.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/utils/transformChartData.ts

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 2 (normalized: 0.94)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 92 (normalized: 0.94)
- **Complexity:** 1.20 (normalized: 1.00)
- **Avg. Function Length:** 20.60 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/CopyButton/CopyButton.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 28 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 9.67 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Card/Card.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 26 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 14.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/AnchorLink/index.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 19 (normalized: 0.99)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 8.00 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Menu/menu.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 54 (normalized: 0.97)
- **Complexity:** 2.25 (normalized: 0.98)
- **Avg. Function Length:** 13.00 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/DetailCard/DetailCard.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 32 (normalized: 0.98)
- **Complexity:** 2.50 (normalized: 0.97)
- **Avg. Function Length:** 14.50 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/utils/useLayoutBreakpoint.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 48 (normalized: 0.97)
- **Complexity:** 5.00 (normalized: 0.92)
- **Avg. Function Length:** 15.25 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/stats/metadata.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 6 (normalized: 0.20)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 48 (normalized: 0.97)
- **Complexity:** 2.75 (normalized: 0.97)
- **Avg. Function Length:** 10.00 (normalized: 0.94)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 3 (normalized: 0.85)
### ./src/pages/_app.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 18 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 13.00 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Dropdownt/Dropdownt.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 78 (normalized: 0.95)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 9.40 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/SortButton/SortButton.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 30 (normalized: 0.98)
- **Complexity:** 2.50 (normalized: 0.97)
- **Avg. Function Length:** 12.50 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/TopBarDropdown/TopBarDropdown.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 74 (normalized: 0.95)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 10.88 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/NavDropdown/NavDropdown.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 63 (normalized: 0.96)
- **Complexity:** 1.43 (normalized: 0.99)
- **Avg. Function Length:** 9.57 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Button/IconButton/IconButton.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 31 (normalized: 0.98)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 9.00 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Layout/Layout.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 39 (normalized: 0.98)
- **Complexity:** 1.80 (normalized: 0.98)
- **Avg. Function Length:** 10.20 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/cycle/Cycle/useCycleHook.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 42 (normalized: 0.97)
- **Complexity:** 1.67 (normalized: 0.99)
- **Avg. Function Length:** 16.00 (normalized: 0.90)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/validator-line-chart/ValidatorLineChart.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 44 (normalized: 0.97)
- **Complexity:** 1.33 (normalized: 0.99)
- **Avg. Function Length:** 13.67 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/utils/calculateValue.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 7 (normalized: 0.23)
- **Imported By Count:** 5 (normalized: 0.11)
- **Lines of Code:** 86 (normalized: 0.95)
- **Complexity:** 4.13 (normalized: 0.94)
- **Avg. Function Length:** 9.50 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 3 (normalized: 0.85)
### ./src/frontend/api/useCycleDetail.ts

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 20 (normalized: 0.99)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 13.00 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useReceiptDetail.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 31 (normalized: 0.98)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 13.50 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/SearchBox/SearchBox.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 36 (normalized: 0.98)
- **Complexity:** 1.67 (normalized: 0.99)
- **Avg. Function Length:** 11.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Breadcrumb/Breadcrumb.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 32 (normalized: 0.98)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 16.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Dropdownold/Dropdown.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 84 (normalized: 0.95)
- **Complexity:** 1.50 (normalized: 0.99)
- **Avg. Function Length:** 10.50 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Dropdown/Dropdown.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 85 (normalized: 0.95)
- **Complexity:** 1.50 (normalized: 0.99)
- **Avg. Function Length:** 10.63 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useContract.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 22 (normalized: 0.99)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 10.00 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/collectors/rmq/cycles.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 32 (normalized: 0.98)
- **Complexity:** 1.33 (normalized: 0.99)
- **Avg. Function Length:** 5.33 (normalized: 0.97)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/collectors/rmq/original_txs.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 32 (normalized: 0.98)
- **Complexity:** 1.33 (normalized: 0.99)
- **Avg. Function Length:** 5.33 (normalized: 0.97)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/collectors/rmq/receipts.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 32 (normalized: 0.98)
- **Complexity:** 1.33 (normalized: 0.99)
- **Avg. Function Length:** 5.33 (normalized: 0.97)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/logSubscription/Handler.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 2 (normalized: 0.94)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 126 (normalized: 0.92)
- **Complexity:** 4.75 (normalized: 0.93)
- **Avg. Function Length:** 13.88 (normalized: 0.91)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/TokenDropdown/TokenDropdown.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 81 (normalized: 0.95)
- **Complexity:** 1.50 (normalized: 0.99)
- **Avg. Function Length:** 15.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useList.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 66 (normalized: 0.96)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 22.00 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/frontend/components/MenuItem/MenuItem.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 48 (normalized: 0.97)
- **Complexity:** 3.50 (normalized: 0.95)
- **Avg. Function Length:** 22.00 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/cycle/Cycle/Cycle.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 8 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 80 (normalized: 0.95)
- **Complexity:** 1.90 (normalized: 0.98)
- **Avg. Function Length:** 3.90 (normalized: 0.98)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/LatestCycle/LatestCycle.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 55 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 24.33 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/middleware/usage.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 5 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 145 (normalized: 0.91)
- **Complexity:** 3.13 (normalized: 0.96)
- **Avg. Function Length:** 13.13 (normalized: 0.92)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Detail/useTransactionDetailHook.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 64 (normalized: 0.96)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 15.83 (normalized: 0.90)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/types/abis.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 673 (normalized: 0.57)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction-line-chart/TransactionLineChart.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 30 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 25.00 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useAccount.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 32 (normalized: 0.98)
- **Complexity:** 5.00 (normalized: 0.92)
- **Avg. Function Length:** 13.50 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/Transaction/Transaction.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 70 (normalized: 0.96)
- **Complexity:** 2.75 (normalized: 0.97)
- **Avg. Function Length:** 9.63 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/utils/decodeEVMRawTx.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 71 (normalized: 0.95)
- **Complexity:** 4.75 (normalized: 0.93)
- **Avg. Function Length:** 15.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 3 (normalized: 0.85)
### ./src/frontend/dashboard/ChartDetail/ChartDetail.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 8 (normalized: 0.76)
- **Export Count:** 3 (normalized: 0.10)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 100 (normalized: 0.94)
- **Complexity:** 1.40 (normalized: 0.99)
- **Avg. Function Length:** 15.20 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/PaginationPrevNext/PaginationPrevNext.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 42 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 30.00 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/log/Log.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 41 (normalized: 0.97)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 17.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./getStakeTxs.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 35 (normalized: 0.98)
- **Complexity:** 3.50 (normalized: 0.95)
- **Avg. Function Length:** 19.50 (normalized: 0.88)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./getUnstakeTxs.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 35 (normalized: 0.98)
- **Complexity:** 3.50 (normalized: 0.95)
- **Avg. Function Length:** 19.50 (normalized: 0.88)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Header/Header.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 86 (normalized: 0.95)
- **Complexity:** 1.78 (normalized: 0.98)
- **Avg. Function Length:** 16.33 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Pagination/Pagination.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 84 (normalized: 0.95)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 16.67 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Footer/Footer.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 74 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 26.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/sqlite3storage.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 8 (normalized: 0.27)
- **Imported By Count:** 10 (normalized: 0.22)
- **Lines of Code:** 102 (normalized: 0.94)
- **Complexity:** 2.25 (normalized: 0.98)
- **Avg. Function Length:** 10.88 (normalized: 0.93)
- **Async Functions:** 6 (normalized: 0.70)
- **Try-Catch Blocks:** 3 (normalized: 0.85)
### ./src/frontend/contract/Contract.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 9 (normalized: 0.74)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 79 (normalized: 0.95)
- **Complexity:** 1.43 (normalized: 0.99)
- **Avg. Function Length:** 9.57 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/DetailCard/useAccountDetailHook.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 61 (normalized: 0.96)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 15.40 (normalized: 0.91)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/LatestTransaction/LatestTransaction.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 68 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 33.00 (normalized: 0.80)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/index.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 3 (normalized: 0.10)
- **Imported By Count:** 5 (normalized: 0.11)
- **Lines of Code:** 103 (normalized: 0.93)
- **Complexity:** 1.80 (normalized: 0.98)
- **Avg. Function Length:** 22.40 (normalized: 0.86)
- **Async Functions:** 4 (normalized: 0.80)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/stats/coinStats.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 5 (normalized: 0.17)
- **Imported By Count:** 4 (normalized: 0.09)
- **Lines of Code:** 64 (normalized: 0.96)
- **Complexity:** 2.60 (normalized: 0.97)
- **Avg. Function Length:** 10.60 (normalized: 0.93)
- **Async Functions:** 4 (normalized: 0.80)
- **Try-Catch Blocks:** 4 (normalized: 0.80)
### ./src/stats/validatorStats.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 6 (normalized: 0.20)
- **Imported By Count:** 7 (normalized: 0.15)
- **Lines of Code:** 89 (normalized: 0.94)
- **Complexity:** 3.75 (normalized: 0.95)
- **Avg. Function Length:** 9.38 (normalized: 0.94)
- **Async Functions:** 4 (normalized: 0.80)
- **Try-Catch Blocks:** 4 (normalized: 0.80)
### ./src/stats/nodeStats.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 7 (normalized: 0.23)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 93 (normalized: 0.94)
- **Complexity:** 3.33 (normalized: 0.95)
- **Avg. Function Length:** 13.67 (normalized: 0.92)
- **Async Functions:** 5 (normalized: 0.75)
- **Try-Catch Blocks:** 5 (normalized: 0.75)
### ./src/frontend/account/Account/Account.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 10 (normalized: 0.71)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 75 (normalized: 0.95)
- **Complexity:** 1.67 (normalized: 0.99)
- **Avg. Function Length:** 7.67 (normalized: 0.95)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Logs/Logs.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 52 (normalized: 0.97)
- **Complexity:** 2.33 (normalized: 0.97)
- **Avg. Function Length:** 29.33 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/logSubscription/CollectorListener.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 46 (normalized: 0.97)
- **Complexity:** 2.17 (normalized: 0.98)
- **Avg. Function Length:** 7.00 (normalized: 0.96)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/cycle/CycleDetail/CycleDetail.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 151 (normalized: 0.90)
- **Complexity:** 2.10 (normalized: 0.98)
- **Avg. Function Length:** 17.30 (normalized: 0.89)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./getTotalRewardByAddress.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 76 (normalized: 0.95)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 26.50 (normalized: 0.84)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/ContentLayout/ContentLayout.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 8 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 52 (normalized: 0.97)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 15.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chart/LineChart/LineChart.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 152 (normalized: 0.90)
- **Complexity:** 2.17 (normalized: 0.98)
- **Avg. Function Length:** 29.00 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/SearchBar/useSearchHook.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 39 (normalized: 0.98)
- **Complexity:** 7.00 (normalized: 0.88)
- **Avg. Function Length:** 26.50 (normalized: 0.84)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/pages/_document.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 45 (normalized: 0.97)
- **Complexity:** 5.00 (normalized: 0.92)
- **Avg. Function Length:** 40.00 (normalized: 0.75)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/log/useLogHook.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 89 (normalized: 0.94)
- **Complexity:** 7.00 (normalized: 0.88)
- **Avg. Function Length:** 18.00 (normalized: 0.89)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chart/LineChart/StackedLineStockChart.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 236 (normalized: 0.85)
- **Complexity:** 3.46 (normalized: 0.95)
- **Avg. Function Length:** 24.54 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Overview/Item.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 68 (normalized: 0.96)
- **Complexity:** 2.00 (normalized: 0.98)
- **Avg. Function Length:** 47.00 (normalized: 0.71)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/stats/index.ts

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 62 (normalized: 0.96)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 61.00 (normalized: 0.62)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/stats/transactionStats.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 6 (normalized: 0.20)
- **Imported By Count:** 7 (normalized: 0.15)
- **Lines of Code:** 107 (normalized: 0.93)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 10.50 (normalized: 0.94)
- **Async Functions:** 5 (normalized: 0.75)
- **Try-Catch Blocks:** 5 (normalized: 0.75)
### ./getNodeAccountByAddress.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 82 (normalized: 0.95)
- **Complexity:** 5.25 (normalized: 0.92)
- **Avg. Function Length:** 20.50 (normalized: 0.87)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useTransaction.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 37 (normalized: 0.98)
- **Complexity:** 8.50 (normalized: 0.85)
- **Avg. Function Length:** 20.50 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/stats/sqlite3storage.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 8 (normalized: 0.76)
- **Export Count:** 7 (normalized: 0.23)
- **Imported By Count:** 6 (normalized: 0.13)
- **Lines of Code:** 89 (normalized: 0.94)
- **Complexity:** 2.31 (normalized: 0.97)
- **Avg. Function Length:** 10.23 (normalized: 0.94)
- **Async Functions:** 5 (normalized: 0.75)
- **Try-Catch Blocks:** 2 (normalized: 0.90)
### ./src/frontend/components/Chart/LineChart/LineStockChart.tsx

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 209 (normalized: 0.87)
- **Complexity:** 2.83 (normalized: 0.96)
- **Avg. Function Length:** 36.17 (normalized: 0.78)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./data_patcher.ts

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 41 (normalized: 0.97)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 24.00 (normalized: 0.85)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chart/LineChart/StackedLineChart.tsx

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 204 (normalized: 0.87)
- **Complexity:** 4.36 (normalized: 0.93)
- **Avg. Function Length:** 25.09 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/AccountInfo/AccountInfo.tsx

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 72 (normalized: 0.95)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 34.00 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/components/Chart/BarChart/BarChart.tsx

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 76 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 68.00 (normalized: 0.58)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionTable/TransactionTable.tsx

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 8 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 294 (normalized: 0.81)
- **Complexity:** 2.44 (normalized: 0.97)
- **Avg. Function Length:** 17.09 (normalized: 0.89)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/account/AccountDetail/useAccountDetailHook.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 103 (normalized: 0.93)
- **Complexity:** 7.17 (normalized: 0.88)
- **Avg. Function Length:** 24.67 (normalized: 0.85)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/messaging/rabbitmq/consumer.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 107 (normalized: 0.93)
- **Complexity:** 2.89 (normalized: 0.96)
- **Avg. Function Length:** 13.89 (normalized: 0.91)
- **Async Functions:** 7 (normalized: 0.65)
- **Try-Catch Blocks:** 3 (normalized: 0.85)
### ./src/frontend/transaction/TransactionDetail/Detail/TransactionDetail.tsx

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 12 (normalized: 0.65)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 74 (normalized: 0.95)
- **Complexity:** 2.60 (normalized: 0.97)
- **Avg. Function Length:** 20.60 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/token/useTokenHook.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 3 (normalized: 0.91)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 1 (normalized: 0.02)
- **Lines of Code:** 150 (normalized: 0.90)
- **Complexity:** 7.50 (normalized: 0.87)
- **Avg. Function Length:** 25.50 (normalized: 0.84)
- **Async Functions:** 3 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/log_server.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 9 (normalized: 0.74)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 80 (normalized: 0.95)
- **Complexity:** 1.86 (normalized: 0.98)
- **Avg. Function Length:** 13.86 (normalized: 0.91)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 2 (normalized: 0.90)
### ./src/storage/log.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 9 (normalized: 0.30)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 218 (normalized: 0.86)
- **Complexity:** 4.46 (normalized: 0.93)
- **Avg. Function Length:** 14.23 (normalized: 0.91)
- **Async Functions:** 6 (normalized: 0.70)
- **Try-Catch Blocks:** 6 (normalized: 0.70)
### ./src/frontend/dashboard/Dashboard/Dashboard.tsx

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 12 (normalized: 0.65)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 70 (normalized: 0.96)
- **Complexity:** 3.00 (normalized: 0.96)
- **Avg. Function Length:** 33.00 (normalized: 0.80)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./accountsDataToCsv.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 192 (normalized: 0.88)
- **Complexity:** 2.23 (normalized: 0.98)
- **Avg. Function Length:** 12.23 (normalized: 0.92)
- **Async Functions:** 4 (normalized: 0.80)
- **Try-Catch Blocks:** 2 (normalized: 0.90)
### ./data_sync_checker.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 6 (normalized: 0.82)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 60 (normalized: 0.96)
- **Complexity:** 8.00 (normalized: 0.86)
- **Avg. Function Length:** 46.00 (normalized: 0.72)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/validateData.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 5 (normalized: 0.11)
- **Lines of Code:** 57 (normalized: 0.96)
- **Complexity:** 11.00 (normalized: 0.80)
- **Avg. Function Length:** 41.00 (normalized: 0.75)
- **Async Functions:** 1 (normalized: 0.95)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./transactionsDataToCsv.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 8 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 253 (normalized: 0.84)
- **Complexity:** 2.67 (normalized: 0.97)
- **Avg. Function Length:** 15.33 (normalized: 0.91)
- **Async Functions:** 4 (normalized: 0.80)
- **Try-Catch Blocks:** 2 (normalized: 0.90)
### ./cyclesDataToCsv.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 235 (normalized: 0.85)
- **Complexity:** 2.81 (normalized: 0.96)
- **Avg. Function Length:** 18.88 (normalized: 0.88)
- **Async Functions:** 4 (normalized: 0.80)
- **Try-Catch Blocks:** 2 (normalized: 0.90)
### ./src/frontend/token/Token.tsx

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 10 (normalized: 0.71)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 229 (normalized: 0.85)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 40.00 (normalized: 0.75)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/utils/showMethod.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 56 (normalized: 0.96)
- **Complexity:** 26.00 (normalized: 0.50)
- **Avg. Function Length:** 31.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/cycle.ts

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 11 (normalized: 0.37)
- **Imported By Count:** 6 (normalized: 0.13)
- **Lines of Code:** 160 (normalized: 0.90)
- **Complexity:** 4.00 (normalized: 0.94)
- **Avg. Function Length:** 13.08 (normalized: 0.92)
- **Async Functions:** 9 (normalized: 0.55)
- **Try-Catch Blocks:** 8 (normalized: 0.60)
### ./src/frontend/account/AccountDetail/AccountDetail.tsx

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 14 (normalized: 0.59)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 281 (normalized: 0.82)
- **Complexity:** 3.33 (normalized: 0.95)
- **Avg. Function Length:** 30.89 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/dashboard/CardDetail/CardDetail.tsx

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 4 (normalized: 0.88)
- **Export Count:** 2 (normalized: 0.07)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 132 (normalized: 0.92)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 115.00 (normalized: 0.29)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/aggregator.ts

- **Composite Score:** 0.73 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 12 (normalized: 0.65)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 88 (normalized: 0.94)
- **Complexity:** 9.00 (normalized: 0.84)
- **Avg. Function Length:** 36.00 (normalized: 0.78)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/api/useStats.ts

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 5 (normalized: 0.85)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 93 (normalized: 0.94)
- **Complexity:** 19.00 (normalized: 0.64)
- **Avg. Function Length:** 74.00 (normalized: 0.54)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/frontend/transaction/TransactionDetail/Overview/Ovewview.tsx

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 11 (normalized: 0.68)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 383 (normalized: 0.76)
- **Complexity:** 7.67 (normalized: 0.87)
- **Avg. Function Length:** 57.44 (normalized: 0.65)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/storage/originalTxData.ts

- **Composite Score:** 0.70 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 10 (normalized: 0.33)
- **Imported By Count:** 5 (normalized: 0.11)
- **Lines of Code:** 319 (normalized: 0.80)
- **Complexity:** 9.90 (normalized: 0.82)
- **Avg. Function Length:** 27.70 (normalized: 0.83)
- **Async Functions:** 8 (normalized: 0.60)
- **Try-Catch Blocks:** 8 (normalized: 0.60)
### ./src/frontend/components/Icon/Icon.tsx

- **Composite Score:** 0.70 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 34 (normalized: 0.00)
- **Export Count:** 3 (normalized: 0.10)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 79 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/class/StatsFunctions.ts

- **Composite Score:** 0.70 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 13 (normalized: 0.62)
- **Export Count:** 9 (normalized: 0.30)
- **Imported By Count:** 2 (normalized: 0.04)
- **Lines of Code:** 614 (normalized: 0.61)
- **Complexity:** 5.24 (normalized: 0.92)
- **Avg. Function Length:** 21.53 (normalized: 0.87)
- **Async Functions:** 8 (normalized: 0.60)
- **Try-Catch Blocks:** 2 (normalized: 0.90)
### ./src/class/DataSync.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 10 (normalized: 0.71)
- **Export Count:** 16 (normalized: 0.53)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 644 (normalized: 0.59)
- **Complexity:** 9.05 (normalized: 0.84)
- **Avg. Function Length:** 31.05 (normalized: 0.81)
- **Async Functions:** 13 (normalized: 0.35)
- **Try-Catch Blocks:** 1 (normalized: 0.95)
### ./src/storage/receipt.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 10 (normalized: 0.71)
- **Export Count:** 13 (normalized: 0.43)
- **Imported By Count:** 5 (normalized: 0.11)
- **Lines of Code:** 444 (normalized: 0.72)
- **Complexity:** 6.89 (normalized: 0.88)
- **Avg. Function Length:** 23.17 (normalized: 0.86)
- **Async Functions:** 10 (normalized: 0.50)
- **Try-Catch Blocks:** 9 (normalized: 0.55)
### ./src/collector.ts

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 17 (normalized: 0.50)
- **Export Count:** 1 (normalized: 0.03)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 269 (normalized: 0.83)
- **Complexity:** 5.00 (normalized: 0.92)
- **Avg. Function Length:** 25.17 (normalized: 0.84)
- **Async Functions:** 6 (normalized: 0.70)
- **Try-Catch Blocks:** 2 (normalized: 0.90)
### ./src/storage/account.ts

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 7 (normalized: 0.79)
- **Export Count:** 17 (normalized: 0.57)
- **Imported By Count:** 5 (normalized: 0.11)
- **Lines of Code:** 377 (normalized: 0.76)
- **Complexity:** 6.50 (normalized: 0.89)
- **Avg. Function Length:** 19.33 (normalized: 0.88)
- **Async Functions:** 16 (normalized: 0.20)
- **Try-Catch Blocks:** 15 (normalized: 0.25)
### ./src/storage/transaction.ts

- **Composite Score:** 0.49 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 8 (normalized: 0.76)
- **Export Count:** 22 (normalized: 0.73)
- **Imported By Count:** 5 (normalized: 0.11)
- **Lines of Code:** 1436 (normalized: 0.09)
- **Complexity:** 12.77 (normalized: 0.77)
- **Avg. Function Length:** 38.97 (normalized: 0.76)
- **Async Functions:** 20 (normalized: 0.00)
- **Try-Catch Blocks:** 20 (normalized: 0.00)
### ./src/class/TxDecoder.ts

- **Composite Score:** 0.39 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 12 (normalized: 0.65)
- **Export Count:** 4 (normalized: 0.13)
- **Imported By Count:** 3 (normalized: 0.07)
- **Lines of Code:** 553 (normalized: 0.65)
- **Complexity:** 51.33 (normalized: 0.00)
- **Avg. Function Length:** 162.33 (normalized: 0.00)
- **Async Functions:** 2 (normalized: 0.90)
- **Try-Catch Blocks:** 8 (normalized: 0.60)
### ./src/server.ts

- **Composite Score:** 0.27 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 29 (normalized: 0.15)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 1571 (normalized: 0.00)
- **Complexity:** 28.71 (normalized: 0.45)
- **Avg. Function Length:** 119.92 (normalized: 0.26)
- **Async Functions:** 15 (normalized: 0.25)
- **Try-Catch Blocks:** 3 (normalized: 0.85)
