import { jest } from '@jest/globals'
import { getAccountData } from '../../../../src/utils/account'
import { AccountType, WrappedEVMAccount } from '../../../../src/shardeum/shardeumTypes'
import * as AccountsStorage from '../../../../src/storage/accountStorage'
import { getReadableAccountInfo, isArchiverMode } from '../../../../src/index'
import { Account } from '@ethereumjs/util'
import { bytesToHex } from '@ethereumjs/util'

jest.mock('../../../../src/storage/accountStorage')
jest.mock('../../../../src/index', () => ({
  isArchiverMode: jest.fn(),
  getReadableAccountInfo: jest.fn(),
}))

// Helper types
type MockShardus = {
  getNodeId: jest.Mock
  isNodeInRotationBounds: jest.Mock
  getLocalOrRemoteAccount: jest.Mock
}

type MockReq = {
  query: {
    type?: string
    blockNumber?: string
    secondaryAddress?: string
  }
}

// Helper functions
function createMockAccount(overrides: Partial<Account> = {}): Account {
  return {
    nonce: BigInt(0),
    balance: BigInt(100),
    storageRoot: Buffer.alloc(32),
    codeHash: Buffer.alloc(32),
    _validate: jest.fn(),
    raw: jest.fn(),
    serialize: jest.fn(),
    isContract: jest.fn(),
    isEmpty: jest.fn(),
    ...overrides,
  } as unknown as Account
}

function createMockWrappedAccount(
  account: Account,
  ethAddress = '0x1234567890123456789012345678901234567890',
  accountType = AccountType.Account
): WrappedEVMAccount {
  return {
    accountType,
    ethAddress,
    hash: '0x',
    timestamp: 0,
    account,
    data: {
      accountType,
      ethAddress,
      hash: '0x',
      timestamp: 0,
      account,
    },
  } as unknown as WrappedEVMAccount
}

function setupDefaultMocks(mockShardus: MockShardus, mockReq: MockReq): void {
  jest.clearAllMocks()
  mockShardus.getNodeId.mockReturnValue('node1')
  mockShardus.isNodeInRotationBounds.mockReturnValue(false)

  const mockAccount = createMockAccount()
  const mockWrappedAccount = createMockWrappedAccount(mockAccount)
  mockShardus.getLocalOrRemoteAccount.mockImplementation(() => Promise.resolve(mockWrappedAccount))
  ;(getReadableAccountInfo as jest.Mock).mockImplementation(() => {
    try {
      if (!mockAccount.nonce || !mockAccount.balance || !mockAccount.storageRoot || !mockAccount.codeHash) {
        return Promise.resolve(null)
      }
      return Promise.resolve({
        nonce: mockAccount.nonce.toString(),
        balance: mockAccount.balance.toString(),
        storageRoot: bytesToHex(mockAccount.storageRoot),
        codeHash: bytesToHex(mockAccount.codeHash),
        operatorAccountInfo: null,
      })
    } catch (e) {
      return Promise.resolve(null)
    }
  })
}

describe('getAccountData', () => {
  let mockShardus: MockShardus
  let mockReq: MockReq

  beforeEach(() => {
    mockShardus = {
      getNodeId: jest.fn(),
      isNodeInRotationBounds: jest.fn(),
      getLocalOrRemoteAccount: jest.fn(),
    }
    mockReq = { query: {} }
    setupDefaultMocks(mockShardus, mockReq)
  })

  describe('Input validation', () => {
    it('should return error for invalid address length', async () => {
      const result = await getAccountData(mockShardus, 'invalid', mockReq)
      expect(result).toEqual({ error: 'Invalid address' })
    })

    it('should return error when node is in rotation bounds', async () => {
      mockShardus.isNodeInRotationBounds.mockReturnValue(true)
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ error: 'node close to rotation edges' })
    })
  })

  describe('Standard account retrieval', () => {
    it('should return account data for valid EVM address', async () => {
      const address = '0x1234567890123456789012345678901234567890'
      const result = await getAccountData(mockShardus, address, mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.Account,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          account: expect.objectContaining({
            nonce: BigInt(0),
            balance: BigInt(100),
            storageRoot: Buffer.alloc(32),
            codeHash: Buffer.alloc(32),
          }),
        }),
      })
    })

    it('should return null account when account not found', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() => Promise.resolve(null))
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })

    it('should handle account with undefined values', async () => {
      const mockAccount = createMockAccount({
        nonce: undefined,
        balance: undefined,
        storageRoot: undefined,
        codeHash: undefined,
      })
      const mockWrappedAccount = createMockWrappedAccount(mockAccount)
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() => Promise.resolve(mockWrappedAccount))
      ;(getReadableAccountInfo as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          nonce: undefined,
          balance: undefined,
          storageRoot: undefined,
          codeHash: undefined,
          operatorAccountInfo: null,
        })
      )

      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: {
          nonce: undefined,
          balance: undefined,
          storageRoot: undefined,
          codeHash: undefined,
          operatorAccountInfo: null,
        },
      })
    })

    it('should handle account with empty string values', async () => {
      const mockAccount = createMockAccount({
        nonce: BigInt(0),
        balance: BigInt(0),
      })
      const mockWrappedAccount = createMockWrappedAccount(mockAccount)
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() => Promise.resolve(mockWrappedAccount))
      ;(getReadableAccountInfo as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          nonce: '',
          balance: '',
          storageRoot: '0x',
          codeHash: '0x',
          operatorAccountInfo: null,
        })
      )

      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: {
          nonce: '',
          balance: '',
          storageRoot: '0x',
          codeHash: '0x',
          operatorAccountInfo: null,
        },
      })
    })

    it('should handle account with very large numbers', async () => {
      const mockAccount = createMockAccount({
        nonce: BigInt('9999999999999999999999999999999999999999'),
        balance: BigInt('9999999999999999999999999999999999999999'),
      })
      const mockWrappedAccount = createMockWrappedAccount(mockAccount)
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() => Promise.resolve(mockWrappedAccount))
      ;(getReadableAccountInfo as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          nonce: '9999999999999999999999999999999999999999',
          balance: '9999999999999999999999999999999999999999',
          storageRoot: '0x',
          codeHash: '0x',
          operatorAccountInfo: null,
        })
      )

      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: {
          nonce: '9999999999999999999999999999999999999999',
          balance: '9999999999999999999999999999999999999999',
          storageRoot: '0x',
          codeHash: '0x',
          operatorAccountInfo: null,
        },
      })
    })
  })

  describe('Archiver mode', () => {
    beforeEach(() => {
      ;(isArchiverMode as jest.Mock).mockReturnValue(true)
      mockReq.query.blockNumber = '0x123'
      ;(AccountsStorage.fetchAccountDataFromCollector as jest.Mock).mockImplementation(() =>
        Promise.resolve(null)
      ),
        mockShardus.getLocalOrRemoteAccount.mockImplementation(() => Promise.resolve(null))
    })

    it('should return null account when collector data not found', async () => {
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })

    it('should handle archiver mode with invalid block number', async () => {
      mockReq.query.blockNumber = 'invalid'
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })

    it('should handle archiver mode with undefined block number', async () => {
      mockReq.query.blockNumber = undefined
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })

    it('should handle archiver mode with empty block number', async () => {
      mockReq.query.blockNumber = ''
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })

    it('should handle archiver mode with negative block number', async () => {
      mockReq.query.blockNumber = '-1'
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })

    it('should handle archiver mode with non-numeric block number', async () => {
      mockReq.query.blockNumber = 'abc'
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })
  })

  describe('Specialized account types', () => {
    beforeEach(() => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
          value: Buffer.from([]),
        })
      )
    })

    it('should handle contract storage account type', async () => {
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
        }),
      })
    })

    it('should handle contract storage with secondary address', async () => {
      mockReq.query.type = AccountType.ContractStorage.toString()
      mockReq.query.secondaryAddress = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
        }),
      })
    })

    it('should return error for invalid account type', async () => {
      mockReq.query.type = '999'
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ error: 'Invalid account type' })
    })

    it('should return error for invalid secondary address length', async () => {
      mockReq.query.type = AccountType.ContractStorage.toString()
      mockReq.query.secondaryAddress = 'invalid'
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ error: 'Invalid secondary address' })
    })

    it('should return null account when contract storage not found', async () => {
      mockReq.query.type = AccountType.ContractStorage.toString()
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() => Promise.resolve(null))
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ account: null })
    })

    it('should handle contract storage with malformed secondary address', async () => {
      mockReq.query.type = AccountType.ContractStorage.toString()
      mockReq.query.secondaryAddress = '0x' // Incomplete hex
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ error: 'Invalid secondary address' })
    })

    it('should handle contract storage with non-numeric account type', async () => {
      mockReq.query.type = 'abc'
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({ error: 'Invalid account type' })
    })

    it('should handle contract storage with missing key in response', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          value: Buffer.from([]),
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
        }),
      })
    })

    it('should handle contract storage with missing value in response', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
        }),
      })
    })

    it('should handle contract storage with malformed response', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 'invalid', // Invalid timestamp type
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
          value: Buffer.from([]),
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
        }),
      })
    })

    it('should handle contract storage with null values in response', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: null,
          hash: null,
          timestamp: null,
          key: null,
          value: null,
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: null,
          hash: null,
          timestamp: null,
          key: null,
        }),
      })
    })

    it('should handle contract storage with undefined values in response', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: undefined,
          hash: undefined,
          timestamp: undefined,
          key: undefined,
          value: undefined,
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: undefined,
          hash: undefined,
          timestamp: undefined,
          key: undefined,
        }),
      })
    })

    it('should handle contract storage with empty string values in response', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '',
          hash: '',
          timestamp: 0,
          key: '',
          value: Buffer.from([]),
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '',
          hash: '',
          timestamp: 0,
          key: '',
        }),
      })
    })

    it('should handle contract storage with non-Buffer value', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
          value: 'not-a-buffer',
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
        }),
      })
    })

    it('should handle contract storage with very long key', async () => {
      const longKey = '0x' + '1'.repeat(1000)
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: longKey,
          value: Buffer.from([]),
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: 0,
          key: longKey,
        }),
      })
    })

    it('should handle contract storage with negative timestamp', async () => {
      mockShardus.getLocalOrRemoteAccount.mockImplementation(() =>
        Promise.resolve({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: -1,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
          value: Buffer.from([]),
        })
      )
      mockReq.query.type = AccountType.ContractStorage.toString()
      const result = await getAccountData(mockShardus, '0x1234567890123456789012345678901234567890', mockReq)
      expect(result).toEqual({
        account: expect.objectContaining({
          accountType: AccountType.ContractStorage,
          ethAddress: '0x1234567890123456789012345678901234567890',
          hash: '0x',
          timestamp: -1,
          key: '0x1234567890123456789012345678901234567890123456789012345678901234',
        }),
      })
    })
  })
})
