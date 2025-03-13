# TypeScript Files Ranked by Testing Difficulty

This report ranks 123 TypeScript files by their testing difficulty, based on static code analysis. Files are ranked from easiest to hardest to test.

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
| Easy to Test     | 95 | 77.2% |
| Moderate         | 28 | 22.8% |
| Hard to Test     | 0 | 0.0% |
| **Total**        | **123** | **100%** |

## High Priority Testing Targets

These files should be prioritized for testing based on a combination of their usage (import count) and testability difficulty. 
Files that are both widely used and hard to test appear at the top of this list.

| File | Priority | Testability | Imported By | Imports | Exports | LOC | Complexity |
|:-----|----------:|------------:|-----------:|--------:|--------:|----:|------------:|
| ./globals.ts | 0.71 | 0.87 | 17 | 1 | 1 | 6 | 1.00 |
| ./useModalStore.ts | 0.67 | 0.86 | 16 | 2 | 2 | 21 | 1.43 |
| ./useToastStore.ts | 0.62 | 0.89 | 15 | 2 | 7 | 67 | 2.00 |
| ./useNodeStatus.ts | 0.58 | 0.66 | 12 | 7 | 1 | 47 | 2.33 |
| ./useNotificationsStore.ts | 0.48 | 0.74 | 10 | 1 | 5 | 77 | 3.67 |
| ./MobileModalWrapper.tsx | 0.44 | 0.75 | 9 | 4 | 1 | 96 | 4.25 |
| ./Card.tsx | 0.40 | 0.87 | 9 | 1 | 1 | 11 | 1.00 |
| ./auth.service.ts | 0.39 | 0.76 | 8 | 3 | 5 | 74 | 2.20 |
| ./FetcherContextProvider.tsx | 0.36 | 0.86 | 8 | 3 | 2 | 22 | 1.00 |
| ./fetcher.ts | 0.35 | 0.77 | 7 | 2 | 2 | 44 | 3.67 |

## Files Not Imported By Any Other File (18)

These files are not imported by any other file in the project. They might be entry points, utilities used outside the project, or potential dead code.

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./auth.ts | 0.89 | 0 | 1 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./node-settings.ts | 0.89 | 0 | 1 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./index.tsx | 0.88 | 0 | 1 | 0 | 5 | 1.00 | 5.00 | 0 | 0 |
| ./next-i18next.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./postcss.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./index.tsx | 0.87 | 2 | 1 | 0 | 8 | 1.00 | 4.50 | 0 | 0 |
| ./tailwind.config.js | 0.86 | 0 | 0 | 0 | 65 | 1.00 | 0.00 | 0 | 0 |
| ./_document.tsx | 0.85 | 1 | 1 | 0 | 18 | 1.00 | 17.00 | 0 | 0 |
| ./useNodeStatusHistory.ts | 0.83 | 3 | 1 | 0 | 41 | 1.00 | 7.25 | 2 | 0 |
| ./next.config.js | 0.82 | 0 | 1 | 0 | 49 | 1.00 | 33.00 | 1 | 0 |
| ./useNodeAlert.ts | 0.82 | 5 | 1 | 0 | 20 | 2.00 | 10.00 | 0 | 0 |
| ./index.tsx | 0.81 | 5 | 1 | 0 | 63 | 1.40 | 15.80 | 1 | 0 |
| ./index.ts | 0.78 | 12 | 0 | 0 | 60 | 1.00 | 6.50 | 0 | 0 |
| ./index.tsx | 0.78 | 4 | 1 | 0 | 71 | 2.00 | 35.00 | 0 | 0 |
| ./index.tsx | 0.68 | 15 | 2 | 0 | 116 | 3.00 | 50.00 | 0 | 0 |
| ./index.tsx | 0.64 | 9 | 1 | 0 | 172 | 3.50 | 83.00 | 0 | 0 |
| ./index.tsx | 0.60 | 29 | 2 | 0 | 322 | 1.61 | 19.72 | 2 | 0 |
| ./index.tsx | 0.54 | 22 | 1 | 0 | 466 | 4.38 | 29.44 | 2 | 0 |

## Easy to Test Files (Score >= 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./node-types.ts | 0.97 | 1 | 12 | 1 | 98 | 1.00 | 0.00 | 0 | 0 |
| ./util.ts | 0.90 | 1 | 5 | 3 | 44 | 1.00 | 7.56 | 0 | 0 |
| ./error.ts | 0.90 | 0 | 2 | 1 | 12 | 1.00 | 0.00 | 0 | 0 |
| ./useToastStore.ts | 0.89 | 2 | 7 | 15 | 67 | 2.00 | 9.90 | 0 | 0 |
| ./device.tsx | 0.89 | 1 | 3 | 7 | 24 | 1.00 | 6.50 | 0 | 0 |
| ./auth.ts | 0.89 | 0 | 1 | 0 | 3 | 1.00 | 0.00 | 0 | 0 |
| ./account-stake-info.ts | 0.89 | 0 | 1 | 1 | 4 | 1.00 | 0.00 | 0 | 0 |
| ./node-alert.ts | 0.89 | 0 | 1 | 1 | 5 | 1.00 | 0.00 | 0 | 0 |
| ./node-settings.ts | 0.89 | 0 | 1 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./node-status-history.ts | 0.89 | 0 | 1 | 1 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./node-performance.ts | 0.89 | 0 | 1 | 2 | 10 | 1.00 | 0.00 | 0 | 0 |
| ./node-version.ts | 0.89 | 0 | 1 | 2 | 11 | 1.00 | 0.00 | 0 | 0 |
| ./node-network.ts | 0.89 | 0 | 1 | 1 | 14 | 1.00 | 0.00 | 0 | 0 |
| ./async-router-handler.ts | 0.88 | 1 | 2 | 2 | 9 | 1.00 | 4.00 | 0 | 0 |
| ./useStatusUpdateStore.ts | 0.88 | 1 | 2 | 3 | 11 | 1.00 | 4.20 | 0 | 0 |
| ./is-dev.ts | 0.88 | 0 | 2 | 1 | 6 | 1.50 | 3.00 | 0 | 0 |
| ./index.tsx | 0.88 | 0 | 1 | 0 | 5 | 1.00 | 5.00 | 0 | 0 |
| ./ConfirmModalContextProvider.tsx | 0.88 | 1 | 3 | 3 | 46 | 1.00 | 11.75 | 0 | 0 |
| ./next-i18next.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./postcss.config.js | 0.88 | 0 | 0 | 0 | 6 | 1.00 | 0.00 | 0 | 0 |
| ./node-status.ts | 0.87 | 1 | 1 | 4 | 37 | 1.00 | 0.00 | 0 | 0 |
| ./globals.ts | 0.87 | 1 | 1 | 17 | 6 | 1.00 | 5.00 | 0 | 0 |
| ./sha256-hash.ts | 0.87 | 0 | 1 | 2 | 7 | 1.00 | 4.00 | 1 | 0 |
| ./Card.tsx | 0.87 | 1 | 1 | 9 | 11 | 1.00 | 7.00 | 0 | 0 |
| ./isEthersError.ts | 0.87 | 0 | 2 | 4 | 30 | 2.00 | 3.00 | 0 | 0 |
| ./index.tsx | 0.87 | 2 | 1 | 0 | 8 | 1.00 | 4.50 | 0 | 0 |
| ./tailwind.config.js | 0.86 | 0 | 0 | 0 | 65 | 1.00 | 0.00 | 0 | 0 |
| ./useModalStore.ts | 0.86 | 2 | 2 | 16 | 21 | 1.43 | 6.57 | 0 | 0 |
| ./null-placerholder.ts | 0.86 | 0 | 1 | 3 | 3 | 2.00 | 3.00 | 0 | 0 |
| ./isMetaMaskError.ts | 0.86 | 0 | 1 | 4 | 8 | 2.00 | 3.00 | 0 | 0 |
| ./Title.tsx | 0.86 | 0 | 1 | 1 | 9 | 2.00 | 5.00 | 0 | 0 |
| ./csrf.ts | 0.86 | 3 | 2 | 4 | 25 | 1.50 | 4.50 | 0 | 0 |
| ./FetcherContextProvider.tsx | 0.86 | 3 | 2 | 8 | 22 | 1.00 | 13.00 | 0 | 0 |
| ./auth.ts | 0.86 | 6 | 7 | 2 | 82 | 2.38 | 10.63 | 0 | 0 |
| ./_document.tsx | 0.85 | 1 | 1 | 0 | 18 | 1.00 | 17.00 | 0 | 0 |
| ./mapToDoughnut.tsx | 0.85 | 1 | 1 | 2 | 19 | 1.00 | 17.00 | 0 | 0 |
| ./ToastWindow.tsx | 0.85 | 2 | 1 | 2 | 29 | 1.33 | 9.00 | 0 | 0 |
| ./BgImage.tsx | 0.85 | 2 | 1 | 6 | 21 | 1.00 | 15.00 | 0 | 0 |
| ./ClipboardIcon.tsx | 0.85 | 0 | 1 | 2 | 18 | 2.00 | 14.00 | 0 | 0 |
| ./SupportDisplay.tsx | 0.84 | 1 | 1 | 1 | 16 | 2.00 | 11.00 | 0 | 0 |
| ./RedemptionSuccessModal.tsx | 0.84 | 3 | 1 | 1 | 45 | 1.00 | 13.67 | 0 | 0 |
| ./UnstakeSuccessModal.tsx | 0.84 | 3 | 1 | 1 | 45 | 1.00 | 13.67 | 0 | 0 |
| ./StepsIcon.tsx | 0.84 | 0 | 1 | 1 | 22 | 2.00 | 18.00 | 0 | 0 |
| ./ForceUnstakeSuccessModal.tsx | 0.84 | 3 | 1 | 1 | 51 | 1.00 | 15.67 | 0 | 0 |
| ./ErrorIcon.tsx | 0.83 | 0 | 1 | 2 | 26 | 2.00 | 22.00 | 0 | 0 |
| ./useNodeStatusHistory.ts | 0.83 | 3 | 1 | 0 | 41 | 1.00 | 7.25 | 2 | 0 |
| ./RewardIcon.tsx | 0.83 | 0 | 1 | 1 | 28 | 2.00 | 24.00 | 0 | 0 |
| ./error-middleware.ts | 0.83 | 3 | 1 | 1 | 28 | 2.25 | 10.00 | 0 | 0 |
| ./LoadingButton.tsx | 0.83 | 1 | 1 | 4 | 18 | 3.00 | 10.00 | 0 | 0 |
| ./security-headers.ts | 0.82 | 2 | 3 | 1 | 67 | 2.75 | 17.75 | 0 | 0 |
| ./next.config.js | 0.82 | 0 | 1 | 0 | 49 | 1.00 | 33.00 | 1 | 0 |
| ./Modal.tsx | 0.82 | 2 | 1 | 1 | 46 | 2.40 | 13.20 | 0 | 0 |
| ./useNodeAlert.ts | 0.82 | 5 | 1 | 0 | 20 | 2.00 | 10.00 | 0 | 0 |
| ./useNodePerformance.ts | 0.82 | 5 | 1 | 3 | 20 | 2.00 | 10.00 | 0 | 0 |
| ./TabButton.tsx | 0.82 | 1 | 1 | 1 | 31 | 2.67 | 17.33 | 0 | 0 |
| ./useNodeNetwork.ts | 0.82 | 5 | 1 | 4 | 22 | 2.00 | 12.00 | 0 | 0 |
| ./NotificationsWindow.tsx | 0.82 | 3 | 1 | 1 | 75 | 2.00 | 14.38 | 0 | 0 |
| ./ConfirmForceStopModal.tsx | 0.81 | 3 | 1 | 1 | 75 | 1.40 | 16.40 | 1 | 0 |
| ./NodesIcon.tsx | 0.81 | 0 | 1 | 2 | 38 | 2.00 | 34.00 | 0 | 0 |
| ./RouteGuard.tsx | 0.81 | 4 | 1 | 1 | 48 | 2.00 | 16.00 | 0 | 0 |
| ./AutoRestartNodeToggle.tsx | 0.81 | 2 | 1 | 1 | 43 | 2.00 | 19.50 | 1 | 0 |
| ./ExpansionArrow.tsx | 0.81 | 2 | 1 | 1 | 35 | 3.33 | 10.33 | 0 | 0 |
| ./LogsDisplay.tsx | 0.81 | 7 | 1 | 1 | 71 | 1.20 | 15.40 | 0 | 0 |
| ./index.tsx | 0.81 | 5 | 1 | 0 | 63 | 1.40 | 15.80 | 1 | 0 |
| ./_app.tsx | 0.80 | 16 | 7 | 5 | 113 | 1.60 | 10.20 | 0 | 0 |
| ./MobileMenu.tsx | 0.80 | 6 | 1 | 1 | 84 | 1.00 | 24.25 | 0 | 0 |
| ./ForceRemoveStake.tsx | 0.80 | 4 | 1 | 1 | 81 | 1.33 | 29.33 | 0 | 0 |
| ./useAccountStakeInfo.ts | 0.79 | 5 | 1 | 3 | 24 | 3.00 | 14.00 | 0 | 0 |
| ./NotificationBox.tsx | 0.79 | 3 | 2 | 1 | 81 | 3.25 | 19.50 | 0 | 0 |
| ./PasswordInput.tsx | 0.78 | 2 | 1 | 2 | 51 | 3.50 | 23.50 | 0 | 0 |
| ./UsageBar.tsx | 0.78 | 0 | 1 | 1 | 43 | 4.50 | 19.50 | 0 | 0 |
| ./index.ts | 0.78 | 12 | 0 | 0 | 60 | 1.00 | 6.50 | 0 | 0 |
| ./index.tsx | 0.78 | 4 | 1 | 0 | 71 | 2.00 | 35.00 | 0 | 0 |
| ./ResetPasswordForm.tsx | 0.78 | 5 | 2 | 1 | 90 | 2.67 | 27.67 | 0 | 0 |
| ./fetcher.ts | 0.77 | 2 | 2 | 7 | 44 | 3.67 | 17.00 | 3 | 0 |
| ./useSettings.ts | 0.77 | 5 | 3 | 5 | 37 | 2.00 | 22.00 | 0 | 1 |
| ./ConfirmRedemptionModal.tsx | 0.77 | 7 | 1 | 1 | 129 | 1.75 | 21.00 | 1 | 0 |
| ./auth.service.ts | 0.76 | 3 | 5 | 8 | 74 | 2.20 | 12.40 | 4 | 1 |
| ./ForceStopNode.tsx | 0.76 | 5 | 1 | 1 | 89 | 2.67 | 33.00 | 0 | 0 |
| ./ToastContextProvider.tsx | 0.76 | 3 | 2 | 4 | 202 | 1.76 | 11.41 | 0 | 1 |
| ./Pagination.tsx | 0.76 | 2 | 1 | 1 | 109 | 2.56 | 14.89 | 5 | 0 |
| ./Logo.tsx | 0.75 | 3 | 1 | 3 | 32 | 5.00 | 22.00 | 0 | 0 |
| ./ToastBox.tsx | 0.75 | 5 | 1 | 1 | 102 | 3.80 | 21.40 | 0 | 0 |
| ./MobileModalWrapper.tsx | 0.75 | 4 | 1 | 9 | 96 | 4.25 | 22.50 | 0 | 0 |
| ./NodeExitStatus.tsx | 0.75 | 3 | 1 | 1 | 38 | 5.00 | 27.00 | 0 | 0 |
| ./LoginForm.tsx | 0.74 | 9 | 1 | 1 | 114 | 3.14 | 18.14 | 0 | 0 |
| ./LogFrame.tsx | 0.74 | 4 | 1 | 1 | 89 | 3.40 | 21.00 | 3 | 0 |
| ./OverviewSidebar.tsx | 0.74 | 8 | 1 | 2 | 118 | 2.75 | 29.25 | 0 | 0 |
| ./NetworkSizeCard.tsx | 0.74 | 2 | 1 | 1 | 41 | 5.00 | 39.00 | 0 | 0 |
| ./useNotificationsStore.ts | 0.74 | 1 | 5 | 10 | 77 | 3.67 | 10.58 | 0 | 2 |
| ./api.ts | 0.72 | 9 | 2 | 1 | 111 | 2.17 | 13.67 | 1 | 1 |
| ./NodeStatusUpdate.tsx | 0.72 | 2 | 1 | 1 | 129 | 6.00 | 26.20 | 0 | 0 |
| ./ToastIcon.tsx | 0.72 | 4 | 1 | 1 | 38 | 6.00 | 31.00 | 0 | 0 |
| ./Layout.tsx | 0.71 | 7 | 1 | 1 | 117 | 3.00 | 37.00 | 2 | 0 |
| ./ConfirmUnstakeModal.tsx | 0.70 | 9 | 1 | 2 | 213 | 2.89 | 30.89 | 1 | 0 |

## Moderate Difficulty Files (0.4 <= Score < 0.7)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|
| ./InformationPopupsDisplay.tsx | 0.70 | 7 | 1 | 1 | 254 | 3.60 | 32.70 | 0 | 0 |
| ./AddStakeModal.tsx | 0.69 | 9 | 1 | 1 | 210 | 3.70 | 26.90 | 1 | 0 |
| ./useTXLogs.ts | 0.69 | 3 | 1 | 4 | 34 | 2.33 | 15.67 | 2 | 2 |
| ./useNodeVersion.ts | 0.69 | 7 | 1 | 5 | 47 | 7.50 | 16.50 | 0 | 0 |
| ./SettingsDisplay.tsx | 0.68 | 12 | 1 | 1 | 71 | 5.00 | 22.33 | 1 | 0 |
| ./usePasswordChange.ts | 0.68 | 5 | 2 | 2 | 45 | 5.00 | 33.00 | 0 | 1 |
| ./index.tsx | 0.68 | 15 | 2 | 0 | 116 | 3.00 | 50.00 | 0 | 0 |
| ./RewardsCard.tsx | 0.66 | 10 | 1 | 1 | 127 | 6.00 | 29.80 | 0 | 0 |
| ./useNodeStatus.ts | 0.66 | 7 | 1 | 12 | 47 | 2.33 | 17.67 | 2 | 2 |
| ./PasswordResetForm.tsx | 0.66 | 6 | 2 | 1 | 214 | 6.14 | 38.29 | 1 | 0 |
| ./SupportOptions.tsx | 0.66 | 8 | 1 | 2 | 128 | 1.00 | 114.00 | 0 | 0 |
| ./StatusBadge.tsx | 0.66 | 1 | 1 | 1 | 63 | 9.00 | 42.00 | 0 | 0 |
| ./StakeDisplay.tsx | 0.65 | 13 | 1 | 1 | 179 | 5.22 | 26.56 | 0 | 0 |
| ./useUnstake.ts | 0.65 | 8 | 1 | 2 | 109 | 3.43 | 25.86 | 3 | 1 |
| ./NotificationIcon.tsx | 0.64 | 5 | 1 | 1 | 53 | 9.00 | 34.00 | 0 | 0 |
| ./index.tsx | 0.64 | 9 | 1 | 0 | 172 | 3.50 | 83.00 | 0 | 0 |
| ./NodeStatusRibbon.tsx | 0.63 | 11 | 2 | 1 | 214 | 6.14 | 41.29 | 0 | 0 |
| ./useStake.ts | 0.63 | 6 | 1 | 2 | 162 | 3.33 | 29.17 | 0 | 2 |
| ./StakeForm.tsx | 0.61 | 9 | 1 | 1 | 211 | 2.44 | 24.22 | 1 | 2 |
| ./index.tsx | 0.60 | 29 | 2 | 0 | 322 | 1.61 | 19.72 | 2 | 0 |
| ./NodeStatus.tsx | 0.60 | 10 | 7 | 2 | 562 | 6.73 | 46.33 | 0 | 0 |
| ./WalletConnectButton.tsx | 0.57 | 2 | 1 | 3 | 105 | 10.00 | 77.33 | 0 | 0 |
| ./node.ts | 0.55 | 10 | 2 | 2 | 193 | 3.35 | 18.30 | 13 | 1 |
| ./index.tsx | 0.54 | 20 | 6 | 3 | 698 | 4.19 | 30.22 | 4 | 0 |
| ./index.tsx | 0.54 | 22 | 1 | 0 | 466 | 4.38 | 29.44 | 2 | 0 |
| ./RemoveStakeButton.tsx | 0.53 | 13 | 1 | 1 | 164 | 4.20 | 27.00 | 4 | 2 |
| ./useNodeLogs.ts | 0.53 | 5 | 1 | 4 | 108 | 6.75 | 43.50 | 3 | 2 |
| ./PerformanceDisplay.tsx | 0.53 | 10 | 1 | 1 | 112 | 8.00 | 102.00 | 0 | 0 |

## Hard to Test Files (Score < 0.4)

| File | Score | Imports | Exports | Imported By | LOC | Complexity | Fn Length | Async | Try-Catch |
|:-----|------:|--------:|--------:|-----------:|----:|------------:|-----------:|------:|----------:|

## Detailed Metrics

### ./node-types.ts

- **Composite Score:** 0.97 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 12 (normalized: 1.00)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 98 (normalized: 0.86)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./util.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 5 (normalized: 0.42)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 44 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.56 (normalized: 0.93)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./error.ts

- **Composite Score:** 0.90 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 12 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useToastStore.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.62 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 7 (normalized: 0.58)
- **Imported By Count:** 15 (normalized: 0.88)
- **Lines of Code:** 67 (normalized: 0.91)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 9.90 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./device.tsx

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 3 (normalized: 0.25)
- **Imported By Count:** 7 (normalized: 0.41)
- **Lines of Code:** 24 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.50 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./auth.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./account-stake-info.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 4 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node-alert.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node-settings.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node-status-history.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node-performance.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 10 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node-version.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 11 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node-network.ts

- **Composite Score:** 0.89 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 14 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./async-router-handler.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 9 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useStatusUpdateStore.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 11 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.20 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./is-dev.ts

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.08 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.50 (normalized: 0.94)
- **Avg. Function Length:** 3.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 5 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ConfirmModalContextProvider.tsx

- **Composite Score:** 0.88 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 3 (normalized: 0.25)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 46 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 11.75 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./next-i18next.config.js

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
### ./node-status.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 37 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./globals.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.71 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 17 (normalized: 1.00)
- **Lines of Code:** 6 (normalized: 1.00)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 5.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./sha256-hash.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 7 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.00 (normalized: 0.96)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./Card.tsx

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.40 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 9 (normalized: 0.53)
- **Lines of Code:** 11 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.00 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./isEthersError.ts

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 30 (normalized: 0.96)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 3.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.tsx

- **Composite Score:** 0.87 (testability)
- **Priority Score:** 0.04 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 4.50 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./tailwind.config.js

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 65 (normalized: 0.91)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 0.00 (normalized: 1.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useModalStore.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.67 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 16 (normalized: 0.94)
- **Lines of Code:** 21 (normalized: 0.97)
- **Complexity:** 1.43 (normalized: 0.95)
- **Avg. Function Length:** 6.57 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./null-placerholder.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 3 (normalized: 1.00)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 3.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./isMetaMaskError.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 8 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 3.00 (normalized: 0.97)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./Title.tsx

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 9 (normalized: 0.99)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 5.00 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./csrf.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 25 (normalized: 0.97)
- **Complexity:** 1.50 (normalized: 0.94)
- **Avg. Function Length:** 4.50 (normalized: 0.96)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./FetcherContextProvider.tsx

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.36 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 8 (normalized: 0.47)
- **Lines of Code:** 22 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 13.00 (normalized: 0.89)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./auth.ts

- **Composite Score:** 0.86 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 6 (normalized: 0.79)
- **Export Count:** 7 (normalized: 0.58)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 82 (normalized: 0.89)
- **Complexity:** 2.38 (normalized: 0.85)
- **Avg. Function Length:** 10.63 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./_document.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.05 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 18 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 17.00 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./mapToDoughnut.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 19 (normalized: 0.98)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 17.00 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ToastWindow.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 29 (normalized: 0.96)
- **Complexity:** 1.33 (normalized: 0.96)
- **Avg. Function Length:** 9.00 (normalized: 0.92)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./BgImage.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.28 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 6 (normalized: 0.35)
- **Lines of Code:** 21 (normalized: 0.97)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 15.00 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ClipboardIcon.tsx

- **Composite Score:** 0.85 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 18 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 14.00 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./SupportDisplay.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 16 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 11.00 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./RedemptionSuccessModal.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 45 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 13.67 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./UnstakeSuccessModal.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 45 (normalized: 0.94)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 13.67 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./StepsIcon.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 22 (normalized: 0.97)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 18.00 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ForceUnstakeSuccessModal.tsx

- **Composite Score:** 0.84 (testability)
- **Priority Score:** 0.09 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 51 (normalized: 0.93)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 15.67 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ErrorIcon.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 26 (normalized: 0.97)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 22.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useNodeStatusHistory.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 41 (normalized: 0.95)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 7.25 (normalized: 0.94)
- **Async Functions:** 2 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./RewardIcon.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 28 (normalized: 0.96)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 24.00 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./error-middleware.ts

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 28 (normalized: 0.96)
- **Complexity:** 2.25 (normalized: 0.86)
- **Avg. Function Length:** 10.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./LoadingButton.tsx

- **Composite Score:** 0.83 (testability)
- **Priority Score:** 0.22 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 18 (normalized: 0.98)
- **Complexity:** 3.00 (normalized: 0.78)
- **Avg. Function Length:** 10.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./security-headers.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 3 (normalized: 0.25)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 67 (normalized: 0.91)
- **Complexity:** 2.75 (normalized: 0.81)
- **Avg. Function Length:** 17.75 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./next.config.js

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 49 (normalized: 0.93)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 33.00 (normalized: 0.71)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./Modal.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 46 (normalized: 0.94)
- **Complexity:** 2.40 (normalized: 0.84)
- **Avg. Function Length:** 13.20 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useNodeAlert.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 20 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 10.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useNodePerformance.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 20 (normalized: 0.98)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 10.00 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./TabButton.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 31 (normalized: 0.96)
- **Complexity:** 2.67 (normalized: 0.81)
- **Avg. Function Length:** 17.33 (normalized: 0.85)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useNodeNetwork.ts

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.22 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 22 (normalized: 0.97)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 12.00 (normalized: 0.89)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NotificationsWindow.tsx

- **Composite Score:** 0.82 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 75 (normalized: 0.90)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 14.38 (normalized: 0.87)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ConfirmForceStopModal.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 75 (normalized: 0.90)
- **Complexity:** 1.40 (normalized: 0.96)
- **Avg. Function Length:** 16.40 (normalized: 0.86)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NodesIcon.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 38 (normalized: 0.95)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 34.00 (normalized: 0.70)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./RouteGuard.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 4 (normalized: 0.86)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 48 (normalized: 0.94)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 16.00 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./AutoRestartNodeToggle.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 43 (normalized: 0.94)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 19.50 (normalized: 0.83)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ExpansionArrow.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 35 (normalized: 0.95)
- **Complexity:** 3.33 (normalized: 0.74)
- **Avg. Function Length:** 10.33 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./LogsDisplay.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.10 (importance for testing)
- **Import Count:** 7 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 71 (normalized: 0.90)
- **Complexity:** 1.20 (normalized: 0.98)
- **Avg. Function Length:** 15.40 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.tsx

- **Composite Score:** 0.81 (testability)
- **Priority Score:** 0.06 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 63 (normalized: 0.91)
- **Complexity:** 1.40 (normalized: 0.96)
- **Avg. Function Length:** 15.80 (normalized: 0.86)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./_app.tsx

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 16 (normalized: 0.45)
- **Export Count:** 7 (normalized: 0.58)
- **Imported By Count:** 5 (normalized: 0.29)
- **Lines of Code:** 113 (normalized: 0.84)
- **Complexity:** 1.60 (normalized: 0.93)
- **Avg. Function Length:** 10.20 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./MobileMenu.tsx

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 6 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 84 (normalized: 0.88)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 24.25 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ForceRemoveStake.tsx

- **Composite Score:** 0.80 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 4 (normalized: 0.86)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 81 (normalized: 0.89)
- **Complexity:** 1.33 (normalized: 0.96)
- **Avg. Function Length:** 29.33 (normalized: 0.74)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useAccountStakeInfo.ts

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 24 (normalized: 0.97)
- **Complexity:** 3.00 (normalized: 0.78)
- **Avg. Function Length:** 14.00 (normalized: 0.88)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NotificationBox.tsx

- **Composite Score:** 0.79 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 81 (normalized: 0.89)
- **Complexity:** 3.25 (normalized: 0.75)
- **Avg. Function Length:** 19.50 (normalized: 0.83)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./PasswordInput.tsx

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 51 (normalized: 0.93)
- **Complexity:** 3.50 (normalized: 0.72)
- **Avg. Function Length:** 23.50 (normalized: 0.79)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./UsageBar.tsx

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 0 (normalized: 1.00)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 43 (normalized: 0.94)
- **Complexity:** 4.50 (normalized: 0.61)
- **Avg. Function Length:** 19.50 (normalized: 0.83)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.ts

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 12 (normalized: 0.59)
- **Export Count:** 0 (normalized: 0.00)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 60 (normalized: 0.92)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 6.50 (normalized: 0.94)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.tsx

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.07 (importance for testing)
- **Import Count:** 4 (normalized: 0.86)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 71 (normalized: 0.90)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 35.00 (normalized: 0.69)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ResetPasswordForm.tsx

- **Composite Score:** 0.78 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 90 (normalized: 0.87)
- **Complexity:** 2.67 (normalized: 0.81)
- **Avg. Function Length:** 27.67 (normalized: 0.76)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./fetcher.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.35 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 7 (normalized: 0.41)
- **Lines of Code:** 44 (normalized: 0.94)
- **Complexity:** 3.67 (normalized: 0.70)
- **Avg. Function Length:** 17.00 (normalized: 0.85)
- **Async Functions:** 3 (normalized: 0.77)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useSettings.ts

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 3 (normalized: 0.25)
- **Imported By Count:** 5 (normalized: 0.29)
- **Lines of Code:** 37 (normalized: 0.95)
- **Complexity:** 2.00 (normalized: 0.89)
- **Avg. Function Length:** 22.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./ConfirmRedemptionModal.tsx

- **Composite Score:** 0.77 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 7 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 129 (normalized: 0.82)
- **Complexity:** 1.75 (normalized: 0.92)
- **Avg. Function Length:** 21.00 (normalized: 0.82)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./auth.service.ts

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.39 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 5 (normalized: 0.42)
- **Imported By Count:** 8 (normalized: 0.47)
- **Lines of Code:** 74 (normalized: 0.90)
- **Complexity:** 2.20 (normalized: 0.87)
- **Avg. Function Length:** 12.40 (normalized: 0.89)
- **Async Functions:** 4 (normalized: 0.69)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./ForceStopNode.tsx

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 89 (normalized: 0.88)
- **Complexity:** 2.67 (normalized: 0.81)
- **Avg. Function Length:** 33.00 (normalized: 0.71)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ToastContextProvider.tsx

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.24 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 202 (normalized: 0.71)
- **Complexity:** 1.76 (normalized: 0.92)
- **Avg. Function Length:** 11.41 (normalized: 0.90)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./Pagination.tsx

- **Composite Score:** 0.76 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 109 (normalized: 0.85)
- **Complexity:** 2.56 (normalized: 0.83)
- **Avg. Function Length:** 14.89 (normalized: 0.87)
- **Async Functions:** 5 (normalized: 0.62)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./Logo.tsx

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 32 (normalized: 0.96)
- **Complexity:** 5.00 (normalized: 0.56)
- **Avg. Function Length:** 22.00 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ToastBox.tsx

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 102 (normalized: 0.86)
- **Complexity:** 3.80 (normalized: 0.69)
- **Avg. Function Length:** 21.40 (normalized: 0.81)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./MobileModalWrapper.tsx

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.44 (importance for testing)
- **Import Count:** 4 (normalized: 0.86)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 9 (normalized: 0.53)
- **Lines of Code:** 96 (normalized: 0.87)
- **Complexity:** 4.25 (normalized: 0.64)
- **Avg. Function Length:** 22.50 (normalized: 0.80)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NodeExitStatus.tsx

- **Composite Score:** 0.75 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 38 (normalized: 0.95)
- **Complexity:** 5.00 (normalized: 0.56)
- **Avg. Function Length:** 27.00 (normalized: 0.76)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./LoginForm.tsx

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 9 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 114 (normalized: 0.84)
- **Complexity:** 3.14 (normalized: 0.76)
- **Avg. Function Length:** 18.14 (normalized: 0.84)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./LogFrame.tsx

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 4 (normalized: 0.86)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 89 (normalized: 0.88)
- **Complexity:** 3.40 (normalized: 0.73)
- **Avg. Function Length:** 21.00 (normalized: 0.82)
- **Async Functions:** 3 (normalized: 0.77)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./OverviewSidebar.tsx

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 8 (normalized: 0.72)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 118 (normalized: 0.83)
- **Complexity:** 2.75 (normalized: 0.81)
- **Avg. Function Length:** 29.25 (normalized: 0.74)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NetworkSizeCard.tsx

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 41 (normalized: 0.95)
- **Complexity:** 5.00 (normalized: 0.56)
- **Avg. Function Length:** 39.00 (normalized: 0.66)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useNotificationsStore.ts

- **Composite Score:** 0.74 (testability)
- **Priority Score:** 0.48 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 5 (normalized: 0.42)
- **Imported By Count:** 10 (normalized: 0.59)
- **Lines of Code:** 77 (normalized: 0.89)
- **Complexity:** 3.67 (normalized: 0.70)
- **Avg. Function Length:** 10.58 (normalized: 0.91)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./api.ts

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 9 (normalized: 0.69)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 111 (normalized: 0.84)
- **Complexity:** 2.17 (normalized: 0.87)
- **Avg. Function Length:** 13.67 (normalized: 0.88)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./NodeStatusUpdate.tsx

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 129 (normalized: 0.82)
- **Complexity:** 6.00 (normalized: 0.44)
- **Avg. Function Length:** 26.20 (normalized: 0.77)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ToastIcon.tsx

- **Composite Score:** 0.72 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 4 (normalized: 0.86)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 38 (normalized: 0.95)
- **Complexity:** 6.00 (normalized: 0.44)
- **Avg. Function Length:** 31.00 (normalized: 0.73)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./Layout.tsx

- **Composite Score:** 0.71 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 7 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 117 (normalized: 0.84)
- **Complexity:** 3.00 (normalized: 0.78)
- **Avg. Function Length:** 37.00 (normalized: 0.68)
- **Async Functions:** 2 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./ConfirmUnstakeModal.tsx

- **Composite Score:** 0.70 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 9 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 213 (normalized: 0.70)
- **Complexity:** 2.89 (normalized: 0.79)
- **Avg. Function Length:** 30.89 (normalized: 0.73)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./InformationPopupsDisplay.tsx

- **Composite Score:** 0.70 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 7 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 254 (normalized: 0.64)
- **Complexity:** 3.60 (normalized: 0.71)
- **Avg. Function Length:** 32.70 (normalized: 0.71)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./AddStakeModal.tsx

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 9 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 210 (normalized: 0.70)
- **Complexity:** 3.70 (normalized: 0.70)
- **Avg. Function Length:** 26.90 (normalized: 0.76)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useTXLogs.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 3 (normalized: 0.90)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 34 (normalized: 0.96)
- **Complexity:** 2.33 (normalized: 0.85)
- **Avg. Function Length:** 15.67 (normalized: 0.86)
- **Async Functions:** 2 (normalized: 0.85)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./useNodeVersion.ts

- **Composite Score:** 0.69 (testability)
- **Priority Score:** 0.30 (importance for testing)
- **Import Count:** 7 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 5 (normalized: 0.29)
- **Lines of Code:** 47 (normalized: 0.94)
- **Complexity:** 7.50 (normalized: 0.28)
- **Avg. Function Length:** 16.50 (normalized: 0.86)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./SettingsDisplay.tsx

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.14 (importance for testing)
- **Import Count:** 12 (normalized: 0.59)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 71 (normalized: 0.90)
- **Complexity:** 5.00 (normalized: 0.56)
- **Avg. Function Length:** 22.33 (normalized: 0.80)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./usePasswordChange.ts

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.18 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 45 (normalized: 0.94)
- **Complexity:** 5.00 (normalized: 0.56)
- **Avg. Function Length:** 33.00 (normalized: 0.71)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./index.tsx

- **Composite Score:** 0.68 (testability)
- **Priority Score:** 0.11 (importance for testing)
- **Import Count:** 15 (normalized: 0.48)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 116 (normalized: 0.84)
- **Complexity:** 3.00 (normalized: 0.78)
- **Avg. Function Length:** 50.00 (normalized: 0.56)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./RewardsCard.tsx

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 10 (normalized: 0.66)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 127 (normalized: 0.82)
- **Complexity:** 6.00 (normalized: 0.44)
- **Avg. Function Length:** 29.80 (normalized: 0.74)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useNodeStatus.ts

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.58 (importance for testing)
- **Import Count:** 7 (normalized: 0.76)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 12 (normalized: 0.71)
- **Lines of Code:** 47 (normalized: 0.94)
- **Complexity:** 2.33 (normalized: 0.85)
- **Avg. Function Length:** 17.67 (normalized: 0.85)
- **Async Functions:** 2 (normalized: 0.85)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./PasswordResetForm.tsx

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 6 (normalized: 0.79)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 214 (normalized: 0.70)
- **Complexity:** 6.14 (normalized: 0.43)
- **Avg. Function Length:** 38.29 (normalized: 0.66)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./SupportOptions.tsx

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 8 (normalized: 0.72)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 128 (normalized: 0.82)
- **Complexity:** 1.00 (normalized: 1.00)
- **Avg. Function Length:** 114.00 (normalized: 0.00)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./StatusBadge.tsx

- **Composite Score:** 0.66 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 1 (normalized: 0.97)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 63 (normalized: 0.91)
- **Complexity:** 9.00 (normalized: 0.11)
- **Avg. Function Length:** 42.00 (normalized: 0.63)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./StakeDisplay.tsx

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 13 (normalized: 0.55)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 179 (normalized: 0.75)
- **Complexity:** 5.22 (normalized: 0.53)
- **Avg. Function Length:** 26.56 (normalized: 0.77)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useUnstake.ts

- **Composite Score:** 0.65 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 8 (normalized: 0.72)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 109 (normalized: 0.85)
- **Complexity:** 3.43 (normalized: 0.73)
- **Avg. Function Length:** 25.86 (normalized: 0.77)
- **Async Functions:** 3 (normalized: 0.77)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./NotificationIcon.tsx

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 53 (normalized: 0.93)
- **Complexity:** 9.00 (normalized: 0.11)
- **Avg. Function Length:** 34.00 (normalized: 0.70)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.tsx

- **Composite Score:** 0.64 (testability)
- **Priority Score:** 0.12 (importance for testing)
- **Import Count:** 9 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 172 (normalized: 0.76)
- **Complexity:** 3.50 (normalized: 0.72)
- **Avg. Function Length:** 83.00 (normalized: 0.27)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NodeStatusRibbon.tsx

- **Composite Score:** 0.63 (testability)
- **Priority Score:** 0.16 (importance for testing)
- **Import Count:** 11 (normalized: 0.62)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 214 (normalized: 0.70)
- **Complexity:** 6.14 (normalized: 0.43)
- **Avg. Function Length:** 41.29 (normalized: 0.64)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./useStake.ts

- **Composite Score:** 0.63 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 6 (normalized: 0.79)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 162 (normalized: 0.77)
- **Complexity:** 3.33 (normalized: 0.74)
- **Avg. Function Length:** 29.17 (normalized: 0.74)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./StakeForm.tsx

- **Composite Score:** 0.61 (testability)
- **Priority Score:** 0.17 (importance for testing)
- **Import Count:** 9 (normalized: 0.69)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 211 (normalized: 0.70)
- **Complexity:** 2.44 (normalized: 0.84)
- **Avg. Function Length:** 24.22 (normalized: 0.79)
- **Async Functions:** 1 (normalized: 0.92)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./index.tsx

- **Composite Score:** 0.60 (testability)
- **Priority Score:** 0.13 (importance for testing)
- **Import Count:** 29 (normalized: 0.00)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 322 (normalized: 0.54)
- **Complexity:** 1.61 (normalized: 0.93)
- **Avg. Function Length:** 19.72 (normalized: 0.83)
- **Async Functions:** 2 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./NodeStatus.tsx

- **Composite Score:** 0.60 (testability)
- **Priority Score:** 0.21 (importance for testing)
- **Import Count:** 10 (normalized: 0.66)
- **Export Count:** 7 (normalized: 0.58)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 562 (normalized: 0.20)
- **Complexity:** 6.73 (normalized: 0.36)
- **Avg. Function Length:** 46.33 (normalized: 0.59)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./WalletConnectButton.tsx

- **Composite Score:** 0.57 (testability)
- **Priority Score:** 0.26 (importance for testing)
- **Import Count:** 2 (normalized: 0.93)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 105 (normalized: 0.85)
- **Complexity:** 10.00 (normalized: 0.00)
- **Avg. Function Length:** 77.33 (normalized: 0.32)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./node.ts

- **Composite Score:** 0.55 (testability)
- **Priority Score:** 0.23 (importance for testing)
- **Import Count:** 10 (normalized: 0.66)
- **Export Count:** 2 (normalized: 0.17)
- **Imported By Count:** 2 (normalized: 0.12)
- **Lines of Code:** 193 (normalized: 0.73)
- **Complexity:** 3.35 (normalized: 0.74)
- **Avg. Function Length:** 18.30 (normalized: 0.84)
- **Async Functions:** 13 (normalized: 0.00)
- **Try-Catch Blocks:** 1 (normalized: 0.50)
### ./index.tsx

- **Composite Score:** 0.54 (testability)
- **Priority Score:** 0.27 (importance for testing)
- **Import Count:** 20 (normalized: 0.31)
- **Export Count:** 6 (normalized: 0.50)
- **Imported By Count:** 3 (normalized: 0.18)
- **Lines of Code:** 698 (normalized: 0.00)
- **Complexity:** 4.19 (normalized: 0.65)
- **Avg. Function Length:** 30.22 (normalized: 0.73)
- **Async Functions:** 4 (normalized: 0.69)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./index.tsx

- **Composite Score:** 0.54 (testability)
- **Priority Score:** 0.15 (importance for testing)
- **Import Count:** 22 (normalized: 0.24)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 0 (normalized: 0.00)
- **Lines of Code:** 466 (normalized: 0.33)
- **Complexity:** 4.38 (normalized: 0.63)
- **Avg. Function Length:** 29.44 (normalized: 0.74)
- **Async Functions:** 2 (normalized: 0.85)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
### ./RemoveStakeButton.tsx

- **Composite Score:** 0.53 (testability)
- **Priority Score:** 0.19 (importance for testing)
- **Import Count:** 13 (normalized: 0.55)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 164 (normalized: 0.77)
- **Complexity:** 4.20 (normalized: 0.64)
- **Avg. Function Length:** 27.00 (normalized: 0.76)
- **Async Functions:** 4 (normalized: 0.69)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./useNodeLogs.ts

- **Composite Score:** 0.53 (testability)
- **Priority Score:** 0.31 (importance for testing)
- **Import Count:** 5 (normalized: 0.83)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 4 (normalized: 0.24)
- **Lines of Code:** 108 (normalized: 0.85)
- **Complexity:** 6.75 (normalized: 0.36)
- **Avg. Function Length:** 43.50 (normalized: 0.62)
- **Async Functions:** 3 (normalized: 0.77)
- **Try-Catch Blocks:** 2 (normalized: 0.00)
### ./PerformanceDisplay.tsx

- **Composite Score:** 0.53 (testability)
- **Priority Score:** 0.20 (importance for testing)
- **Import Count:** 10 (normalized: 0.66)
- **Export Count:** 1 (normalized: 0.08)
- **Imported By Count:** 1 (normalized: 0.06)
- **Lines of Code:** 112 (normalized: 0.84)
- **Complexity:** 8.00 (normalized: 0.22)
- **Avg. Function Length:** 102.00 (normalized: 0.11)
- **Async Functions:** 0 (normalized: 1.00)
- **Try-Catch Blocks:** 0 (normalized: 1.00)
