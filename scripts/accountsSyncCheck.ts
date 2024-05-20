import sqlite3 from 'sqlite3'
import axios from 'axios'
import fs from 'fs'
import { FilePaths } from '../src/shardeum/shardeumFlags'
import { Utils } from '@shardus/types'
let db: any

const instancesDirPath = 'instances'
const numberOfNodes = 8
const saveAccountsDataAsFile = true

const consensorAccounts: any = []
const archiverAccounts: any = []

const consensorAccountsFileName = 'instances/consensorAccounts.json'
const archiverAccountsFileName = 'instances/archiverAccounts.json'

const ARCHIVER_URL = 'http://127.0.0.1:4000/full-nodelist' // active archiver url

// Update the archiver db path for different archiver
const ARCHIVER_DB_PATH = 'archiver-db-4000/archiverdb-4000.sqlite3'

export async function initShardeumDB(node: string): Promise<void> {
  const dbName = `${instancesDirPath}/shardus-instance-${node}/${FilePaths.SHARDEUM_DB}`
  console.log(dbName)
  db = new sqlite3.Database(dbName)
  // await run('PRAGMA journal_mode=WAL');
  console.log('Database initialized.')
  await runCreate(
    'CREATE TABLE if not exists `accountsEntry` (`accountId` VARCHAR(255) NOT NULL, `timestamp` BIGINT NOT NULL, `data` JSON NOT NULL, PRIMARY KEY (`accountId`))'
  )
}

export async function runCreate(createStatement): Promise<void> {
  await run(createStatement)
}

export async function run(sql, params = [] || {}): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.log('Error running sql ' + sql)
        console.log(err)
        reject(err)
      } else {
        resolve({ id: this.lastID })
      }
    })
  })
}

export async function all(sql, params = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.log('Error running sql: ' + sql)
        console.log(err)
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

export async function get(sql, params = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) {
        console.log('Error running sql: ' + sql)
        console.log(err)
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export async function queryAccountsFromConsensor(): Promise<any> {
  let accounts
  try {
    const sql = `SELECT * FROM accountsEntry ORDER BY timestamp ASC`
    accounts = await all(sql)
  } catch (e) {
    console.log(e)
  }
  return accounts
}

export const getAccountsDataFromConsensors = async (): Promise<any> => {
  const res = await axios.get(ARCHIVER_URL)

  for (const nodeinfo of res.data.nodeList) {
    const node = nodeinfo.port
    await initShardeumDB(node)
    const accounts = await queryAccountsFromConsensor()
    console.log('Node', node, accounts.length)
    for (const account of accounts) {
      for (const acc of consensorAccounts) {
        if (acc.accountId === account.accountId) {
          if (acc.timestamp < account.timestamp) {
            consensorAccounts.splice(consensorAccounts.indexOf(acc), 1)
          }
        }
      }
      if (!consensorAccounts.find((acc) => acc.accountId === account.accountId))
        consensorAccounts.push(account)
    }
  }

  // let startingNode = 9001
  // for (let i = 0; i < numberOfNodes; i++) {
  //   await initShardeumDB(startingNode + i)
  //   const accounts = await queryAccountsFromConsensor()
  //   console.log('Node', i + 1, accounts.length)
  //   for (const account of accounts) {
  //     if (!consensorAccounts.find((acc: any) => acc.accountId === account.accountId)) consensorAccounts.push(account)
  //   }
  // }
  console.log('Total Number of Accounts From Consensors', consensorAccounts.length)
  if (saveAccountsDataAsFile)
    fs.writeFileSync(consensorAccountsFileName, Utils.safeStringify(consensorAccounts))
  return consensorAccounts
}

export async function queryAccountCountFromArchiver(): Promise<any> {
  let accounts
  try {
    const sql = `SELECT COUNT(*) FROM accounts`
    accounts = await get(sql, [])
  } catch (e) {
    console.log(e)
  }

  // console.log('Account count', accounts)
  if (accounts) accounts = accounts['COUNT(*)']
  else accounts = 0
  return accounts
}

export async function queryAccountsFromArchiver(skip = 0, limit = 10000): Promise<any> {
  let accounts
  try {
    const sql = `SELECT * FROM accounts ORDER BY cycleNumber ASC, timestamp ASC LIMIT ${limit} OFFSET ${skip}`
    accounts = await all(sql)
    if (accounts.lenth > 0) {
      accounts.map((account) => {
        if (account && account.data) account.data = Utils.safeJsonParse(account.data)
      })
    }
  } catch (e) {
    console.log(e)
  }

  console.log('Account accounts', accounts ? accounts.length : accounts, 'skip', skip)
  return accounts
}

export const getAccountsDataFromArchiver = async (): Promise<any> => {
  const dbName = `${instancesDirPath}/${ARCHIVER_DB_PATH}`
  db = new sqlite3.Database(dbName)
  await run('PRAGMA journal_mode=WAL')
  console.log('Database initialized.')
  await runCreate(
    'CREATE TABLE if not exists `accounts` (`accountId` TEXT NOT NULL UNIQUE PRIMARY KEY, `data` JSON NOT NULL, `timestamp` BIGINT NOT NULL, `hash` TEXT NOT NULL, `cycleNumber` NUMBER NOT NULL, `isGlobal` BOOLEAN)'
  )

  const accounts = await queryAccountCountFromArchiver()
  console.log(accounts)
  const limit = 10000
  for (let i = 0; i < accounts; ) {
    const accounts = await queryAccountsFromArchiver(i, limit)
    archiverAccounts.push(...accounts)
    i += limit
  }
  console.log('Total Number of Accounts From Archiver', archiverAccounts.length)
  if (saveAccountsDataAsFile)
    fs.writeFileSync(archiverAccountsFileName, JSON.stringify(archiverAccounts, null, 2))
  return archiverAccounts
}

const checkAccountsDataSync = async (): Promise<any> => {
  console.log('Missing Accounts on Archiver!')
  for (const account1 of consensorAccounts) {
    let found = false
    for (const account2 of archiverAccounts) {
      if (account1.accountId === account2.accountId) {
        found = true
        if (account1.timestamp !== account2.timestamp)
          console.log('Found but timestamp mismatch', account1.accountId)
      }
    }
    if (!found) {
      console.log(account1.accountId)
    }
  }
  console.log('Missing Accounts on Consensors!')
  for (const account1 of archiverAccounts) {
    let found = false
    for (const account2 of consensorAccounts) {
      if (account1.accountId === account2.accountId) {
        found = true
        if (account1.timestamp !== account2.timestamp)
          console.log('Found but timestamp mismatch', account1.accountId)
      }
    }
    if (!found) {
      console.log(account1.accountId)
    }
  }
}

const runProgram = async (): Promise<any> => {
  await getAccountsDataFromConsensors()
  await getAccountsDataFromArchiver()
  await checkAccountsDataSync()
}

runProgram()
