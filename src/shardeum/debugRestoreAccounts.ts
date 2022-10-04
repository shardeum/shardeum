import * as fs from 'fs'
import { setGenesisAccounts, networkAccount } from '..'
import * as ShardeumFlags from '../shardeum/shardeumFlags'
import * as Path from 'path'
import { sleep } from '../utils'
import * as readline from 'readline'
import { once } from 'events'
export interface LoadOptions {
  file: string
}

export interface LoadReport {
  passed: boolean
  loadCount: number
  loadFailed: number
  fatal: boolean
}

let oneJsonAccountPerLine = true
let loadInitialDataPerBatch = false

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

    let accountArray = []
    let totalAccounts = 0
    if(oneJsonAccountPerLine === false){
      const accountFileText = fs.readFileSync(path, 'utf8')
      if (accountFileText == null) {
        return report
      }
      accountArray = JSON.parse(accountFileText)
      if (accountArray == null) {
        return report
      }
    } else if (loadInitialDataPerBatch === true) {
      const rl = readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        terminal: false,
        crlfDelay: Infinity,
      })
      rl.on('line', async line => {
        if (line != '') {
          try {
            const account = JSON.parse(line)
            if (account != null) {
              accountArray.push(account)
              totalAccounts++
            }
            if (accountArray.length % 1000 === 0) {
              rl.pause()
              await processAccountsData(shardus, report, accountArray)
              accountArray = []
              rl.resume()
            }
          } catch (ex) {
            console.log('Error in parsing the line', line, ex)
          }
        }
      })
      await once(rl, 'close')
      await processAccountsData(shardus, report, accountArray)
      if (accountArray.length > 0) {
        await processAccountsData(shardus, report, accountArray)
        accountArray = []
      }
      if (logVerbose) shardus.log(`loadAccountDataFromDB ${totalAccounts}`)
      console.log(`loadAccountDataFromDB: ${totalAccounts}`)
      return report
    } else {
      const rl = readline.createInterface({
        input: fs.createReadStream(path),
        output: process.stdout,
        terminal: false,
        crlfDelay: Infinity
      })
      rl.on('line', (line) => {
        if(line != ''){
          try{
            const account = JSON.parse(line)
            if(account != null){
              accountArray.push(account)
            }
          } catch(ex){

          }
        }
      })
      await once(rl, 'close');
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
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${JSON.stringify(error)}`)

    throw new Error(`loadAccountDataFromDB:` + error.name + ': ' + error.message + ' at ' + error.stack)
  }
  return report
}

export const processAccountsData = async (shardus, report: LoadReport, accountArray) => {
  let logVerbose = ShardeumFlags.VerboseLogs
  let lastTS = -1
  let accountArrayClean = []
  for (let account of accountArray) {
    //account.isGlobal = (account.isGlobal === 1)? true : false
    try {
      account.data = JSON.parse(account.data)
      // skip account with accountIds starting with "0x"
      if (account.accountId.indexOf('0x') >= 0) continue
    } catch (error) {
      if (report.loadFailed < 100) {
        //log first 100 parsing errors
        console.log(`error parsing ${account.data}`)
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

    accountArrayClean.push(account)
  }

  //replace with the clean array
  accountArray = accountArrayClean

  if (report.loadCount === 0) {
    let firstAccount = accountArray[0]
    if (logVerbose) shardus.log(`loadAccountDataFromDB ${JSON.stringify(firstAccount)}`)
  }

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
      if (accountsToForward < accountArray.length) await sleep(1000)
    }
  } else {
    await shardus.forwardAccounts(accountArray.length)
    setGenesisAccounts(accountArray) // As an assumption to save in memory, so that when it's queried it can reponse fast, we can make it query from DB later
  }

  await shardus.debugCommitAccountCopies(accountArray)

  report.loadCount = report.loadCount + accountArray.length //todo make this more closed loop on how many accounts were loaded
  report.passed = true
}
