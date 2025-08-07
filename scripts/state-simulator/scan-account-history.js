// Node.js script to scan receipts.sqlite3 for specific accountIDs and check amountSpent vs balance changes
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// List of account IDs to observe (edit as needed)
const observedAccounts = [
  '0d0707963952f2fba59dd06f2b425ace40b492fe000000000000000000000000',
  // Add more account IDs here
];

const dbPath = path.resolve(__dirname, 'superset/receipts.sqlite3');
const db = new sqlite3.Database(dbPath);

// Track how many times each observed account is seen
const accountSeenCount = Object.fromEntries(observedAccounts.map(id => [id, 0]));
let errorCount = 0;

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

function parseHexBigInt(val) {
  try {
    return BigInt(val.startsWith('0x') ? val : '0x' + val);
  } catch (e) {
    return null;
  }
}

const query = 'SELECT timestamp, afterStates, signedReceipt, appReceiptData, cycle FROM receipts ORDER BY timestamp ASC';
db.each(query, (err, row) => {
  if (err) {
    console.error('DB error:', err);
    return;
  }

  let afterStates, appReceiptData;
  try {
    afterStates = JSON.parse(row.afterStates);
  } catch (e) {
    afterStates = [];
  }
  try {
    appReceiptData = JSON.parse(row.appReceiptData);
  } catch (e) {
    appReceiptData = null;
  }

  // Check for observed accounts in afterStates
  for (const acct of afterStates) {
    const accountId = acct.accountId;
    if (!observedAccounts.includes(accountId)) continue;
    accountSeenCount[accountId] = (accountSeenCount[accountId] || 0) + 1;
    const data = acct.data && acct.data.account;
    if (!data || !data.balance || !data.balance.value) continue;
    // Find before and after balances
    let beforeBalance = null, afterBalance = null, amountSpent = null;
    // Try to get before balance from signedReceipt (if available)
    let signedReceipt;
    try {
      signedReceipt = JSON.parse(row.signedReceipt);
    } catch (e) {}
    if (signedReceipt && signedReceipt.proposal && Array.isArray(signedReceipt.proposal.accountIDs)) {
      const idx = signedReceipt.proposal.accountIDs.indexOf(accountId);
      if (idx !== -1 && signedReceipt.proposal.beforeStateHashes && signedReceipt.proposal.afterStateHashes) {
        // Try to get before/after balances from afterStates and previous state
        afterBalance = parseHexBigInt(data.balance.value);
        // Try to get before balance from previous afterStates (not available in this row, so just log after for now)
      }
    }
    // Try to get amountSpent from appReceiptData
    if (appReceiptData  && appReceiptData.data && appReceiptData.data.amountSpent) {
      amountSpent = parseHexBigInt(appReceiptData.data.amountSpent);
    }
    // Try to get transfer value from readableReceipt if present
    let transferValue = null;
    if (appReceiptData && appReceiptData.data && appReceiptData.data.readableReceipt && appReceiptData.data.readableReceipt.value) {
      transferValue = parseHexBigInt(appReceiptData.data.readableReceipt.value);
    }
    // Log info
    console.log(`Account ${accountId} at timestamp ${row.timestamp}, cycle ${row.cycle}`);
    console.log(`  After balance: ${humanReadableEthBalance(data.balance)}`);
    if (amountSpent !== null) {
      console.log(`  Amount spent: ${amountSpent} wei (${Number(amountSpent)/1e18} ETH)`);
    }
    if (transferValue !== null) {
      console.log(`  Transfer value: ${transferValue} wei (${Number(transferValue)/1e18} ETH)`);
    }
    // If you have beforeBalance, compare
    // (In this script, beforeBalance is not available unless you build a running ledger)
    // You can extend this to keep a running ledger if needed
    // If transferValue is present, check if before/after balances add up
    if (transferValue !== null && afterBalance !== null) {
      // You need beforeBalance to do the check, but it's not available in this row
      // So, let's keep a running ledger for each account
      if (!acct._lastBalance) {
        acct._lastBalance = afterBalance;
        // Print before balance for first step (same as after)
        console.log(`  Before balance: ${humanReadableEthBalance({value: afterBalance.toString(16)})} (initial)`);
      } else {
        const beforeBalance = acct._lastBalance;
        console.log(`  Before balance: ${humanReadableEthBalance({value: beforeBalance.toString(16)})}`);
        const plusTransfer = beforeBalance + transferValue;
        const minusTransfer = beforeBalance - transferValue;
        let match = false;
        if (plusTransfer === afterBalance) {
          console.log(`  [CHECK] afterBalance = beforeBalance + transferValue (${humanReadableEthBalance({value: beforeBalance.toString(16)})} + ${Number(transferValue)/1e18} ETH)`);
          match = true;
        }
        if (minusTransfer === afterBalance) {
          console.log(`  [CHECK] afterBalance = beforeBalance - transferValue (${humanReadableEthBalance({value: beforeBalance.toString(16)})} - ${Number(transferValue)/1e18} ETH)`);
          match = true;
        }
        if (!match) {
          console.log(`  [CHECK] afterBalance does NOT match beforeBalance +/- transferValue.`);
          errorCount++;
        }
        acct._lastBalance = afterBalance;
      }
    }
    console.log('---');
  }
}, (err, count) => {
  if (err) {
    console.error('Final DB error:', err);
  } else {
    console.log(`\nScan complete. Rows processed: ${count}`);
    console.log('Account observation summary:');
    for (const id of observedAccounts) {
      console.log(`  ${id}: seen ${accountSeenCount[id]} times`);
    }
    console.log(`Total errors detected: ${errorCount}`);
  }
  db.close();
});
