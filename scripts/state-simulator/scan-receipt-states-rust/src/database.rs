use anyhow::{Context, Result};
use rusqlite::Connection;
use crate::models::Receipt;

pub struct ReceiptDatabase {
    conn: Connection,
    page_size: usize,
}

impl ReceiptDatabase {
    pub fn new(db_path: &str, page_size: usize) -> Result<Self> {
        let conn = Connection::open(db_path)
            .with_context(|| format!("Failed to open database at {}", db_path))?;
        
        // SQLite optimizations for read-only access
        conn.pragma_update(None, "journal_mode", "OFF")?;
        conn.pragma_update(None, "synchronous", "OFF")?;
        conn.pragma_update(None, "cache_size", 100000)?;  // 100MB cache
        conn.pragma_update(None, "temp_store", "MEMORY")?;
        conn.pragma_update(None, "mmap_size", 1073741824)?; // 1GB mmap
        conn.pragma_update(None, "page_size", 8192)?;
        
        Ok(ReceiptDatabase { conn, page_size })
    }

    pub fn verify_tables(&self) -> Result<()> {
        let mut stmt = self.conn.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )?;
        
        let tables: Vec<String> = stmt
            .query_map([], |row| row.get(0))?
            .collect::<Result<Vec<_>, _>>()?;
        
        println!("Available tables: {}", tables.join(", "));
        
        if !tables.contains(&"receipts".to_string()) {
            anyhow::bail!("Table 'receipts' not found in database");
        }
        
        Ok(())
    }

    pub fn fetch_page(
        &self,
        last_timestamp: Option<i64>,
        last_rowid: Option<i64>,
    ) -> Result<Vec<Receipt>> {
        let mut receipts = Vec::with_capacity(self.page_size);
        
        if last_timestamp.is_none() {
            let mut stmt = self.conn.prepare_cached(
                "SELECT rowid as rid, timestamp, afterStates, signedReceipt, cycle 
                 FROM receipts 
                 ORDER BY timestamp ASC, rowid ASC 
                 LIMIT ?"
            )?;
            
            let rows = stmt.query_map([self.page_size], |row| {
                Ok(Receipt {
                    rid: row.get(0)?,
                    timestamp: row.get(1)?,
                    after_states: row.get(2)?,
                    signed_receipt: row.get(3)?,
                    cycle: row.get(4)?,
                })
            })?;
            
            for row in rows {
                receipts.push(row.with_context(|| "Failed to parse receipt row")?);
            }
        } else {
            let mut stmt = self.conn.prepare_cached(
                "SELECT rowid as rid, timestamp, afterStates, signedReceipt, cycle 
                 FROM receipts 
                 WHERE (timestamp > ? OR (timestamp = ? AND rowid > ?))
                 ORDER BY timestamp ASC, rowid ASC 
                 LIMIT ?"
            )?;
            
            let rows = stmt.query_map(
                rusqlite::params![
                    last_timestamp.unwrap(),
                    last_timestamp.unwrap(),
                    last_rowid.unwrap(),
                    self.page_size
                ],
                |row| {
                    Ok(Receipt {
                        rid: row.get(0)?,
                        timestamp: row.get(1)?,
                        after_states: row.get(2)?,
                        signed_receipt: row.get(3)?,
                        cycle: row.get(4)?,
                    })
                },
            )?;
            
            for row in rows {
                receipts.push(row.with_context(|| "Failed to parse receipt row")?);
            }
        }

        Ok(receipts)
    }
}

pub struct ReceiptIterator {
    db: ReceiptDatabase,
    last_timestamp: Option<i64>,
    last_rowid: Option<i64>,
    finished: bool,
}

impl ReceiptIterator {
    pub fn new(db: ReceiptDatabase) -> Self {
        ReceiptIterator {
            db,
            last_timestamp: None,
            last_rowid: None,
            finished: false,
        }
    }

    pub fn next_page(&mut self) -> Result<Vec<Receipt>> {
        if self.finished {
            return Ok(vec![]);
        }

        let receipts = self.db.fetch_page(self.last_timestamp, self.last_rowid)?;
        
        if let Some(last) = receipts.last() {
            self.last_timestamp = Some(last.timestamp);
            self.last_rowid = Some(last.rid);
        } else {
            self.finished = true;
        }

        Ok(receipts)
    }
}