# State Simulator Usage Guide

## Quick Start

1. **Install dependencies**:
   ```bash
   cd scripts/state-simulator
   npm install
   ```

2. **Run the simulation**:
   ```bash
   ./run.sh simulate
   ```

## Commands

### 1. Full Simulation
Runs the complete simulation to find transactions that should be flipped:

```bash
./run.sh simulate [options]

Options:
  -i, --input <path>        Path to superset data (default: ../simulate/superset)
  -o, --output <path>       Output directory (default: ./output)
  -m, --max-flips <number>  Max flips to test (default: all)
  -a, --accounts <ids...>   Target specific accounts
```

Example:
```bash
./run.sh simulate --max-flips 100 --accounts 0x123...abc_0 0x456...def_0
```

### 2. Balance Analysis
Analyze balance mismatches without running simulation:

```bash
./run.sh analyze [options]
```

### 3. Transaction Inspection
Inspect a specific transaction:

```bash
./run.sh inspect <txId>
```

Example:
```bash
./run.sh inspect 0x7d3f9c8b5e2a1f4d6c9e8b7a5d3f2c1e9b8a7d6f
```

### 4. Database Statistics
Show database statistics:

```bash
./run.sh stats
```

## Output Files

The simulator generates several output files in the `output/` directory:

1. **simulation-report-[timestamp].json**: Complete simulation results
2. **flip-transactions-[timestamp].txt**: List of transaction IDs to flip
3. **analysis-[timestamp].json**: Balance analysis results

## Workflow

### Finding Balance Mismatches

1. First, run an analysis to understand the scope:
   ```bash
   ./run.sh analyze
   ```

2. Review the analysis output to see:
   - Number of balance mismatches
   - Failed transactions with balance changes
   - Successful transactions causing negative balances

### Running Targeted Simulations

1. For specific accounts with issues:
   ```bash
   ./run.sh simulate --accounts 0x123...abc_0 0x456...def_0
   ```

2. To limit the scope:
   ```bash
   ./run.sh simulate --max-flips 50
   ```

### Inspecting Problematic Transactions

1. From the analysis results, pick suspicious transactions
2. Inspect them individually:
   ```bash
   ./run.sh inspect 0x7d3f9c8b5e2a1f4d6c9e8b7a5d3f2c1e9b8a7d6f
   ```

## Understanding Results

### Reconciliation Score
- **100%**: All balance mismatches fully reconciled
- **> 80%**: Good reconciliation, most issues resolved
- **< 50%**: Poor reconciliation, needs investigation

### Transaction Status Flips
The simulator identifies transactions where:
- Failed transactions have balance changes (shouldn't happen)
- Successful transactions cause negative balances (invalid)

### Balance Impact
Shows how flipping transaction statuses affects account balances:
- Positive impact: Account gains balance
- Negative impact: Account loses balance

## Advanced Usage

### Custom Configuration
Create a custom config file based on `config/example.config.json`:

```json
{
  "simulation": {
    "maxFlipsToTest": 500,
    "batchSize": 50
  },
  "targetAccounts": ["0x123...abc_0"],
  "filters": {
    "minBalanceMismatch": "1000000000000000"
  }
}
```

### Debugging

Enable verbose output:
```bash
NODE_ENV=debug ./run.sh simulate
```

Check specific cycles:
```bash
./run.sh analyze --min-cycle 1000 --max-cycle 2000
```

## Troubleshooting

### "Cannot find module" errors
Ensure you're in the correct directory and dependencies are installed:
```bash
cd scripts/state-simulator
npm install
```

### "Database not found" errors
Check that the superset data exists:
```bash
ls ../simulate/superset/*.sqlite3
```

### Out of memory errors
Reduce batch size or max flips:
```bash
./run.sh simulate --max-flips 100
```