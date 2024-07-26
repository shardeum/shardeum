/**
 * This script filters failed transactions from the specified database based on account types and cycle numbers.
 * 
 * Usage:
 *   npx ts-node scripts/failedTxCheck.ts [dbPath] [options]
 * 
 * Arguments:
 *   dbPath: Optional. Path to the database directory. Default is 'instances/archiver-db-4000'.
 * 
 * Options:
 *   --excludeAccount, -e: Exclude specific account types from the check.
 *                         Can specify multiple types: -e 12 10 or -e 12 -e 10
 *   --range, -r:          Specify cycle range for filtering.
 *                         Format: -r startCycle [endCycle]
 *                         If only startCycle is provided, it filters from that cycle onwards.
 *   --color:              Enable ANSI color output.
 * 
 * Examples:
 *   npx ts-node scripts/failedTxCheck.ts
 *   npx ts-node scripts/failedTxCheck.ts path/to/custom/db
 *   npx ts-node scripts/failedTxCheck.ts -e 12 10 -r 1000 2000
 *   npx ts-node scripts/failedTxCheck.ts -r 5000 // All cycles from 5000 onwards
 *   npx ts-node scripts/failedTxCheck.ts --color
 * 
 * Output:
 *   The script generates a report file named 'failed_transactions_report_[timestamp].txt' in the root directory.
 */

import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

const defaultDbPath = 'instances/archiver-db-4000'
let dbPath = defaultDbPath
let excludedAccountTypes: number[] = []
let useAnsiColors = false
let cycleRange: number[] = []

// Account Type mapping
const AccountType = {
  0: "Account",
  1: "ContractStorage",
  2: "ContractCode",
  3: "Receipt",
  4: "Debug",
  5: "NetworkAccount",
  6: "NodeAccount",
  7: "NodeRewardReceipt",
  8: "DevAccount",
  9: "NodeAccount2",
  10: "StakeReceipt",
  11: "UnstakeReceipt",
  12: "InternalTxReceipt",
}

// Parse command line arguments
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--excludeAccount' || process.argv[i] === '-e') {
    i++
    while (i < process.argv.length && !process.argv[i].startsWith('-')) {
      const accountTypes = process.argv[i].split(' ').map(num => parseInt(num, 10))
      excludedAccountTypes.push(...accountTypes)
      i++
    }
    i--
  } else if (process.argv[i] === '--range' || process.argv[i] === '-r') {
    i++
    cycleRange = process.argv[i].split(' ').map(num => parseInt(num, 10))
    if (cycleRange.length > 2 || cycleRange.some(isNaN)) {
      console.error('Invalid range format. Use: --range startCycle [endCycle]')
      process.exit(1)
    }
  } else if (process.argv[i] === '--color') {
    useAnsiColors = true
  } else if (!process.argv[i].startsWith('-')) {
    dbPath = process.argv[i]
  }
}

// Remove any NaN values that might have been introduced
excludedAccountTypes = excludedAccountTypes.filter(num => !isNaN(num))

const excludedAccountTypeNames = excludedAccountTypes.map(type => `${type} (${AccountType[type] || 'Unknown'})`)

const dbFilePath = path.join(dbPath, 'archiverdb-4000.sqlite3')

console.log(`Attempting to open database at: ${dbFilePath}`)
console.log(`Excluding AccountTypes: ${excludedAccountTypeNames.join(', ')}`)
console.log(`Cycle range: ${cycleRange.length === 1 ? `${cycleRange[0]} onwards` : cycleRange.length === 2 ? `${cycleRange[0]} to ${cycleRange[1]}` : 'All cycles'}`)

if (!fs.existsSync(dbFilePath)) {
  console.error(`Database file does not exist at path: ${dbFilePath}`)
  process.exit(1)
}

// ANSI color codes
const colors = {
  reset: (): string => useAnsiColors ? "\x1b[0m" : "",
  bright: (): string => useAnsiColors ? "\x1b[1m" : "",
  red: (): string => useAnsiColors ? "\x1b[31m" : "",
  green: (): string => useAnsiColors ? "\x1b[32m" : "",
  yellow: (): string => useAnsiColors ? "\x1b[33m" : "",
  blue: (): string => useAnsiColors ? "\x1b[34m" : "",
  magenta: (): string => useAnsiColors ? "\x1b[35m" : "",
  cyan: (): string => useAnsiColors ? "\x1b[36m" : "",
}

function log(message: string, fileStream: fs.WriteStream): void {
  console.log(message)
  fileStream.write(message + '\n')
}

function getDB(dbPath: string): sqlite3.Database {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Error opening database: ', err.message)
      console.error('Full error object:', err)
      process.exit(1)
    } else {
      console.log('Successfully opened the database.')
    }
  })
}

function runQuery(db: sqlite3.Database, query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function filterFailedTransactions(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputPath = path.join(process.cwd(), `failed_transactions_report_${timestamp}.txt`)
  const fileStream = fs.createWriteStream(outputPath, { flags: 'w' })
  const db = getDB(dbFilePath)

  let queryString = `
    SELECT txId, data, timestamp, cycleNumber
    FROM transactions
    WHERE JSON_EXTRACT(data, '$.readableReceipt.status') = 0
  `

  if (cycleRange.length > 0) {
    if (cycleRange.length === 1) {
      queryString += ` AND cycleNumber >= ${cycleRange[0]}`
    } else {
      queryString += ` AND cycleNumber >= ${cycleRange[0]} AND cycleNumber <= ${cycleRange[1]}`
    }
  }

  queryString += ' ORDER BY cycleNumber, timestamp'

  const transactions = await runQuery(db, queryString)

  const failedTxsByAccount = new Map<string, any[]>()

  for (const tx of transactions) {
    const txData = JSON.parse(tx.data)
    
    // Skip excluded AccountTypes
    if (excludedAccountTypes.includes(txData.accountType)) {
      continue
    }

    const fromAddress = txData.txFrom || txData.readableReceipt?.from
    const toAddress = txData.txTo || txData.readableReceipt?.to
    const nonce = parseInt(txData.readableReceipt?.nonce || '0', 16)
    const accountType = txData.accountType
    const reason = txData.readableReceipt?.reason || 'Unknown reason'

    if (fromAddress) {
      if (!failedTxsByAccount.has(fromAddress)) {
        failedTxsByAccount.set(fromAddress, [])
      }
      failedTxsByAccount.get(fromAddress)!.push({
        txId: tx.txId,
        toAddress,
        nonce,
        accountType,
        reason,
        cycleNumber: tx.cycleNumber,
        timestamp: tx.timestamp
      })
    }
  }

  let totalFailedTransactions = 0

  log('Failed Transactions by Account:', fileStream)
  for (const [fromAddress, txs] of failedTxsByAccount.entries()) {
    log(`\n${colors.bright()}${colors.cyan()}From Address: ${fromAddress}${colors.reset()}`, fileStream)
    log(`${colors.bright()}Number of failed transactions: ${txs.length}${colors.reset()}`, fileStream)
    
    txs.forEach(({ txId, toAddress, nonce, accountType, reason, cycleNumber, timestamp }) => {
      const accountTypeStr = AccountType[accountType] || 'Unknown'
      const date = new Date(timestamp)
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      const isoDate = date.toISOString()
      
      log(`  ${colors.bright()}TxID: ${txId}${colors.reset()}`, fileStream)
      log(`    To: ${toAddress}`, fileStream)
      log(`    Nonce: ${nonce}`, fileStream)
      log(`    Account Type: ${colors.yellow()}${accountTypeStr}${colors.reset()}`, fileStream)
      log(`    Cycle Number: ${colors.magenta()}${cycleNumber}${colors.reset()}`, fileStream)
      log(`    Timestamp: ${colors.blue()}${formattedDate} (${isoDate})${colors.reset()}`, fileStream)
      log(`    ${colors.red()}Failure Reason: ${reason}${colors.reset()}`, fileStream)
    })

    totalFailedTransactions += txs.length
  }

  log(`\n${colors.bright()}${colors.blue()}Total failed transactions: ${totalFailedTransactions}${colors.reset()}`, fileStream)
  log(`${colors.bright()}${colors.blue()}Total accounts with failed transactions: ${failedTxsByAccount.size}${colors.reset()}`, fileStream)

  db.close()
  fileStream.end()

  console.log(`\nReport saved to: ${outputPath}`)
}

filterFailedTransactions().catch(console.error)