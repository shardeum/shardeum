import * as fs from 'fs'
import { networkAccount } from '..'
import * as ShardeumFlags from '../shardeum/shardeumFlags'
import * as Path from 'path'
import { sleep } from '../utils'
export interface LoadOptions {
  file: string
}

export interface LoadReport {
  passed: boolean
  loadCount: number
  fatal: boolean
}

export async function loadAccountDataFromDB(shardus: any, options: LoadOptions): Promise<LoadReport> {
  let report: LoadReport = {
    passed: false,
    loadCount: 0,
    fatal: false,
  }




  let logVerbose = ShardeumFlags.VerboseLogs //shardus.getLogFlags().verbose

  if (logVerbose) shardus.log(`loadAccountDataFromDB`)
  try {
    let path = options.file

    path = Path.resolve('./', path)

    if(fs.existsSync(path) === false){
      console.log(`loadAccountDataFromDB: ${path}  does not exist`)
      return report
    }

    const accountFileText = fs.readFileSync(path, 'utf8')
    if (accountFileText == null) {
      return report
    }
    const accountArray = JSON.parse(accountFileText)
    if (accountArray == null) {
      return report
    }

    if (logVerbose) shardus.log(`loadAccountDataFromDB ${accountArray.length}`)
    console.log(`loadAccountDataFromDB: ${accountArray.length}`)

    // for(let account of accountArray){
    //     let {hash, data, accountId, isGlobal, timestamp, cycleNumber} = account
    //     let wrappedResponse = shardus.createWrappedResponse(accountId, false, hash, timestamp, data)
    //     //transform global account?
    //     await shardus.debugSetAccountState(wrappedResponse)
    // }

    let rawAccounts = []
    let lastTS = -1
    for (let account of accountArray) {
      //account.isGlobal = (account.isGlobal === 1)? true : false
      account.data = JSON.parse(account.data)
      account.isGlobal = Boolean(account.isGlobal)
      account.cycleNumber = 0 //force to 0.  later if we use a cycle offset, then we leave cycle number alone
                              //but for now we have to start back at 0 in a new network

      if(account.timestamp === 0){
        account.timestamp = 1 //fix some old data to have non zero timestamps
      }

      if(account.data.timestamp === 0){
        account.data.timestamp = 1 //fix some old data to have non zero timestamps
      }

      // in liberty 1.0 contract accounts were globbal.  They are now going to be non global in 
      // liberty 1.1   We will keep the network account as global though
      if(account.accountId != networkAccount){
        account.isGlobal = false
      }

      if (account.timestamp < lastTS) {
        //accounts are descending timestamps.
        throw new Error(`invalid timestamp sort: ${account.timestamp}`)
      }
      lastTS = account.timestamp

      rawAccounts.push(account)
    }

    let firstAccount = accountArray[0]
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${JSON.stringify(firstAccount)}`)

    let limit = 10000
    let j = limit
    for (let i = 0; i < rawAccounts.length; i = j) {
      console.log(i, limit)
      const accountsToForward = rawAccounts.slice(i, limit)
      try {
        await shardus.forwardAccounts(accountsToForward)
      } catch (error) {
        console.log(`loadAccountDataFromDB:` + error.name + ': ' + error.message + ' at ' + error.stack)
      }
      j = limit
      limit += 10000
      await sleep(1000)
    }

    await shardus.debugCommitAccountCopies(accountArray)

    report.loadCount = accountArray.length //todo make this more closed loop on how many accounts were loaded
    report.passed = true
    if (logVerbose) shardus.log(`loadAccountDataFromDB success`)
    //accountsCopy.json
  } catch (error) {
    report.fatal = true
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${JSON.stringify(error)}`)

    throw new Error(`loadAccountDataFromDB:` + error.name + ': ' + error.message + ' at ' + error.stack)
  }
  return report
}

