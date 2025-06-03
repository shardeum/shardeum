import Database from 'better-sqlite3'
import * as path from 'path'
import {
  AccountData,
  TransactionData,
  ReceiptData,
  AccountLedgerEntry,
  ProcessedTransaction
} from '../types'

export class DatabaseInterface {
  private accountsDb: Database.Database
  private transactionsDb: Database.Database
  private receiptsDb: Database.Database
  private ledgerDb: Database.Database
  private processedDb: Database.Database

  constructor(dataPath: string) {
    this.accountsDb = new Database(path.join(dataPath, 'accounts.sqlite3'), { readonly: true })
    this.transactionsDb = new Database(path.join(dataPath, 'transactions.sqlite3'), { readonly: true })
    this.receiptsDb = new Database(path.join(dataPath, 'receipts.sqlite3'), { readonly: true })
    this.ledgerDb = new Database(path.join(dataPath, 'accounts_ledger.sqlite3'), { readonly: true })
    this.processedDb = new Database(path.join(dataPath, 'processed_transactions.sqlite3'), { readonly: true })
  }

  close(): void {
    this.accountsDb.close()
    this.transactionsDb.close()
    this.receiptsDb.close()
    this.ledgerDb.close()
    this.processedDb.close()
  }

  getAccount(accountId: string): AccountData | undefined {
    const stmt = this.accountsDb.prepare('SELECT * FROM accounts WHERE accountId = ?')
    return stmt.get(accountId) as AccountData | undefined
  }

  getAllAccounts(): AccountData[] {
    const stmt = this.accountsDb.prepare('SELECT * FROM accounts')
    return stmt.all() as AccountData[]
  }

  getAccountsByCycle(cycleNumber: number): AccountData[] {
    const stmt = this.accountsDb.prepare('SELECT * FROM accounts WHERE cycleNumber = ?')
    return stmt.all(cycleNumber) as AccountData[]
  }

  getTransaction(txId: string): TransactionData | undefined {
    const stmt = this.transactionsDb.prepare('SELECT * FROM transactions WHERE txId = ?')
    return stmt.get(txId) as TransactionData | undefined
  }

  getTransactionsByCycle(cycleNumber: number): TransactionData[] {
    const stmt = this.transactionsDb.prepare('SELECT * FROM transactions WHERE cycleNumber = ?')
    return stmt.all(cycleNumber) as TransactionData[]
  }

  getAllTransactions(): TransactionData[] {
    const stmt = this.transactionsDb.prepare('SELECT * FROM transactions ORDER BY timestamp')
    return stmt.all() as TransactionData[]
  }

  getReceipt(receiptId: string): ReceiptData | undefined {
    const stmt = this.receiptsDb.prepare('SELECT * FROM receipts WHERE receiptId = ?')
    return stmt.get(receiptId) as ReceiptData | undefined
  }

  getReceiptsByCycle(cycle: number): ReceiptData[] {
    const stmt = this.receiptsDb.prepare('SELECT * FROM receipts WHERE cycle = ?')
    return stmt.all(cycle) as ReceiptData[]
  }

  getFailedReceipts(): ReceiptData[] {
    const checkStmt = this.receiptsDb.prepare(`
      SELECT COUNT(*) as count FROM receipts 
      WHERE json_extract(signedReceipt, '$.readableReceipt.status') IS NOT NULL
      LIMIT 1
    `)
    const hasReadableReceipt = (checkStmt.get() as { count: number }).count > 0

    if (hasReadableReceipt) {
      const stmt = this.receiptsDb.prepare(`
        SELECT * FROM receipts 
        WHERE json_extract(signedReceipt, '$.readableReceipt.status') = 0
        ORDER BY timestamp
      `)
      return stmt.all() as ReceiptData[]
    } else {
      const txStmt = this.transactionsDb.prepare(`
        SELECT txId FROM transactions
        WHERE json_extract(data, '$.readableReceipt.status') = 0
      `)
      const failedTxIds = txStmt.all() as { txId: string }[]

      const receipts: ReceiptData[] = []
      const batchSize = 100
      const receiptStmt = this.receiptsDb.prepare('SELECT * FROM receipts WHERE receiptId = ?')

      for (let i = 0; i < failedTxIds.length; i += batchSize) {
        const batch = failedTxIds.slice(i, i + batchSize)
        for (const { txId } of batch) {
          const receipt = receiptStmt.get(txId) as ReceiptData | undefined
          if (receipt) {
            receipts.push(receipt)
          }
        }
      }

      console.log(`Found ${receipts.length} receipts for ${failedTxIds.length} failed transactions`)
      return receipts
    }
  }

  getSuccessfulReceipts(): ReceiptData[] {
    const checkStmt = this.receiptsDb.prepare(`
      SELECT COUNT(*) as count FROM receipts 
      WHERE json_extract(signedReceipt, '$.readableReceipt.status') IS NOT NULL
      LIMIT 1
    `)
    const hasReadableReceipt = (checkStmt.get() as { count: number }).count > 0

    if (hasReadableReceipt) {
      const stmt = this.receiptsDb.prepare(`
        SELECT * FROM receipts 
        WHERE json_extract(signedReceipt, '$.readableReceipt.status') = 1
        ORDER BY timestamp
      `)
      return stmt.all() as ReceiptData[]
    } else {
      const txStmt = this.transactionsDb.prepare(`
        SELECT txId FROM transactions
        WHERE json_extract(data, '$.readableReceipt.status') = 1
      `)
      const successfulTxIds = txStmt.all() as { txId: string }[]

      const receipts: ReceiptData[] = []
      for (const { txId } of successfulTxIds) {
        const receiptStmt = this.receiptsDb.prepare('SELECT * FROM receipts WHERE receiptId = ?')
        const receipt = receiptStmt.get(txId) as ReceiptData | undefined
        if (receipt) {
          receipts.push(receipt)
        }
      }

      return receipts
    }
  }

  getAccountLedgerEntries(accountId: string): AccountLedgerEntry[] {
    const stmt = this.ledgerDb.prepare('SELECT * FROM accounts_ledger WHERE accountId = ? ORDER BY timestamp')
    return stmt.all(accountId) as AccountLedgerEntry[]
  }

  getAccountLedgerEntriesByAddress(ethAddress: string): AccountLedgerEntry[] {
    const stmt = this.ledgerDb.prepare('SELECT * FROM accounts_ledger WHERE eth_address = ? ORDER BY timestamp')
    return stmt.all(ethAddress) as AccountLedgerEntry[]
  }

  getLedgerEntryByReceiptId(receiptId: string): AccountLedgerEntry[] {
    const stmt = this.ledgerDb.prepare('SELECT * FROM accounts_ledger WHERE receiptId = ?')
    return stmt.all(receiptId) as AccountLedgerEntry[]
  }

  getProcessedTransaction(txId: string): ProcessedTransaction | undefined {
    const stmt = this.processedDb.prepare('SELECT * FROM processedTransactions WHERE txId = ?')
    return stmt.get(txId) as ProcessedTransaction | undefined
  }

  getReceiptCountByStatus(): { status: number; count: number }[] {
    const stmt = this.receiptsDb.prepare(`
      SELECT 
        json_extract(signedReceipt, '$.readableReceipt.status') as status,
        COUNT(*) as count
      FROM receipts
      GROUP BY status
    `)
    return stmt.all() as { status: number; count: number }[]
  }

  getCycleRange(): { minCycle: number; maxCycle: number } {
    const stmt = this.receiptsDb.prepare('SELECT MIN(cycle) as minCycle, MAX(cycle) as maxCycle FROM receipts')
    return stmt.get() as { minCycle: number; maxCycle: number }
  }

  getActiveAccountIds(): string[] {
    const stmt = this.ledgerDb.prepare('SELECT DISTINCT accountId FROM accounts_ledger')
    const rows = stmt.all() as { accountId: string }[]
    return rows.map((row) => row.accountId)
  }

  getBalanceHistory(accountId: string): { timestamp: number; balance: string }[] {
    const stmt = this.ledgerDb.prepare(`
      SELECT timestamp, final_balance as balance 
      FROM accounts_ledger 
      WHERE accountId = ? 
      ORDER BY timestamp
    `)
    return stmt.all(accountId) as { timestamp: number; balance: string }[]
  }
}