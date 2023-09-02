import fs from 'fs'
import path from 'path'
import { DeSerializeFromJsonString } from '../src/utils'
import { FilePaths } from '../src/shardeum/shardeumFlags'
const { Sequelize } = require('sequelize')
const sqlite3 = require('sqlite3').verbose()

/* dataRestore tool collects all the rows in all the databases (sharded network will have more than 1
 * database) in to a single JSON file. This JSON file is ingested during network reset.
 */
async function main() {
  const myArgs = process.argv.slice(2)
  if (myArgs.length != 2) {
    console.error(' two args are required. <baseDirectory> and <blockSize> ')
    process.exit(1)
  }
  const baseDirectory = myArgs[0] ?? '.'
  const batchSize = parseInt(myArgs[1], 10) ?? 1000
  const targetDBPath = './' + FilePaths.SHARDEUM_DB
  const targetJSONPath = './' + FilePaths.ACCOUNT_EXPORT

  // get all the database files to fetch data from
  let dbFiles = await dbFilesFromFolders(baseDirectory)

  // export the rows of all the databases
  await exportData(dbFiles, batchSize, targetDBPath, targetJSONPath, true) // exportToJson is set to true for now
}

/* dbFilesFromFolders finds out all the database files under the given root folder */
async function dbFilesFromFolders(baseDirectory: string): Promise<string[]> {
  let dbFiles = []
  fs.readdirSync(baseDirectory).forEach(file => {
    try {
      let nodeDirectory = path.resolve(baseDirectory, file)
      let isDir = fs.lstatSync(nodeDirectory).isDirectory()
      if (isDir) {
        let dbFilepath = path.resolve(baseDirectory, nodeDirectory, 'db', FilePaths.SHARDEUM_DB)
        let size = fs.lstatSync(dbFilepath)?.size ?? -1
        dbFiles.push(dbFilepath)
      }
    } catch (error) {
      console.error(error)
    }
  })
  return dbFiles
}

/*  exportData is the function which collects the rows from every database and merges it in to a big fat
 * database and optionally a large JSON file.
 */
async function exportData(
  dbFiles,
  batchSize: number,
  targetDBPath: string,
  targetJSONPath: string,
  exportToJson: boolean
) {
  let targetDB = await createTargetDB(targetDBPath)
  let totalDBRowCount = 0
  let totalJSONRowCount = 0

  //for every db found in the root directory, export the rows to a single DB.
  for (let dbFile of dbFiles) {
    totalDBRowCount += await writeDBToTarget(dbFile, targetDB, batchSize)
  }
  await targetDB.close()

  // from the single DB, export to a big JSON file
  // TODO: in future the single DB should be fine and we should not use JSON
  if (exportToJson) {
    await sleep(5000)
    console.log('Starting export to JSON file')
    totalJSONRowCount = await exportToJSON(targetDBPath, targetJSONPath, batchSize)
  }
  console.log(`wrote ${totalDBRowCount} rows to DB and ${totalJSONRowCount} to JSON file`)
}

/* writeDBToTarget combines all the rows from all the source databases in to a single sqliteDB.
   This is required in future and also used as a way to dedupe rows too when exporting to JSON.
 */
async function writeDBToTarget(dbFile, targetDB, batchSize) {
  console.log('exporting db ', dbFile)
  let rowCount = 0
  let sourceDB = getDB(dbFile)
  try {
    let latestAccountId = '00' //  storing latest value of every batch make the pagination faster
    for (let i = 0; ; i += batchSize) {
      const queryString = `SELECT * FROM accountsEntry WHERE accountId > \'${latestAccountId}\' order by accountId asc LIMIT ${batchSize}`
      let accounts = await sourceDB.query(queryString)
      accounts = accounts[0]
      await targetDB.serialize(function() {
        targetDB.run('begin transaction')
        for (let account of accounts) {
          const dataStr = JSON.stringify(DeSerializeFromJsonString(account.data)).replace(/'/g, "''")
          let insertQuery = `insert into accountsEntry (accountId, timestamp, data) values (\'${account.accountId}\', ${account.timestamp}, \'${dataStr}\')`
          targetDB.run(insertQuery)
          latestAccountId = account.accountId
          rowCount++
        }
        targetDB.run('commit')
      })
      if (rowCount % 100000 == 0) {
        console.log(`inserted ${rowCount} elements in target database`)
      }
      if (accounts.length < batchSize) {
        break
      }
    }
    console.log(`successfully exported ${rowCount} rows`)
  } catch (error) {
    console.error('error processing the source database:', error)
  } finally {
    if (sourceDB) {
      await sourceDB.close()
    }
  }
  return rowCount
}

/* exportToJSON exports all the rows from the single combined database created in the previous
 * step in to a big fat JSON file.
 */
async function exportToJSON(targetDbPath, targetJsonPath, batchSize) {
  let rowCount = 0
  let targetDB = getDB(targetDbPath)
  const writableStream = fs.createWriteStream(targetJsonPath)
  try {
    for (let i = 0; ; i += batchSize) {
      const queryString = `SELECT * FROM accountsEntry order by timestamp asc LIMIT ${batchSize} offset ${i}`
      let accounts = await targetDB.query(queryString)
      accounts = accounts[0]
      for (let account of accounts) {
        const dataObj = JSON.parse(account.data)
        dataObj.timestamp = 1
        let dataStr = JSON.stringify(dataObj).replace(/"/g, '\\"')
        let jsonString = `{ "accountId" : "${account.accountId}", "timestamp" : 1, "data": "${dataStr}" }`
        writableStream.write(jsonString)
        writableStream.write('\n')
        rowCount++
      }
      if (rowCount % 100000 == 0) {
        console.log(`inserted ${rowCount} elements in json file`)
      }
      if (accounts.length < batchSize) {
        break
      }
    }
  } catch (error) {
    console.log('error writing to JSON file: ', error)
  } finally {
    writableStream.end()
    if (targetDB) {
      await targetDB.close()
    }
  }
  return rowCount
}

/* createTargetDB deletes any existing target database and create a new database.
 * It also creates the table schema and all the indexes required.
 */
async function createTargetDB(targetDBPath: string) {
  if (fs.existsSync(targetDBPath)) {
    console.log('target db already exists: trying to delete it')
    fs.unlinkSync(targetDBPath)
    await sleep(1000)
    console.log('deleted old database successfully')
  }
  console.log('creating new database')
  let targetDB = new sqlite3.Database(targetDBPath)
  targetDB.run(
    'CREATE TABLE if not exists `accountsEntry` (`accountId` VARCHAR(255) NOT NULL, `timestamp` BIGINT NOT NULL, `data` JSON NOT NULL, PRIMARY KEY (`accountId`))'
  )
  await sleep(1000)
  targetDB.run('CREATE INDEX IF NOT EXISTS timestamp1 ON accountsEntry(timestamp)')
  await sleep(1000)
  console.log('created new target database at', targetDBPath)
  return targetDB
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

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

main()
