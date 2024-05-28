/* eslint-disable no-empty */
import fs from 'fs'
//import Log4js from 'log4js'
import path from 'path'

import { isObject } from '../utils'
import { Op } from './utils/sqlOpertors'
import { SQLDataTypes } from './utils/schemaDefintions'

//const sqlite3 = require('sqlite3').verbose()
import { Database, OPEN_READONLY } from 'sqlite3'
import config from '../config'
import { isServiceMode } from '..'
import { Utils } from '@shardus/types'

interface Sqlite3Storage {
  baseDir: string
  memoryFile: boolean
  dbPath: string
  //mainLogger: Log4js.Logger
  initialized: boolean
  // punting on storageModels for now
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storageModels: any
  db: Database
  oldDb: Database
}

interface ParamEntry {
  name: string
  type?: string
  v1?: string
  v2?: string
  sql?: string
  vals?: string[]
}

interface ModelData {
  tableName: string
  columns: string[]
  columnsString: string
  substitutionString: string
  isColumnJSON: { [key: string]: boolean }
  JSONkeys: string[]
  insertOrReplaceString?: string
  insertString?: string
  selectString?: string
  updateString?: string
  deleteString?: string
}

class Sqlite3Storage {
  // note that old storage passed in logger, now we pass in the specific log for it to use.  This works for application use, but may need to rethink if we apply this to shardus core
  constructor(models, baseDir: string, dbPath: string) {
    this.baseDir = baseDir

    this.dbPath = path.join(baseDir, dbPath)

    this.memoryFile = false
    this.initialized = false
    this.storageModels = {}
    for (const [modelName, modelAttributes] of models) {
      this.sqlite3Define(modelName, modelAttributes)
    }
  }

  sqlite3Define(modelName, modelAttributes): void {
    const tableName = modelName

    const modelData: ModelData = {
      tableName: tableName,
      columns: [],
      columnsString: '',
      substitutionString: '',
      isColumnJSON: {},
      JSONkeys: [],
    }
    let key
    for (const attr in modelAttributes) {
      key = attr
      if (Object.prototype.hasOwnProperty.call(modelAttributes, key)) {
        modelData.columns.push(key)
        // eslint-disable-next-line security/detect-object-injection
        const value = modelAttributes[key]

        let type = value.type
        if (!type) {
          type = value
          // if (logFlags.console) console.log(' TYPE MISSING!!!! ' + key)
        }
        if (type.toString() === SQLDataTypes.JSON.toString()) {
          // eslint-disable-next-line security/detect-object-injection
          modelData.isColumnJSON[key] = true
          modelData.JSONkeys.push(key)
          // if (logFlags.console) console.log(`JSON column: ${key}`)
        } else {
          // eslint-disable-next-line security/detect-object-injection
          modelData.isColumnJSON[key] = false
        }
      }
    }
    for (let i = 0; i < modelData.columns.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      key = modelData.columns[i]
      modelData.columnsString += key
      modelData.substitutionString += '?'
      if (i < modelData.columns.length - 1) {
        modelData.columnsString += ', '
        modelData.substitutionString += ', '
      }
    }
    modelData.insertOrReplaceString = `INSERT OR REPLACE INTO ${modelData.tableName} (${modelData.columnsString} ) VALUES (${modelData.substitutionString})`
    modelData.insertString = `INSERT INTO ${modelData.tableName} (${modelData.columnsString} ) VALUES (${modelData.substitutionString})`
    modelData.selectString = `SELECT * FROM ${modelData.tableName} `
    modelData.updateString = `UPDATE ${modelData.tableName} SET `
    modelData.deleteString = `DELETE FROM ${modelData.tableName} `

    // if (logFlags.console) console.log(`Create model data for table: ${tableName} => ${stringify(modelData)}`)
    // if (logFlags.console) console.log()
    // eslint-disable-next-line security/detect-object-injection
    this.storageModels[tableName] = modelData

    // todo base this off of models
  }

  async init(): Promise<void> {
    const dbDir = path.parse(this.dbPath).dir

    // Rename dbDir if it exists
    try {
      // oldDirPath = dbDir + '-old-' + Date.now()
      // fs.renameSync(dbDir, oldDirPath)
      // if (oldDirPath) {
      //   //this.mainLogger.info('Setting old data path. this will cause safety mode?' + oldDirPath)
      //   //Snapshot.setOldDataPath(oldDirPath)
      //   this.oldDb = new sqlite3.Database(`${oldDirPath}/db.sqlite`)
      // }
      // shardus can take care of moving the database!!
      //
      // if(config.storage.options.saveOldDBFiles){
      //   fs.renameSync(dbDir, oldDirPath)
      //   if (oldDirPath) {
      //     this.oldDb = new sqlite3.Database(`${oldDirPath}/db.sqlite`)
      //   }
      // } else {
      //   //recursive delete of db folder
      //   try{
      //     fs.rmdirSync(dbDir, { recursive: true })
      //   } catch (e) {
      //     //wait 5 seconds and try one more time
      //     await sleep(5000)
      //     fs.rmdirSync(dbDir, { recursive: true })
      //   }
      // }
    } catch (e) {
      // if (config.p2p.startInWitnessMode) {
      //   throw new Error('Unable to start in witness mode: no old data')
      // }
    }

    try {
      // Create dbDir if it doesn't exist
      await _ensureExists(dbDir)
      //this.mainLogger.info('Created Database directory.')

      if (this.memoryFile) {
        this.db = new Database(':memory:')
      } else if (isServiceMode()) {
        this.db = new Database(this.dbPath, OPEN_READONLY)
      } else {
        this.db = new Database(this.dbPath)
      }

      if (!isServiceMode()) {
        await this.run('PRAGMA synchronous = OFF')
        console.log('PRAGMA synchronous = OFF')

        if (config?.storage?.options?.walMode === true) {
          await this.run('PRAGMA journal_mode = WAL')
          console.log('PRAGMA journal_mode = WAL')
        } else {
          await this.run('PRAGMA journal_mode = MEMORY')
          console.log('PRAGMA journal_mode = MEMORY')
        }

        if (config?.storage?.options?.exclusiveLockMode === true) {
          await this.run('PRAGMA locking_mode = EXCLUSIVE')
          console.log('PRAGMA locking_mode = EXCLUSIVE')
        }
      }
    } catch (e) {
      throw new Error('shardeum storage init error ' + e.name + ': ' + e.message + ' at ' + e.stack)
    }

    this.initialized = true
    //this.mainLogger.info('Database initialized.')
  }

  async close(): Promise<void> {
    // //this.mainLogger.info('Closing Database connections.')
    await this.db.close()
    if (this.oldDb) await this.oldDb.close()
  }

  async runCreate(createStatement): Promise<void> {
    await this.run(createStatement)
  }

  async dropAndCreateModel(): Promise<void> {
    // await model.sync({ force: true })
  }

  _checkInit(): void {
    if (!this.initialized) throw new Error('Storage not initialized.')
  }

  _create(table, object, opts): Promise<unknown> {
    try {
      //this.profiler.profileSectionStart('db')
      // if (logFlags.console) console.log('_create2: ' + stringify(object))
      if (Array.isArray(object)) {
        // return table.bulkCreate(values, opts)
        // todo transaciton or something else

        for (const subObj of object) {
          // if (logFlags.console) console.log('sub obj: ' + stringify(subObj))
          this._create(table, subObj, opts)
        }
        return
      }
      let queryString = table.insertString
      if (opts && opts.createOrReplace) {
        queryString = table.insertOrReplaceString
      }
      const inputs = []
      // if (logFlags.console) console.log('columns: ' + stringify(table.columns))
      for (const column of table.columns) {
        // eslint-disable-next-line security/detect-object-injection
        let value = object[column]

        // eslint-disable-next-line security/detect-object-injection
        if (table.isColumnJSON[column]) {
          value = Utils.safeStringify(value)
        }
        // if (logFlags.console) console.log(`column: ${column}  ${value}`)
        inputs.push(value)
      }
      queryString += this.options2string(opts)

      // if (logFlags.console) console.log(queryString + '  VALUES: ' + stringify(inputs))
      return this.run(queryString, inputs)
    } finally {
      //this.profiler.profileSectionEnd('db')
    }
  }

  async _read(table, params, opts): Promise<unknown> {
    try {
      //this.profiler.profileSectionStart('db')
      // return table.findAll({ where, ...opts })
      let queryString = table.selectString

      // let valueArray = []

      const paramsArray = this.params2Array(params, table)

      const { whereString, whereValueArray } = this.paramsToWhereStringAndValues(paramsArray)

      const valueArray = whereValueArray
      queryString += whereString
      queryString += this.options2string(opts)

      // if (logFlags.console) console.log(queryString + '  VALUES: ' + stringify(valueArray))

      const results = await this.all(queryString, valueArray)
      // optionally parse results!
      if (!opts || !opts.raw) {
        if (table.JSONkeys.length > 0) {
          // for (let i = 0; i < results.length; i++) {
          //   let result = results[i]
          //   if (logFlags.console) console.log('todo parse this??? ' + result)
          // }
        }
      }
      return results
    } finally {
      //this.profiler.profileSectionEnd('db')
    }
  }

  async _readOld(table, params, opts): Promise<unknown> {
    try {
      //this.profiler.profileSectionStart('db')
      // return table.findAll({ where, ...opts })
      let queryString = table.selectString

      // let valueArray = []

      const paramsArray = this.params2Array(params, table)

      const { whereString, whereValueArray } = this.paramsToWhereStringAndValues(paramsArray)

      const valueArray = whereValueArray
      queryString += whereString
      queryString += this.options2string(opts)

      // if (logFlags.console) console.log(queryString + '  VALUES: ' + stringify(valueArray))

      const results = await this.allOld(queryString, valueArray)
      // optionally parse results!
      if (!opts || !opts.raw) {
        if (table.JSONkeys.length > 0) {
          // for (let i = 0; i < results.length; i++) {
          //   let result = results[i]
          //   if (logFlags.console) console.log('todo parse this??? ' + result)
          // }
        }
      }
      return results
    } finally {
      //this.profiler.profileSectionEnd('db')
    }
  }

  _update(table, values, where, opts): Promise<unknown> {
    try {
      //this.profiler.profileSectionStart('db')
      // return table.update(values, { where, ...opts })
      let queryString = table.updateString

      const valueParams = this.params2Array(values, table)
      // eslint-disable-next-line prefer-const
      let { resultString, valueArray } = this.paramsToAssignmentStringAndValues(valueParams)

      queryString += resultString

      const whereParams = this.params2Array(where, table)
      const { whereString, whereValueArray } = this.paramsToWhereStringAndValues(whereParams)
      queryString += whereString

      valueArray = valueArray.concat(whereValueArray)

      queryString += this.options2string(opts)

      // if (logFlags.console) console.log(queryString + '  VALUES: ' + stringify(valueArray))
      return this.run(queryString, valueArray)
    } finally {
      //this.profiler.profileSectionEnd('db')
    }
  }

  _delete(table, where, opts): Promise<unknown> {
    try {
      //this.profiler.profileSectionStart('db')
      // if (!where) {
      //   return table.destroy({ ...opts })
      // }
      // return table.destroy({ where, ...opts })

      let queryString = table.deleteString

      const whereParams = this.params2Array(where, table)
      const { whereString, whereValueArray } = this.paramsToWhereStringAndValues(whereParams)
      const valueArray = whereValueArray
      queryString += whereString
      queryString += this.options2string(opts)

      // if (logFlags.console) console.log(queryString + '  VALUES: ' + stringify(valueArray))
      return this.run(queryString, valueArray)
    } finally {
      //this.profiler.profileSectionEnd('db')
    }
  }

  _rawQuery(queryString, valueArray): Promise<unknown> {
    // return this.sequelize.query(query, { model: table })
    try {
      //this.profiler.profileSectionStart('db')
      return this.all(queryString, valueArray)
    } finally {
      //this.profiler.profileSectionEnd('db')
    }
  }

  _rawQueryOld(queryString, valueArray): Promise<unknown> {
    // return this.sequelize.query(query, { model: table })
    try {
      //this.profiler.profileSectionStart('db')
      return this.allOld(queryString, valueArray)
    } finally {
      //this.profiler.profileSectionEnd('db')
    }
  }

  params2Array(paramsObj, table): unknown[] {
    if (paramsObj === null || paramsObj === undefined) {
      return []
    }
    const paramsArray = []
    for (const key in paramsObj) {
      if (Object.prototype.hasOwnProperty.call(paramsObj, key)) {
        const paramEntry: ParamEntry = { name: key }

        // eslint-disable-next-line security/detect-object-injection
        const value = paramsObj[key]
        if (isObject(value) && table.isColumnJSON[paramEntry.name] === false) {
          // WHERE column_name BETWEEN value1 AND value2;
          if (value[Op.between]) {
            const between = value[Op.between]
            paramEntry.type = 'BETWEEN'
            paramEntry.v1 = between[0]
            paramEntry.v2 = between[1]
            paramEntry.sql = `${paramEntry.name} ${paramEntry.type} ? AND ? `
            paramEntry.vals = [paramEntry.v1, paramEntry.v2]
          }
          // WHERE column_name IN (value1, value2, ...)
          if (value[Op.in]) {
            const inValues = value[Op.in]
            paramEntry.type = 'IN'
            // paramEntry.v1 = between[0]
            // paramEntry.v2 = between[1]
            let questionMarks = ''
            for (let i = 0; i < inValues.length; i++) {
              questionMarks += '?'
              if (i < inValues.length - 1) {
                questionMarks += ' , '
              }
            }
            paramEntry.sql = `${paramEntry.name} ${paramEntry.type} (${questionMarks})`
            paramEntry.vals = []
            paramEntry.vals = paramEntry.vals.concat(inValues)
          }
          if (value[Op.lte]) {
            const rightHandValue = value[Op.lte]
            paramEntry.type = 'LTE'
            paramEntry.v1 = rightHandValue
            // paramEntry.v2 = between[1]
            paramEntry.sql = `${paramEntry.name} <= ?`
            paramEntry.vals = [paramEntry.v1]
          }
          if (value[Op.gte]) {
            const rightHandValue = value[Op.gte]
            paramEntry.type = 'GTE'
            paramEntry.v1 = rightHandValue
            // paramEntry.v2 = between[1]
            paramEntry.sql = `${paramEntry.name} >= ?`
            paramEntry.vals = [paramEntry.v1]
          }
        } else {
          paramEntry.type = '='
          paramEntry.v1 = value
          paramEntry.sql = `${paramEntry.name} ${paramEntry.type} ?`

          if (table.isColumnJSON[paramEntry.name]) {
            paramEntry.v1 = Utils.safeStringify(paramEntry.v1)
          }
          paramEntry.vals = [paramEntry.v1]
        }

        paramsArray.push(paramEntry)
      }
    }
    return paramsArray
  }

  paramsToWhereStringAndValues(paramsArray): { whereString: string; whereValueArray: unknown[] } {
    let whereValueArray = []
    let whereString = ''
    for (let i = 0; i < paramsArray.length; i++) {
      if (i === 0) {
        whereString += ' WHERE '
      }
      // eslint-disable-next-line security/detect-object-injection
      const paramEntry = paramsArray[i]
      whereString += '(' + paramEntry.sql + ')'
      if (i < paramsArray.length - 1) {
        whereString += ' AND '
      }
      whereValueArray = whereValueArray.concat(paramEntry.vals)
    }
    return { whereString, whereValueArray }
  }

  paramsToAssignmentStringAndValues(paramsArray): { resultString: string; valueArray: unknown[] } {
    let valueArray = []
    let resultString = ''
    for (let i = 0; i < paramsArray.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const paramEntry = paramsArray[i]
      resultString += paramEntry.sql
      if (i < paramsArray.length - 1) {
        resultString += ' , '
      }
      valueArray = valueArray.concat(paramEntry.vals)
    }
    return { resultString, valueArray }
  }

  options2string(optionsObj): string {
    if (optionsObj === null || optionsObj === undefined) {
      return ''
    }
    let optionsString = ''
    if (optionsObj.order) {
      optionsString += ' ORDER BY '
      for (let i = 0; i < optionsObj.order.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const orderEntry = optionsObj.order[i]
        optionsString += ` ${orderEntry[0]} ${orderEntry[1]} `
        if (i < optionsObj.order.length - 1) {
          optionsString += ','
        }
      }
    }
    if (optionsObj.limit) {
      optionsString += ` LIMIT ${optionsObj.limit}`

      if (optionsObj.offset) {
        optionsString += ` OFFSET ${optionsObj.offset}`
      }
    }

    return optionsString
  }

  // run/get/all promise wraps from this tutorial: https://stackabuse.com/a-sqlite-tutorial-with-node-js/
  run(sql, params = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          // if (logFlags.console) console.log('Error running sql ' + sql)
          // if (logFlags.console) console.log(err)
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      })
    })
  }

  get(sql, params = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          // if (logFlags.console) console.log('Error running sql: ' + sql)
          // if (logFlags.console) console.log(err)
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  all(sql, params = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          // if (logFlags.console) console.log('Error running sql: ' + sql)
          // if (logFlags.console) console.log(err)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  allOld(sql, params = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.oldDb.all(sql, params, (err, rows) => {
        if (err) {
          // if (logFlags.console) console.log('Error running sql: ' + sql)
          // if (logFlags.console) console.log(err)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }
}

async function _ensureExists(dir): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // dir is 'db/shardeum.sqlite'
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        // Ignore err if folder exists
        if (err.code === 'EEXIST') resolve()
        // Something else went wrong
        else reject(err)
      } else {
        // Successfully created folder
        resolve()
      }
    })
  })
}

export default Sqlite3Storage
