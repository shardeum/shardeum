import execa from 'execa'
import { join } from 'path'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import * as utils from '../testUtils'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

const opts = { shell: true }
const LOAD_TESTER = join(__dirname, '../../../load-tester') // spam-client repo path

export const transactionsTest = (START_NETWORK_SIZE: number, EXPECTED_ACTIVE_NODES = null) => {
  it('Process eth transfer txs at the rate of 2 txs per second for 1 min', async () => {
    console.log('TEST: Process eth transfer txs at the rate of 2 txs per second for 1 min')

    // const activeNodes = await utils.queryActiveNodes()
    // const nodeCount = Object.keys(activeNodes).length
    const durationMinute = 1
    const durationSecond = 60 * durationMinute
    // const durationSecond = 10
    const durationMiliSecond = 1000 * durationSecond

    await utils.resetReport()
    await utils._sleep(10000) // need to wait monitor-server to collect active nodes after reset

    console.log('Spamming the network ...')

    let spamCommand = `npx hardhat load_test --type eth_transfer --tps 2 --duration ${durationSecond} --eoa 100 --validate true`
    // const { stdout, stderr } = await execa.command(`cd ${SPAM_CLIENT_DIR} && ls `, opts)
    // console.log(stdout, stderr)
    // execa.command('ls').stdout.pipe(process.stdout)
    execa.commandSync(`cd ${LOAD_TESTER} && ${spamCommand}`, { ...opts /*stdio: [0, 1, 2]*/ })
    await utils._sleep(durationMiliSecond + 10000) // extra 10s for processing pending txs in the queue

    let report = await utils.queryLatestReport()
    let processedRatio = report.totalProcessed / report.totalInjected

    // TBC: process / injected ratio should be 80% or more
    expect(processedRatio).toBeGreaterThanOrEqual(0.8)
    // TBC: rejected should be less than 3% of total injected
    expect(report.totalRejected).toBeLessThanOrEqual(report.totalInjected * 0.03)
  })

  it('Process token transfer txs of 2 ERC20 contracts at the rate of 5 txs per second for 1 min', async () => {
    console.log(
      'TEST: Process token transfer txs of 2 ERC20 contracts at the rate of 5 txs per second for 1 min'
    )

    // const activeNodes = await utils.queryActiveNodes()
    // const nodeCount = Object.keys(activeNodes).length
    const durationMinute = 1
    const durationSecond = 60 * durationMinute
    // const durationSecond = 10
    const durationMiliSecond = 1000 * durationSecond

    await utils.resetReport()
    await utils._sleep(10000) // need to wait monitor-server to collect active nodes after reset

    console.log('Spamming the network ...')

    let spamCommand = `npx hardhat load_test --type token_transfer --tps 2 --duration ${durationSecond} --contracts 5 --eoa 100 --validate true --deploytps 1`
    // const { stdout, stderr } = await execa.command(`cd ${SPAM_CLIENT_DIR} && ls `, opts)
    // console.log(stdout, stderr)
    // execa.command('ls').stdout.pipe(process.stdout)
    execa.commandSync(`cd ${LOAD_TESTER} && ${spamCommand}`, { ...opts /*stdio: [0, 1, 2]*/ })
    await utils._sleep(durationMiliSecond + 10000) // extra 10s for processing pending txs in the queue

    let report = await utils.queryLatestReport()
    let processedRatio = report.totalProcessed / report.totalInjected

    // TBC: process / injected ratio should be 80% or more
    expect(processedRatio).toBeGreaterThanOrEqual(0.8)
    // TBC: rejected should be less than 3% of total injected
    expect(report.totalRejected).toBeLessThanOrEqual(report.totalInjected * 0.03)
  })
}
