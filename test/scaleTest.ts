import execa from 'execa'
import * as utils from './testUtils'
import { join } from 'path'
import { kill } from 'process'

const opts = { shell: true }
const SPAM_CLIENT_DIR = join(__dirname, '../../spam-client') // spam-client repo path
// const abortController = new AbortController()

export async function waitForNetworkLoad(load, value) {
  let isCriteriaMet = false
  while (!isCriteriaMet) {
    try {
      let activeNodes = await utils.queryActiveNodes()
      if (activeNodes) {
        let totalLoad = 0
        let avgLoad = 0
        for (let nodeId in activeNodes) {
          const node = activeNodes[nodeId]
          totalLoad += node.currentLoad.networkLoad
        }
        avgLoad = totalLoad / Object.keys(activeNodes).length
        console.log('avg load', avgLoad)
        if (load === 'high' && avgLoad >= value) isCriteriaMet = true
        else if (load === 'low' && avgLoad <= value) isCriteriaMet = true
        else {
          await utils._sleep(10000)
        }
      }
    } catch (e) {
      // console.log(e)
      await utils._sleep(30000)
    }
  }
  return true
}

export async function waitForNetworkScaling(desired) {
  let isCriteriaMet = false
  while (!isCriteriaMet) {
    try {
      let activeNodes = await utils.queryActiveNodes()
      if (Object.keys(activeNodes).length === desired) isCriteriaMet = true
      else await utils._sleep(10000)
    } catch (e) {
      await utils._sleep(30000)
    }
  }
  return true
}

export const scaleTest = START_NETWORK_SIZE => {
  test('Auto scale up the network successfully', async () => {
    console.log('TEST: Auto scale up the network successfully')
    let spamCommand = `npx hardhat load_test --type eth_transfer --tps 10 --duration 600 --eoa 1000`
    let spamProcess = execa.command(`cd ${SPAM_CLIENT_DIR} && ${spamCommand}`, opts)
    console.log(process.pid)
    console.log(spamProcess.pid)
    let isLoadIncreased = await waitForNetworkLoad('high', 0.2)

    console.log('Waiting for network to scale up...')

    let hasNetworkScaledUp = await waitForNetworkScaling(START_NETWORK_SIZE * 2)
    spamProcess.cancel()

    // try {
    //   await spamProcess;
    //   spamProcess.kill('SIGTERM')
    //   spamProcess.cancel()
    // } catch (e) {
    //   console.log((await spamProcess).isCanceled); // true
	  //   console.log(e.isCanceled); // true
    // }

    // try {
    //   execa.commandSync(`kill -9 ${process.pid - 1}`, { ...opts, stdio: [0, 1, 2] })
    // } catch(e){
    //   console.log(e)
    // }
    expect(isLoadIncreased).toBe(true)
    expect(hasNetworkScaledUp).toBe(true)
  })

  test('Auto scale down the network successfully', async () => {
    console.log('TEST: Auto scale down the network successfully')

    let isLoadDecreased = await waitForNetworkLoad('low', 0.2)
    let hasNetworkScaledDown = await waitForNetworkScaling(START_NETWORK_SIZE)

    expect(hasNetworkScaledDown).toBe(true)
    expect(isLoadDecreased).toBe(true)
  })

  test('Data is correctly synced across the nodes after network scaled down', async () => {
    console.log('TEST: Data is correctly synced across the nodes after network scaled down')
    let result = await utils.getInsyncAll()
    const in_sync = result.in_sync === START_NETWORK_SIZE
    const out_sync = result.out_sync === 0
    expect(in_sync).toBe(true)
    expect(out_sync).toBe(true)
  })
}
