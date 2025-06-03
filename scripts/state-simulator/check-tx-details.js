const Database = require('better-sqlite3')
const path = require('path')

const txDb = new Database(path.join(__dirname, '../simulate/superset/transactions.sqlite3'), { readonly: true })
const ledgerDb = new Database(path.join(__dirname, '../simulate/superset/accounts_ledger.sqlite3'), { readonly: true })

const txId = '68ec28525b23993f59df6ad417d231f6bf0fcc208c96fa43ea75d9bd1b41d426'
const txStmt = txDb.prepare('SELECT * FROM transactions WHERE txId = ?')
const tx = txStmt.get(txId)

if (tx) {
  const txData = JSON.parse(tx.data)
  console.log('Transaction details:')
  console.log('From:', txData.from)
  console.log('To:', txData.to)
  console.log('Value:', txData.value)
  console.log('Gas:', txData.gas || txData.gasLimit)
  console.log('Gas Price:', txData.gasPrice || txData.maxFeePerGas)
  console.log('Status:', txData.readableReceipt?.status)

  if (txData.readableReceipt) {
    console.log('\nReadable Receipt:')
    console.log('From:', txData.readableReceipt.from)
    console.log('To:', txData.readableReceipt.to)
    console.log('Value:', txData.readableReceipt.value)
  }

  const ledgerStmt = ledgerDb.prepare('SELECT * FROM accounts_ledger WHERE receiptId = ?')
  const entries = ledgerStmt.all(txId)

  console.log('\nLedger entries:')
  entries.forEach((entry) => {
    console.log(`  Account: ${entry.accountId}`)
    console.log(`  Eth Address: ${entry.eth_address}`)
    console.log(`  Balance change: ${entry.balance_change}`)
    console.log(`  Final balance: ${entry.final_balance}`)
    console.log()
  })
}

txDb.close()
ledgerDb.close()