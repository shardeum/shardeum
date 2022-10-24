import execa from 'execa'
import * as utils from './testUtils'
import { join } from 'path'
const { performance } = require('perf_hooks')
const opts = { shell: true }
const LOAD_TESTER = join(__dirname, '../../load-tester') // spam-client repo path
// const abortController = new AbortController()
import { dataSyncTest } from './dataSyncTest'

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
        // console.log('avg load', avgLoad)
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

// desired is node count, and _timeout is maximum time this function will wait until it return false meaning test has failed.
// negative number in _timeout will result in infinte waiting time
export async function waitForNetworkScaling(desired: number, _timeout: number = -1) {
  let isCriteriaMet = false
  const start = performance.now()
  while (!isCriteriaMet) {
    try {
      let activeNodes = await utils.queryActiveNodes()
      if (Object.keys(activeNodes).length === desired) isCriteriaMet = true
      else await utils._sleep(10000)
    } catch (e) {
      await utils._sleep(30000)
    } finally {
      if (_timeout < 0) continue
      const now = performance.now()
      const elapsed = Math.floor(now - start) / 60000
      // console.log(elapsed, "min");
      if (_timeout > 0 && _timeout < elapsed) {
        return false //timeout!!!,  network has failed to scale within the max time, returning false;
      }
    }
  }
  return true
}

export const scaleTest = (START_NETWORK_SIZE: number, EXPECTED_ACTIVE_NODES: number) => {
  test('Auto scale up the network successfully', async () => {
    console.log('TEST: Auto scale up the network successfully')
    // TODO: Add a smart way to decide how much tps to use according to the network size later
    let spamCommand = `node node_modules/.bin/hardhat load_test --type eth_transfer --tps 20 --duration 1800 --eoa 5000`
    let spamProcess = execa.command(`cd ${LOAD_TESTER} && ${spamCommand}`, opts)
    let isLoadIncreased = await waitForNetworkLoad('high', 0.2)

    let hasNetworkScaledUp = await waitForNetworkScaling(EXPECTED_ACTIVE_NODES, 40)

    // this is a little hacky to kill the load tester
    console.log(spamProcess.pid)
    spamProcess.cancel()
    process.kill(spamProcess.pid + 1)

    expect(isLoadIncreased).toBe(true)
    expect(hasNetworkScaledUp).toBe(true)
  })

  test('Auto scale down the network successfully', async () => {
    console.log('TEST: Auto scale down the network successfully')

    let isLoadDecreased = await waitForNetworkLoad('low', 0.2)
    let hasNetworkScaledDown = await waitForNetworkScaling(START_NETWORK_SIZE, 30)

    expect(hasNetworkScaledDown).toBe(true)
    expect(isLoadDecreased).toBe(true)
  })
}
