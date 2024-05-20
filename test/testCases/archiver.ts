import execa from 'execa'
import * as utils from '../testUtils'
import * as AccountsCheck from '../../scripts/accountsSyncCheck'
import { Utils } from '@shardus/types'

const opts = { shell: true }

export const archiverTest = (startNewAchiver = false, checkTotalDataCheck = false, dataSyncTest = false) => {
  if (startNewAchiver) {
    test('Start new archivers successfully', async () => {
      console.log('TEST: Start new archivers successfully')

      try {
        execa.commandSync('shardus start --archivers 1', { ...opts /*stdio: [0, 1, 2]*/ })
      } catch (e) {
        console.log(e)
      }
      let hasNewArchiverJoined = await utils.waitForArchiverToJoin('localhost', 4001)

      expect(hasNewArchiverJoined).toBe(true)
    })
  }

  if (checkTotalDataCheck) {
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
      // let hasSameData = true
      let hasSameCyclesData = true
      let hasSameAccountsData = true
      let hasSameTransactionsData = true
      let hasSameReceiptsData = true
      console.log('Check totalCycles', dataFromArchiver_1.totalCycles, dataFromArchiver_2.totalCycles)
      if (dataFromArchiver_1.totalCycles !== dataFromArchiver_2.totalCycles) hasSameCyclesData = false
      console.log('Check totalAccounts', dataFromArchiver_1.totalAccounts, dataFromArchiver_2.totalAccounts)
      if (dataFromArchiver_1.totalAccounts !== dataFromArchiver_2.totalAccounts) hasSameAccountsData = false
      console.log(
        'Check totalTransactions',
        dataFromArchiver_1.totalTransactions,
        dataFromArchiver_2.totalTransactions
      )
      if (dataFromArchiver_1.totalTransactions !== dataFromArchiver_2.totalTransactions)
        hasSameTransactionsData = false
      console.log('Check totalReceipts', dataFromArchiver_1.totalReceipts, dataFromArchiver_2.totalReceipts)
      if (dataFromArchiver_1.totalReceipts !== dataFromArchiver_2.totalReceipts) hasSameReceiptsData = false
      // expect(hasSameData).toBe(true)
      expect(hasSameCyclesData).toBe(true)
      expect(hasSameAccountsData).toBe(true)
      expect(hasSameTransactionsData).toBe(true)
      expect(hasSameReceiptsData).toBe(true)
    })
  }

  if (dataSyncTest) {
    test('Check if cycles data among archivers are same.', async () => {
      console.log('TEST: Check if cycle data among archivers are same.')

      console.log('Comparing the latest 100 cycles.')
      const dataFromArchiver_1 = await utils.queryLatestCycleRecordFromArchiver('localhost', 4000, 100)
      const dataFromArchiver_2 = await utils.queryLatestCycleRecordFromArchiver('localhost', 4001, 100)

      let allCyclesAreMatched = true
      let j = 0
      let i = 0
      console.log(dataFromArchiver_1)
      while (dataFromArchiver_1[i].counter !== dataFromArchiver_2[j].counter) {
        i++
      }
      for (i; i < dataFromArchiver_1.length; i++) {
        let data1 = dataFromArchiver_1[i]
        let data2 = dataFromArchiver_2[j]
        if (data2) {
          let isSame = Utils.safeStringify(data1) === Utils.safeStringify(data2)
          j++
          if (!isSame) {
            console.log(data1.counter, data2.counter, isSame)
            allCyclesAreMatched = isSame
          }
        }
      }
      expect(allCyclesAreMatched).toBe(true)
    })

    test('Check if receipts data among archivers are same.', async () => {
      console.log('TEST: Check if receipts data among archivers are same.')

      console.log('Get the latest receipt info from an archiver.')
      const latestReceipt = await utils.queryLatestReceiptFromArchiver('localhost', 4000, 1)
      const endCycle = latestReceipt.cycle
      const startCycle = latestReceipt.cycle - 10

      console.log('Comparing the receipts count of 10 cycles.')
      const dataFromArchiver_1 = await utils.queryReceiptsByCycle('localhost', 4000, startCycle, endCycle)
      const dataFromArchiver_2 = await utils.queryReceiptsByCycle('localhost', 4001, startCycle, endCycle)

      let hasSameData = true
      let j = 0
      let i = 0
      for (i; i < dataFromArchiver_1.length; i++) {
        let data1 = dataFromArchiver_1[i]
        let data2 = dataFromArchiver_2[j]
        if (data2) {
          let isSame = data1.cycle === data2.cycle && data1.receipts === data2.receipts
          j++
          if (!isSame) {
            console.log(data1, data2, isSame)
            hasSameData = isSame
          }
        }
      }
      expect(hasSameData).toBe(true)
    })

    test('Check if archiver misses any data (receipts/accounts).', async () => {
      console.log('TEST: Check if cycle data among archivers are same.')

      console.log('Collecting accounts Data from consensors and archiver.')
      const consensorAccounts = await AccountsCheck.getAccountsDataFromConsensors()
      const archiverAccounts = await AccountsCheck.getAccountsDataFromArchiver()

      let hasSameData = true
      console.log('Missing Accounts on Archiver!')
      for (let account1 of consensorAccounts) {
        let found = false
        for (let account2 of archiverAccounts) {
          if (account1.accountId === account2.accountId) {
            found = true
          }
        }
        if (!found) {
          console.log(account1.accountId)
          hasSameData = false
        }
      }
      console.log('Missing Accounts on Consensors!')
      for (let account1 of archiverAccounts) {
        let found = false
        for (let account2 of consensorAccounts) {
          if (account1.accountId === account2.accountId) {
            found = true
          }
        }
        if (!found) {
          console.log(account1.accountId)
          hasSameData = false
        }
      }
      expect(hasSameData).toBe(true)
    })
  }
}
