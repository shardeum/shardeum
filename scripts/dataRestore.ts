import fs from 'fs'
import path from 'path' //require('path')
const { Sequelize, Model } = require('sequelize')
import * as WrappedEVMAccountFunctions from '../src/shardeum/wrappedEVMAccountFunctions'
import TransactionState from '../src/state/transactionState'
import * as crypto from '@shardus/crypto-utils'
import { accounts } from '../src/storage/accountStorage'
import { Utils } from 'sequelize/types'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

let accountsMap = new Map()
const emptyCodeHash = 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
let dbFiles = [
  {
    filename: 'db.0715_1.sqlite',
    loadAccountType: 'all',
  },

  {
    filename: 'db.0609_1.sqlite',
    loadAccountType: 'contractStorage',
  },
  // {
  //   filename: 'db.0609_2.sqlite',
  //   loadAccountType: 'contractStorage'
  // },
  // {
  //   filename: 'db.0623_1.sqlite',
  //   loadAccountType: "all-minus-storage" // except storage accounts
  // },
]

const myArgs = process.argv.slice(2)
const directory = myArgs[0] ?? '.' //`paste path here`;
async function dbFilesFromFolders() {
  dbFiles = []
  fs.readdir(directory, (err, files) => {
    files.forEach(file => {
      try {
        let filepath = path.resolve(directory, file)
        let isDir = fs.lstatSync(filepath).isDirectory()
        if (isDir) {
          //console.log(file);
          let filepath2 = path.resolve(directory, filepath + '/db/db.sqlite')
          let filepathRel = file + '/db/db.sqlite'
          let size = fs.lstatSync(filepath2)?.size ?? -1
          console.log(filepath2 + ' ' + size)

          dbFiles.push({
            filename: filepathRel,
            loadAccountType: 'all',
          })
        }
      } catch (error) {
        console.log(error)
      }
    })
    //console.log(JSON.stringify(dbFiles, null, 2))
  })

  await sleep(1000)
  console.log(JSON.stringify(dbFiles, null, 2))
  await main()
}

async function main() {
  let stats = {
    patchedOld_codeHash: 0,
    accountsToCheckCodeHash: 0,
    timestampUpgrades:0
  }

  for (let dbFile of dbFiles) {
    let tsUpgrades = 0
    try {

      let newestAccounts = await getNewestAccountsFromDB(dbFile.filename)
      for (let account of newestAccounts) {
        if (dbFile.loadAccountType === 'contractStorage') {
          if (account.data.accountType !== 1) continue
        } else if (dbFile.loadAccountType === 'all-minus-storage') {
          if (account.data.accountType === 1) continue
        } else if (dbFile.loadAccountType === 'all') {
          //skip no accounts
        }
        if (accountsMap.has(account.accountId)) {
          let existingAccounts = accountsMap.get(account.accountId)
          //add all...
          //existingAccounts.push(account)
          //existingAccounts.sort((a, b) => b.timestamp - a.timestamp)
          if(account.timestamp > existingAccounts[0].timestamp){
            existingAccounts[0] = account
            stats.timestampUpgrades++
            tsUpgrades++
          }
        } else {
          accountsMap.set(account.accountId, [account])
        }
      }
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    }
    console.log(`size of accounts map after db: ${dbFile} ${accountsMap.size}  tsUpgrades:${tsUpgrades}`)
  }

  let repairOldCodeHash = false
  if (repairOldCodeHash) {
    let accountsToCheckCodeHash = []
    for (let [accountId, accountData] of accountsMap) {
      let newestAccount = accountData[0]
      if (newestAccount.data.accountType === 0) {
        // check codeHash for EOA and CA
        const codeHashHex = Buffer.from(newestAccount.data.account.codeHash).toString('hex')
        if (codeHashHex !== emptyCodeHash) {
          // this is a CA. Don't need to check anymore
          accountsMap.set(accountId, newestAccount)
        } else if (codeHashHex === emptyCodeHash) {
          // we will query old codeHash in bulk and check later
          if (accountsToCheckCodeHash.indexOf(accountId) === -1) accountsToCheckCodeHash.push(accountId)
        }
      } else {
        accountsMap.set(accountId, newestAccount)
      }
    }

    // collect old accounts
    console.log('total account to check code hash', accountsToCheckCodeHash.length)
    stats.accountsToCheckCodeHash = accountsToCheckCodeHash.length
    let oldAccountsMap = new Map()
    for (let dbFile of dbFiles) {
      let db = getDB(dbFile.filename)
      let accountIdArr = ''
      for (let i = 0; i < accountsToCheckCodeHash.length; i++) {
        let accountId = accountsToCheckCodeHash[i]
        if (i === accountsToCheckCodeHash.length - 1) accountIdArr += `'${accountId}'`
        else accountIdArr += `'${accountId}',`
      }
      accountIdArr = '(' + accountIdArr + ')'
      let queryStr = `SELECT a.accountId,a.data,a.timestamp,a.hash,a.isGlobal,a.cycleNumber FROM accountsCopy a INNER JOIN (SELECT accountId, MIN(timestamp) timestamp FROM accountsCopy GROUP BY accountId) b ON a.accountId = b.accountId AND a.timestamp = b.timestamp WHERE a.accountId IN ${accountIdArr} order by a.timestamp asc`

      let oldAccounts = await db.query(queryStr, { raw: true })
      oldAccounts = oldAccounts[0]
      oldAccounts = oldAccounts.map(acc => ({ ...acc, data: JSON.parse(acc.data) }))
      for (let account of oldAccounts) {
        let accountId = account.accountId
        if (oldAccountsMap.get(accountId)) {
          let existing = oldAccountsMap.get(accountId)
          existing.push(account)
          existing.sort((a, b) => a.timestamp - b.timestamp)
        } else {
          oldAccountsMap.set(accountId, [account])
        }
      }
    }

    // check codeHash of old account against newest account
    for (let [accountId, accountData] of oldAccountsMap) {
      let oldestAccount = accountData[0]
      let newestAccount = accountsMap.get(accountId)[0]
      let oldestCodeHash = Buffer.from(oldestAccount.data.account.codeHash).toString('hex')
      if (oldestCodeHash !== emptyCodeHash) {
        // codeHash is corrupted. We will restore with old contract code hash
        newestAccount.data.account.codeHash = oldestAccount.data.account.codeHash

        //not 100% sure if this is correct. but I think it works with the updates in this commit
        WrappedEVMAccountFunctions.fixDeserializedWrappedEVMAccount(newestAccount.data)

        // update account hash
        WrappedEVMAccountFunctions.updateEthAccountHash(newestAccount.data)
        newestAccount.hash = newestAccount.data.hash
        // TBC: do we need to do this ?
        // TransactionState.fixUpAccountFields(newestAccount.data)

        stats.patchedOld_codeHash++
      }
    }
  }

  let finalAccounts = Array.from(accountsMap.values())
  finalAccounts = finalAccounts.map(acc => (Array.isArray(acc) ? acc[0] : acc))
  finalAccounts = finalAccounts.sort((a, b) => a.timestamp - b.timestamp).map(acc => ({ ...acc, data: JSON.stringify(acc.data) }))
  //RangeError: Invalid string length means out of memory!
  //fs.writeFileSync('account-export.json', JSON.stringify(finalAccounts, null, 2))
  console.log(JSON.stringify(stats, null, 2))

  const writableStream = fs.createWriteStream('account-export.json')
  writableStream.write('[')
  for (let i = 0; i < finalAccounts.length; i++) {
    let account = finalAccounts[i]
    writableStream.write(JSON.stringify(account, null, 2)) // + (i < finalAccounts.length)?',\n':'')
    if (i < finalAccounts.length - 1) {
      writableStream.write(',\n')
    }
  }
  writableStream.write(']')
  writableStream.end()
  console.log('Merge Completed!')
  console.log(JSON.stringify(stats, null, 2))
}

function getDB(db: string) {
  return new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: db, // or ':memory:'
    pool: {
      max: 1000,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    //disable DB log to console because it is super slow!
    logging: false,
  })
}

async function getNewestAccountsFromDB(db: string) {
  const database = getDB(db)
  const queryString = `SELECT a.accountId,a.data,a.timestamp,a.hash,a.isGlobal,a.cycleNumber FROM accountsCopy a INNER JOIN (SELECT accountId, MAX(timestamp) timestamp FROM accountsCopy GROUP BY accountId) b ON a.accountId = b.accountId AND a.timestamp = b.timestamp order by a.accountId asc`
  let accounts = await database.query(queryString, { raw: true })
  accounts = accounts[0]
  accounts = accounts.map(acc => ({ ...acc, data: JSON.parse(acc.data) }))
  //database.close()
  return accounts
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}


//main()
dbFilesFromFolders()
