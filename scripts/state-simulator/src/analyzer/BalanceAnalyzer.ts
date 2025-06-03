import { DatabaseInterface } from '../database/DatabaseInterface'
import { BalanceMismatch, StatusFlipCandidate } from '../types'
import chalk from 'chalk'
import * as fs from 'fs'
import * as path from 'path'

export class BalanceAnalyzer {
  private genesisBalances: Map<string, bigint> = new Map()

  constructor(private db: DatabaseInterface) {
    this.loadGenesisBalances()
  }

  private loadGenesisBalances(): void {
    try {
      let genesisPath = path.join(__dirname, '../../../simulate/superset/mainnet.genesis.json')
      if (!fs.existsSync(genesisPath)) {
        genesisPath = path.join(__dirname, '../../../../src/config/mainnet.genesis.json')
      }

      const genesisData = JSON.parse(fs.readFileSync(genesisPath, 'utf8'))

      for (const [address, data] of Object.entries(genesisData)) {
        if (data && typeof data === 'object' && 'wei' in data) {
          const balance = BigInt((data as any).wei)
          const cleanAddress = address.toLowerCase().replace('0x', '')
          const accountId = `${cleanAddress.padStart(40, '0')}${'0'.repeat(24)}`
          this.genesisBalances.set(accountId, balance)
        }
      }

      let secureAccountsPath = path.join(__dirname, '../../../simulate/superset/mainnet.genesis-secure-accounts.json')
      if (!fs.existsSync(secureAccountsPath)) {
        secureAccountsPath = path.join(__dirname, '../../../../src/config/mainnet.genesis-secure-accounts.json')
      }

      const secureAccountsData = JSON.parse(fs.readFileSync(secureAccountsPath, 'utf8'))

      for (const account of secureAccountsData) {
        if (account.SourceFundsAddress && account.SourceFundsBalance) {
          const balance = BigInt(account.SourceFundsBalance)
          const cleanAddress = account.SourceFundsAddress.toLowerCase().replace('0x', '')
          const accountId = `${cleanAddress.padStart(40, '0')}${'0'.repeat(24)}`
          this.genesisBalances.set(accountId, balance)
        }
      }

      console.log(chalk.green(`Loaded ${this.genesisBalances.size} genesis account balances`))
    } catch (error) {
      console.error(chalk.red('Failed to load genesis balances:'), error)
    }
  }

  async findBalanceMismatches(limit?: number): Promise<BalanceMismatch[]> {
    console.log(chalk.blue('Starting balance mismatch analysis...'))

    const mismatches: BalanceMismatch[] = []
    let activeAccountIds = this.db.getActiveAccountIds()

    if (limit && limit > 0) {
      activeAccountIds = activeAccountIds.slice(0, limit)
      console.log(chalk.yellow(`Limiting analysis to first ${limit} accounts`))
    }

    console.log(chalk.gray(`Found ${activeAccountIds.length} active accounts to analyze`))

    for (const accountId of activeAccountIds) {
      const ledgerEntries = this.db.getAccountLedgerEntries(accountId)
      if (ledgerEntries.length === 0) continue

      const genesisBalance = this.genesisBalances.get(accountId) || BigInt(0)
      let calculatedBalance = genesisBalance
      const relatedTransactions: string[] = []

      for (const entry of ledgerEntries) {
        const balanceChange = BigInt(entry.balance_change || '0')
        calculatedBalance += balanceChange
        relatedTransactions.push(entry.receiptId)
      }

      const lastEntry = ledgerEntries[ledgerEntries.length - 1]
      const finalBalance = BigInt(lastEntry.final_balance || '0')

      if (calculatedBalance !== finalBalance) {
        const mismatch: BalanceMismatch = {
          accountId,
          ethAddress: lastEntry.eth_address,
          expectedBalance: calculatedBalance,
          actualBalance: finalBalance,
          difference: finalBalance - calculatedBalance,
          relatedTransactions,
        }
        mismatches.push(mismatch)

        console.log(chalk.yellow(`Found mismatch for account ${accountId}:`))
        if (genesisBalance > BigInt(0)) {
          console.log(chalk.gray(`  Genesis balance: ${genesisBalance.toString()}`))
        }
        console.log(chalk.gray(`  Expected: ${calculatedBalance.toString()}`))
        console.log(chalk.gray(`  Actual: ${finalBalance.toString()}`))
        console.log(chalk.gray(`  Difference: ${mismatch.difference.toString()}`))
      }
    }

    console.log(chalk.green(`\nAnalysis complete. Found ${mismatches.length} balance mismatches.`))
    return mismatches
  }

  async findStatusFlipCandidates(limit?: number): Promise<StatusFlipCandidate[]> {
    console.log(chalk.blue('Finding status flip candidates...'))

    const candidates: StatusFlipCandidate[] = []
    let failedReceipts = this.db.getFailedReceipts()

    if (limit && limit > 0) {
      failedReceipts = failedReceipts.slice(0, limit)
      console.log(chalk.yellow(`Limiting analysis to first ${limit} failed transactions`))
    }

    console.log(chalk.gray(`Analyzing ${failedReceipts.length} failed transactions...`))

    for (const receipt of failedReceipts) {
      const ledgerEntries = this.db.getLedgerEntryByReceiptId(receipt.receiptId)

      const hasBalanceChanges = ledgerEntries.some((entry) => {
        const balanceChange = BigInt(entry.balance_change || '0')
        return balanceChange !== BigInt(0)
      })

      if (hasBalanceChanges) {
        const totalImpact = ledgerEntries.reduce((sum, entry) => {
          return sum + BigInt(entry.balance_change || '0')
        }, BigInt(0))

        const candidate: StatusFlipCandidate = {
          transactionId: receipt.receiptId,
          currentStatus: 0, // failed
          reason: 'Failed transaction has balance changes',
          potentialImpact: totalImpact,
          affectedAccounts: ledgerEntries.map((e) => e.accountId),
        }
        candidates.push(candidate)

        console.log(chalk.yellow(`Found candidate: ${receipt.receiptId}`))
        console.log(chalk.gray(`  Reason: ${candidate.reason}`))
        console.log(chalk.gray(`  Impact: ${totalImpact.toString()}`))
        console.log(chalk.gray(`  Affected accounts: ${candidate.affectedAccounts.length}`))
      }
    }

    let successfulReceipts = this.db.getSuccessfulReceipts()

    if (limit && limit > 0) {
      successfulReceipts = successfulReceipts.slice(0, limit)
      console.log(chalk.yellow(`Limiting successful transaction analysis to first ${limit} transactions`))
    }

    for (const receipt of successfulReceipts) {
      const ledgerEntries = this.db.getLedgerEntryByReceiptId(receipt.receiptId)

      for (const entry of ledgerEntries) {
        const finalBalance = BigInt(entry.final_balance || '0')
        if (finalBalance < BigInt(0)) {
          const candidate: StatusFlipCandidate = {
            transactionId: receipt.receiptId,
            currentStatus: 1, // success
            reason: 'Transaction resulted in negative balance',
            potentialImpact: finalBalance,
            affectedAccounts: [entry.accountId],
          }
          candidates.push(candidate)

          console.log(chalk.red(`Found problematic success: ${receipt.receiptId}`))
          console.log(chalk.gray(`  Account ${entry.accountId} went negative: ${finalBalance.toString()}`))
          break
        }
      }
    }

    console.log(chalk.green(`\nFound ${candidates.length} status flip candidates.`))
    return candidates
  }

  async analyzeTransaction(txId: string): Promise<void> {
    console.log(chalk.blue(`\nAnalyzing transaction: ${txId}`))

    const receipt = this.db.getReceipt(txId)
    if (!receipt) {
      console.log(chalk.red('Receipt not found'))
      return
    }

    const transaction = this.db.getTransaction(txId)
    const ledgerEntries = this.db.getLedgerEntryByReceiptId(txId)

    const signedReceipt = JSON.parse(receipt.signedReceipt)
    const status = signedReceipt.readableReceipt?.status

    console.log(chalk.white('\nReceipt Information:'))
    console.log(chalk.gray(`  Status: ${status === 1 ? 'Success' : 'Failed'}`))
    console.log(chalk.gray(`  Cycle: ${receipt.cycle}`))
    console.log(chalk.gray(`  Timestamp: ${new Date(receipt.timestamp).toISOString()}`))

    if (transaction) {
      const txData = JSON.parse(transaction.data)
      console.log(chalk.gray(`  From: ${txData.from || 'N/A'}`))
      console.log(chalk.gray(`  To: ${txData.to || 'N/A'}`))
      console.log(chalk.gray(`  Value: ${txData.value || '0'}`))
    }

    console.log(chalk.white('\nBalance Changes:'))
    for (const entry of ledgerEntries) {
      console.log(chalk.gray(`  Account: ${entry.accountId} (${entry.eth_address})`))
      console.log(chalk.gray(`    Balance change: ${entry.balance_change}`))
      console.log(chalk.gray(`    Final balance: ${entry.final_balance}`))
    }

    const hasBalanceChanges = ledgerEntries.some((e) => BigInt(e.balance_change || '0') !== BigInt(0))
    if (status === 0 && hasBalanceChanges) {
      console.log(chalk.yellow('\n⚠️  WARNING: Failed transaction has balance changes!'))
    }

    const hasNegativeBalance = ledgerEntries.some((e) => BigInt(e.final_balance || '0') < BigInt(0))
    if (hasNegativeBalance) {
      console.log(chalk.red('\n❌ ERROR: Transaction resulted in negative balance!'))
    }
  }
}