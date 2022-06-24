import fs from 'fs'
const { Sequelize, Model } = require('sequelize')
import * as WrappedEVMAccountFunctions from '../src/shardeum/wrappedEVMAccountFunctions'
import TransactionState from '../src/state/transactionState'
import * as crypto from '@shardus/crypto-utils'

crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

let accountsMap = new Map()
const emptyCodeHash = 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
let dbFiles = [
  'db.1.sqlite',
  'db.2.sqlite',
  'db.3.sqlite',
  // 'db.4.sqlite',
  // 'db.5.sqlite',
]

async function main() {
  for (let dbFile of dbFiles) {
    try {
      let accounts = await getNewestAccountsFromDB(dbFile)
      for (let account of accounts) {
        if (accountsMap.has(account.accountId)) {
          let existingAccounts = accountsMap.get(account.accountId)
          existingAccounts.push(account)
          existingAccounts.sort((a, b) => b.timestamp - a.timestamp)
        } else {
          accountsMap.set(account.accountId, [account])
        }
      }
    } catch (error) {
      console.error('Unable to connect to the database:', error)
    }
    console.log('size of accounts map after db', dbFile, accountsMap.size)
  }

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
  let oldAccountsMap = new Map()
  for (let dbFile of dbFiles) {
    let db = getDB(dbFile)
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
      // update account hash
      WrappedEVMAccountFunctions.updateEthAccountHash(newestAccount.data)
      newestAccount.hash = newestAccount.data.hash
      // TBC: do we need to do this ?
      // TransactionState.fixUpAccountFields(newestAccount.data)
    }
  }
  let finalAccounts = Array.from(accountsMap.values())
  finalAccounts = finalAccounts.map(acc => Array.isArray(acc) ? acc[0] : acc)
  finalAccounts = finalAccounts.sort((a, b) => a.timestamp - b.timestamp).map(acc => ({...acc, data: JSON.stringify(acc.data)}))
  fs.writeFileSync('account-export.json', JSON.stringify(finalAccounts, null, 2))
  console.log('Merge Completed!')
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
  })
}

async function getNewestAccountsFromDB(db: string) {
  const database = getDB(db)
  const queryString = `SELECT a.accountId,a.data,a.timestamp,a.hash,a.isGlobal,a.cycleNumber FROM accountsCopy a INNER JOIN (SELECT accountId, MAX(timestamp) timestamp FROM accountsCopy GROUP BY accountId) b ON a.accountId = b.accountId AND a.timestamp = b.timestamp order by a.accountId asc`
  let accounts = await database.query(queryString, { raw: true })
  accounts = accounts[0]
  accounts = accounts.map(acc => ({ ...acc, data: JSON.parse(acc.data) }))
  return accounts
}


main()
