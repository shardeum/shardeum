//import Log4js from 'log4js'

import models from './models'
import { WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import Sqlite3Storage from './sqlite3storage'
import { isServiceMode } from '..'
import { Op } from './utils/sqlOpertors'
import { Utils } from '@shardus/types'

export interface AccountsEntry {
  accountId: string
  timestamp: number
  data: string | WrappedEVMAccount
}

interface Storage {
  storage: Sqlite3Storage
  // punting on storageModels for now
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storageModels: any
  initialized: boolean
  // punting on these for now
  /* eslint-disable @typescript-eslint/no-explicit-any */
  _create: any //(table, values, opts) => Promise<unknown>
  _read: any //(table, where, opts) => Promise<unknown>
  _readOld: any //(table, where, opts) => Promise<unknown>
  _update: any //(table, values, where, opts) => Promise<unknown>
  _delete: any //(table, where, opts) => Promise<unknown>
  _query: any //(query, tableModel) => Promise<unknown>
  _queryOld: any //(query, tableModel) => Promise<unknown>
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

class Storage {
  storage: Sqlite3Storage = null

  constructor(baseDir: string, dbPath: string) {
    this.storage = new Sqlite3Storage(models, baseDir, dbPath)
  }

  async init(): Promise<void> {
    console.log('shardeum storage init:' + this.storage.dbPath)
    await this.storage.init()
    console.log('shardeum storage init complete:')

    if (!isServiceMode()) {
      //would be neat if this wasn't needed here (refactor so storage stays more generic?)
      await this.storage.runCreate(
        'CREATE TABLE if not exists `accountsEntry` (`accountId` VARCHAR(255) NOT NULL, `timestamp` BIGINT NOT NULL, `data` JSON NOT NULL, PRIMARY KEY (`accountId`))'
      )

      if (ShardeumFlags.NewStorageIndex) {
        //add index to timestamp
        await this.storage.run('CREATE INDEX IF NOT EXISTS timestamp1 ON accountsEntry(timestamp)')
      }

      if (ShardeumFlags.enableRIAccountsCache) {
        await this.storage.runCreate(
          'CREATE TABLE if not exists `riAccountsCache` (`accountId` VARCHAR(255) NOT NULL, `timestamp` BIGINT NOT NULL, `data` JSON NOT NULL, PRIMARY KEY (`accountId`))'
        )
        await this.storage.run('CREATE INDEX IF NOT EXISTS timestampIdx ON riAccountsCache(timestamp)')
      }
    }

    // get models and helper methods from the storage class we just initializaed.
    this.storageModels = this.storage.storageModels

    this._create = async (table, values, opts): Promise<unknown> => this.storage._create(table, values, opts)
    this._read = async (table, where, opts): Promise<unknown> => this.storage._read(table, where, opts)
    this._readOld = async (table, where, opts): Promise<unknown> => this.storage._readOld(table, where, opts)
    this._update = async (table, values, where, opts): Promise<unknown> =>
      this.storage._update(table, values, where, opts)
    this._delete = async (table, where, opts): Promise<unknown> => this.storage._delete(table, where, opts)
    this._query = async (query, tableModel): Promise<unknown> => this.storage._rawQuery(query, tableModel) // or queryString, valueArray for non-sequelize
    this._queryOld = async (query, tableModel): Promise<unknown> =>
      this.storage._rawQueryOld(query, tableModel) // or queryString, valueArray for non-sequelize

    this.initialized = true
  }
  async close(): Promise<void> {
    await this.storage.close()
  }

  _checkInit(): void {
    if (!this.initialized) throw new Error('Storage not initialized.')
  }

  async createOrReplaceAccountEntry(accountEntry: AccountsEntry): Promise<void> {
    this._checkInit()
    try {
      await this._create(this.storageModels.accountsEntry, accountEntry, {
        createOrReplace: true,
      })
    } catch (e) {
      throw new Error(e)
    }
  }

  async getRIAccountsCache(accountId: string): Promise<AccountsEntry> {
    this._checkInit()
    try {
      const result = await this._read(
        this.storageModels.riAccountsCache,
        { accountId },
        {
          attributes: { exclude: ['createdAt', 'updatedAt', 'id'] },
          raw: true,
        }
      )
      if (result.length > 0) {
        return result[0]
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  async setRIAccountsCache(accountEntry: AccountsEntry): Promise<void> {
    this._checkInit()
    try {
      console.log('setRIAccountsCache: ', Utils.safeStringify(accountEntry))
      await this._create(this.storageModels.riAccountsCache, accountEntry, {
        createOrReplace: true,
      })

      const cacheSize = await this.getRIAccountsCacheSize()

      // if actual cache size is greater than the max allowed, delete the oldest entries
      if (cacheSize > ShardeumFlags.riAccountsCacheSize) {
        const deleteSize = ShardeumFlags.riAccountsDeleteBatchSize
        await this.deleteOldestRIAccountsFromCache(deleteSize)
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  async getRIAccountsCacheSize(): Promise<number> {
    this._checkInit()
    try {
      const query = `SELECT COUNT(*) FROM riAccountsCache`
      const result = await this._query(query, [])
      return result[0]['COUNT(*)']
    } catch (e) {
      throw new Error(e)
    }
  }

  async deleteOldestRIAccountsFromCache(size: number): Promise<void> {
    this._checkInit()
    try {
      const query = `DELETE FROM riAccountsCache 
                     WHERE accountId IN 
                     (SELECT accountId FROM riAccountsCache 
                     ORDER BY timestamp ASC LIMIT ?)`
      await this._query(query, [size])
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
      if (result.length > 0) {
        return result[0]
      }
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
    const accountStartNum = Number(accountStart)
    const accountEndNum = Number(accountEnd)
    limit = Number(limit)
    const accountOffsetNum = Number(accountOffset)
    tsStart = Number(tsStart)
    tsEnd = Number(tsEnd)

    if (
      isNaN(accountStartNum) ||
      isNaN(accountEndNum) ||
      isNaN(accountOffsetNum) ||
      isNaN(limit) ||
      isNaN(tsStart) ||
      isNaN(tsEnd)
    ) {
      throw new Error('arguments should be numbers.')
    }
    if (accountEndNum < accountStartNum) {
      throw new Error('accountEnd must be greater than or equal to accountStart.')
    }
    if (tsStart < 0 || tsEnd < 0 || tsEnd < tsStart) {
      throw new Error('Invalid timestamp range.')
    }

    // Validate limit
    if (limit <= 0) {
      throw new Error('Invalid limit. Must be a positive number')
    }
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
      /*if (Array.isArray(result)) {
        if (isAccountsEntry(result[0])) {
          return result
        }
      }*/
    } catch (e) {
      throw new Error(e)
    }
  }

  async deleteAccountsEntry(): Promise<void> {
    this._checkInit()
    try {
      await this._delete(this.storageModels.accountsEntry, null, null)
    } catch (e) {
      throw new Error(e)
    }
  }

  async debugSelectAllAccountsEntry(): Promise<unknown> {
    this._checkInit()
    try {
      return await this._read(this.storageModels.accountsEntry, null, null)
    } catch (e) {
      throw new Error(e)
    }
  }
}
export default Storage
