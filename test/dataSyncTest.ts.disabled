import * as utils from './testUtils'
import axios from 'axios'
import { Utils } from '@shardus/types'

export async function getAccountsReport(_shuffle: boolean = false) {
  const activeNodes = await utils.queryActiveNodes()
  const activeNodeList: any = Object.values(activeNodes)
  const index = _shuffle ? Math.floor(Math.random() * activeNodeList.length) : 0
  const host =
    activeNodeList[index].nodeIpInfo.externalIp + ':' + activeNodeList[index].nodeIpInfo.externalPort
  let result = await axios.get(`http://${host}/accounts`)
  console.log(host)
  return result.data
}

export const dataSyncTest = (START_NETWORK_SIZE, EXPECTED_ACTIVE_NODES, accountsCheck = false) => {
  it('Data is correctly synced across the nodes', async () => {
    console.log('TEST: Data is correctly synced across the nodes')
    await utils._sleep(60000) // Wait for 60s before checking
    let result = await utils.getInsyncAll()
    let in_sync =
      result.in_sync === START_NETWORK_SIZE ||
      (EXPECTED_ACTIVE_NODES && result.in_sync === EXPECTED_ACTIVE_NODES)
    if (!in_sync) {
      await utils._sleep(60000)
      result = await utils.getInsyncAll()
      in_sync =
        result.in_sync === START_NETWORK_SIZE ||
        (EXPECTED_ACTIVE_NODES && result.in_sync === EXPECTED_ACTIVE_NODES)
    }
    const out_sync = result.out_sync === 0
    expect(in_sync).toBe(true)
    expect(out_sync).toBe(true)
  })

  if (accountsCheck)
    test('Data is correctly synced across the nodes after nodes rotation', async () => {
      console.log('TEST: Data is correctly synced across the nodes after nodes rotation')
      let data1 = await getAccountsReport()
      await utils._sleep(600000) // Wait for 10 minutes to let network nodes rotate
      let data2 = await getAccountsReport()
      let isSame = Utils.safeStringify(data1) === Utils.safeStringify(data2)
      if (!isSame) {
        await utils._sleep(10000)
        data2 = await getAccountsReport()
        isSame = Utils.safeStringify(data1) === Utils.safeStringify(data2)
      }
      expect(isSame).toBe(true)
    })
}
