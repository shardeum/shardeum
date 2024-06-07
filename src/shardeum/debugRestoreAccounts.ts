import * as fs from 'fs'
import { logFlags, setGenesisAccounts } from '..'
import { networkAccount } from '../shardeum/shardeumConstants'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import * as Path from 'path'
import * as readline from 'readline'
import { once } from 'events'
import { AccountType } from './shardeumTypes'
import { Shardus } from '@shardus/core'
import { Utils } from '@shardus/types'
export interface LoadOptions {
  file: string
}

export interface LoadReport {
  passed: boolean
  loadCount: number
  loadFailed: number
  fatal: boolean
}

const loadInitialDataPerBatch = true

export async function loadAccountDataFromDB(shardus: Shardus, options: LoadOptions): Promise<LoadReport> {
  const report: LoadReport = {
    passed: false,
    loadCount: 0,
    loadFailed: 0,
    fatal: false,
  }

  const logVerbose = ShardeumFlags.VerboseLogs //shardus.getLogFlags().verbose

  /* prettier-ignore */ if (logFlags.dapp_verbose) shardus.log(`loadAccountDataFromDB`)
  try {
    let path = options.file

    path = Path.resolve('./', path)

    // ./account-export.json from ShardeumFlags.ts
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(path) === false) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`loadAccountDataFromDB: ${path}  does not exist`)
      return report
    }

    let accountArray = []
    let totalAccounts = 0
    if (loadInitialDataPerBatch === true) {
      const rl = readline.createInterface({
        // ./account-export.json from ShardeumFlags.ts
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        input: fs.createReadStream(path),
        output: process.stdout,
        terminal: false,
        crlfDelay: Infinity,
      })
      rl.on('line', async (line) => {
        if (line != '') {
          try {
            const account = Utils.safeJsonParse(line)
            if (account != null) {
              accountArray.push(account)
              totalAccounts++
            }
            if (accountArray.length % 1000 === 0) {
              rl.pause()
              await processAccountsData(shardus, report, [...accountArray])
              if (accountArray.length >= 1000) {
                accountArray = accountArray.slice(1000, accountArray.length)
              }
              rl.resume()
            }
          } catch (ex) {
            /* prettier-ignore */ if (logFlags.error) console.log('Error in parsing the line', line, ex)
          }
        }
      })
      await once(rl, 'close')
      if (accountArray.length > 0) {
        await processAccountsData(shardus, report, accountArray)
        accountArray = []
      }
      /* prettier-ignore */ if (logFlags.dapp_verbose) shardus.log(`loadAccountDataFromDB ${totalAccounts}`)
      console.log(`loadAccountDataFromDB: ${totalAccounts}`)
      return report
    } else {
      const rl = readline.createInterface({
        // ./account-export.json from ShardeumFlags.ts
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        input: fs.createReadStream(path),
        output: process.stdout,
        terminal: false,
        crlfDelay: Infinity,
      })
      rl.on('line', (line) => {
        if (line != '') {
          try {
            const account = Utils.safeJsonParse(line)
            if (account != null) {
              accountArray.push(account)
            }
          } catch (ex) {}
        }
      })
      await once(rl, 'close')
    }

    if (logVerbose) shardus.log(`loadAccountDataFromDB ${accountArray.length}`)
    console.log(`loadAccountDataFromDB: ${accountArray.length}`)

    // for(let account of accountArray){
    //     let {hash, data, accountId, isGlobal, timestamp, cycleNumber} = account
    //     let wrappedResponse = shardus.createWrappedResponse(accountId, false, hash, timestamp, data)
    //     //transform global account?
    //     await shardus.debugSetAccountState(wrappedResponse)
    // }
    await processAccountsData(shardus, report, accountArray)
    if (logVerbose) shardus.log(`loadAccountDataFromDB success`)
    //accountsCopy.json
  } catch (error) {
    report.fatal = true
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${Utils.safeStringify(error)}`)

    throw new Error(`loadAccountDataFromDB:` + error.name + ': ' + error.message + ' at ' + error.stack)
  }
  return report
}

export const processAccountsData = async (shardus, report: LoadReport, accountArray): Promise<void> => {
  const logVerbose = ShardeumFlags.VerboseLogs
  let lastTS = -1
  const accountArrayClean = {
    accounts: [],
    receipts: [],
  }
  for (const account of accountArray) {
    //account.isGlobal = (account.isGlobal === 1)? true : false
    try {
      account.data = Utils.safeJsonParse(account.data)
      // skip account with accountIds starting with "0x"
      if (account.accountId.indexOf('0x') >= 0) continue
    } catch (error) {
      if (report.loadFailed < 100) {
        //log first 100 parsing errors
        console.log(`error parsing`, account.data)
      }
      report.loadFailed++
      continue
    }

    account.isGlobal = Boolean(account.isGlobal)
    account.cycleNumber = 0 //force to 0.  later if we use a cycle offset, then we leave cycle number alone
    //but for now we have to start back at 0 in a new network

    if (account.timestamp === 0) {
      account.timestamp = 1 //fix some old data to have non zero timestamps
    }

    if (account.data.timestamp === 0) {
      account.data.timestamp = 1 //fix some old data to have non zero timestamps
    }

    // in liberty 1.0 contract accounts were globbal.  They are now going to be non global in
    // liberty 1.1   We will keep the network account as global though
    if (account.accountId != networkAccount) {
      account.isGlobal = false
    }

    if (account.timestamp < lastTS) {
      //accounts are descending timestamps.
      throw new Error(`invalid timestamp sort: ${account.timestamp}`)
    }
    lastTS = account.timestamp

    // Filter out failed EVM Receipts to get stored
    // if (account.data.accountType) {
    //   if (
    //     account.data.accountType === AccountType.Receipt ||
    //     account.data.accountType === AccountType.NodeRewardReceipt
    //   ) {
    //     if (account.data.readableReceipt.status === 0) continue
    //   }
    // }

    if (!ShardeumFlags.EVMReceiptsAsAccounts) {
      if (
        account.data.accountType === AccountType.Receipt ||
        account.data.accountType === AccountType.NodeRewardReceipt ||
        account.data.accountType === AccountType.StakeReceipt ||
        account.data.accountType === AccountType.UnstakeReceipt ||
        account.data.accountType === AccountType.InternalTxReceipt
      )
        accountArrayClean.receipts.push(account)
      else accountArrayClean.accounts.push(account)
    } else {
      accountArrayClean.accounts.push(account)
    }
  }

  //replace with the clean array
  // accountArray = accountArrayClean

  if (report.loadCount === 0) {
    const firstAccount = accountArrayClean.accounts[0]
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${Utils.safeStringify(firstAccount)}`)
  }

  if (ShardeumFlags.forwardGenesisAccounts) {
    // let bucketSize = ShardeumFlags.DebugRestoreArchiveBatch
    // let limit = bucketSize
    // let j = limit
    // let accountsToForward
    // for (let i = 0; i < accountArray.length; i = j) {
    //   if (i === 0 && accountArray.length < limit) accountsToForward = accountArray
    //   else accountsToForward = accountArray.slice(i, limit)
    //   console.log(i, accountsToForward.length)
    //   try {
    //     await shardus.forwardAccounts(accountsToForward)
    //   } catch (error) {
    //     console.log(`loadAccountDataFromDB:` + error.name + ': ' + error.message + ' at ' + error.stack)
    //   }
    //   j = limit
    //   limit += bucketSize
    //   await sleep(1000)
    // }
    try {
      console.log(
        'Restore data to forward',
        'accounts size',
        accountArrayClean.accounts.length,
        'receipts size',
        accountArrayClean.receipts.length
      )
      await shardus.forwardAccounts({
        accounts: accountArrayClean.accounts,
        receipts: accountArrayClean.receipts,
      })
    } catch (error) {
      console.log(`loadAccountDataFromDB:` + error.name + ': ' + error.message + ' at ' + error.stack)
    }
  } else {
    await shardus.forwardAccounts({ accounts: accountArrayClean.accounts, receipts: [] })
    setGenesisAccounts(accountArrayClean.accounts) // As an assumption to save in memory, so that when it's queried it can reponse fast, we can make it query from DB later
  }

  await shardus.debugCommitAccountCopies(accountArrayClean.accounts)

  report.loadCount = report.loadCount + accountArray.length //todo make this more closed loop on how many accounts were loaded
  report.passed = true
}
