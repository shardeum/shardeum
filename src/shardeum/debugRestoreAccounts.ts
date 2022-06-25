import * as fs from 'fs'
import { setGenesisAccounts, networkAccount } from '..'
import * as ShardeumFlags from '../shardeum/shardeumFlags'
import * as Path from 'path'
import { sleep } from '../utils'
export interface LoadOptions {
  file: string
}

export interface LoadReport {
  passed: boolean
  loadCount: number
  loadFailed: number
  fatal: boolean
}

export async function loadAccountDataFromDB(shardus: any, options: LoadOptions): Promise<LoadReport> {
  let report: LoadReport = {
    passed: false,
    loadCount: 0,
    loadFailed: 0,
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
    let accountArray = JSON.parse(accountFileText)
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

    let lastTS = -1
    let accountArrayClean = []
    for (let account of accountArray) {
      //account.isGlobal = (account.isGlobal === 1)? true : false
      try{
        account.data = JSON.parse(account.data)
      } catch (error){
        if(report.loadFailed < 100){
          //log first 100 parsing errors
          console.log(`error parsing ${account.data}`)          
        }
        report.loadFailed++
        continue
      }

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

      accountArrayClean.push(account)
    }

    //replace with the clean array
    accountArray = accountArrayClean

    let firstAccount = accountArray[0]
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${JSON.stringify(firstAccount)}`)

    if (ShardeumFlags.forwardGenesisAccounts) {
      let bucketSize = ShardeumFlags.DebugRestoreArchiveBatch
      let limit = bucketSize
      let j = limit
      for (let i = 0; i < accountArray.length; i = j) {
        console.log(i, limit)
        const accountsToForward = accountArray.slice(i, limit)
        try {
          await shardus.forwardAccounts(accountsToForward)
        } catch (error) {
          console.log(`loadAccountDataFromDB:` + error.name + ': ' + error.message + ' at ' + error.stack)
        }
        j = limit
        limit += bucketSize
        await sleep(1000)
      }
    } else {
      await shardus.forwardAccounts(accountArray.length)
      setGenesisAccounts(accountArray) // As an assumption to save in memory, so that when it's queried it can reponse fast, we can make it query from DB later 
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

