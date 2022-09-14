import execa from 'execa'
import * as utils from '../testUtils'

const opts = { shell: true }

export const archiverTest = () => {
  test('Start new archivers successfully', async () => {
    console.log('TEST: Start new archivers successfully')

    try {
      execa.commandSync('shardus start --archivers 1', { ...opts, stdio: [0, 1, 2] })
    } catch (e) {
      console.log(e)
    }
    let hasNewArchiverJoined = await utils.waitForArchiverToJoin('localhost', 4001)

    expect(hasNewArchiverJoined).toBe(true)
  })

  test('New archivers sync archived data successfully', async () => {
    console.log('TEST: New archivers sync archived data successfully')
    await utils._sleep(60000 * 5) // needs to wait while new archiver is syncing data

    // const dataFromArchiver_1 = await utils.queryArchivedCycles('localhost', 4000, 5)
    // console.log('archiver:4000')
    // const dataFromArchiver_2 = await utils.queryArchivedCycles('localhost', 4001, 5)
    // console.log('archiver:4001')
    // let hasSameData = true
    // for (let i = 0; i < dataFromArchiver_1.length; i++) {
    //   let data1 = dataFromArchiver_1[i]
    //   let data2 = dataFromArchiver_2[i]
    //   let isSame = JSON.stringify(data1) === JSON.stringify(data2)
    //   if (!isSame) {
    //     hasSameData = isSame
    //   }
    // }

    const dataFromArchiver_1 = await utils.queryArchiverTotalData('localhost', 4000)
    const dataFromArchiver_2 = await utils.queryArchiverTotalData('localhost', 4001)
    let hasSameData = true
    console.log('Check totalCycles', dataFromArchiver_1.totalCycles, dataFromArchiver_2.totalCycles)
    if (dataFromArchiver_1.totalCycles !== dataFromArchiver_2.totalCycles) hasSameData = false
    console.log('Check totalAccounts', dataFromArchiver_1.totalAccounts, dataFromArchiver_2.totalAccounts)
    if (dataFromArchiver_1.totalAccounts !== dataFromArchiver_2.totalAccounts) hasSameData = false
    console.log('Check totalTransactions', dataFromArchiver_1.totalTransactions, dataFromArchiver_2.totalTransactions)
    if (dataFromArchiver_1.totalTransactions !== dataFromArchiver_2.totalTransactions) hasSameData = false
    console.log('Check totalReceipts', dataFromArchiver_1.totalReceipts, dataFromArchiver_2.totalReceipts)
    if (dataFromArchiver_1.totalReceipts !== dataFromArchiver_2.totalReceipts) hasSameData = false
    expect(hasSameData).toBe(true)
  })
}
