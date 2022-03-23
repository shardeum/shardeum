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
const spamClientDir = join(__dirname, '../../spam-client') // spam-client repo path

describe('Smoke Testing to the Shardeum Network', () => {

    it('Start a new network successfully', async () => {
        console.log('TEST: Start a new network successfully')
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
            execa.commandSync(`shardus create --no-log-rotation  ${START_NETWORK_SIZE}`) // start 2 times of minNode
            const isNetworkActive = await utils.waitForNetworkToBeActive(START_NETWORK_SIZE)
            expect(isNetworkActive).toBe(true)
        }
    })


    it('Process txs at the rate of 2 txs per node/per second for 1 min', async () => {
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

        let spamCommand = `npx hardhat load_test --type eth_transfer --tps ${nodeCount * 2} --duration ${durationSecond} --eoa ${nodeCount * 50} --validate true`
        // const { stdout, stderr } = await execa.command(`cd ${spamClientDir} && `, opts)
        // console.log(stdout, stderr)
        // execa.command('ls').stdout.pipe(process.stdout)
        execa.commandSync(`cd ${spamClientDir} && ${spamCommand}`, { ...opts, stdio: [0, 1, 2] })
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
        // console.log(result)
        const in_sync = result.in_sync === START_NETWORK_SIZE
        const out_sync = result.out_sync === 0
        expect(in_sync).toBe(true)
        expect(out_sync).toBe(true)
    })


    test('Cleans a network successfully', async () => {
        execa.commandSync('shardus stop', { stdio: [0, 1, 2] })
        await utils._sleep(3000)
        execa.commandSync('shardus clean', { stdio: [0, 1, 2] })
        await utils._sleep(2000)
        execa.commandSync('rm -rf instances')
        expect(true).toBe(true)
    })
})