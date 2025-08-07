import { Command } from 'commander'
import { StateSimulator, SimulationConfig } from './simulator/StateSimulator'
import { DatabaseInterface } from './database/DatabaseInterface'
import { BalanceAnalyzer } from './analyzer/BalanceAnalyzer'
import chalk from 'chalk'
import * as path from 'path'
import * as fs from 'fs'

const program = new Command()

program
  .name('state-simulator')
  .description('Blockchain state simulator for transaction replay and balance reconciliation')
  .version('1.0.0')

program
  .command('simulate')
  .description('Run full simulation to find transactions to flip')
  .option('-i, --input <path>', 'Path to superset data directory', '../state-simulator/superset')
  .option('-o, --output <path>', 'Path to output directory', './output')
  .option('-m, --max-flips <number>', 'Maximum number of flips to test', parseInt)
  .option('-a, --accounts <accounts...>', 'Specific account IDs to target')
  .option('-s, --subset <number>', 'Limit analysis to a subset of accounts/transactions', parseInt)
  .action(async (options) => {
    try {
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true })
      }

      const config: SimulationConfig = {
        dataPath: path.resolve(options.input),
        outputPath: path.resolve(options.output),
        maxFlipsToTest: options.maxFlips,
        targetAccounts: options.accounts,
        subset: options.subset,
      }

      const simulator = new StateSimulator(config)
      await simulator.runSimulation()
      simulator.close()
    } catch (error) {
      console.error(chalk.red('Simulation failed:'), error)
      process.exit(1)
    }
  })

program
  .command('analyze')
  .description('Analyze balance mismatches without running simulation')
  .option('-i, --input <path>', 'Path to superset data directory', '../state-simulator/superset')
  .option('-o, --output <path>', 'Path to output directory', './output')
  .option('-s, --subset <number>', 'Limit analysis to a subset of accounts/transactions', parseInt)
  .action(async (options) => {
    try {
      const db = new DatabaseInterface(path.resolve(options.input))
      const analyzer = new BalanceAnalyzer(db)

      console.log(chalk.bold.blue('\n🔍 Running balance analysis...\n'))

      const mismatches = await analyzer.findBalanceMismatches(options.subset)
      const candidates = await analyzer.findStatusFlipCandidates(options.subset)

      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
      const analysisFile = path.join(options.output, `analysis-${timestamp}.json`)

      fs.writeFileSync(
        analysisFile,
        JSON.stringify(
          {
            timestamp: new Date(),
            mismatches: mismatches.map((m) => ({
              ...m,
              expectedBalance: m.expectedBalance.toString(),
              actualBalance: m.actualBalance.toString(),
              difference: m.difference.toString(),
            })),
            candidates: candidates.map((c) => ({
              ...c,
              potentialImpact: c.potentialImpact.toString(),
            })),
          },
          null,
          2
        )
      )

      console.log(chalk.green(`\n📄 Analysis saved to: ${analysisFile}`))

      db.close()
    } catch (error) {
      console.error(chalk.red('Analysis failed:'), error)
      process.exit(1)
    }
  })

program
  .command('inspect-tx <txId>')
  .description('Inspect a specific transaction')
  .option('-i, --input <path>', 'Path to superset data directory', '../state-simulator/superset')
  .action(async (txId, options) => {
    try {
      const db = new DatabaseInterface(path.resolve(options.input))
      const analyzer = new BalanceAnalyzer(db)
      
      await analyzer.analyzeTransaction(txId)
      
      db.close()
    } catch (error) {
      console.error(chalk.red('Inspection failed:'), error)
      process.exit(1)
    }
  })

program
  .command('stats')
  .description('Show database statistics')
  .option('-i, --input <path>', 'Path to superset data directory', '../state-simulator/superset')
  .action(async (options) => {
    try {
      const db = new DatabaseInterface(path.resolve(options.input))
      
      console.log(chalk.bold.blue('\n📊 Database Statistics\n'))
      
      const receiptStats = db.getReceiptCountByStatus()
      console.log(chalk.cyan('Receipt Status:'))
      receiptStats.forEach((stat) => {
        const statusName = stat.status === 1 ? 'Success' : 'Failed'
        console.log(chalk.gray(`  ${statusName}: ${stat.count.toLocaleString()}`))
      })

      const cycleRange = db.getCycleRange()
      console.log(chalk.cyan('\nCycle Range:'))
      console.log(chalk.gray(`  Min: ${cycleRange.minCycle}`))
      console.log(chalk.gray(`  Max: ${cycleRange.maxCycle}`))
      
      const activeAccounts = db.getActiveAccountIds()
      console.log(chalk.cyan('\nActive Accounts:'))
      console.log(chalk.gray(`  Total: ${activeAccounts.length.toLocaleString()}`))
      
      console.log()
      
      db.close()
    } catch (error) {
      console.error(chalk.red('Stats failed:'), error)
      process.exit(1)
    }
  })

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled promise rejection:'), error)
  process.exit(1)
})

program.parse(process.argv)