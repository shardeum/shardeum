import { DatabaseInterface } from '../database/DatabaseInterface'
import { BalanceAnalyzer } from '../analyzer/BalanceAnalyzer'
import { TransactionReplayer, ReplayResult } from '../replay/TransactionReplayer'
import { BalanceMismatch, StatusFlipCandidate, SimulationResult } from '../types'
import chalk from 'chalk'
import * as fs from 'fs'
import * as path from 'path'

export interface SimulationConfig {
  dataPath: string
  outputPath: string
  maxFlipsToTest?: number
  parallelSimulations?: number
  targetAccounts?: string[]
  subset?: number // Limit analysis to a subset of accounts/transactions
}

export interface SimulationReport {
  timestamp: Date
  totalMismatches: number
  candidatesFound: number
  optimalFlips: string[]
  balanceImpact: Map<string, bigint>
  reconciliationScore: number
}

export class StateSimulator {
  private db: DatabaseInterface
  private analyzer: BalanceAnalyzer
  private replayer: TransactionReplayer

  constructor(private config: SimulationConfig) {
    this.db = new DatabaseInterface(config.dataPath)
    this.analyzer = new BalanceAnalyzer(this.db)
    this.replayer = new TransactionReplayer(this.db)
  }

  async runSimulation(): Promise<SimulationReport> {
    console.log(chalk.bold.blue('\n🚀 Starting Blockchain State Simulation\n'))

    const startTime = Date.now()

    console.log(chalk.cyan('Step 1: Analyzing balance mismatches...'))
    const mismatches = await this.analyzer.findBalanceMismatches(this.config.subset)

    console.log(chalk.cyan('\nStep 2: Collecting all transactions for mismatched accounts...'))
    const transactionsForMismatchedAccounts = await this.collectTransactionsForAccounts(mismatches)

    console.log(chalk.cyan('\nStep 3: Identifying failed transactions to test...'))
    const failedTransactions = transactionsForMismatchedAccounts.filter((tx) => tx.status === 0)
    console.log(
      chalk.gray(
        `Found ${failedTransactions.length} failed transactions out of ${transactionsForMismatchedAccounts.length} total`
      )
    )

    console.log(chalk.cyan('\nStep 4: Initializing state with relevant accounts...'))
    await this.initializeStateForSimulation(transactionsForMismatchedAccounts)

    console.log(chalk.cyan('\nStep 5: Running transaction flip simulations...'))
    const optimalFlips = await this.findOptimalFlipsFromTransactions(mismatches, failedTransactions)

    console.log(chalk.cyan('\nStep 6: Calculating final impact...'))
    const balanceImpact = await this.calculateBalanceImpact(optimalFlips)

    const report: SimulationReport = {
      timestamp: new Date(),
      totalMismatches: mismatches.length,
      candidatesFound: failedTransactions.length,
      optimalFlips,
      balanceImpact,
      reconciliationScore: this.calculateReconciliationScore(mismatches, balanceImpact),
    }

    await this.saveReport(report)

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(chalk.bold.green(`\n✅ Simulation complete in ${duration}s\n`))

    this.printSummary(report, failedTransactions.length)

    return report
  }

  private async initializeStateForSimulation(
    transactions: Array<{
      txId: string
      timestamp: number
      status: number
      affectedAccounts: string[]
    }>
  ): Promise<void> {
    const allAffectedAccounts = new Set<string>()
    for (const tx of transactions) {
      tx.affectedAccounts.forEach((acc) => allAffectedAccounts.add(acc))
    }

    console.log(chalk.gray(`Loading ${allAffectedAccounts.size} unique accounts into replayer state...`))

    let loadedCount = 0
    for (const accountId of allAffectedAccounts) {
      const loaded = await this.replayer.loadAccount(accountId)
      if (loaded) {
        loadedCount++
      }
    }

    console.log(
      chalk.green(`Successfully loaded ${loadedCount}/${allAffectedAccounts.size} accounts into replayer state`)
    )
  }

  private async collectTransactionsForAccounts(mismatches: BalanceMismatch[]): Promise<
    Array<{
      txId: string
      timestamp: number
      status: number
      affectedAccounts: string[]
    }>
  > {
    const accountIds = new Set(mismatches.map((m) => m.accountId))
    const allTransactions: Array<{
      txId: string
      timestamp: number
      status: number
      affectedAccounts: string[]
    }> = []

    console.log(chalk.gray(`Collecting transactions for ${accountIds.size} accounts with mismatches...`))

    for (const accountId of accountIds) {
      const ledgerEntries = this.db.getAccountLedgerEntries(accountId)

      for (const entry of ledgerEntries) {
        if (!allTransactions.some((tx) => tx.txId === entry.receiptId)) {
          const transaction = this.db.getTransaction(entry.receiptId)
          if (transaction) {
            const txData = JSON.parse(transaction.data)
            const status = txData.readableReceipt?.status ?? -1

            const affectedAccounts = this.db
              .getLedgerEntryByReceiptId(entry.receiptId)
              .map((e) => e.accountId)
              .filter((acc, index, self) => self.indexOf(acc) === index) // unique

            allTransactions.push({
              txId: entry.receiptId,
              timestamp: transaction.timestamp,
              status,
              affectedAccounts,
            })
          }
        }
      }
    }

    allTransactions.sort((a, b) => a.timestamp - b.timestamp)

    console.log(chalk.green(`Collected ${allTransactions.length} unique transactions`))

    return allTransactions
  }

  private async findOptimalFlipsFromTransactions(
    mismatches: BalanceMismatch[],
    failedTransactions: Array<{
      txId: string
      timestamp: number
      status: number
      affectedAccounts: string[]
    }>
  ): Promise<string[]> {
    const beneficialFlips: string[] = []
    const maxToTest = this.config.maxFlipsToTest || failedTransactions.length

    console.log(chalk.gray(`Testing up to ${maxToTest} failed transactions...`))

    const mismatchMap = new Map(mismatches.map((m) => [m.accountId, m.difference]))

    for (let i = 0; i < Math.min(maxToTest, failedTransactions.length); i++) {
      const tx = failedTransactions[i]
      console.log(chalk.gray(`\nTesting flip ${i + 1}/${maxToTest}: ${tx.txId}`))
      console.log(chalk.gray(`  Affects accounts: ${tx.affectedAccounts.join(', ')}`))

      const affectsMismatchedAccounts = tx.affectedAccounts.some((acc) => mismatchMap.has(acc))

      if (affectsMismatchedAccounts) {
        const result = await this.simulateTransactionFlip(tx.txId, tx.affectedAccounts)

        if (result.reconciles) {
          beneficialFlips.push(tx.txId)
          console.log(chalk.green(`  ✓ Beneficial flip found!`))

          for (const [accountId, impact] of result.balanceImpact) {
            const currentMismatch = mismatchMap.get(accountId) || BigInt(0)
            mismatchMap.set(accountId, currentMismatch + impact)
          }
        } else {
          console.log(chalk.gray(`  ✗ No improvement`))
        }
      } else {
        console.log(chalk.gray(`  ✗ Doesn't affect mismatched accounts`))
      }
    }

    return beneficialFlips
  }

  private async simulateTransactionFlip(txId: string, affectedAccounts: string[]): Promise<SimulationResult> {
    console.log(chalk.gray(`    Simulating flip for transaction affecting ${affectedAccounts.length} accounts`))

    const replayResult = await this.replayer.replayTransaction(txId, true, affectedAccounts)

    const reconciles = this.checkReconciliation(replayResult)

    return {
      transactionId: txId,
      originalStatus: 0,
      simulatedStatus: 1,
      affectedAccounts,
      balanceImpact: new Map(
        Array.from(replayResult.stateChanges.values()).map((change) => [change.accountId, change.balanceChange])
      ),
      reconciles,
    }
  }

  private async findOptimalFlips(mismatches: BalanceMismatch[], candidates: StatusFlipCandidate[]): Promise<string[]> {
    const targetAccounts = new Set(this.config.targetAccounts || mismatches.map((m) => m.accountId))

    const relevantCandidates = candidates.filter((c) => c.affectedAccounts.some((acc) => targetAccounts.has(acc)))

    console.log(chalk.gray(`Testing ${relevantCandidates.length} relevant candidates...`))

    const beneficialFlips: string[] = []
    const maxToTest = this.config.maxFlipsToTest || relevantCandidates.length

    for (let i = 0; i < Math.min(maxToTest, relevantCandidates.length); i++) {
      const candidate = relevantCandidates[i]
      console.log(chalk.gray(`\nTesting flip ${i + 1}/${maxToTest}: ${candidate.transactionId}`))

      const result = await this.simulateFlip(candidate)

      if (result.reconciles) {
        beneficialFlips.push(candidate.transactionId)
        console.log(chalk.green(`  ✓ Beneficial flip found`))
      } else {
        console.log(chalk.gray(`  ✗ No improvement`))
      }
    }

    return beneficialFlips
  }

  private async simulateFlip(candidate: StatusFlipCandidate): Promise<SimulationResult> {
    for (const accountId of candidate.affectedAccounts) {
      await this.replayer.loadAccount(accountId)
    }

    const forceSuccess = candidate.currentStatus === 0
    const replayResult = await this.replayer.replayTransaction(candidate.transactionId, forceSuccess)

    const reconciles = this.checkReconciliation(replayResult)

    return {
      transactionId: candidate.transactionId,
      originalStatus: candidate.currentStatus,
      simulatedStatus: forceSuccess ? 1 : 0,
      affectedAccounts: candidate.affectedAccounts,
      balanceImpact: new Map(
        Array.from(replayResult.stateChanges.values()).map((change) => [change.accountId, change.balanceChange])
      ),
      reconciles,
    }
  }

  private checkReconciliation(replayResult: ReplayResult): boolean {
    if (!replayResult.success) return false

    let hasBalanceChanges = false
    for (const change of replayResult.stateChanges.values()) {
      if (change.balanceChange !== BigInt(0)) {
        hasBalanceChanges = true
        console.log(
          chalk.green(
            `    Balance change detected: ${change.ethAddress} ${
              change.balanceChange > 0 ? '+' : ''
            }${change.balanceChange.toString()}`
          )
        )
      }
    }

    if (hasBalanceChanges) {
      console.log(chalk.green(`    ✓ Transaction would cause balance changes - this is beneficial!`))
    }

    return hasBalanceChanges
  }

  private async calculateBalanceImpact(txIds: string[]): Promise<Map<string, bigint>> {
    const impactMap = new Map<string, bigint>()

    for (const txId of txIds) {
      const ledgerEntries = this.db.getLedgerEntryByReceiptId(txId)
      for (const entry of ledgerEntries) {
        const current = impactMap.get(entry.accountId) || BigInt(0)
        const change = BigInt(entry.balance_change || '0')
        impactMap.set(entry.accountId, current + change)
      }
    }

    return impactMap
  }

  private calculateReconciliationScore(mismatches: BalanceMismatch[], balanceImpact: Map<string, bigint>): number {
    let totalDifference = BigInt(0)
    let reconciled = BigInt(0)

    for (const mismatch of mismatches) {
      totalDifference += mismatch.difference < 0 ? -mismatch.difference : mismatch.difference

      const impact = balanceImpact.get(mismatch.accountId) || BigInt(0)
      const newDifference = mismatch.difference + impact
      const improvement =
        (mismatch.difference < 0 ? -mismatch.difference : mismatch.difference) -
        (newDifference < 0 ? -newDifference : newDifference)

      if (improvement > 0) {
        reconciled += improvement
      }
    }

    if (totalDifference === BigInt(0)) return 100

    return Number((reconciled * BigInt(100)) / totalDifference)
  }

  private async saveReport(report: SimulationReport): Promise<void> {
    const timestamp = report.timestamp.toISOString().replace(/:/g, '-').split('.')[0]
    const filename = `simulation-report-${timestamp}.json`
    const filepath = path.join(this.config.outputPath, filename)

    const reportData = {
      ...report,
      balanceImpact: Array.from(report.balanceImpact.entries()).map(([k, v]) => ({
        account: k,
        impact: v.toString(),
      })),
    }

    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2))
    console.log(chalk.green(`\n📄 Report saved to: ${filepath}`))

    if (report.optimalFlips.length > 0) {
      await this.saveEnhancedFlipReport(report.optimalFlips, timestamp)
    }
  }

  private async saveEnhancedFlipReport(optimalFlips: string[], timestamp: string): Promise<void> {
    const txListFile = path.join(this.config.outputPath, `flip-transactions-${timestamp}.txt`)
    const prefixedTxList = optimalFlips
    fs.writeFileSync(txListFile, prefixedTxList.join('\n'))
    console.log(chalk.green(`📋 Transaction list saved to: ${txListFile}`))

    const enhancedReport = await this.generateEnhancedFlipReport(optimalFlips)
    const enhancedFile = path.join(this.config.outputPath, `flip-report-enhanced-${timestamp}.json`)
    fs.writeFileSync(enhancedFile, JSON.stringify(enhancedReport, null, 2))
    console.log(chalk.green(`🔍 Enhanced flip report saved to: ${enhancedFile}`))

    const summaryFile = path.join(this.config.outputPath, `flip-summary-${timestamp}.txt`)
    const summaryText = this.generateFlipSummary(enhancedReport)
    fs.writeFileSync(summaryFile, summaryText)
    console.log(chalk.green(`📋 Human-readable summary saved to: ${summaryFile}`))
  }

  private async generateEnhancedFlipReport(optimalFlips: string[]): Promise<any> {
    const report = {
      summary: {
        totalFlips: optimalFlips.length,
        timestamp: new Date().toISOString(),
      },
      transactions: [],
      accountBreakdown: new Map<string, any>(),
    }

    for (const txId of optimalFlips) {
      const transaction = this.db.getTransaction(txId)
      const receipt = this.db.getReceipt(txId)
      const ledgerEntries = this.db.getLedgerEntryByReceiptId(txId)

      if (transaction && receipt) {
        const txData = JSON.parse(transaction.data)
        const receiptData = JSON.parse(receipt.signedReceipt)

        const fromAddr = txData.readableReceipt?.from || txData.from
        const toAddr = txData.readableReceipt?.to || txData.to
        const value = txData.readableReceipt?.value || txData.value || '0'

        const txInfo = {
          transactionHash: txId,
          from: fromAddr,
          to: toAddr,
          value: value,
          originalStatus: receiptData.readableReceipt?.status || 0,
          recommendedStatus: 1,
          affectedAccounts: ledgerEntries
            .map((entry) => {
              const paddedId = entry.accountId
              const ethAddr = '0x' + paddedId.substring(0, 40)
              return ethAddr
            })
            .filter((addr, index, self) => self.indexOf(addr) === index), // unique
        }

        report.transactions.push(txInfo)

        for (const ethAddr of txInfo.affectedAccounts) {
          if (!report.accountBreakdown.has(ethAddr)) {
            report.accountBreakdown.set(ethAddr, {
              ethAddress: ethAddr,
              affectedTransactions: [],
              totalFlips: 0,
            })
          }

          const accountData = report.accountBreakdown.get(ethAddr)
          accountData.affectedTransactions.push({
            transactionHash: txId,
            role: ethAddr === fromAddr ? 'sender' : ethAddr === toAddr ? 'receiver' : 'affected',
            value: value,
          })
          accountData.totalFlips++
        }
      }
    }

    return {
      ...report,
      accountBreakdown: Array.from(report.accountBreakdown.entries()).map(([addr, data]) => data),
    }
  }

  private generateFlipSummary(enhancedReport: any): string {
    let summary = `TRANSACTION FLIP SUMMARY\n`
    summary += `========================\n`
    summary += `Generated: ${enhancedReport.summary.timestamp}\n`
    summary += `Total Flips: ${enhancedReport.summary.totalFlips}\n\n`

    summary += `TRANSACTIONS TO FLIP (FAILED → SUCCESS):\n`
    summary += `----------------------------------------\n`
    for (const tx of enhancedReport.transactions) {
      summary += `TX: ${tx.transactionHash}\n`
      summary += `  From: ${tx.from}\n`
      summary += `  To: ${tx.to}\n`
      summary += `  Value: ${tx.value} wei\n`
      summary += `  Status: FAILED → SUCCESS\n\n`
    }

    summary += `ACCOUNT BREAKDOWN:\n`
    summary += `------------------\n`
    for (const account of enhancedReport.accountBreakdown) {
      summary += `Account: ${account.ethAddress}\n`
      summary += `  Affected by ${account.totalFlips} flip(s)\n`
      for (const tx of account.affectedTransactions) {
        summary += `    - ${tx.transactionHash} (${tx.role})\n`
      }
      summary += `\n`
    }

    return summary
  }

  private printSummary(report: SimulationReport, failedTransactionCount: number = 0): void {
    console.log(chalk.bold('\n📊 Simulation Summary:'))
    console.log(chalk.white('─'.repeat(50)))
    console.log(chalk.cyan(`Total balance mismatches found: ${report.totalMismatches}`))
    console.log(chalk.cyan(`Failed transactions analyzed: ${failedTransactionCount}`))
    console.log(chalk.cyan(`Optimal flips identified: ${report.optimalFlips.length}`))
    console.log(chalk.cyan(`Reconciliation score: ${report.reconciliationScore.toFixed(2)}%`))

    if (report.optimalFlips.length > 0) {
      console.log(chalk.white('\n🔄 Transactions to flip to success:'))
      report.optimalFlips.slice(0, 10).forEach((txId) => {
        console.log(chalk.yellow(`  - ${txId}`))
      })
      if (report.optimalFlips.length > 10) {
        console.log(chalk.gray(`  ... and ${report.optimalFlips.length - 10} more`))
      }
    }

    console.log(chalk.white('─'.repeat(50)))
  }

  close(): void {
    this.db.close()
  }
}
