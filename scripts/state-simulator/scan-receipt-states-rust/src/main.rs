mod database;
mod models;
mod report;
mod validator;

use std::path::{Path, PathBuf};
use anyhow::Result;
use clap::Parser;

use database::{ReceiptDatabase, ReceiptIterator};
use report::ReportWriter;
use validator::StateValidator;

#[derive(Parser, Debug)]
#[command(
    name = "scan-receipt-states",
    about = "Blockchain state consistency validator for Shardeum receipts",
    long_about = r#"
Scans receipts.sqlite3 database to validate account state transitions and detect transaction stomping.

Usage:
  scan-receipt-states [path/to/receipts.sqlite3]

Arguments:
  [path/to/receipts.sqlite3] (optional)
    - Full or relative path to the receipts SQLite database to scan.
    - If omitted, defaults to: ../superset/receipts.sqlite3 (relative to executable).
    - If the file does not exist, the script will record an error and exit.

Behavior:
  - Streams errors to a JSON report file named tx-stomp-<timestamp>.json in the current directory.
  - Prints progress: a '.' for every 1000 receipts processed, and an 'X' when an error is detected.
  - Paginates the receipts table 1000 rows at a time using keyset pagination.
"#
)]
struct Args {
    /// Path to the receipts SQLite database
    #[arg(value_name = "DATABASE")]
    db_path: Option<PathBuf>,
}

const PAGE_SIZE: usize = 5000;  // Increased for better throughput

fn main() -> Result<()> {
    let args = Args::parse();
    
    // Determine database path
    let db_path = if let Some(path) = args.db_path {
        if path.is_absolute() {
            path
        } else {
            std::env::current_dir()?.join(path)
        }
    } else {
        // Default to ../superset/receipts.sqlite3 relative to executable
        let exe_path = std::env::current_exe()?;
        let exe_dir = exe_path.parent().unwrap_or(Path::new("."));
        exe_dir.join("../superset/receipts.sqlite3")
    };
    
    let db_path_str = db_path.to_string_lossy();
    
    // Initialize report writer
    let mut report_writer = ReportWriter::new(&db_path_str)?;
    
    // Check if database file exists
    if !db_path.exists() {
        eprintln!("Database file not found: {}", db_path_str);
        let error = models::ValidationError {
            error_type: "db_path".to_string(),
            message: "Database file not found".to_string(),
            meta: None,
        };
        report_writer.write_error(&error)?;
        report_writer.finalize("db_file_not_found", 0, 1)?;
        std::process::exit(1);
    }
    
    // Open database and verify tables
    let db = match ReceiptDatabase::new(&db_path_str, PAGE_SIZE) {
        Ok(db) => db,
        Err(e) => {
            eprintln!("Failed to open database: {}", e);
            let error = models::ValidationError {
                error_type: "db_init".to_string(),
                message: format!("Failed to open database: {}", e),
                meta: None,
            };
            report_writer.write_error(&error)?;
            report_writer.finalize("failed_db_init", 0, 1)?;
            std::process::exit(1);
        }
    };
    
    if let Err(e) = db.verify_tables() {
        eprintln!("Database verification failed: {}", e);
        let error = models::ValidationError {
            error_type: "db_init".to_string(),
            message: e.to_string(),
            meta: None,
        };
        report_writer.write_error(&error)?;
        report_writer.finalize("missing_table_receipts", 0, 1)?;
        std::process::exit(1);
    }
    
    // Initialize validator and iterator
    let mut validator = StateValidator::new();
    let mut iterator = ReceiptIterator::new(db);
    
    println!("scanning receipts...");
    
    // Process all receipts
    loop {
        match iterator.next_page() {
            Ok(receipts) => {
                if receipts.is_empty() {
                    break;
                }
                
                for receipt in receipts {
                    if let Err(e) = validator.process_receipt(&receipt) {
                        eprintln!("\nError processing receipt: {}", e);
                        let error = models::ValidationError {
                            error_type: "processing".to_string(),
                            message: e.to_string(),
                            meta: None,
                        };
                        report_writer.write_error(&error)?;
                    }
                    
                    // Write accumulated errors to report (buffered)
                    let errors = validator.take_errors();
                    if !errors.is_empty() {
                        report_writer.write_errors(&errors)?;
                    }
                }
            }
            Err(e) => {
                eprintln!("\nDatabase error: {}", e);
                let error = models::ValidationError {
                    error_type: "db_page".to_string(),
                    message: format!("DB error while fetching a page: {}", e),
                    meta: None,
                };
                report_writer.write_error(&error)?;
                
                let (processed, errors) = validator.get_stats();
                validator.print_summary();
                report_writer.finalize("db_error_page", processed, errors)?;
                std::process::exit(1);
            }
        }
    }
    
    // Write any remaining errors
    let remaining_errors = validator.take_all_errors();
    if !remaining_errors.is_empty() {
        report_writer.write_errors(&remaining_errors)?;
    }
    
    // Finalize
    let (processed, errors) = validator.get_stats();
    validator.print_summary();
    report_writer.finalize("complete", processed, errors)?;
    
    Ok(())
}