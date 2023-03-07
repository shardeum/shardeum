//import Log4js from 'log4js'

import models from './models'

import {ShardeumFlags} from '../shardeum/shardeumFlags'
import Sqlite3Storage from './sqlite3storage'
import * as Sequelize from 'sequelize'
const Op = Sequelize.Op

interface AccountsEntry {
  accountId: string
  timestamp: number
  data: any //could be a string or a WrappedEVMAccount ...
}

interface Storage {
  storage: Sqlite3Storage
  storageModels: any
  initialized: boolean
  _create: any
  _read: any
  _readOld: any
  _update: (table, values, where, opts) => Promise<unknown>
  _delete: any
  _query: any
  _queryOld: any
}

class Storage {
  storage: Sqlite3Storage = null

  constructor(baseDir: string, dbPath: string) {
    this.storage = new Sqlite3Storage(models, baseDir, dbPath)
  }

  async init() {
    console.log('shardeum storage init:' + this.storage.dbPath)
    await this.storage.init()
    console.log('shardeum storage init complete:')

    //would be neat if this wasn't needed here (refactor so storage stays more generic?)
    await this.storage.runCreate(
      'CREATE TABLE if not exists `accountsEntry` (`accountId` VARCHAR(255) NOT NULL, `timestamp` BIGINT NOT NULL, `data` JSON NOT NULL, PRIMARY KEY (`accountId`))'
    )

    if (ShardeumFlags.NewStorageIndex) {
      //add index to timestamp
      await this.storage.run('CREATE INDEX IF NOT EXISTS timestamp1 ON accountsEntry(timestamp)')
    }

    // get models and helper methods from the storage class we just initializaed.
    this.storageModels = this.storage.storageModels

    this._create = async (table, values, opts) => this.storage._create(table, values, opts)
    this._read = async (table, where, opts) => this.storage._read(table, where, opts)
    this._readOld = async (table, where, opts) => this.storage._readOld(table, where, opts)
    this._update = async (table, values, where, opts) => this.storage._update(table, values, where, opts)
    this._delete = async (table, where, opts) => this.storage._delete(table, where, opts)
    this._query = async (query, tableModel) => this.storage._rawQuery(query, tableModel) // or queryString, valueArray for non-sequelize
    this._queryOld = async (query, tableModel) => this.storage._rawQueryOld(query, tableModel) // or queryString, valueArray for non-sequelize

    this.initialized = true
  }
  async close() {
    await this.storage.close()
  }

  _checkInit() {
    if (!this.initialized) throw new Error('Storage not initialized.')
  }

  async createOrReplaceAccountEntry(accountEntry: AccountsEntry) {
    this._checkInit()
    try {
      await this._create(this.storageModels.accountsEntry, accountEntry, {
        createOrReplace: true,
      })
    } catch (e) {
      throw new Error(e)
    }
  }

  async getAccountsEntry(accountId): Promise<AccountsEntry> {
    this._checkInit()
    try {
      const result = await this._read(
        this.storageModels.accountsEntry,
        { accountId },
        {
          attributes: { exclude: ['createdAt', 'updatedAt', 'id'] },
          raw: true,
        }
      )
      if (result.length > 0) return result[0]
    } catch (e) {
      throw new Error(e)
    }
  }

  async queryAccountsEntryByRanges3(
    accountStart: string,
    accountEnd: string,
    tsStart: number,
    tsEnd: number,
    limit: number,
    accountOffset: string
  ): Promise<AccountsEntry[]> {
    this._checkInit()
    try {
      const query = `SELECT * FROM accountsEntry WHERE (timestamp, accountId) >= (${tsStart}, "${accountOffset}") 
                      AND timestamp < ${tsEnd} 
                      AND accountId <= "${accountEnd}" AND accountId >= "${accountStart}" 
                      ORDER BY timestamp, accountId  LIMIT ${limit}`
      const result = await this._query(query, [])
      return result
    } catch (e) {
      throw new Error(e)
    }
  }

  async queryAccountsEntryByRanges2(
    accountStart: string,
    accountEnd: string,
    tsStart: number,
    tsEnd: number,
    limit: number,
    offset: number
  ): Promise<AccountsEntry[]> {
    this._checkInit()
    try {
      const result = await this._read(
        this.storageModels.accountsEntry,
        {
          accountId: { [Op.between]: [accountStart, accountEnd] },
          timestamp: { [Op.between]: [tsStart, tsEnd] },
        },
        {
          limit: limit,
          offset: offset,
          order: [
            ['timestamp', 'ASC'],
            ['accountId', 'ASC'],
          ],
          attributes: { exclude: ['createdAt', 'updatedAt', 'id'] },
          raw: true,
        }
      )
      return result
    } catch (e) {
      throw new Error(e)
    }
  }

  async queryAccountsEntryByRanges(
    accountStart: string,
    accountEnd: string,
    limit: number
    //offset:number
  ): Promise<AccountsEntry[]> {
    this._checkInit()
    try {
      const result = await this._read(
        this.storageModels.accountsEntry,
        {
          accountId: { [Op.between]: [accountStart, accountEnd] },
        },
        {
          limit: limit,
          //offset: offset,
          order: [
            //['timestamp', 'ASC'],
            ['accountId', 'ASC'],
          ],
          attributes: { exclude: ['createdAt', 'updatedAt', 'id'] },
          raw: true,
        }
      )
      return result
    } catch (e) {
      throw new Error(e)
    }
  }

  async deleteAccountsEntry() {
    this._checkInit()
    try {
      await this._delete(this.storageModels.accountsEntry, null)
    } catch (e) {
      throw new Error(e)
    }
  }

  async debugSelectAllAccountsEntry() {
    this._checkInit()
    try {
      return await this._read(this.storageModels.accountsEntry, null)
    } catch (e) {
      throw new Error(e)
    }
  }
}
export default Storage
