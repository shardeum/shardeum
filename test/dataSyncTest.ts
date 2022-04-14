import * as utils from './testUtils'
import axios from 'axios'

export async function getAccountsReport() {
  const activeNodes = await utils.queryActiveNodes()
  const activeNodeList: any = Object.values(activeNodes)
  const host = activeNodeList[0].nodeIpInfo.externalIp + ':' + activeNodeList[0].nodeIpInfo.externalPort
  let result = await axios.get(`http://${host}/accounts`)
  return result
}

export const dataSyncTest = () => {
  test('Data is correctly synced across the nodes after nodes rotation', async () => {
    console.log('TEST: Data is correctly synced across the nodes after nodes rotation')
    let data1 = await getAccountsReport()
    await utils._sleep(120000)
    let data2 = await getAccountsReport()
    let isSame = JSON.stringify(data1) === JSON.stringify(data2)
    if (!isSame) {
      await utils._sleep(2000)
      data2 = await getAccountsReport()
      isSame = JSON.stringify(data1) === JSON.stringify(data2)
    }
    expect(isSame).toBe(true)
  })
}
