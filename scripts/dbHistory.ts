import fs from 'fs'
import path from 'path'
const sqlite3 = require('sqlite3').verbose()
import * as crypto from '@shardus/crypto-utils'
import { DBHistoryFile, AccountHistoryModel } from './types'
import { FilePaths } from '../src/shardeum/shardeumFlags'
import { Utils } from '@shardus/types'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

let tsUpgrades = 0
let accountsMap = new Map<string, any>()
const emptyCodeHash = 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
const dbFiles: DBHistoryFile[] = []

const myArgs = process.argv.slice(2)
const directory = myArgs[0] ?? '.' //`paste path here`;

async function dbFilesFromFolders() {
  fs.readdir(directory, (err, files) => {
    files.forEach((file) => {
      try {
        let filepath = path.resolve(directory, file)
        const isDir = fs.lstatSync(filepath).isDirectory()
        if (isDir) {
          let oldFilePath = path.resolve(directory, filepath, 'db', FilePaths.DB)
          let oldSize = fs.lstatSync(oldFilePath)?.size ?? -1
          console.log(oldFilePath + ' ' + oldSize)

          let oldFilepath = path.resolve(directory, filepath, 'db', FilePaths.SHARDEUM_DB)
          let newSize = fs.lstatSync(oldFilepath)?.size ?? -1
          console.log(oldFilepath + ' ' + newSize)

          let historyFilePath = path.resolve(directory, filepath, 'db', FilePaths.HISTORY_DB)
          let historySize = fs.existsSync(historyFilePath) ? fs.lstatSync(historyFilePath)?.size ?? -1 : -1
          console.log(historyFilePath + ' ' + historySize)

          dbFiles.push({
            oldFilename: oldFilePath,
            newFilename: oldFilepath,
            historyFileName: historyFilePath,
          })
        }
      } catch (error) {
        console.log(error)
      }
    })
  })

  await sleep(1000)
  console.log(JSON.stringify(dbFiles, null, 2))
  await main()
}

async function main() {
  for (const dbFile of dbFiles) {
    tsUpgrades = 0
    try {
      accountsMap = new Map<string, any>()

      await createHistoryDbIfNotExist(dbFile.historyFileName)
      const historyAccounts = await getHistoryAccountsFromDB(dbFile.historyFileName)
      const historyDb = getDB(dbFile.historyFileName)

      const historyAccountMap = new Map<string, AccountHistoryModel>()
      for (const account of historyAccounts) {
        historyAccountMap.set(account.accountId, account)
      }
      await loadDb(dbFile.oldFilename, true)
      await loadDb(dbFile.newFilename, false)
      for (const account of accountsMap.values()) {
        const codeHashHex = Buffer.from(account.data.account.codeHash).toString('hex')

        let updatedAccount: AccountHistoryModel

        if (historyAccountMap.has(account.accountId)) {
          const existingHistoryAccount = historyAccountMap.get(account.accountId)!
          existingHistoryAccount.lastSeen = account.data.timestamp
          existingHistoryAccount.accountBalance = account.data.account.balance
          if (codeHashHex !== existingHistoryAccount.codehash) {
            existingHistoryAccount.codehash = codeHashHex
            existingHistoryAccount.typeChanged = true
            existingHistoryAccount.accountType = codeHashHex === emptyCodeHash ? 'EOA' : 'CA'
          }

          updatedAccount = existingHistoryAccount
        } else {
          updatedAccount = {
            accountId: account.accountId,
            evmAddress: account.data.ethAddress,
            accountType: codeHashHex === emptyCodeHash ? 'EOA' : 'CA',
            firstSeen: account.data.timestamp,
            lastSeen: account.data.timestamp,
            accountBalance: account.data.account.balance,
            codehash: codeHashHex,
            typeChanged: false,
          }
        }

        historyAccountMap.set(account.accountId, updatedAccount)

        const queryString = `INSERT OR REPLACE INTO accountsHistory (accountId, evmAddress, accountType, firstSeen, lastSeen, accountBalance, codehash, typeChanged) VALUES ("${updatedAccount.accountId}", "${updatedAccount.evmAddress}", "${updatedAccount.accountType}", ${updatedAccount.firstSeen}, ${updatedAccount.lastSeen}, "${updatedAccount.accountBalance}", "${updatedAccount.codehash}", ${updatedAccount.typeChanged})`
        await historyDb.query(queryString, { raw: true })
      }
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    }

    console.log(
      `size of accounts map after db: ${dbFile.oldFilename}, ${dbFile.newFilename} ${accountsMap.size}  tsUpgrades:${tsUpgrades}`
    )
  }
}

async function loadDb(filename: string, isOld: boolean) {
  const newestAccounts = await getNewestAccountsFromDB(filename, isOld)
  for (const account of newestAccounts) {
    if (account.data.accountType !== 0) continue

    if (accountsMap.has(account.accountId)) {
      let existingAccounts = accountsMap.get(account.accountId)
      //add all...
      //existingAccounts.push(account)
      //existingAccounts.sort((a, b) => b.timestamp - a.timestamp)
      if (account.timestamp > existingAccounts.timestamp) {
        existingAccounts = account
        tsUpgrades++
      }
    } else {
      accountsMap.set(account.accountId, account)
    }
  }
}

function getDB(dbPath) {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Error opening database: ', err.message)
    }
  })
}

async function getHistoryAccountsFromDB(dbPath) {
  const db = getDB(dbPath)
  const queryString = `SELECT * FROM accountsHistory ORDER BY accountId ASC`
  const accounts = await runQuery(db, queryString)
  return accounts
}

function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function getNewestAccountsFromDB(dbPath, isOld) {
  const db = getDB(dbPath)
  const queryString = isOld
    ? `SELECT a.accountId, a.data, a.timestamp, a.hash, a.isGlobal, a.cycleNumber FROM accountsCopy a INNER JOIN (SELECT accountId, MAX(timestamp) timestamp FROM accountsCopy GROUP BY accountId) b ON a.accountId = b.accountId AND a.timestamp = b.timestamp ORDER BY a.accountId ASC`
    : `SELECT a.accountId, a.data, a.timestamp FROM accountsEntry a INNER JOIN (SELECT accountId, MAX(timestamp) timestamp FROM accountsEntry GROUP BY accountId) b ON a.accountId = b.accountId AND a.timestamp = b.timestamp ORDER BY a.accountId ASC`
  let accounts = await runQuery(db, queryString)
  accounts = accounts.map((acc) => ({ ...acc, data: Utils.safeJsonParse(acc.data), isOld }))
  return accounts
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function createHistoryDbIfNotExist(path) {
  if (fs.existsSync(path)) {
    console.log('History DB already exists')
    return
  }
  const db = new sqlite3.Database(path)
  await db.run('PRAGMA synchronous = OFF')

  await db.run(
    'CREATE TABLE if not exists `accountsHistory` (`accountId` VARCHAR(255) NOT NULL, `evmAddress` VARCHAR(42) NOT NULL, `accountType` VARCHAR(3) NOT NULL, `firstSeen` BIGINT NOT NULL, `lastSeen` BIGINT NOT NULL, `accountBalance` VARCHAR(255) NOT NULL, `codehash` VARCHAR(255) NOT NULL, `typeChanged` BOOLEAN NOT NULL, PRIMARY KEY (`accountId`))'
  )
}

//main()
dbFilesFromFolders()
