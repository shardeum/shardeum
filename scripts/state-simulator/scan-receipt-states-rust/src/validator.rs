use rustc_hash::FxHashMap;
use std::io::{self, Write};
use anyhow::Result;

use crate::models::{
    AccountHashEntry, AccountLedgerEntry, AfterState, Receipt, SignedReceipt,
    ValidationError, ErrorMetadata
};

pub struct StateValidator {
    account_ledger: FxHashMap<String, AccountLedgerEntry>,
    account_hashes: FxHashMap<String, AccountHashEntry>,
    account_tx_count: FxHashMap<String, usize>,
    account_last_before_hash: FxHashMap<String, String>,
    account_prev_balance: FxHashMap<String, String>,
    processed_count: usize,
    error_count: usize,
    errors: Vec<ValidationError>,
    error_buffer_size: usize,
}

impl StateValidator {
    pub fn new() -> Self {
        StateValidator {
            account_ledger: FxHashMap::with_capacity_and_hasher(50000, Default::default()),
            account_hashes: FxHashMap::with_capacity_and_hasher(50000, Default::default()),
            account_tx_count: FxHashMap::with_capacity_and_hasher(50000, Default::default()),
            account_last_before_hash: FxHashMap::with_capacity_and_hasher(50000, Default::default()),
            account_prev_balance: FxHashMap::with_capacity_and_hasher(50000, Default::default()),
            processed_count: 0,
            error_count: 0,
            errors: Vec::with_capacity(100),
            error_buffer_size: 100,
        }
    }

    pub fn process_receipt(&mut self, receipt: &Receipt) -> Result<()> {
        self.processed_count += 1;
        
        // Print progress dot every 1000 receipts
        if self.processed_count % 1000 == 0 {
            print!(".");
            io::stdout().flush()?;
        }

        // Use SIMD JSON for faster parsing
        let mut after_states_bytes = receipt.after_states.clone().into_bytes();
        let mut signed_receipt_bytes = receipt.signed_receipt.clone().into_bytes();

        // Process afterStates
        match simd_json::serde::from_slice::<Vec<AfterState>>(&mut after_states_bytes) {
            Ok(after_states) => {
                for state in after_states.iter() {
                    if let Some(balance_str) = state.get_balance_string() {
                        // Save previous balance before updating
                        if let Some(current_entry) = self.account_ledger.get(&state.account_id) {
                            self.account_prev_balance.insert(
                                state.account_id.clone(),
                                current_entry.balance.clone(),
                            );
                        }
                        
                        self.account_ledger.insert(
                            state.account_id.clone(),
                            AccountLedgerEntry {
                                balance: balance_str,
                                last_timestamp: receipt.timestamp,
                            },
                        );
                    }
                }
                
                // Process signedReceipt with cached afterStates
                if let Err(e) = self.process_signed_receipt_with_states(
                    &mut signed_receipt_bytes, 
                    receipt, 
                    &after_states
                ) {
                    self.record_error_simple(
                        "data_validation",
                        &format!("Failed to parse signedReceipt for timestamp {}, cycle {}: {}",
                            receipt.timestamp, receipt.cycle, e),
                        None
                    );
                }
            }
            Err(e) => {
                self.record_error_simple(
                    "data_validation",
                    &format!("Failed to parse afterStates for timestamp {}, cycle {}: {}", 
                        receipt.timestamp, receipt.cycle, e),
                    None
                );
                
                // Still try to process signed receipt
                if let Err(e) = self.process_signed_receipt(&mut signed_receipt_bytes, receipt) {
                    self.record_error_simple(
                        "data_validation",
                        &format!("Failed to parse signedReceipt for timestamp {}, cycle {}: {}",
                            receipt.timestamp, receipt.cycle, e),
                        None
                    );
                }
            }
        }

        Ok(())
    }

    fn process_signed_receipt_with_states(
        &mut self,
        signed_receipt_bytes: &mut [u8],
        receipt: &Receipt,
        after_states: &[AfterState],
    ) -> Result<()> {
        let signed_receipt: SignedReceipt = simd_json::serde::from_slice(signed_receipt_bytes)?;
        
        if let Some(proposal) = signed_receipt.proposal {
            for i in 0..proposal.account_ids.len() {
                if i >= proposal.before_state_hashes.len() || i >= proposal.after_state_hashes.len() {
                    continue;
                }
                
                let account_id = &proposal.account_ids[i];
                let before_hash = &proposal.before_state_hashes[i];
                let after_hash = &proposal.after_state_hashes[i];
                
                // Increment transaction count for this account
                let current_tx_count = self.account_tx_count.get(account_id).copied().unwrap_or(0) + 1;
                self.account_tx_count.insert(account_id.clone(), current_tx_count);
                
                // Check if this is the receiver (second account in the list)
                let is_receiver = i == 1;
                
                // Get previous hash info
                let prev = self.account_hashes.get(account_id);
                let last_before_hash = self.account_last_before_hash.get(account_id);
                
                if let Some(prev) = prev {
                    if !prev.after.is_empty() && before_hash != &prev.after {
                        // Calculate detection flags
                        let is_second_tx = current_tx_count == 2;
                        let has_last_before_state = last_before_hash.map_or(false, |h| before_hash == h);
                        
                        // Get previous balance
                        let prev_balance = self.account_prev_balance.get(account_id)
                            .cloned()
                            .unwrap_or_else(|| "N/A".to_string());
                        
                        // Try to get the new balance for this account from cached afterStates
                        let new_balance = after_states
                            .iter()
                            .find(|a| a.account_id == *account_id)
                            .and_then(|a| a.get_balance_string())
                            .unwrap_or_else(|| "N/A".to_string());
                        
                        // Create error metadata
                        let error_meta = ErrorMetadata {
                            is_second_tx,
                            has_last_before_state,
                            is_receiver,
                            prev_balance,
                            tx_count: current_tx_count,
                            account_id: account_id.clone(),
                            timestamp: receipt.timestamp,
                            cycle: receipt.cycle,
                            before_hash: before_hash.clone(),
                            expected_hash: prev.after.clone(),
                            new_balance: new_balance.clone(),
                        };
                        
                        // Display appropriate indicator
                        let indicator = Self::get_error_indicator(is_second_tx, has_last_before_state, is_receiver);
                        print!("{}", indicator);
                        io::stdout().flush().unwrap_or(());
                        
                        let error_msg = format!(
                            "Hash mismatch for account {} at timestamp {}, cycle {}: beforeHash={}, expected={}, newBalance={}",
                            account_id, receipt.timestamp, receipt.cycle, before_hash, prev.after, new_balance
                        );
                        
                        self.record_error("data_validation", &error_msg, Some(error_meta));
                    }
                }
                
                // Update tracking for next iteration
                self.account_last_before_hash.insert(account_id.clone(), before_hash.clone());
                self.account_hashes.insert(
                    account_id.clone(),
                    AccountHashEntry {
                        before: before_hash.clone(),
                        after: after_hash.clone(),
                    },
                );
            }
        }
        
        Ok(())
    }

    fn process_signed_receipt(&mut self, signed_receipt_bytes: &mut [u8], receipt: &Receipt) -> Result<()> {
        let signed_receipt: SignedReceipt = simd_json::serde::from_slice(signed_receipt_bytes)?;
        
        if let Some(proposal) = signed_receipt.proposal {
            for i in 0..proposal.account_ids.len() {
                if i >= proposal.before_state_hashes.len() || i >= proposal.after_state_hashes.len() {
                    continue;
                }
                
                let account_id = &proposal.account_ids[i];
                let before_hash = &proposal.before_state_hashes[i];
                let after_hash = &proposal.after_state_hashes[i];
                
                // Increment transaction count for this account
                let current_tx_count = self.account_tx_count.get(account_id).copied().unwrap_or(0) + 1;
                self.account_tx_count.insert(account_id.clone(), current_tx_count);
                
                // Check if this is the receiver (second account in the list)
                let is_receiver = i == 1;
                
                // Get previous hash info
                let prev = self.account_hashes.get(account_id);
                let last_before_hash = self.account_last_before_hash.get(account_id);
                
                if let Some(prev) = prev {
                    if !prev.after.is_empty() && before_hash != &prev.after {
                        // Calculate detection flags
                        let is_second_tx = current_tx_count == 2;
                        let has_last_before_state = last_before_hash.map_or(false, |h| before_hash == h);
                        
                        // Get previous balance
                        let prev_balance = self.account_prev_balance.get(account_id)
                            .cloned()
                            .unwrap_or_else(|| "N/A".to_string());
                        
                        // Create error metadata
                        let error_meta = ErrorMetadata {
                            is_second_tx,
                            has_last_before_state,
                            is_receiver,
                            prev_balance,
                            tx_count: current_tx_count,
                            account_id: account_id.clone(),
                            timestamp: receipt.timestamp,
                            cycle: receipt.cycle,
                            before_hash: before_hash.clone(),
                            expected_hash: prev.after.clone(),
                            new_balance: "N/A".to_string(),
                        };
                        
                        // Display appropriate indicator
                        let indicator = Self::get_error_indicator(is_second_tx, has_last_before_state, is_receiver);
                        print!("{}", indicator);
                        io::stdout().flush().unwrap_or(());
                        
                        let error_msg = format!(
                            "Hash mismatch for account {} at timestamp {}, cycle {}: beforeHash={}, expected={}, newBalance=N/A",
                            account_id, receipt.timestamp, receipt.cycle, before_hash, prev.after
                        );
                        
                        self.record_error("data_validation", &error_msg, Some(error_meta));
                    }
                }
                
                // Update tracking for next iteration
                self.account_last_before_hash.insert(account_id.clone(), before_hash.clone());
                self.account_hashes.insert(
                    account_id.clone(),
                    AccountHashEntry {
                        before: before_hash.clone(),
                        after: after_hash.clone(),
                    },
                );
            }
        }
        
        Ok(())
    }

    fn get_error_indicator(is_second_tx: bool, has_last_before_state: bool, is_receiver: bool) -> String {
        let indicator = if is_second_tx && has_last_before_state {
            "X"
        } else if is_second_tx {
            "2"
        } else if has_last_before_state {
            "S"
        } else {
            "e"
        };
        
        if is_receiver {
            format!("{}+", indicator)
        } else {
            indicator.to_string()
        }
    }

    fn record_error(&mut self, error_type: &str, message: &str, meta: Option<ErrorMetadata>) {
        self.error_count += 1;
        
        self.errors.push(ValidationError {
            error_type: error_type.to_string(),
            message: message.to_string(),
            meta,
        });
    }
    
    fn record_error_simple(&mut self, error_type: &str, message: &str, meta: Option<ErrorMetadata>) {
        self.error_count += 1;
        // For simple errors, don't print indicator
        
        self.errors.push(ValidationError {
            error_type: error_type.to_string(),
            message: message.to_string(),
            meta,
        });
    }

    pub fn get_stats(&self) -> (usize, usize) {
        (self.processed_count, self.error_count)
    }

    pub fn take_errors(&mut self) -> Vec<ValidationError> {
        if self.errors.len() >= self.error_buffer_size {
            std::mem::take(&mut self.errors)
        } else {
            Vec::new()
        }
    }
    
    pub fn take_all_errors(&mut self) -> Vec<ValidationError> {
        std::mem::take(&mut self.errors)
    }

    pub fn print_summary(&self) {
        if self.processed_count % 1000 != 0 {
            println!(); // New line if we didn't just print a dot
        }
        println!("Scan complete. Rows processed: {}", self.processed_count);
        println!("Total errors detected: {}", self.error_count);
    }
}