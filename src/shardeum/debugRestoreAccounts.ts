import * as fs from 'fs'
import * as ShardeumFlags from '../shardeum/shardeumFlags'

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

    const accountFileText = fs.readFileSync(path, 'utf8')
    if (accountFileText == null) {
      return report
    }
    const accountArray = JSON.parse(accountFileText)
    if (accountArray == null) {
      return report
    }

    if (logVerbose) shardus.log(`loadAccountDataFromDB ${accountArray.length}`)

    // for(let account of accountArray){
    //     let {hash, data, accountId, isGlobal, timestamp, cycleNumber} = account
    //     let wrappedResponse = shardus.createWrappedResponse(accountId, false, hash, timestamp, data)
    //     //transform global account?
    //     await shardus.debugSetAccountState(wrappedResponse)
    // }

    let lastTS = -1
    for (let account of accountArray) {
      //account.isGlobal = (account.isGlobal === 1)? true : false
      account.data = JSON.parse(account.data)
      account.isGlobal = Boolean(account.isGlobal)
      account.cycleNumber = 0 //hack to 0

      if (account.timestamp < lastTS) {
        //accounts are descending timestamps.
        throw new Error(`invalid timestamp sort: ${account.timestamp}`)
      }
      lastTS = account.timestamp
    }

    let firstAccount = accountArray[0]
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${JSON.stringify(firstAccount)}`)

    await shardus.debugCommitAccountCopies(accountArray)

    report.loadCount = accountArray.length //todo make this more closed loop on how many accounts were loaded
    report.passed = true
    if (logVerbose) shardus.log(`loadAccountDataFromDB success`)
    //accountsCopy.json
  } catch (error) {
    report.fatal = true
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${JSON.stringify(error)}`)
  }
  return report
}
