import execa from 'execa'
import { resolve, join } from 'path'
import * as crypto from '@shardus/crypto-utils'
import fs from 'fs'
import axios from 'axios'
import * as utils from './testUtils'
import { util } from 'prettier'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

const USE_EXISTING_NETWORK = false
const START_NETWORK_SIZE = 5
let accounts = []
const network = '0'.repeat(64)

const opts = { shell: true }
const LOAD_TESTER = join(__dirname, '../../load-tester') // spam-client repo path

describe('Smoke Testing to the Shardeum Network', () => {
  it('Start a new network ', async () => {
    console.log('TEST: Start a new network ')
    if (USE_EXISTING_NETWORK) {
      console.log('Using existing active network')
      let activeNodes = await utils.queryActiveNodes()
      expect(Object.keys(activeNodes).length).toBe(START_NETWORK_SIZE)
    } else {
      try {
        execa.commandSync('shardus stop', { stdio: [0, 1, 2] })
        await utils._sleep(3000)
        execa.commandSync('rm -rf instances')
      } catch (e) {
        console.log('Unable to remove instances folder')
      }
      execa.commandSync(`shardus create --no-log-rotation  ${START_NETWORK_SIZE}`, {
        ...opts /*stdio: [0, 1, 2]*/,
      })
      const isNetworkActive = await utils.waitForNetworkToBeActive(START_NETWORK_SIZE)
      expect(isNetworkActive).toBe(true)
    }
  })

  it('Process eth transfer txs at the rate of 2 txs per node/per second for 1 min', async () => {
    console.log('TEST: Process txs at the rate of 2 txs per node/per second for 1 min')

    const activeNodes = await utils.queryActiveNodes()
    const nodeCount = Object.keys(activeNodes).length
    const durationMinute = 1
    const durationSecond = 60 * durationMinute
    // const durationSecond = 10
    const durationMiliSecond = 1000 * durationSecond

    await utils.resetReport()
    await utils._sleep(10000) // need to wait monitor-server to collect active nodes after reset

    console.log('Spamming the network ...')

    let spamCommand = `npx hardhat load_test --type eth_transfer --tps ${nodeCount *
      2} --duration ${durationSecond} --eoa ${nodeCount * 50} --validate true`
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

  it('Process token transfer txs of 5 ERC20 contracts at the rate of 2 txs per node/per second for 1 min', async () => {
    console.log('TEST: Process txs at the rate of 2 txs per node/per second for 1 min')

    const activeNodes = await utils.queryActiveNodes()
    const nodeCount = Object.keys(activeNodes).length
    const durationMinute = 1
    const durationSecond = 60 * durationMinute
    // const durationSecond = 10
    const durationMiliSecond = 1000 * durationSecond

    // await utils.resetReport()
    await utils._sleep(10000) // need to wait monitor-server to collect active nodes after reset

    console.log('Spamming the network ...')

    let spamCommand = `npx hardhat load_test --type token_transfer --tps ${nodeCount *
      2} --duration ${durationSecond} --contracts 5 --eoa ${nodeCount * 50} --validate true --deploytps 1`
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

  it('Data is correctly synced across the nodes', async () => {
    console.log('TEST: Data is correctly synced across the nodes')
    let result = await utils.getInsyncAll()
    const in_sync = result.in_sync === START_NETWORK_SIZE
    const out_sync = result.out_sync === 0
    expect(in_sync).toBe(true)
    expect(out_sync).toBe(true)
  })

  test('Start new archivers ', async () => {
    console.log('TEST: Start new archivers ')

    try {
      execa.commandSync('shardus-network start --archivers 1', { ...opts /*stdio: [0, 1, 2]*/ })
    } catch (e) {
      console.log(e)
    }
    let hasNewArchiverJoined = await utils.waitForArchiverToJoin('localhost', 4001)

    expect(hasNewArchiverJoined).toBe(true)
  })

  test('New archivers sync archived data ', async () => {
    console.log('TEST: New archivers sync archived data ')
    await utils._sleep(60000) // needs to wait while new archiver is syncing data

    // const dataFromArchiver_1 = await utils.queryArchivedCycles('localhost', 4000, 5)
    // const dataFromArchiver_2 = await utils.queryArchivedCycles('localhost', 4001, 5)
    // let hasSameData = true
    // for (let i = 0; i < dataFromArchiver_1.length; i++) {
    //     let data1 = dataFromArchiver_1[i]
    //     let data2 = dataFromArchiver_2[i]
    //     let isSame = JSON.stringify(data1) === JSON.stringify(data2)
    //     if (!isSame) {
    //         hasSameData = isSame
    //     }
    // }
    const dataFromArchiver_1 = await utils.queryArchiverTotalData('localhost', 4000)
    const dataFromArchiver_2 = await utils.queryArchiverTotalData('localhost', 4001)
    let hasSameData = true
    console.log('Check totalCycles', dataFromArchiver_1.totalCycles, dataFromArchiver_2.totalCycles)
    if (dataFromArchiver_1.totalCycles !== dataFromArchiver_2.totalCycles) hasSameData = false
    console.log('Check totalAccounts', dataFromArchiver_1.totalAccounts, dataFromArchiver_2.totalAccounts)
    if (dataFromArchiver_1.totalAccounts !== dataFromArchiver_2.totalAccounts) hasSameData = false
    console.log(
      'Check totalTransactions',
      dataFromArchiver_1.totalTransactions,
      dataFromArchiver_2.totalTransactions
    )
    if (dataFromArchiver_1.totalTransactions !== dataFromArchiver_2.totalTransactions) hasSameData = false
    console.log('Check totalReceipts', dataFromArchiver_1.totalReceipts, dataFromArchiver_2.totalReceipts)
    if (dataFromArchiver_1.totalReceipts !== dataFromArchiver_2.totalReceipts) hasSameData = false
    expect(hasSameData).toBe(true)
  })

  test('Cleans a network ', async () => {
    execa.commandSync('shardus stop', { stdio: [0, 1, 2] })
    await utils._sleep(3000)
    execa.commandSync('shardus clean', { stdio: [0, 1, 2] })
    await utils._sleep(2000)
    execa.commandSync('rm -rf instances')
    expect(true).toBe(true)
  })
})
