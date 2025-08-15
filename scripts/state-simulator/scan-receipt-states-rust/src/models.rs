use serde::{Deserialize, Serialize};
use primitive_types::U256;

#[derive(Debug, Clone)]
pub struct AccountLedgerEntry {
    pub balance: String,
    pub last_timestamp: i64,
}

#[derive(Debug, Clone)]
pub struct AccountHashEntry {
    pub before: String,
    pub after: String,
}

#[derive(Debug, Clone)]
pub struct Receipt {
    pub rid: i64,
    pub timestamp: i64,
    pub after_states: String,
    pub signed_receipt: String,
    pub cycle: i64,
}

#[derive(Debug, Deserialize)]
pub struct AfterState {
    #[serde(rename = "accountId")]
    pub account_id: String,
    pub data: Option<AccountData>,
}

#[derive(Debug, Deserialize)]
pub struct AccountData {
    pub account: Option<Account>,
}

#[derive(Debug, Deserialize)]
pub struct Account {
    pub balance: Option<Balance>,
}

#[derive(Debug, Deserialize)]
pub struct Balance {
    pub value: String,
}

#[derive(Debug, Deserialize)]
pub struct SignedReceipt {
    pub proposal: Option<Proposal>,
}

#[derive(Debug, Deserialize)]
pub struct Proposal {
    #[serde(rename = "accountIDs")]
    pub account_ids: Vec<String>,
    #[serde(rename = "beforeStateHashes")]
    pub before_state_hashes: Vec<String>,
    #[serde(rename = "afterStateHashes")]
    pub after_state_hashes: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ValidationError {
    #[serde(rename = "type")]
    pub error_type: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<ErrorMetadata>,
}

#[derive(Debug, Serialize)]
pub struct ErrorMetadata {
    #[serde(rename = "isSecondTX")]
    pub is_second_tx: bool,
    #[serde(rename = "hasLastBeforeState")]
    pub has_last_before_state: bool,
    #[serde(rename = "isReceiver")]
    pub is_receiver: bool,
    #[serde(rename = "prevBalance")]
    pub prev_balance: String,
    #[serde(rename = "txCount")]
    pub tx_count: usize,
    #[serde(rename = "accountId")]
    pub account_id: String,
    pub timestamp: i64,
    pub cycle: i64,
    #[serde(rename = "beforeHash")]
    pub before_hash: String,
    #[serde(rename = "expectedHash")]
    pub expected_hash: String,
    #[serde(rename = "newBalance")]
    pub new_balance: String,
}

#[derive(Debug, Serialize)]
pub struct Report {
    #[serde(rename = "startedAt")]
    pub started_at: String,
    #[serde(rename = "dbPath")]
    pub db_path: String,
    pub errors: Vec<ValidationError>,
    #[serde(rename = "finishedAt")]
    pub finished_at: String,
    #[serde(rename = "processedCount")]
    pub processed_count: usize,
    #[serde(rename = "errorCount")]
    pub error_count: usize,
    pub status: String,
    #[serde(rename = "reportFile")]
    pub report_file: String,
}

impl AfterState {
    pub fn get_balance_string(&self) -> Option<String> {
        self.data
            .as_ref()
            .and_then(|d| d.account.as_ref())
            .and_then(|a| a.balance.as_ref())
            .map(|b| human_readable_eth_balance(&b.value))
    }
}

pub fn human_readable_eth_balance(hex_value: &str) -> String {
    if !hex_value.starts_with("0x") && !hex_value.starts_with("0X") {
        let hex_str = if hex_value.len() > 0 { hex_value } else { "0" };
        match U256::from_str_radix(hex_str, 16) {
            Ok(value) => {
                let eth = value.as_u128() as f64 / 1e18;
                format!("{:.8} ETH", eth)
            }
            Err(_) => hex_value.to_string(),
        }
    } else {
        let hex_str = if hex_value.len() > 2 { &hex_value[2..] } else { "0" };
        match U256::from_str_radix(hex_str, 16) {
            Ok(value) => {
                let eth = value.as_u128() as f64 / 1e18;
                format!("{:.8} ETH", eth)
            }
            Err(_) => hex_value.to_string(),
        }
    }
}