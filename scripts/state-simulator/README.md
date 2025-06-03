# Blockchain State Simulator

A tool for simulating blockchain state by replaying processed transactions to identify and reconcile balance mismatches.

## Overview

This simulator:
1. Replays already processed transactions
2. Identifies mismatched balances between receipts and account database
3. Simulates flipping transaction statuses (failure to success) to find incorrectly marked failures
4. Runs full simulations across affected accounts
5. Outputs transaction IDs that should be marked as success to reconcile balances

## Project Structure

```
state-simulator/
├── src/
│   ├── index.ts           # Main entry point
│   ├── database/          # Database interfaces
│   ├── replay/            # Transaction replay logic
│   ├── analyzer/          # Balance mismatch analysis
│   ├── simulator/         # State simulation engine
│   └── types/             # TypeScript types
├── config/                # Configuration files
├── output/                # Simulation results
└── package.json
```

## Usage

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the simulator
npm run simulate -- --input ../simulate/superset --output ./output

# Analyze specific transactions
npm run analyze -- --tx-id <transaction_id>
```

## Configuration

The simulator uses the existing blockchain data from `scripts/simulate/superset/`:
- `accounts.sqlite3` - Account states
- `transactions.sqlite3` - Transaction data  
- `receipts.sqlite3` - Transaction receipts
- `accounts_ledger.sqlite3` - Balance history

## Output

The simulator generates:
- List of transaction IDs to flip from failure to success
- Balance reconciliation report
- Detailed simulation logs