# Shardeum Ecosystem Testability Analysis

## Overview

This report provides a consolidated view of testability across 21 repositories in the Shardeum ecosystem.

- **Total Repositories Analyzed:** 21
- **Total Files Analyzed:** 1035

## Repository Summary

| Repository | Files | Easy | Moderate | Hard | Avg. Score |
|:-----------|------:|-----:|--------:|----:|-----------:|
| [shardeum-validator-gui](./reports/shardeum-validator-gui-report.md) | 123 | 95 (77.2%) | 28 (22.8%) | 0 (0.0%) | 0.78 |
| [Issuance_Dashboard](./reports/Issuance_Dashboard-report.md) | 43 | 43 (100.0%) | 0 (0.0%) | 0 (0.0%) | 0.87 |
| [monitor-client](./reports/monitor-client-report.md) | 25 | 15 (60.0%) | 8 (32.0%) | 2 (8.0%) | 0.71 |
| [lib-crypto-web](./reports/lib-crypto-web-report.md) | 4 | 1 (25.0%) | 2 (50.0%) | 1 (25.0%) | 0.63 |
| [lib-net](./reports/lib-net-report.md) | 17 | 11 (64.7%) | 5 (29.4%) | 1 (5.9%) | 0.70 |
| [lib-crypto-utils](./reports/lib-crypto-utils-report.md) | 6 | 4 (66.7%) | 1 (16.7%) | 1 (16.7%) | 0.70 |
| [faucet-server](./reports/faucet-server-report.md) | 53 | 42 (79.2%) | 10 (18.9%) | 1 (1.9%) | 0.77 |
| [distributor](./reports/distributor-report.md) | 31 | 19 (61.3%) | 11 (35.5%) | 1 (3.2%) | 0.72 |
| [tools-shardus-cli](./reports/tools-shardus-cli-report.md) | 6 | 6 (100.0%) | 0 (0.0%) | 0 (0.0%) | 0.90 |
| [faucet-client](./reports/faucet-client-report.md) | 8 | 7 (87.5%) | 1 (12.5%) | 0 (0.0%) | 0.86 |
| [explorer](./reports/explorer-report.md) | 242 | 234 (96.7%) | 6 (2.5%) | 2 (0.8%) | 0.84 |
| [data-analytics](./reports/data-analytics-report.md) | 11 | 5 (45.5%) | 3 (27.3%) | 3 (27.3%) | 0.61 |
| [collector](./reports/collector-report.md) | 64 | 54 (84.4%) | 9 (14.1%) | 1 (1.6%) | 0.79 |
| [lib-archiver-discovery](./reports/lib-archiver-discovery-report.md) | 8 | 4 (50.0%) | 3 (37.5%) | 1 (12.5%) | 0.66 |
| [monitor-server](./reports/monitor-server-report.md) | 48 | 45 (93.8%) | 3 (6.3%) | 0 (0.0%) | 0.80 |
| [lib-types](./reports/lib-types-report.md) | 28 | 27 (96.4%) | 1 (3.6%) | 0 (0.0%) | 0.86 |
| [tools-multisig-app](./reports/tools-multisig-app-report.md) | 47 | 40 (85.1%) | 6 (12.8%) | 1 (2.1%) | 0.77 |
| [tools-shardus-cli-network](./reports/tools-shardus-cli-network-report.md) | 27 | 24 (88.9%) | 3 (11.1%) | 0 (0.0%) | 0.79 |
| [tools-debug-app](./reports/tools-debug-app-report.md) | 27 | 24 (88.9%) | 2 (7.4%) | 1 (3.7%) | 0.77 |
| [json-rpc-server](./reports/json-rpc-server-report.md) | 40 | 27 (67.5%) | 12 (30.0%) | 1 (2.5%) | 0.75 |
| [shardeum](./reports/shardeum-report.md) | 177 | 175 (98.9%) | 1 (0.6%) | 1 (0.6%) | 0.85 |

## Testability Distribution Across Ecosystem

| Difficulty | Count | Percentage |
|:-----------|------:|-----------:|
| Easy       | 902 | 87.1% |
| Moderate   | 115 | 11.1% |
| Hard       | 18 | 1.7% |

## Most Testable Repositories

| Repository | Average Testability Score |
|:-----------|---------------------------:|
| tools-shardus-cli | 0.90 |
| Issuance_Dashboard | 0.87 |
| lib-types | 0.86 |
| faucet-client | 0.86 |
| shardeum | 0.85 |

## Least Testable Repositories

| Repository | Average Testability Score |
|:-----------|---------------------------:|
| data-analytics | 0.61 |
| lib-crypto-web | 0.63 |
| lib-archiver-discovery | 0.66 |
| lib-net | 0.70 |
| lib-crypto-utils | 0.70 |

## Top Priority Files Across Ecosystem

These files should be prioritized for testing based on their usage and testability difficulty.

| Repository | File | Priority Score | Testability Score |
|:-----------|:-----|---------------:|------------------:|
| lib-crypto-utils | ./index.ts | 0.92 | 0.25 |
| tools-multisig-app | ./ProposalProvider.js | 0.85 | 0.45 |
| data-analytics | ./pgStorage.ts | 0.84 | 0.48 |
| lib-archiver-discovery | ./utils.ts | 0.80 | 0.61 |
| monitor-server | ./node.ts | 0.80 | 0.44 |
| distributor | ./Config.ts | 0.75 | 0.74 |
| faucet-server | ./dao.ts | 0.74 | 0.79 |
| collector | ./index.ts | 0.73 | 0.80 |
| lib-net | ./types.ts | 0.73 | 0.82 |
| faucet-server | ./faucetClaim.repo.ts | 0.72 | 0.65 |
| json-rpc-server | ./config.ts | 0.71 | 0.87 |
| shardeum-validator-gui | ./globals.ts | 0.71 | 0.87 |
| explorer | ./index.ts | 0.71 | 0.88 |
| Issuance_Dashboard | ./range-slider.js | 0.70 | 0.90 |
| lib-types | ./P2PTypes.ts | 0.70 | 0.90 |
| tools-multisig-app | ./proposalHelper.js | 0.69 | 0.56 |
| lib-archiver-discovery | ./types.ts | 0.69 | 0.93 |
| faucet-server | ./Err.ts | 0.69 | 0.93 |
| monitor-server | ./interface.ts | 0.68 | 0.96 |
| shardeum | ./shardeumTypes.ts | 0.68 | 0.97 |
