import * as utils from './testUtils'
import axios from 'axios'

export async function getAccountsReport() {
  const activeNodes = await utils.queryActiveNodes()
  const activeNodeList: any = Object.values(activeNodes)
  const host = activeNodeList[0].nodeIpInfo.externalIp + ':' + activeNodeList[0].nodeIpInfo.externalPort
  let result = await axios.get(`http://${host}/accounts`)
  return result.data
}

export const dataSyncTest = (START_NETWORK_SIZE, EXPECTED_ACTIVE_NODES, accountsCheck = false) => {
  it('Data is correctly synced across the nodes', async () => {
    console.log('TEST: Data is correctly synced across the nodes')
    await utils._sleep(30000) // Wait for 30s before checking
    let result = await utils.getInsyncAll()
    let in_sync = result.in_sync === START_NETWORK_SIZE || (EXPECTED_ACTIVE_NODES && result.in_sync === EXPECTED_ACTIVE_NODES)
    if (!in_sync) {
      await utils._sleep(30000)
      result = await utils.getInsyncAll()
      in_sync = result.in_sync === START_NETWORK_SIZE || (EXPECTED_ACTIVE_NODES && result.in_sync === EXPECTED_ACTIVE_NODES)
    }
    const out_sync = result.out_sync === 0
    expect(in_sync).toBe(true)
    expect(out_sync).toBe(true)
  })

  if (accountsCheck)
    test('Data is correctly synced across the nodes after nodes rotation', async () => {
      console.log('TEST: Data is correctly synced across the nodes after nodes rotation')
      let data1 = await getAccountsReport()
      await utils._sleep(1000000) // Wait for 10 minutes to let network nodes rotate
      let data2 = await getAccountsReport()
      let isSame = JSON.stringify(data1) === JSON.stringify(data2)
      if (!isSame) {
        await utils._sleep(5000)
        data2 = await getAccountsReport()
        isSame = JSON.stringify(data1) === JSON.stringify(data2)
      }
      expect(isSame).toBe(true)
    })
}
