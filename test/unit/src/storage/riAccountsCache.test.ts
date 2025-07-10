import { getCachedRIAccount, setCachedRIAccount } from '../../../../src/storage/riAccountsCache'
import { nestedCountersInstance } from '@shardeum-foundation/core'
import { isServiceMode, logFlags } from '../../../../src'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { AccountType, WrappedEVMAccount } from '../../../../src/shardeum/shardeumTypes'
import { accounts, storage } from '../../../../src/storage/accountStorage'
import { AccountsEntry } from '../../../../src/storage/storage'
import * as WrappedEVMAccountFunctions from '../../../../src/shardeum/wrappedEVMAccountFunctions'
import { Utils } from '@shardeum-foundation/lib-types'

// Mock all dependencies
jest.mock('@shardeum-foundation/core', () => ({
  nestedCountersInstance: {
    countEvent: jest.fn()
  }
}))

jest.mock('../../../../src', () => ({
  isServiceMode: jest.fn(),
  logFlags: {
    important_as_fatal: false
  }
}))

jest.mock('../../../../src/shardeum/shardeumFlags', () => ({
  ShardeumFlags: {
    enableRIAccountsCache: true,
    UseDBForAccounts: true
  }
}))

jest.mock('../../../../src/storage/accountStorage', () => ({
  accounts: {},
  storage: {
    getRIAccountsCache: jest.fn(),
    setRIAccountsCache: jest.fn()
  }
}))

jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions', () => ({
  _calculateAccountHash: jest.fn()
}))

jest.mock('@shardeum-foundation/lib-types', () => ({
  Utils: {
    safeJsonParse: jest.fn()
  }
}))

describe('riAccountsCache functions', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  const mockAccount: WrappedEVMAccount = {
    accountType: AccountType.ContractCode,
    timestamp: Date.now(),
    account: {
      nonce: BigInt(0),
      balance: BigInt(0),
      storageRoot: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
      codeHash: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
    } as any,
    hash: 'mockhash',
    ethAddress: mockAddress
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset ShardeumFlags to defaults
    ;(ShardeumFlags as any).enableRIAccountsCache = true
    ;(ShardeumFlags as any).UseDBForAccounts = true
    ;(isServiceMode as jest.Mock).mockReturnValue(false)
    ;(logFlags as any).important_as_fatal = false
  })

  describe('getCachedRIAccount', () => {
    it('should return undefined when enableRIAccountsCache is false', async () => {
      ;(ShardeumFlags as any).enableRIAccountsCache = false
      
      const result = await getCachedRIAccount(mockAddress)
      
      expect(result).toBeUndefined()
      expect(storage.getRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should return undefined in service mode', async () => {
      ;(isServiceMode as jest.Mock).mockReturnValue(true)
      
      const result = await getCachedRIAccount(mockAddress)
      
      expect(result).toBeUndefined()
      expect(storage.getRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should get account from database when UseDBForAccounts is true', async () => {
      const mockEntry = { data: mockAccount }
      ;(storage.getRIAccountsCache as jest.Mock).mockResolvedValue(mockEntry)
      
      const result = await getCachedRIAccount(mockAddress)
      
      expect(storage.getRIAccountsCache).toHaveBeenCalledWith(mockAddress)
      expect(result).toBe(mockAccount)
    })

    it('should parse string data when returned from database', async () => {
      const stringData = 'mock-json-string'
      const mockEntry = { data: stringData }
      ;(storage.getRIAccountsCache as jest.Mock).mockResolvedValue(mockEntry)
      ;(Utils.safeJsonParse as jest.Mock).mockReturnValue(mockAccount)
      
      const result = await getCachedRIAccount(mockAddress)
      
      expect(Utils.safeJsonParse).toHaveBeenCalledWith(stringData)
      expect(result).toBe(mockAccount)
    })

    it('should return undefined when account not found in database', async () => {
      ;(storage.getRIAccountsCache as jest.Mock).mockResolvedValue(null)
      
      const result = await getCachedRIAccount(mockAddress)
      
      expect(result).toBeUndefined()
    })

    it('should get account from memory when UseDBForAccounts is false', async () => {
      ;(ShardeumFlags as any).UseDBForAccounts = false
      ;(accounts as any)[mockAddress] = mockAccount
      
      const result = await getCachedRIAccount(mockAddress)
      
      expect(result).toBe(mockAccount)
      expect(storage.getRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should handle errors and log them when important_as_fatal is true', async () => {
      ;(logFlags as any).important_as_fatal = true
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const error = new Error('Test error')
      ;(storage.getRIAccountsCache as jest.Mock).mockRejectedValue(error)
      
      const result = await getCachedRIAccount(mockAddress)
      
      expect(result).toBeUndefined()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Error: while trying to get cached ri account',
        'Test error'
      )
      
      consoleLogSpy.mockRestore()
    })
  })

  describe('setCachedRIAccount', () => {
    const mockAccountEntry: AccountsEntry = {
      accountId: mockAddress,
      data: mockAccount,
      timestamp: Date.now()
    }

    it('should return early when enableRIAccountsCache is false', async () => {
      ;(ShardeumFlags as any).enableRIAccountsCache = false
      
      await setCachedRIAccount(mockAccountEntry)
      
      expect(storage.setRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should return early in service mode', async () => {
      ;(isServiceMode as jest.Mock).mockReturnValue(true)
      
      await setCachedRIAccount(mockAccountEntry)
      
      expect(storage.setRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should parse string data before processing', async () => {
      const stringAccount = { ...mockAccountEntry, data: 'mock-json-string' }
      ;(Utils.safeJsonParse as jest.Mock).mockReturnValue(mockAccount)
      ;(storage.getRIAccountsCache as jest.Mock).mockResolvedValue(null)
      ;(WrappedEVMAccountFunctions._calculateAccountHash as jest.Mock).mockReturnValue('calculated-hash')
      
      await setCachedRIAccount(stringAccount)
      
      expect(Utils.safeJsonParse).toHaveBeenCalledWith('mock-json-string')
    })

    it('should return early for non-ContractCode account types', async () => {
      const nonContractAccount = {
        ...mockAccountEntry,
        data: { ...mockAccount, accountType: AccountType.Account }
      }
      
      await setCachedRIAccount(nonContractAccount)
      
      expect(storage.setRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should save new account to database when UseDBForAccounts is true', async () => {
      ;(storage.getRIAccountsCache as jest.Mock).mockResolvedValue(null)
      ;(WrappedEVMAccountFunctions._calculateAccountHash as jest.Mock).mockReturnValue('calculated-hash')
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456789)
      
      await setCachedRIAccount(mockAccountEntry)
      
      expect(storage.getRIAccountsCache).toHaveBeenCalledWith(mockAddress)
      expect(nestedCountersInstance.countEvent).toHaveBeenCalledWith('cache', 'setCachedRIAccountData')
      expect(WrappedEVMAccountFunctions._calculateAccountHash).toHaveBeenCalledWith(mockAccount)
      expect(storage.setRIAccountsCache).toHaveBeenCalledWith({
        ...mockAccountEntry,
        timestamp: 123456789,
        data: { ...mockAccount, hash: 'calculated-hash' }
      })
      
      dateNowSpy.mockRestore()
    })

    it('should not save if account already exists in database', async () => {
      ;(storage.getRIAccountsCache as jest.Mock).mockResolvedValue(mockAccountEntry)
      
      await setCachedRIAccount(mockAccountEntry)
      
      expect(storage.setRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should save account to memory when UseDBForAccounts is false', async () => {
      ;(ShardeumFlags as any).UseDBForAccounts = false
      
      await setCachedRIAccount(mockAccountEntry)
      
      expect((accounts as any)[mockAddress]).toBe(mockAccount)
      expect(storage.setRIAccountsCache).not.toHaveBeenCalled()
    })

    it('should handle errors and log them when important_as_fatal is true', async () => {
      ;(logFlags as any).important_as_fatal = true
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const error = new Error('Test error')
      ;(storage.getRIAccountsCache as jest.Mock).mockRejectedValue(error)
      
      await setCachedRIAccount(mockAccountEntry)
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Error: while trying to set cached ri account',
        'Test error'
      )
      
      consoleLogSpy.mockRestore()
    })
  })
})