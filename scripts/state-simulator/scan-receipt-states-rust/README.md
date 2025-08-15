# Scan Receipt States (Rust Implementation)

A high-performance Rust implementation of the receipt state validator for Shardeum blockchain. This tool scans the receipts database to detect transaction stomping and state consistency issues.

## Features

- **Fast Processing**: Native compiled Rust for optimal performance
- **Memory Efficient**: Processes large databases with streaming pagination
- **Detailed Error Reporting**: JSON-formatted reports with comprehensive error details
- **Progress Tracking**: Visual feedback during processing (`.` per 1000 receipts, `X` on errors)

## Installation

### Build from Source

```bash
cd scan-receipt-states-rust
cargo build --release
```

The binary will be available at `./target/release/scan-receipt-states`

## Usage

```bash
# Use default database location (../superset/receipts.sqlite3)
./target/release/scan-receipt-states

# Specify custom database path
./target/release/scan-receipt-states /path/to/receipts.sqlite3

# Show help
./target/release/scan-receipt-states --help
```

## Output

The tool generates a JSON report file named `tx-stomp-<timestamp>.json` in the current directory containing:

- **startedAt**: Scan start timestamp
- **dbPath**: Path to the scanned database
- **errors**: Array of detected issues including:
  - Hash mismatches (transaction stomping)
  - Parse errors
  - Database errors
- **finishedAt**: Scan completion timestamp
- **processedCount**: Total receipts processed
- **errorCount**: Total errors detected
- **status**: Final status (complete, db_error, etc.)

## Error Types

### Hash Mismatch
Indicates a break in the cryptographic hash chain, suggesting:
- Transactions applied out of order
- State corruption
- Consensus failure

Example:
```json
{
  "type": "data_validation",
  "message": "Hash mismatch for account 0x... at timestamp 12345, cycle 100: beforeHash=0xabc..., expected=0xdef..., newBalance=10.5 ETH"
}
```

## Performance

The Rust implementation offers significant performance improvements over the JavaScript version:
- ~3-5x faster processing speed
- Lower memory footprint
- Better handling of large databases (tested with 4GB+ SQLite files)

## Technical Details

- **Pagination**: Uses keyset pagination (1000 rows per page) for memory efficiency
- **Database**: SQLite with bundled driver (no external dependencies)
- **Concurrency**: Single-threaded streaming design for consistent ordering
- **Error Handling**: Graceful error recovery with detailed reporting

## Development

### Project Structure
```
src/
├── main.rs       # CLI and orchestration
├── database.rs   # SQLite operations
├── models.rs     # Data structures
├── validator.rs  # State validation logic
└── report.rs     # JSON report generation
```

### Dependencies
- `rusqlite`: SQLite database access
- `serde_json`: JSON parsing and generation
- `clap`: Command-line argument parsing
- `chrono`: Timestamp handling
- `primitive-types`: Ethereum U256 values
- `anyhow`: Error handling

## License

Same as the parent Shardeum project