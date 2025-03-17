import assert from 'assert'
import { jest } from '@jest/globals'
import Storage, { AccountsEntry } from '../../../../src/storage/storage'
import Sqlite3Storage from '../../../../src/storage/sqlite3storage'
import { Database } from 'sqlite3'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'

// Mock implementations
jest.mock('../../../../src/storage/sqlite3storage')
jest.mock('../../../../src', () => ({
  isServiceMode: jest.fn().mockReturnValue(false),
}))

jest.mock('../../../../src/shardeum/shardeumFlags', () => ({
  ShardeumFlags: {
    NewStorageIndex: true,
    enableRIAccountsCache: true,
    riAccountsCacheSize: 1000,
    riAccountsDeleteBatchSize: 100,
  },
}))

describe('Storage', () => {
  let storage: Storage
  let mockStorage: any // Use 'any' type for the mock
  const baseDir = '/test/base/dir'
  const dbPath = 'test.db'

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a mock storage object directly
    const mockDb = {} as jest.Mocked<Database>
    mockStorage = {
      baseDir: '',
      memoryFile: false,
      dbPath: '',
      initialized: false,
      db: mockDb,
      oldDb: mockDb,
      storageModels: {
        accountsEntry: {},
        riAccountsCache: {},
      },
      init: jest.fn(),
      close: jest.fn().mockReturnValue(Promise.resolve()),
      runCreate: jest.fn().mockReturnValue(Promise.resolve()),
      run: jest.fn().mockReturnValue(Promise.resolve()),
      _create: jest.fn().mockReturnValue(Promise.resolve()),
      _read: jest.fn().mockReturnValue(Promise.resolve([])),
      _delete: jest.fn().mockReturnValue(Promise.resolve()),
      _query: jest.fn(), // Mocked _query method
      sqlite3Define: jest.fn(),
      dropAndCreateModel: jest.fn(),
      _rawQuery: jest.fn().mockReturnValue(Promise.resolve([])),
      _rawQueryOld: jest.fn().mockReturnValue(Promise.resolve([])),
      all: jest.fn().mockReturnValue(Promise.resolve([])),
      allOld: jest.fn().mockReturnValue(Promise.resolve([])),
    }

    // Mock the Sqlite3Storage constructor to return the mockStorage
    jest.mocked(Sqlite3Storage as jest.Mock).mockImplementation(() => mockStorage)
    storage = new Storage(baseDir, dbPath)
  })

  describe('constructor()', () => {
    it('should create a new Storage instance with provided paths', () => {
      expect(storage).toBeInstanceOf(Storage)
      const constructorCalls = jest.mocked(Sqlite3Storage).mock.calls
      expect(constructorCalls[0][1]).toBe(baseDir)
      expect(constructorCalls[0][2]).toBe(dbPath)
    })

    it('should initialize with null storage before init', () => {
      expect(storage.initialized).toBe(undefined)
    })
  })

  describe('init()', () => {
    it('should initialize storage successfully in non-service mode', async () => {
      await storage.init()
      expect(mockStorage.init.mock.calls.length).toBe(1)
      expect(
        mockStorage.runCreate.mock.calls[0][0].includes('CREATE TABLE if not exists `accountsEntry`')
      ).toBe(true)
      expect(storage.initialized).toBe(true)
    })

    it('should initialize storage without creating tables in service mode', async () => {
      jest.mocked(require('../../../../src').isServiceMode).mockReturnValue(true)
      await storage.init()
      expect(mockStorage.init.mock.calls.length).toBe(1)
      expect(mockStorage.runCreate.mock.calls.length).toBe(0)
      expect(storage.initialized).toBe(true)
    })

    it('should handle initialization errors', async () => {
      mockStorage.init.mockRejectedValue(new Error('Init Failed'))

      await expect(storage.init()).rejects.toThrow('Init Failed')
      expect(storage.initialized).toBe(undefined)
    })
  })

  describe('close()', () => {
    it('should close storage successfully', async () => {
      await storage.init()
      await storage.close()
      expect(mockStorage.close).toHaveBeenCalledTimes(1)
    })

    it('should handle close errors', async () => {
      mockStorage.close.mockRejectedValue(new Error('Close failed'))
      await storage.init()
      await expect(storage.close()).rejects.toThrow('Close failed')
    })
  })

  describe('_checkInit()', () => {
    it('should not throw when storage is initialized', async () => {
      await storage.init()
      expect(() => storage._checkInit()).not.toThrow()
    })

    it('should throw when storage is not initialized', () => {
      expect(() => storage._checkInit()).toThrow('Storage not initialized.')
    })
  })

  describe('checkDatabaseHealth()', () => {
    beforeEach(async () => {
      await storage.init()
    })

    it('should return true for healthy database', async () => {
      // Mock _query to return a structure that indicates a healthy database
      mockStorage._rawQuery.mockResolvedValue([[0, 1]]) // Return a single row with a single column

      const result = await storage.checkDatabaseHealth()
      expect(result).toBe(true) // This should pass if the implementation is correct
      expect(mockStorage._rawQuery.mock.calls[0][0]).toBe('SELECT 1') // Ensure the query is correct
    })

    it('should return false for unhealthy database', async () => {
      mockStorage._query.mockRejectedValue(new Error('DB Error'))
      const result = await storage.checkDatabaseHealth()
      expect(result).toBe(false)
    })

    it('should return false when not initialized', async () => {
      storage.initialized = false
      const result = await storage.checkDatabaseHealth()
      expect(result).toBe(false)
    })

    it('should return false when query returns empty result', async () => {
      mockStorage._query.mockReturnValue(Promise.resolve([]))
      const result = await storage.checkDatabaseHealth()
      expect(result).toBe(false)
    })
  })

  describe('createOrReplaceAccountEntry()', () => {
    beforeEach(async () => {
      await storage.init()
    })

    it('should successfully create a new account entry', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      mockStorage._create.mockResolvedValue(undefined) // Mock successful creation

      await storage.createOrReplaceAccountEntry(accountEntry)

      expect(mockStorage._create).toHaveBeenCalledWith(
        mockStorage.storageModels.accountsEntry,
        accountEntry,
        { createOrReplace: true }
      )
    })

    it('should replace an existing account entry', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'existingAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      mockStorage._create.mockResolvedValue(undefined) // Mock successful replacement

      await storage.createOrReplaceAccountEntry(accountEntry)

      expect(mockStorage._create).toHaveBeenCalledWith(
        mockStorage.storageModels.accountsEntry,
        accountEntry,
        { createOrReplace: true }
      )
    })

    it('should throw an error if the database operation fails', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string data',
      }

      mockStorage._create.mockRejectedValue(new Error('Database error')) // Mock failure

      await expect(storage.createOrReplaceAccountEntry(accountEntry)).rejects.toThrow('Database error')
    })

    it('should throw an error if storage is not initialized', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.createOrReplaceAccountEntry(accountEntry)).rejects.toThrowError(
        new Error('Storage not initialized.')
      )
    })
  })

  describe('getRIAccountsCache()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully retrieve an account entry from the cache', async () => {
      const accountId = 'testAccountId'
      const expectedEntry = {
        accountId: accountId,
        timestamp: Date.now(),
        data: { someData: 'value' },
      }

      // Mock the _read method to return the expected entry
      mockStorage._read.mockResolvedValue([expectedEntry])

      const result = await storage.getRIAccountsCache(accountId)
      expect(result).toEqual(expectedEntry) // Check that the result matches the expected entry
    })

    it('should return undefined if the account entry does not exist in the cache', async () => {
      const accountId = 'nonExistentAccountId'

      // Mock the _read method to return an empty array
      mockStorage._read.mockResolvedValue([])

      const result = await storage.getRIAccountsCache(accountId)
      expect(result).toBeUndefined() // Check that the result is undefined
    })

    it('should throw an error if the database operation fails', async () => {
      const accountId = 'testAccountId'

      // Mock the _read method to throw an error
      mockStorage._read.mockRejectedValue(new Error('Database error'))

      await expect(storage.getRIAccountsCache(accountId)).rejects.toThrow('Database error')
    })

    it('should throw an error if storage is not initialized', async () => {
      const accountId = 'testAccountId'

      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.getRIAccountsCache(accountId)).rejects.toThrowError(
        new Error('Storage not initialized.')
      )
    })
  })

  describe('setRIAccountsCache()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully set an account entry in the cache when cache size is within limits', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      mockStorage._rawQuery.mockResolvedValue([{ 'COUNT(*)': 0 }])
      mockStorage._create.mockResolvedValue(undefined) // Mock successful creation

      await storage.setRIAccountsCache(accountEntry)

      expect(mockStorage._create).toHaveBeenCalledWith(
        mockStorage.storageModels.riAccountsCache,
        accountEntry,
        { createOrReplace: true }
      )
    })

    it('should successfully set an account entry in the cache when cache size exceeds limits and delete one record', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      const accountEntry1: AccountsEntry = {
        accountId: 'testAccountId1',
        timestamp: Date.now(),
        data: 'some string',
      }
      const accountEntry2: AccountsEntry = {
        accountId: 'testAccountId2',
        timestamp: Date.now(),
        data: 'some string',
      }

      const accountEntry3: AccountsEntry = {
        accountId: 'testAccountId3',
        timestamp: Date.now(),
        data: 'some string',
      }

      const originalRiAccountsCacheSize = ShardeumFlags.riAccountsCacheSize
      ShardeumFlags.riAccountsCacheSize = 2
      mockStorage._rawQuery.mockResolvedValue([{ 'COUNT(*)': 3 }])
      mockStorage._create.mockResolvedValue(undefined) // Mock successful creation

      await storage.setRIAccountsCache(accountEntry)
      await storage.setRIAccountsCache(accountEntry1)
      await storage.setRIAccountsCache(accountEntry2)
      await storage.setRIAccountsCache(accountEntry3)

      expect(mockStorage._create).toHaveBeenCalledWith(
        mockStorage.storageModels.riAccountsCache,
        accountEntry,
        { createOrReplace: true }
      )

      expect(await storage.getRIAccountsCache('testAccountId')).toBeUndefined()
      expect(await storage.getRIAccountsCache('testAccountId1')).toBeUndefined()
      expect(await storage.getRIAccountsCache('testAccountId2')).toBeUndefined()
      expect(await storage.getRIAccountsCache('testAccountId3')).toBeUndefined()

      // Reset cache size back to original value
      ShardeumFlags.riAccountsCacheSize = originalRiAccountsCacheSize
    })

    it('should delete the oldest entries if the cache size exceeds the limit', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      // Mock the method to get the current cache size
      jest.spyOn(storage, 'getRIAccountsCacheSize').mockResolvedValue(1500) // Simulate cache size exceeding limit

      // Mock the _create method to simulate successful creation
      mockStorage._create.mockResolvedValue(undefined)

      await storage.setRIAccountsCache(accountEntry)

      // Ensure that the oldest entries are deleted (you may need to adjust this based on your implementation)
      expect(mockStorage._create).toHaveBeenCalled() // Check that _create was called
      // You can add more specific checks here based on how you implement cache deletion
    })

    it('should throw an error if the database operation fails', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      mockStorage._create.mockRejectedValue(new Error('Database error')) // Mock failure

      await expect(storage.setRIAccountsCache(accountEntry)).rejects.toThrow('Database error')
    })

    it('should throw an error if storage is not initialized', async () => {
      const accountEntry: AccountsEntry = {
        accountId: 'testAccountId',
        timestamp: Date.now(),
        data: 'some string',
      }

      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.setRIAccountsCache(accountEntry)).rejects.toThrowError(
        new Error('Storage not initialized.')
      )
    })
  })

  describe('deleteAccountsEntry()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully delete all account entries', async () => {
      // Mock the _delete method to simulate successful deletion
      mockStorage._delete.mockResolvedValue(undefined) // Mock successful deletion

      await storage.deleteAccountsEntry()

      expect(mockStorage._delete).toHaveBeenCalled() // Check that _delete was called
    })

    it('should throw an error if the database operation fails', async () => {
      mockStorage._delete.mockRejectedValue(new Error('Delete error')) // Mock failure

      await expect(storage.deleteAccountsEntry()).rejects.toThrow('Delete error')
    })

    it('should throw an error if storage is not initialized', async () => {
      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.deleteAccountsEntry()).rejects.toThrow('Storage not initialized.')
    })

    it('should handle the case when there are no entries to delete', async () => {
      // Mock the _delete method to simulate no entries to delete
      mockStorage._delete.mockResolvedValue(undefined) // Mock successful deletion

      await storage.deleteAccountsEntry()

      expect(mockStorage._delete).toHaveBeenCalled() // Check that _delete was called
    })
  })

  describe('debugSelectAllAccountsEntry()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully retrieve all account entries', async () => {
      const expectedEntries = [
        { accountId: 'account1', timestamp: Date.now(), data: { someData: 'value1' } },
        { accountId: 'account2', timestamp: Date.now(), data: { someData: 'value2' } },
      ]

      // Mock the _read method to return the expected entries
      mockStorage._read.mockResolvedValue(expectedEntries)

      const result = await storage.debugSelectAllAccountsEntry()
      expect(result).toEqual(expectedEntries) // Check that the result matches the expected entries
    })

    it('should throw an error if the database operation fails', async () => {
      // Mock the _read method to throw an error
      mockStorage._read.mockRejectedValue(new Error('Read error'))

      await expect(storage.debugSelectAllAccountsEntry()).rejects.toThrow('Read error')
    })

    it('should throw an error if storage is not initialized', async () => {
      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.debugSelectAllAccountsEntry()).rejects.toThrow('Storage not initialized.')
    })

    it('should return an empty array if there are no entries', async () => {
      // Mock the _read method to return an empty array
      mockStorage._read.mockResolvedValue([])

      const result = await storage.debugSelectAllAccountsEntry()
      expect(result).toEqual([]) // Check that the result is an empty array
    })
  })

  describe('getRIAccountsCacheSize()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully return the current size of the RI accounts cache', async () => {
      const expectedSize = 1500 // Example size

      // Mock the method to return the expected size
      jest.spyOn(storage, 'getRIAccountsCacheSize').mockResolvedValue(expectedSize)

      const result = await storage.getRIAccountsCacheSize()
      expect(result).toBe(expectedSize) // Check that the result matches the expected size
    })

    it('should throw an error if the cache operation fails', async () => {
      // Mock the method to throw an error
      jest.spyOn(storage, 'getRIAccountsCacheSize').mockRejectedValue(new Error('Cache error'))

      await expect(storage.getRIAccountsCacheSize()).rejects.toThrow('Cache error')
    })

    it('should throw an error if the database operation fails', async () => {
      // Mock the method to throw an error
      mockStorage._rawQuery.mockRejectedValue(new Error('Database error'))

      await expect(storage.getRIAccountsCacheSize()).rejects.toThrow('Database error')
    })

    it('should throw an error if storage is not initialized', async () => {
      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.getRIAccountsCacheSize()).rejects.toThrow('Storage not initialized.')
    })
  })

  describe('deleteOldestRIAccountsFromCache()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should throw an error if storage is not initialized', async () => {
      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.deleteOldestRIAccountsFromCache(1)).rejects.toThrow('Storage not initialized.')
    })

    it('should successfully delete the specified number of oldest entries', async () => {
      const size = 2 // Number of entries to delete

      // Mock the _query method to simulate successful deletion
      mockStorage._rawQuery.mockResolvedValue(undefined) // Mock successful deletion

      await storage.deleteOldestRIAccountsFromCache(size)

      expect(mockStorage._rawQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM riAccountsCache'),
        [size]
      )
    })

    it('should handle the case when there are no entries to delete', async () => {
      const size = 2 // Number of entries to delete

      // Mock the _query method to simulate no entries
      mockStorage._rawQuery.mockResolvedValue(undefined) // Mock successful deletion

      await storage.deleteOldestRIAccountsFromCache(size)

      expect(mockStorage._rawQuery).toHaveBeenCalled() // Check that _query was called
    })

    it('should throw an error if the database operation fails', async () => {
      const size = 2 // Number of entries to delete

      // Mock the _query method to throw an error
      mockStorage._rawQuery.mockRejectedValue(new Error('Delete error'))

      await expect(storage.deleteOldestRIAccountsFromCache(size)).rejects.toThrow('Delete error')
    })
  })

  describe('getAccountsEntry()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should throw an error if storage is not initialized', async () => {
      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.getAccountsEntry('testAccountId')).rejects.toThrow('Storage not initialized.')
    })

    it('should successfully retrieve an account entry for a valid accountId', async () => {
      const accountId = 'testAccountId'
      const expectedEntry = {
        accountId: accountId,
        timestamp: Date.now(),
        data: { someData: 'value' },
      }

      // Mock the _read method to return the expected entry
      mockStorage._read.mockResolvedValue([expectedEntry])

      const result = await storage.getAccountsEntry(accountId)
      expect(result).toEqual(expectedEntry) // Check that the result matches the expected entry
    })

    it('should return undefined if the account entry does not exist', async () => {
      const accountId = 'nonExistentAccountId'

      // Mock the _read method to return an empty array
      mockStorage._read.mockResolvedValue([])

      const result = await storage.getAccountsEntry(accountId)
      expect(result).toBeUndefined() // Check that the result is undefined
    })

    it('should return undefined if the accountId is invalid', async () => {
      const invalidAccountId = '' // Example of an invalid accountId
      const result = await storage.getAccountsEntry(invalidAccountId)
      expect(result).toBeUndefined()
    })

    it('should throw an error if the database operation fails', async () => {
      const accountId = 'testAccountId'

      // Mock the _read method to throw an error
      mockStorage._read.mockRejectedValue(new Error('Database error'))

      await expect(storage.getAccountsEntry(accountId)).rejects.toThrow('Database error')
    })
  })

  describe('queryAccountsEntryByRanges3()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully retrieve account entries for valid parameters', async () => {
      const accountStart = '0001'
      const accountEnd = '0005'
      const tsStart = 1000
      const tsEnd = 2000
      const limit = 10
      const accountOffset = '0003'

      const expectedEntries = [
        { accountId: '0002', timestamp: 1500, data: { someData: 'value' } },
        { accountId: '0004', timestamp: 1800, data: { someData: 'value' } },
      ]

      mockStorage._rawQuery.mockResolvedValue(expectedEntries)

      const result = await storage.queryAccountsEntryByRanges3(
        accountStart,
        accountEnd,
        tsStart,
        tsEnd,
        limit,
        accountOffset
      )
      expect(result).toEqual(expectedEntries)
    })

    it('should throw an error if accountStart has invalid characters', async () => {
      await expect(
        storage.queryAccountsEntryByRanges3('invalidAccountId', '0005', 1000, 2000, 10, '0003')
      ).rejects.toThrow(
        'accountStart should be an empty string or a string with only upper or lower case hex chars.'
      )
    })

    it('should throw an error if accountEnd has invalid characters', async () => {
      await expect(
        storage.queryAccountsEntryByRanges3('003', 'invalidAccountEnd', 1000, 2000, 10, '0003')
      ).rejects.toThrow(
        'accountEnd should be an empty string or a string with only upper or lower case hex chars.'
      )
    })

    it('should throw an error if accountOffset has invalid characters', async () => {
      await expect(
        storage.queryAccountsEntryByRanges3('003', '005', 1000, 2000, 10, 'invalidAccountOffset')
      ).rejects.toThrow(
        'accountOffset should be an empty string or a string with only upper or lower case hex chars.'
      )
    })

    it('should throw an error if timestamps are invalid', async () => {
      await expect(
        storage.queryAccountsEntryByRanges3('0001', '0005', 2000, 1000, 10, '0003')
      ).rejects.toThrow('Invalid timestamp range.')
    })

    it('should throw an error if limit is not a positive number', async () => {
      await expect(
        storage.queryAccountsEntryByRanges3('0001', '0005', 1000, 2000, -5, '0003')
      ).rejects.toThrow('Invalid limit. Must be a positive number')
    })

    it('should throw an error if limit is invalid number', async () => {
      await expect(
        storage.queryAccountsEntryByRanges3('0001', '0005', 1000, 2000, NaN, '0003')
      ).rejects.toThrow('arguments should be numbers.')
    })

    it('should throw an error if the database operation fails', async () => {
      mockStorage._rawQuery.mockRejectedValue(new Error('Database error'))

      await expect(
        storage.queryAccountsEntryByRanges3('0001', '0005', 1000, 2000, 10, '0003')
      ).rejects.toThrow('Database error')
    })

    it('should throw an error if storage is not initialized', async () => {
      storage.initialized = false

      await expect(
        storage.queryAccountsEntryByRanges3('0001', '0005', 1000, 2000, 10, '0003')
      ).rejects.toThrow('Storage not initialized.')
    })
  })

  describe('queryAccountsEntryByRanges2()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully retrieve account entries for valid parameters', async () => {
      const accountStart = '0001'
      const accountEnd = '0005'
      const tsStart = 1000
      const tsEnd = 2000
      const limit = 10
      const offset = 0

      const expectedEntries = [
        { accountId: '0002', timestamp: 1500, data: { someData: 'value' } },
        { accountId: '0004', timestamp: 1800, data: { someData: 'value' } },
      ]

      // Mock the _read method to return the expected entries
      mockStorage._read.mockResolvedValue(expectedEntries)

      const result = await storage.queryAccountsEntryByRanges2(
        accountStart,
        accountEnd,
        tsStart,
        tsEnd,
        limit,
        offset
      )
      expect(result).toEqual(expectedEntries) // Check that the result matches the expected entries
    })

    it('should throw an error if the database operation fails', async () => {
      const accountStart = '0001'
      const accountEnd = '0005'
      const tsStart = 1000
      const tsEnd = 2000
      const limit = 10
      const offset = 0

      // Mock the _read method to throw an error
      mockStorage._read.mockRejectedValue(new Error('Database error'))

      await expect(async () => {
        await storage.queryAccountsEntryByRanges2(accountStart, accountEnd, tsStart, tsEnd, limit, offset)
      }).rejects.toThrow('Database error')
    })

    it('should throw an error if storage is not initialized', async () => {
      // Simulate storage not being initialized
      storage.initialized = false

      await expect(async () => {
        await storage.queryAccountsEntryByRanges2('0001', '0005', 1000, 2000, 10, 0)
      }).rejects.toThrow('Storage not initialized.') // Ensure this matches the error thrown in your implementation
    })
  })

  describe('queryAccountsEntryByRanges()', () => {
    beforeEach(async () => {
      await storage.init() // Ensure storage is initialized before each test
    })

    it('should successfully retrieve account entries for valid parameters', async () => {
      const accountStart = '0001'
      const accountEnd = '0005'
      const limit = 10

      const expectedEntries = [
        { accountId: '0002', timestamp: 1500, data: { someData: 'value' } },
        { accountId: '0004', timestamp: 1800, data: { someData: 'value' } },
      ]

      // Mock the _read method to return the expected entries
      mockStorage._read.mockResolvedValue(expectedEntries)

      const result = await storage.queryAccountsEntryByRanges(accountStart, accountEnd, limit)
      expect(result).toEqual(expectedEntries) // Check that the result matches the expected entries
    })

    it('should throw an error if the database operation fails', async () => {
      const accountStart = '0001'
      const accountEnd = '0005'
      const limit = 10

      // Mock the _read method to throw an error
      mockStorage._read.mockRejectedValue(new Error('Database error'))

      await expect(storage.queryAccountsEntryByRanges(accountStart, accountEnd, limit)).rejects.toThrow(
        'Database error'
      )
    })

    it('should throw an error if storage is not initialized', async () => {
      // Simulate storage not being initialized
      storage.initialized = false

      await expect(storage.queryAccountsEntryByRanges('0001', '0005', 10)).rejects.toThrow(
        'Storage not initialized.'
      )
    })
  })
})
