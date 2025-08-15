use std::fs::File;
use std::io::{BufWriter, Write};
use anyhow::{Context, Result};
use chrono::Utc;
use serde_json;

use crate::models::ValidationError;

pub struct ReportWriter {
    writer: BufWriter<File>,
    report_path: String,
    started_at: String,
    db_path: String,
    first_error: bool,
}

impl ReportWriter {
    pub fn new(db_path: &str) -> Result<Self> {
        let timestamp = Utc::now().timestamp_millis();
        let report_path = format!("tx-stomp-{}.json", timestamp);
        let started_at = Utc::now().to_rfc3339();
        
        let file = File::create(&report_path)
            .with_context(|| format!("Failed to create report file: {}", report_path))?;
        let mut writer = BufWriter::with_capacity(65536, file);  // 64KB buffer
        
        // Write JSON header
        writeln!(writer, "{{")?;
        writeln!(writer, r#"  "startedAt": "{}","#, started_at)?;
        writeln!(writer, r#"  "dbPath": {},"#, serde_json::to_string(db_path)?)?;
        writeln!(writer, r#"  "errors": ["#)?;
        
        Ok(ReportWriter {
            writer,
            report_path: report_path.clone(),
            started_at,
            db_path: db_path.to_string(),
            first_error: true,
        })
    }

    pub fn write_error(&mut self, error: &ValidationError) -> Result<()> {
        if !self.first_error {
            writeln!(self.writer, ",")?;
        }
        
        let json = serde_json::to_string(error)?;
        write!(self.writer, "{}", json)?;
        self.first_error = false;
        
        // Don't flush every error for better performance
        Ok(())
    }

    pub fn write_errors(&mut self, errors: &[ValidationError]) -> Result<()> {
        for error in errors {
            self.write_error(error)?;
        }
        Ok(())
    }

    pub fn finalize(
        mut self,
        status: &str,
        processed_count: usize,
        error_count: usize,
    ) -> Result<String> {
        let finished_at = Utc::now().to_rfc3339();
        
        // Close errors array and write footer
        writeln!(self.writer)?;
        writeln!(self.writer, "  ],")?;
        writeln!(self.writer, r#"  "finishedAt": "{}","#, finished_at)?;
        writeln!(self.writer, r#"  "processedCount": {},"#, processed_count)?;
        writeln!(self.writer, r#"  "errorCount": {},"#, error_count)?;
        writeln!(self.writer, r#"  "status": {},"#, serde_json::to_string(status)?)?;
        writeln!(self.writer, r#"  "reportFile": {}"#, serde_json::to_string(&self.report_path)?)?;
        writeln!(self.writer, "}}")?;
        
        self.writer.flush()?;
        
        println!("Results saved to: {}", self.report_path);
        Ok(self.report_path.clone())
    }

    pub fn get_report_path(&self) -> &str {
        &self.report_path
    }
}

impl Drop for ReportWriter {
    fn drop(&mut self) {
        // Ensure buffer is flushed even if finalize wasn't called
        let _ = self.writer.flush();
    }
}