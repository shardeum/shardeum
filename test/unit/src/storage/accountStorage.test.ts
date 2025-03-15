import { jest } from '@jest/globals'
import Storage from '../../../../src/storage/storage'
import {
  init,
  getAccount,
  setAccount,
  accountExists,
  getAccountTimestamp,
  clearAccounts,
} from '../../../../src/storage/accountStorage'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { WrappedEVMAccount, AccountType } from '../../../../src/shardeum/shardeumTypes'
import { Account } from '@ethereumjs/util'
import { AccountsEntry } from '../../../../src/storage/storage'
import { networkAccount } from '../../../../src/shardeum/shardeumConstants'
import { shardusGet } from '../../../../src/utils/requests'
import { getContextValue } from '../../../../src/utils/RequestContext'
import { AxiosResponse } from 'axios'
import { logFlags, isArchiverMode } from '../../../../src'

jest.mock('../../../../src/storage/storage')
jest.mock('../../../../src/shardeum/shardeumFlags', () => ({
  ShardeumFlags: {
    UseDBForAccounts: true,
    enableRIAccountsCache: false,
    debugGlobalAccountUpdateFail: false,
    collectorUrl: 'http://test-collector',
  },
}))

jest.mock('../../../../src', () => ({
  isArchiverMode: jest.fn().mockReturnValue(false),
  isServiceMode: jest.fn().mockReturnValue(false),
  logFlags: {
    important_as_fatal: false,
    dapp_verbose: true,
  },
}))

jest.mock('../../../../src/utils/requests')
jest.mock('../../../../src/utils/RequestContext')

const mockIsArchiverMode = jest.mocked(isArchiverMode)
const mockShardusGet = jest.mocked(shardusGet)
const mockGetContextValue = jest.mocked(getContextValue)

;(BigInt.prototype as any).toJSON = function (): string {
  return this.toString()
}

describe('accountStorage', () => {
  const mockAddress = '0x123'
  const mockAccount = new Account(BigInt(0), BigInt(1000))
  const mockWrappedAccount: WrappedEVMAccount = {
    accountType: AccountType.Account,
    ethAddress: mockAddress,
    hash: '0x456',
    timestamp: 1234567890,
    account: mockAccount,
  }
  const mockAccountEntry: AccountsEntry = {
    accountId: mockAddress,
    timestamp: 1234567890,
    data: mockWrappedAccount,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    mockIsArchiverMode.mockReturnValue(false)
    ;(ShardeumFlags as any).debugGlobalAccountUpdateFail = false
    ;(ShardeumFlags as any).UseDBForAccounts = true
  })

  describe('init', () => {
    it('should initialize storage with correct parameters', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'

      await init(mockBaseDir, mockDbPath)

      expect(Storage).toHaveBeenCalledWith(mockBaseDir, mockDbPath)
    })
  })

  describe('getAccount', () => {
    it('should return account from storage when UseDBForAccounts is true', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        getAccountsEntry: jest
          .fn<(address: string) => Promise<AccountsEntry>>()
          .mockResolvedValue(mockAccountEntry),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      const result = await getAccount(mockAddress)

      expect(mockStorageInstance.getAccountsEntry).toHaveBeenCalledWith(mockAddress)
      expect(result).toEqual(mockWrappedAccount)
    })

    it('should handle string data by parsing JSON', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const stringifiedAccount = JSON.stringify(mockWrappedAccount)
      const stringifiedEntry = {
        ...mockAccountEntry,
        data: stringifiedAccount,
      }
      const mockStorageInstance = {
        getAccountsEntry: jest
          .fn<(address: string) => Promise<AccountsEntry>>()
          .mockResolvedValue(stringifiedEntry as unknown as AccountsEntry),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      const result = await getAccount(mockAddress)

      expect(mockStorageInstance.getAccountsEntry).toHaveBeenCalledWith(mockAddress)
      expect(result).toEqual(JSON.parse(stringifiedAccount))
    })

    it('should fetch from collector in archiver mode with block context', async () => {
      mockIsArchiverMode.mockReturnValue(true)
      const mockBlock = { header: { number: BigInt(123) } }
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          accounts: [{ account: mockWrappedAccount }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      }

      mockGetContextValue.mockReturnValue(mockBlock)
      mockShardusGet.mockResolvedValue(mockResponse)

      const result = await getAccount(mockAddress)

      expect(mockShardusGet).toHaveBeenCalledWith(
        'http://test-collector/api/account?accountId=0x123&blockNumber=0x7b',
        {}
      )
      expect(result).toEqual(mockWrappedAccount)
    })

    it('should return null when collector fetch fails', async () => {
      mockIsArchiverMode.mockReturnValue(true)
      const mockBlock = { header: { number: BigInt(123) } }
      mockGetContextValue.mockReturnValue(mockBlock)
      mockShardusGet.mockRejectedValue(new Error('Network error'))

      const result = await getAccount(mockAddress)

      expect(result).toBeNull()
    })

    it('should return null when collector returns unsuccessful response', async () => {
      mockIsArchiverMode.mockReturnValue(true)
      const mockBlock = { header: { number: BigInt(123) } }
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
          accounts: [],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      }

      mockGetContextValue.mockReturnValue(mockBlock)
      mockShardusGet.mockResolvedValue(mockResponse)

      const result = await getAccount(mockAddress)

      expect(result).toBeNull()
    })

    it('should return null when account does not exist', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        getAccountsEntry: jest
          .fn<(address: string) => Promise<AccountsEntry | null>>()
          .mockResolvedValue(null),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      const result = await getAccount(mockAddress)

      expect(mockStorageInstance.getAccountsEntry).toHaveBeenCalledWith(mockAddress)
      expect(result).toBeUndefined()
    })
  })

  describe('setAccount', () => {
    it('should store account in database when UseDBForAccounts is true', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        createOrReplaceAccountEntry: jest
          .fn<(entry: AccountsEntry) => Promise<void>>()
          .mockResolvedValue(undefined),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      await setAccount(mockAddress, mockWrappedAccount)

      expect(mockStorageInstance.createOrReplaceAccountEntry).toHaveBeenCalledWith({
        accountId: mockAddress,
        timestamp: mockWrappedAccount.timestamp,
        data: mockWrappedAccount,
      })
    })

    it('should handle debugGlobalAccountUpdateFail flag', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        createOrReplaceAccountEntry: jest
          .fn<(entry: AccountsEntry) => Promise<void>>()
          .mockResolvedValue(undefined),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)
      ;(ShardeumFlags as any).debugGlobalAccountUpdateFail = true

      await init(mockBaseDir, mockDbPath)

      await setAccount(networkAccount, mockWrappedAccount)

      expect(mockStorageInstance.createOrReplaceAccountEntry).not.toHaveBeenCalled()
    })

    it('should log error when important_as_fatal is true', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockError = new Error('Storage error')
      const mockStorageInstance = {
        createOrReplaceAccountEntry: jest
          .fn<(entry: AccountsEntry) => Promise<void>>()
          .mockRejectedValue(mockError),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)
      logFlags.important_as_fatal = true

      const consoleSpy = jest.spyOn(console, 'log')

      await init(mockBaseDir, mockDbPath)

      try {
        await setAccount(mockAddress, mockWrappedAccount)
      } catch (e) {
        expect(consoleSpy).toHaveBeenCalledWith('Error: while trying to set account', 'Storage error')
      }
    })
  })

  describe('accountExists', () => {
    it('should return true when account exists in storage', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        getAccountsEntry: jest
          .fn<(address: string) => Promise<AccountsEntry>>()
          .mockResolvedValue(mockAccountEntry),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      const result = await accountExists(mockAddress)

      expect(mockStorageInstance.getAccountsEntry).toHaveBeenCalledWith(mockAddress)
      expect(result).toBe(true)
    })

    it('should return false when account does not exist in storage', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        getAccountsEntry: jest
          .fn<(address: string) => Promise<AccountsEntry | null>>()
          .mockResolvedValue(null),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      const result = await accountExists(mockAddress)

      expect(mockStorageInstance.getAccountsEntry).toHaveBeenCalledWith(mockAddress)
      expect(result).toBe(false)
    })
  })

  describe('getAccountTimestamp', () => {
    it('should return account timestamp from storage when UseDBForAccounts is true', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        getAccountsEntry: jest
          .fn<(address: string) => Promise<AccountsEntry>>()
          .mockResolvedValue(mockAccountEntry),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      const result = await getAccountTimestamp(mockAddress)

      expect(mockStorageInstance.getAccountsEntry).toHaveBeenCalledWith(mockAddress)
      expect(result).toBe(mockAccountEntry.timestamp)
    })

    it('should throw error when account does not exist', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        getAccountsEntry: jest
          .fn<(address: string) => Promise<AccountsEntry | null>>()
          .mockResolvedValue(null),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      await expect(getAccountTimestamp(mockAddress)).rejects.toThrow(
        "Cannot read properties of null (reading 'timestamp')"
      )
      expect(mockStorageInstance.getAccountsEntry).toHaveBeenCalledWith(mockAddress)
    })
  })

  describe('clearAccounts', () => {
    it('should clear accounts from storage when UseDBForAccounts is true', async () => {
      const mockBaseDir = '/test/base/dir'
      const mockDbPath = '/test/db/path'
      const mockStorageInstance = {
        init: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        deleteAccountsEntry: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      }
      ;(Storage as jest.Mock).mockImplementation(() => mockStorageInstance)

      await init(mockBaseDir, mockDbPath)

      await clearAccounts()

      expect(mockStorageInstance.init).toHaveBeenCalled()
      expect(mockStorageInstance.deleteAccountsEntry).toHaveBeenCalled()
    })
  })
})
