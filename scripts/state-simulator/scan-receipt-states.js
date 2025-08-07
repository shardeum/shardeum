/*
Usage:
  From the repo root directory:
    node --max-old-space-size=32768 scripts/state-simulator/scan-receipt-states.js [path/to/receipts.sqlite3]

Arguments:
  [path/to/receipts.sqlite3] (optional)
    - Full or relative path to the receipts SQLite database to scan.
    - If omitted, defaults to: scripts/state-simulator/superset/receipts.sqlite3 (relative to this script).
    - If the file does not exist, the script will record an error to the report and exit.

Behavior:
  - Streams errors to a JSON report file named tx-stomp-<timestamp>.json in the current working directory.
  - Prints progress: a '.' for every 1000 receipts processed, and an 'X' immediately when an error is detected.
  - Paginates the receipts table 1000 rows at a time using keyset pagination (no OFFSET), ordered by timestamp ASC, rowid ASC.
*/
/* eslint-disable */

// Node.js script to scan receipts.sqlite3 and analyze account states and hashes
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determine DB path from CLI arg or default to superset/receipts.sqlite3
const argPath = process.argv[2];
const dbPath = argPath
  ? (path.isAbsolute(argPath) ? argPath : path.resolve(process.cwd(), argPath))
  : path.resolve(__dirname, 'superset/receipts.sqlite3');

// Reporting setup
const runTimestamp = Date.now();
const reportFilePath = path.resolve(process.cwd(), `tx-stomp-${runTimestamp}.json`);
const startedAt = new Date(runTimestamp).toISOString();
const dbPathForHeader = dbPath;
const reportStream = fs.createWriteStream(reportFilePath, { flags: 'w' });
// Write the JSON header
reportStream.write(`{
  "startedAt": "${startedAt}",
  "dbPath": ${JSON.stringify(dbPathForHeader)},
  "errors": [\n`);
let isFirstError = true;
let errorCount = 0;
let processedCount = 0;

function recordError(type, msg, meta) {
  errorCount++;
  process.stdout.write('X');
  const errObj = { type, message: msg };
  if (meta) errObj.meta = meta;
  const json = JSON.stringify(errObj);
  if (!isFirstError) reportStream.write(',\n');
  reportStream.write(json);
  isFirstError = false;
}

function writeFooterAndClose(status, totalProcessed) {
  const finishedAt = new Date().toISOString();
  const footer = `\n  ],\n  "finishedAt": "${finishedAt}",\n  "processedCount": ${typeof totalProcessed === 'number' ? totalProcessed : processedCount},\n  "errorCount": ${errorCount},\n  "status": ${JSON.stringify(status)},\n  "reportFile": ${JSON.stringify(reportFilePath)}\n}\n`;
  reportStream.end(footer);
}

// Validate DB path exists before opening
if (!fs.existsSync(dbPath)) {
  recordError('db_path', 'Database file not found', { path: dbPath });
  if (processedCount % 1000 !== 0) process.stdout.write('\n');
  console.log('Scan aborted. Database file not found.');
  console.log(`Results saved to: ${reportFilePath}`);
  writeFooterAndClose('db_file_not_found', processedCount);
  process.exit(1);
}

// Open the database after validation
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", (err, tables) => {
  if (err) {
    recordError('db_init', 'Error fetching tables', { message: err.message || String(err) });
    writeFooterAndClose('failed_db_init');
    return db.close(() => process.exit(1));
  }
  const tableNames = tables.map(t => t.name);
  console.log('Available tables:', tableNames.join(', '));
  if (!tableNames.includes('receipts')) {
    recordError('db_init', "Table 'receipts' not found. Exiting.");
    writeFooterAndClose('missing_table_receipts');
    return db.close(() => process.exit(1));
  }

  // In-memory ledgers
  const accountLedger = new Map(); // accountId -> { balance, lastTimestamp }
  const accountHashes = new Map(); // accountId -> { before, after }

  function humanReadableEthBalance(valObj) {
    if (!valObj || typeof valObj.value !== 'string') return 'N/A';
    try {
      const balBigInt = BigInt('0x' + valObj.value);
      const ethValue = Number(balBigInt) / 1e18;
      return ethValue.toFixed(8) + ' ETH';
    } catch (e) {
      return valObj.value;
    }
  }

  function logError(msg) {
    recordError('data_validation', msg);
  }

  // Progress output
  console.log('scanning receipts...');

  // Paginated processing: 1000 receipts at a time
  const PAGE_SIZE = 1000;
  let lastTs = null;
  let lastRowId = 0;

  function processPage() {
    // Build keyset pagination query
    let sql;
    let params;
    if (lastTs === null) {
      sql = `SELECT rowid as rid, timestamp, afterStates, signedReceipt, cycle
             FROM receipts
             ORDER BY timestamp ASC, rowid ASC
             LIMIT ?`;
      params = [PAGE_SIZE];
    } else {
      sql = `SELECT rowid as rid, timestamp, afterStates, signedReceipt, cycle
             FROM receipts
             WHERE (timestamp > ? OR (timestamp = ? AND rowid > ?))
             ORDER BY timestamp ASC, rowid ASC
             LIMIT ?`;
      params = [lastTs, lastTs, lastRowId, PAGE_SIZE];
    }

    db.all(sql, params, (pageErr, rows) => {
      if (pageErr) {
        recordError('db_page', 'DB error while fetching a page', { message: pageErr.message || String(pageErr) });
        if (processedCount % 1000 !== 0) process.stdout.write('\n');
        console.log(`Scan aborted due to DB error. Rows processed: ${processedCount}`);
        console.log(`Total errors detected: ${errorCount}`);
        console.log(`Results saved to: ${reportFilePath}`);
        writeFooterAndClose('db_error_page');
        return db.close();
      }

      if (!rows || rows.length === 0) {
        // done
        if (processedCount % 1000 !== 0) process.stdout.write('\n');
        console.log(`Scan complete. Rows processed: ${processedCount}`);
        console.log(`Total errors detected: ${errorCount}`);
        console.log(`Results saved to: ${reportFilePath}`);
        writeFooterAndClose('complete', processedCount);
        return db.close();
      }

      for (const row of rows) {
        // progress dot every 1000 receipts
        processedCount++;
        if (processedCount % 1000 === 0) process.stdout.write('.');

        // 1. Parse afterStates and update balances
        let afterStates;
        try {
          afterStates = JSON.parse(row.afterStates);
          if (Array.isArray(afterStates)) {
            for (const acct of afterStates) {
              const accountId = acct.accountId;
              const data = acct.data && acct.data.account;
              if (accountId && data && data.balance && data.balance.value) {
                accountLedger.set(accountId, {
                  balance: humanReadableEthBalance(data.balance),
                  lastTimestamp: row.timestamp
                });
              }
            }
          }
        } catch (e) {
          logError(`Failed to parse afterStates for timestamp ${row.timestamp}, cycle ${row.cycle}`);
        }

        // 2. Parse signedReceipt and check hashes
        try {
          const signedReceipt = JSON.parse(row.signedReceipt);
          const proposal = signedReceipt.proposal;
          if (proposal && Array.isArray(proposal.accountIDs) && Array.isArray(proposal.beforeStateHashes) && Array.isArray(proposal.afterStateHashes)) {
            for (let i = 0; i < proposal.accountIDs.length; i++) {
              const accountId = proposal.accountIDs[i];
              const beforeHash = proposal.beforeStateHashes[i];
              const afterHash = proposal.afterStateHashes[i];
              const prev = accountHashes.get(accountId);
              if (prev && prev.after && beforeHash !== prev.after) {
                // Try to get the new balance from afterStates for this accountId
                let newBalance = 'N/A';
                if (Array.isArray(afterStates)) {
                  const found = afterStates.find(a => a.accountId === accountId);
                  if (found && found.data && found.data.account && found.data.account.balance) {
                    newBalance = humanReadableEthBalance(found.data.account.balance);
                  }
                }
                logError(`Hash mismatch for account ${accountId} at timestamp ${row.timestamp}, cycle ${row.cycle}: beforeHash=${beforeHash}, expected=${prev.after}, newBalance=${newBalance}`);
              }
              accountHashes.set(accountId, { before: beforeHash, after: afterHash });
            }
          }
        } catch (e) {
          logError(`Failed to parse signedReceipt for timestamp ${row.timestamp}, cycle ${row.cycle}`);
        }
      }

      // advance cursor
      const last = rows[rows.length - 1];
      lastTs = last.timestamp;
      lastRowId = last.rid;

      // fetch next page
      processPage();
    });
  }

  // Start paginated processing
  processPage();
});
