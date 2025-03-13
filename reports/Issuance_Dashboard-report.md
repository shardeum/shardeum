# TypeScript Files Ranked by Testing Difficulty

This report ranks 43 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 43 | 100.0% |
| Moderate         | 0 | 0.0% |
| Hard to Test     | 0 | 0.0% |
| **Total**        | **43** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./src/components/components/assets/ra... | 0.70 | 0.90 | 3 | 1 | 1 | 23 | 1.00 |
| ./src/components/components/Emmisions... | 0.48 | 0.91 | 2 | 0 | 1 | 10662 | 1.00 |
| ./src/App.js | 0.46 | 0.96 | 2 | 3 | 2 | 11 | 1.00 |
| ./src/components/Layout.js | 0.32 | 0.72 | 1 | 11 | 1 | 66 | 1.00 |
| ./src/components/pages/Assumptions.js | 0.31 | 0.74 | 1 | 19 | 1 | 213 | 1.00 |
| ./src/components/components/LineChart... | 0.31 | 0.75 | 1 | 2 | 2 | 68 | 3.00 |
| ./src/components/components/Security.js | 0.30 | 0.77 | 1 | 14 | 1 | 1170 | 1.15 |
| ./src/components/components/DrawerLay... | 0.30 | 0.77 | 1 | 3 | 2 | 153 | 3.05 |
| ./src/components/components/Simulatio... | 0.29 | 0.79 | 1 | 12 | 1 | 861 | 1.17 |
| ./src/components/components/LineChart... | 0.29 | 0.79 | 1 | 2 | 2 | 93 | 2.50 |

## Files Not Imported By Any Other File (7)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/components/components/SimChart.js | 0.89 | 2 | 2 | 0 | 80 | 1.00 | 39.50 | 0 | 0 |
| ./postcss.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./tailwind.config.js | 0.88 | 0 | 0 | 0 | 33 | 1.00 | 0.00 | 0 | 0 |
| ./src/setupTests.js | 0.87 | 1 | 0 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/LinearCha... | 0.86 | 2 | 1 | 0 | 56 | 1.00 | 27.50 | 0 | 0 |
| ./src/App.test.js | 0.85 | 2 | 0 | 0 | 7 | 1.00 | 5.00 | 0 | 0 |
| ./src/index.js | 0.83 | 5 | 0 | 0 | 15 | 1.00 | 0.00 | 0 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./src/App.js | 0.96 | 3 | 2 | 2 | 11 | 1.00 | 7.00 | 0 | 0 |
| ./src/components/components/Distribut... | 0.94 | 0 | 1 | 1 | 22 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/RewardDat... | 0.94 | 0 | 1 | 1 | 34 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/NetworkDa... | 0.94 | 0 | 1 | 1 | 42 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/Inclusion... | 0.94 | 0 | 1 | 1 | 72 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/LinearDat... | 0.94 | 0 | 1 | 1 | 82 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/ScalingDa... | 0.94 | 0 | 1 | 1 | 82 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/MonthlySH... | 0.94 | 0 | 1 | 1 | 112 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/pages/Security.js | 0.92 | 1 | 1 | 1 | 6 | 1.00 | 5.00 | 0 | 0 |
| ./src/components/components/EthChart.js | 0.92 | 2 | 2 | 1 | 56 | 1.00 | 27.50 | 0 | 0 |
| ./src/components/components/SAChart.js | 0.92 | 2 | 2 | 1 | 56 | 1.00 | 27.50 | 0 | 0 |
| ./src/components/components/ScalingCh... | 0.92 | 2 | 2 | 1 | 56 | 1.00 | 27.50 | 0 | 0 |
| ./src/components/pages/Parameters.js | 0.91 | 2 | 1 | 1 | 7 | 1.00 | 5.00 | 0 | 0 |
| ./src/components/pages/Simulations.js | 0.91 | 2 | 1 | 1 | 7 | 1.00 | 5.00 | 0 | 0 |
| ./src/components/components/Emmisions... | 0.91 | 0 | 1 | 2 | 10662 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/assets/ra... | 0.90 | 1 | 1 | 3 | 23 | 1.00 | 11.50 | 0 | 0 |
| ./src/components/pages/Apr.js | 0.90 | 2 | 1 | 1 | 11 | 1.00 | 9.00 | 0 | 0 |
| ./src/components/components/Parameter... | 0.90 | 1 | 1 | 1 | 470 | 1.07 | 10.70 | 0 | 0 |
| ./src/components/components/AprCalc.js | 0.90 | 2 | 1 | 1 | 228 | 1.00 | 9.95 | 0 | 0 |
| ./src/reportWebVitals.js | 0.89 | 0 | 2 | 1 | 12 | 2.00 | 9.00 | 0 | 0 |
| ./src/components/components/TPSCalc.js | 0.89 | 2 | 1 | 1 | 110 | 1.00 | 12.38 | 0 | 0 |
| ./src/components/components/Stability... | 0.89 | 1 | 1 | 1 | 112 | 1.00 | 17.00 | 0 | 0 |
| ./src/components/components/SimChart.js | 0.89 | 2 | 2 | 0 | 80 | 1.00 | 39.50 | 0 | 0 |
| ./src/components/components/PieChart.js | 0.88 | 2 | 2 | 1 | 45 | 1.67 | 19.67 | 0 | 0 |
| ./postcss.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./tailwind.config.js | 0.88 | 0 | 0 | 0 | 33 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/AlgoModel... | 0.87 | 0 | 1 | 1 | 21710 | 1.00 | 0.00 | 0 | 0 |
| ./src/setupTests.js | 0.87 | 1 | 0 | 0 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/LineChart.js | 0.86 | 2 | 2 | 1 | 54 | 1.00 | 50.00 | 0 | 0 |
| ./src/components/components/LinearCha... | 0.86 | 2 | 1 | 0 | 56 | 1.00 | 27.50 | 0 | 0 |
| ./src/App.test.js | 0.85 | 2 | 0 | 0 | 7 | 1.00 | 5.00 | 0 | 0 |
| ./src/components/pages/Emissions.js | 0.84 | 9 | 1 | 1 | 83 | 1.00 | 6.36 | 0 | 0 |
| ./src/components/components/BarChart.js | 0.83 | 2 | 2 | 1 | 50 | 2.00 | 27.00 | 0 | 0 |
| ./src/index.js | 0.83 | 5 | 0 | 0 | 15 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/LineChart... | 0.82 | 2 | 2 | 1 | 71 | 1.00 | 67.00 | 0 | 0 |
| ./src/components/components/EthModelD... | 0.80 | 0 | 1 | 1 | 46820 | 1.00 | 0.00 | 0 | 0 |
| ./src/components/components/LineChart... | 0.79 | 2 | 2 | 1 | 93 | 2.50 | 26.25 | 0 | 0 |
| ./src/components/components/Simulatio... | 0.79 | 12 | 1 | 1 | 861 | 1.17 | 9.56 | 0 | 0 |
| ./src/components/components/DrawerLay... | 0.77 | 3 | 2 | 1 | 153 | 3.05 | 11.30 | 0 | 0 |
| ./src/components/components/Security.js | 0.77 | 14 | 1 | 1 | 1170 | 1.15 | 10.95 | 0 | 0 |
| ./src/components/components/LineChart... | 0.75 | 2 | 2 | 1 | 68 | 3.00 | 25.67 | 0 | 0 |
| ./src/components/pages/Assumptions.js | 0.74 | 19 | 1 | 1 | 213 | 1.00 | 7.67 | 0 | 0 |
| ./src/components/Layout.js | 0.72 | 11 | 1 | 1 | 66 | 1.00 | 51.00 | 0 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Detailed Metrics

### ./src/App.js

- **Composite Score:** 0.96 (testability)
- **Priority Score:** 0.46 (importance for testing)
- **Import Count:** 3 (normalized: 0.84)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 2 (normalized: 0.67)
- **Lines of Code:** 11 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/DistributionData.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 22 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/RewardData.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 34 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/NetworkData.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 42 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/InclusionData.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 72 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/LinearData.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 82 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/ScalingData.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 82 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/MonthlySHMData.js

- **Composite Score:** 0.94 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 112 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/pages/Security.js

- **Composite Score:** 0.92 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 1 (normalized: 0.95)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/EthChart.js

- **Composite Score:** 0.92 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 56 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 27.50 (normalized: 0.59)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/SAChart.js

- **Composite Score:** 0.92 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 56 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 27.50 (normalized: 0.59)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/ScalingChart.js

- **Composite Score:** 0.92 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 56 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 27.50 (normalized: 0.59)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/pages/Parameters.js

- **Composite Score:** 0.91 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/pages/Simulations.js

- **Composite Score:** 0.91 (testability)
- **Priority Score:** 0.25 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/EmmisionsData.js

- **Composite Score:** 0.91 (testability)
- **Priority Score:** 0.48 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 2 (normalized: 0.67)
- **Lines of Code:** 10662 (normalized: 0.77)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/assets/range-slider.js

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.70 (importance for testing)
- **Import Count:** 1 (normalized: 0.95)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 3 (normalized: 1.00)
- **Lines of Code:** 23 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 11.50 (normalized: 0.83)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/pages/Apr.js

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 11 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.00 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/Parameters.js

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 1 (normalized: 0.95)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 470 (normalized: 0.99)
- **Complexity:** 1.07 (normalized: 0.97)
- **Avg. Function Length:** 10.70 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/AprCalc.js

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 228 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 9.95 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/reportWebVitals.js

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 12 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.51)
- **Avg. Function Length:** 9.00 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/TPSCalc.js

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 110 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 12.38 (normalized: 0.82)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/StabilityFactor.js

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 1 (normalized: 0.95)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 112 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 17.00 (normalized: 0.75)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/SimChart.js

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 80 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 39.50 (normalized: 0.41)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/PieChart.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 45 (normalized: 1.00)
- **Complexity:** 1.67 (normalized: 0.67)
- **Avg. Function Length:** 19.67 (normalized: 0.71)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./postcss.config.js

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
### ./tailwind.config.js

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 33 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/AlgoModelData.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 21710 (normalized: 0.54)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/setupTests.js

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 1 (normalized: 0.95)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/LineChart.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 54 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 50.00 (normalized: 0.25)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/LinearChart.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 56 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 27.50 (normalized: 0.59)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/App.test.js

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 7 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/pages/Emissions.js

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 9 (normalized: 0.53)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 83 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.36 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/BarChart.js

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 50 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.51)
- **Avg. Function Length:** 27.00 (normalized: 0.60)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/index.js

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.74)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 15 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/LineChart2.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 71 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 67.00 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/EthModelData.js

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 46820 (normalized: 0.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/LineChart4.js

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 93 (normalized: 1.00)
- **Complexity:** 2.50 (normalized: 0.27)
- **Avg. Function Length:** 26.25 (normalized: 0.61)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/Simulations.js

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.29 (importance for testing)
- **Import Count:** 12 (normalized: 0.37)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 861 (normalized: 0.98)
- **Complexity:** 1.17 (normalized: 0.91)
- **Avg. Function Length:** 9.56 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/DrawerLayout.tsx

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.30 (importance for testing)
- **Import Count:** 3 (normalized: 0.84)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 153 (normalized: 1.00)
- **Complexity:** 3.05 (normalized: 0.00)
- **Avg. Function Length:** 11.30 (normalized: 0.83)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/Security.js

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.30 (importance for testing)
- **Import Count:** 14 (normalized: 0.26)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 1170 (normalized: 0.98)
- **Complexity:** 1.15 (normalized: 0.93)
- **Avg. Function Length:** 10.95 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/components/LineChart3.js

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 2 (normalized: 0.89)
- **Export Count:** 2 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 68 (normalized: 1.00)
- **Complexity:** 3.00 (normalized: 0.02)
- **Avg. Function Length:** 25.67 (normalized: 0.62)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/pages/Assumptions.js

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 19 (normalized: 0.00)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 213 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.67 (normalized: 0.89)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./src/components/Layout.js

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.32 (importance for testing)
- **Import Count:** 11 (normalized: 0.42)
- **Export Count:** 1 (normalized: 0.50)
- **Imported By Count:** 1 (normalized: 0.33)
- **Lines of Code:** 66 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 51.00 (normalized: 0.24)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
