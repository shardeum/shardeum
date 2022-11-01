import fs from 'fs'
import path from 'path' //require('path')
const { Sequelize } = require('sequelize')
import * as WrappedEVMAccountFunctions from '../src/shardeum/wrappedEVMAccountFunctions'
import * as crypto from '@shardus/crypto-utils'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

let accountsMap = new Map<string, any>()
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
          let filepath2 = path.resolve(directory, filepath + '/db/shardeum.sqlite')
          let size = fs.lstatSync(filepath2)?.size ?? -1
          console.log(filepath2 + ' ' + size)

          dbFiles.push({
            filename: filepath2,
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

  console.log('wait for connect')
  //await sleep(10000)
  console.log('go')

  console.log(JSON.stringify(dbFiles, null, 2))
  await main()
}

async function main() {
  let stats = {
    patchedOld_codeHash: 0,
    accountsToCheckCodeHash: 0,
    timestampUpgrades: 0,
  }

  let finalAccounts = []
  let writtenCount = 0

  const writableStream = fs.createWriteStream('account-export.json')

  for (let dbFile of dbFiles) {
    let tsUpgrades = 0
    try {
      let newestAccounts = await getNewestAccountsFromDB(dbFile.filename)
      console.log(`process accounts: ${newestAccounts.length}`)
      for (let account of newestAccounts) {
        // accounts = accounts.map(acc => {
        //   const data = JSON.parse(acc.data)
        //   return { ...acc, data: JSON.parse(acc.data), hash: data.hash, isGlobal: acc.accountId === '0'.repeat(64), cycleNumber: 0 }
        // })

        const dataStr = account.data
        const dataObj = JSON.parse(account.data)
        account = { ...account, data: dataObj, hash: dataObj.hash }

        if (account.accountId === '0'.repeat(64)) {
          continue
        }

        if (dbFile.loadAccountType === 'contractStorage') {
          if (account.data.accountType !== 1) continue
        } else if (dbFile.loadAccountType === 'all-minus-storage') {
          if (account.data.accountType === 1) continue
        } else if (dbFile.loadAccountType === 'all') {
          //skip no accounts
        }

        //skip evm receipts
        if (account.data.accountType === 3 /*Receipt*/) {
          continue
        }

        // if (accountsMap.has(account.accountId)) {
        //   let existingAccounts = accountsMap.get(account.accountId)
        //   //add all...
        //   //existingAccounts.push(account)
        //   //existingAccounts.sort((a, b) => b.timestamp - a.timestamp)
        //   if (account.timestamp > existingAccounts[0].timestamp) {
        //     existingAccounts[0] = account
        //     stats.timestampUpgrades++
        //     tsUpgrades++
        //   }
        // } else {
        //   accountsMap.set(account.accountId, [account])
        // }
        //finalAccounts.push(account)

        account = { ...account, data: dataStr }

        writableStream.write(JSON.stringify(account)) //JSON.stringify(account, null, 2)) // + (i < finalAccounts.length)?',\n':'')
        writableStream.write('\n')
        writtenCount++
      }
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    }
    console.log(
      `size of accounts map after db: ${dbFile.filename} ${accountsMap.size}  tsUpgrades:${tsUpgrades}`
    )
  }

  writableStream.end()

  // console.log(`stats loadd: ` + JSON.stringify(stats, null, 2))

  // //let finalAccounts = Array.from(accountsMap.values())
  // //finalAccounts = finalAccounts.map(acc => (Array.isArray(acc) ? acc[0] : acc))
  // //finalAccounts = finalAccounts.sort((a, b) => a.timestamp - b.timestamp).map(acc => ({ ...acc, data: JSON.stringify(acc.data) }))

  // console.log(`writing stream`)

  // //write a non JSON file..  each line will be its own json object
  // const writableStream = fs.createWriteStream('account-export.json')
  // //writableStream.write('[')
  // for (let i = 0; i < finalAccounts.length; i++) {
  //   let account = finalAccounts[i]

  //   account = { ...account, data: JSON.stringify(account.data) }

  //   writableStream.write(JSON.stringify(account)) //JSON.stringify(account, null, 2)) // + (i < finalAccounts.length)?',\n':'')
  //   writableStream.write('\n')
  // }
  // //writableStream.write(']')
  // writableStream.end()
  console.log('Merge Completed! ' + writtenCount)
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

  console.log(`query db`)

  //const queryString = `SELECT a.accountId,a.data,a.timestamp FROM accountsEntry a INNER JOIN (SELECT accountId, MAX(timestamp) timestamp FROM accountsEntry GROUP BY accountId) b ON a.accountId = b.accountId AND a.timestamp = b.timestamp order by a.accountId asc`
  const queryString = `SELECT * FROM accountsEntry order by timestamp asc`
  let accounts = await database.query(queryString, { raw: true })
  accounts = accounts[0]
  console.log(`read accounts: ${accounts.length}`)

  // accounts = accounts.map(acc => {
  //   const data = JSON.parse(acc.data)
  //   return { ...acc, data: JSON.parse(acc.data), hash: data.hash, isGlobal: acc.accountId === '0'.repeat(64), cycleNumber: 0 }
  // })
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
