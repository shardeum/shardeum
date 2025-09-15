import { describe, beforeEach, test, expect, jest, beforeAll } from '@jest/globals'
import { Account, Address, bytesToHex, hexToBytes, KECCAK256_NULL } from '@ethereumjs/util'
import TransactionState, { RunType } from '../../../../src/state/transactionState'
import ShardeumState from '../../../../src/state/shardeumState'
import * as AccountsStorage from '../../../../src/storage/accountStorage'
import { AccountType, WrappedEVMAccount } from '../../../../src/shardeum/shardeumTypes'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { zeroAddressStr } from '../../../../src/utils'
import { Trie } from '@ethereumjs/trie'
import { RLP } from '@ethereumjs/rlp'

// Mock dependencies
jest.mock('../../../../src/storage/accountStorage')
jest.mock('../../../../src/shardeum/shardeumFlags', () => ({
  ShardeumFlags: {
    Virtual0Address: false,
    VerboseLogs: false,
    debugTraceLogs: false,
    CheckpointRevertSupport: true,
    fixContractBytes: false
  }
}))
jest.mock('../../../../src/shardeum/evmAddress')
jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions')
jest.mock('../../../../src/index', () => ({
  shardeumGetTime: jest.fn(() => 1234567890)
}))

describe('TransactionState', () => {
  let transactionState: TransactionState
  let mockShardeumState: jest.Mocked<ShardeumState>
  let mockCallbacks: any
  let mockTrie: jest.Mocked<Trie>

  // Test addresses and accounts
  const address1 = new Address(Buffer.from('0x1234567890123456789012345678901234567890'.slice(2), 'hex'))
  const address2 = new Address(Buffer.from('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'.slice(2), 'hex'))
  const addressString1 = address1.toString()
  const addressString2 = address2.toString()

  const account1 = new Account()
  const account2 = new Account()

  beforeAll(() => {
    account1.balance = BigInt(100)
    account1.nonce = BigInt(1)
    account2.balance = BigInt(200)
    account2.nonce = BigInt(2)
  })

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock shardeum state
    mockShardeumState = {} as jest.Mocked<ShardeumState>

    // Create mock callbacks
    mockCallbacks = {
      storageMiss: jest.fn(() => Promise.resolve(false)),
      contractStorageMiss: jest.fn(() => Promise.resolve(false)),
      accountInvolved: jest.fn(() => true),
      contractStorageInvolved: jest.fn(() => true),
      tryGetRemoteAccountCB: jest.fn(() => Promise.resolve(undefined)),
      monitorEventCB: jest.fn()
    } as any

    // Create mock trie
    mockTrie = {} as jest.Mocked<Trie>

    // Create transaction state instance
    transactionState = new TransactionState()
  })

  describe('initData', () => {
    test('should initialize transaction state with provided data', () => {
      const linkedTX = 'tx123'
      const firstReads = new Map([[addressString1, account1.serialize()]])
      const firstContractStorageReads = new Map([['contract1', new Map([['key1', Buffer.from('value1')]])]]) 

      transactionState.initData(
        mockShardeumState,
        mockCallbacks,
        linkedTX,
        firstReads,
        firstContractStorageReads,
        RunType.Apply
      )

      expect(transactionState.linkedTX).toBe(linkedTX)
      expect(transactionState.shardeumState).toBe(mockShardeumState)
      expect(transactionState.firstAccountReads).toBe(firstReads)
      expect(transactionState.firstContractStorageReads).toBe(firstContractStorageReads)
      expect(transactionState.checkpointCount).toBe(0)
    })

    test('should initialize callbacks correctly', () => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)

      expect(transactionState.accountMissCB).toBe(mockCallbacks.storageMiss)
      expect(transactionState.contractStorageMissCB).toBe(mockCallbacks.contractStorageMiss)
      expect(transactionState.accountInvolvedCB).toBe(mockCallbacks.accountInvolved)
      expect(transactionState.contractStorageInvolvedCB).toBe(mockCallbacks.contractStorageInvolved)
      expect(transactionState.tryGetRemoteAccountCB).toBe(mockCallbacks.tryGetRemoteAccountCB)
      expect(transactionState.monitorEventCB).toBe(mockCallbacks.monitorEventCB)
    })
  })

  describe('resetTransactionState', () => {
    test('should reset all state maps and counters', () => {
      // Initialize with some data
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', new Map(), new Map(), RunType.Apply)
      transactionState.allAccountWrites.set(addressString1, account1.serialize())
      transactionState.checkpointCount = 5

      // Reset
      transactionState.resetTransactionState()

      expect(transactionState.firstAccountReads.size).toBe(0)
      expect(transactionState.allAccountWrites.size).toBe(0)
      expect(transactionState.committedAccountWrites.size).toBe(0)
      expect(transactionState.firstContractStorageReads.size).toBe(0)
      expect(transactionState.allContractStorageWrites.size).toBe(0)
      expect(transactionState.checkpointCount).toBe(0)
    })
  })

  describe('fixAccountFields', () => {
    test('should add 0x prefix to nonce and balance if missing', () => {
      const account = {
        nonce: '1234',
        balance: '5678',
        storageRoot: Buffer.from('storageRoot'),
        codeHash: Buffer.from('codeHash')
      }

      TransactionState.fixAccountFields(account)

      expect(account.nonce).toBe('0x1234')
      expect(account.balance).toBe('0x5678')
    })

    test('should not modify already prefixed values', () => {
      const account = {
        nonce: '0x1234',
        balance: '0x5678',
        storageRoot: Buffer.from('storageRoot'),
        codeHash: Buffer.from('codeHash')
      }

      TransactionState.fixAccountFields(account)

      expect(account.nonce).toBe('0x1234')
      expect(account.balance).toBe('0x5678')
    })

    test('should convert object data to Uint8Array', () => {
      const account = {
        nonce: '0x1234',
        balance: '0x5678',
        storageRoot: { data: [1, 2, 3, 4] },
        codeHash: { data: [5, 6, 7, 8] }
      }

      TransactionState.fixAccountFields(account)

      expect(account.storageRoot).toBeInstanceOf(Uint8Array)
      expect(account.codeHash).toBeInstanceOf(Uint8Array)
    })
  })

  describe('getAccount', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should return account from allAccountWrites if present', async () => {
      transactionState.allAccountWrites.set(addressString1, account1.serialize())

      const result = await transactionState.getAccount(mockTrie, address1, false, false)

      expect(result.balance).toEqual(account1.balance)
      expect(result.nonce).toEqual(account1.nonce)
    })

    test('should return account from allAccountWritesStack if present', async () => {
      const stackMap = new Map([[addressString1, account1.serialize()]])
      transactionState.allAccountWritesStack.push(stackMap)

      const result = await transactionState.getAccount(mockTrie, address1, false, false)

      expect(result.balance).toEqual(account1.balance)
      expect(result.nonce).toEqual(account1.nonce)
    })

    test('should return account from committedAccountWrites if present', async () => {
      transactionState.committedAccountWrites.set(addressString1, account1.serialize())

      const result = await transactionState.getAccount(mockTrie, address1, true, false)

      expect(result.balance).toEqual(account1.balance)
      expect(result.nonce).toEqual(account1.nonce)
    })

    test('should return account from firstAccountReads if present', async () => {
      transactionState.firstAccountReads.set(addressString1, account1.serialize())

      const result = await transactionState.getAccount(mockTrie, address1, false, false)

      expect(result.balance).toEqual(account1.balance)
      expect(result.nonce).toEqual(account1.nonce)
    })

    test('should get account from storage if not in memory', async () => {
      const wrappedAccount: WrappedEVMAccount = {
        accountType: AccountType.Account,
        ethAddress: addressString1,
        account: account1,
        timestamp: 0
      } as any

      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(wrappedAccount))

      const result = await transactionState.getAccount(mockTrie, address1, false, false)

      expect(result.balance).toEqual(account1.balance)
      expect(result.nonce).toEqual(account1.nonce)
      expect(transactionState.firstAccountReads.has(addressString1)).toBe(true)
    })

    test('should try remote account callback if not found locally', async () => {
      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(null))

      const wrappedAccount: WrappedEVMAccount = {
        accountType: AccountType.Account,
        ethAddress: addressString1,
        account: account1,
        timestamp: 0
      } as any

      mockCallbacks.tryGetRemoteAccountCB.mockResolvedValue(wrappedAccount)

      const result = await transactionState.getAccount(mockTrie, address1, false, false)

      expect(result.balance).toEqual(account1.balance)
      expect(mockCallbacks.tryGetRemoteAccountCB).toHaveBeenCalledWith(
        transactionState,
        AccountType.Account,
        addressString1,
        null
      )
    })

    test('should return new account if not found and call storage miss callback', async () => {
      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(null))
      mockCallbacks.tryGetRemoteAccountCB.mockResolvedValue(undefined)
      mockCallbacks.storageMiss.mockResolvedValue(false)

      const result = await transactionState.getAccount(mockTrie, address1, false, false)

      expect(result.balance).toEqual(BigInt(0))
      expect(result.nonce).toEqual(BigInt(0))
      expect(mockCallbacks.storageMiss).toHaveBeenCalledWith(transactionState, addressString1)
    })

    test('should throw error if account is in remote shard and canThrow is true', async () => {
      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(null))
      mockCallbacks.tryGetRemoteAccountCB.mockResolvedValue(undefined)
      mockCallbacks.storageMiss.mockResolvedValue(true) // isRemoteShard = true

      await expect(
        transactionState.getAccount(mockTrie, address1, false, true)
      ).rejects.toThrow('account in remote shard, abort')
    })

    test('should return zero address account for virtual 0 address', async () => {
      ShardeumFlags.Virtual0Address = true
      const zeroAddress = new Address(Buffer.from(zeroAddressStr.slice(2), 'hex'))

      const result = await transactionState.getAccount(mockTrie, zeroAddress, false, false)

      expect(result).toBeDefined()
      ShardeumFlags.Virtual0Address = false
    })

    test('should throw error if account cannot be involved', async () => {
      mockCallbacks.accountInvolved.mockReturnValue(false)

      await expect(
        transactionState.getAccount(mockTrie, address1, false, false)
      ).rejects.toThrow('unable to proceed, cant involve account')
    })
  })

  describe('putAccount', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should add account to current checkpoint if checkpoints exist', () => {
      transactionState.allAccountWritesStack.push(new Map())

      transactionState.putAccount(address1, account1)

      // When CheckpointRevertSupport is enabled, putAccount writes to allAccountWrites
      expect(transactionState.allAccountWrites.has(addressString1)).toBe(true)
    })

    test('should add account to allAccountWrites when CheckpointRevertSupport is enabled', () => {
      transactionState.putAccount(address1, account1)

      // When CheckpointRevertSupport is enabled, putAccount writes to allAccountWrites
      expect(transactionState.allAccountWrites.has(addressString1)).toBe(true)
    })

    test('should add account to firstAccountReads when CheckpointRevertSupport is disabled', () => {
      ShardeumFlags.CheckpointRevertSupport = false
      
      transactionState.putAccount(address1, account1)

      expect(transactionState.firstAccountReads.has(addressString1)).toBe(true)
      expect(transactionState.allAccountWrites.has(addressString1)).toBe(false)
      
      // Reset flag
      ShardeumFlags.CheckpointRevertSupport = true
    })

    test('should add account to stack when CheckpointRevertSupport is disabled but stack exists', () => {
      ShardeumFlags.CheckpointRevertSupport = false
      transactionState.allAccountWritesStack.push(new Map())
      
      transactionState.putAccount(address1, account1)

      const topStack = transactionState.allAccountWritesStack[transactionState.allAccountWritesStack.length - 1]
      expect(topStack.has(addressString1)).toBe(true)
      expect(transactionState.firstAccountReads.has(addressString1)).toBe(false)
      
      // Reset flag
      ShardeumFlags.CheckpointRevertSupport = true
    })

    test('should ignore virtual 0 address when flag is set', () => {
      ShardeumFlags.Virtual0Address = true
      const zeroAddress = new Address(Buffer.from(zeroAddressStr.slice(2), 'hex'))

      transactionState.putAccount(zeroAddress, account1)

      expect(transactionState.allAccountWrites.has(zeroAddressStr)).toBe(false)
      ShardeumFlags.Virtual0Address = false
    })

    test('should throw error if account cannot be involved', () => {
      mockCallbacks.accountInvolved.mockReturnValue(false)

      expect(() => {
        transactionState.putAccount(address1, account1)
      }).toThrow('unable to proceed, cant involve account')
    })
  })

  describe('insertFirstAccountReads', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should insert account into firstAccountReads', () => {
      transactionState.insertFirstAccountReads(address1, account1)

      expect(transactionState.firstAccountReads.has(addressString1)).toBe(true)
      const storedRlp = transactionState.firstAccountReads.get(addressString1)
      const storedAccount = Account.fromRlpSerializedAccount(storedRlp)
      expect(storedAccount.balance).toEqual(account1.balance)
    })
  })

  describe('getContractCode', () => {
    const codeBytes = Buffer.from('0x608060405260', 'hex')
    const codeHash = Buffer.from('codehash123456')
    const codeHashStr = bytesToHex(codeHash)

    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
      // Mock getAccount to return account with codeHash
      jest.spyOn(transactionState, 'getAccount').mockResolvedValue({
        ...account1,
        codeHash
      } as any)
    })

    test('should return code from allContractBytesWrites if present', async () => {
      transactionState.allContractBytesWrites.set(codeHashStr, {
        contractByte: codeBytes,
        codeHash,
        contractAddress: address1
      })

      const result = await transactionState.getContractCode(mockTrie, address1, false, false)

      expect(result).toEqual(codeBytes)
    })

    test('should return code from allContractBytesWritesByAddress if present', async () => {
      transactionState.allContractBytesWritesByAddress.set(addressString1, {
        contractByte: codeBytes,
        codeHash,
        contractAddress: address1
      })

      const result = await transactionState.getContractCode(mockTrie, address1, false, false)

      expect(result).toEqual(codeBytes)
    })

    test('should return code from firstContractBytesReads if present', async () => {
      transactionState.firstContractBytesReads.set(codeHashStr, {
        contractByte: codeBytes,
        codeHash,
        contractAddress: address1
      })

      const result = await transactionState.getContractCode(mockTrie, address1, true, false)

      expect(result).toEqual(codeBytes)
    })

    test('should get code from storage if not in memory', async () => {
      const wrappedAccount: WrappedEVMAccount = {
        accountType: AccountType.ContractCode,
        ethAddress: addressString1,
        codeByte: codeBytes,
        timestamp: 0
      } as any

      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(wrappedAccount))

      const result = await transactionState.getContractCode(mockTrie, address1, false, false)

      expect(result).toEqual(codeBytes)
      expect(transactionState.firstContractBytesReads.has(codeHashStr)).toBe(true)
    })

    test('should return empty array if code not found', async () => {
      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(null))
      mockCallbacks.tryGetRemoteAccountCB.mockResolvedValue(undefined)

      const result = await transactionState.getContractCode(mockTrie, address1, false, false)

      expect(result).toEqual(new Uint8Array(0))
    })

    test('should return undefined if no contract account found', async () => {
      jest.spyOn(transactionState, 'getAccount').mockResolvedValue(undefined)

      const result = await transactionState.getContractCode(mockTrie, address1, false, false)

      expect(result).toBeUndefined()
    })
  })

  describe('putContractCode', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should store contract code with calculated hash', async () => {
      const codeBytes = Buffer.from('608060405260', 'hex')

      await transactionState.putContractCode(address1, codeBytes)

      expect(transactionState.allContractBytesWrites.size).toBe(1)
      expect(transactionState.allContractBytesWritesByAddress.has(addressString1)).toBe(true)
      expect(transactionState.touchedCAs.has(addressString1)).toBe(true)
    })

    test('should skip if code hash is KECCAK256_NULL', async () => {
      const emptyCode = Buffer.from('')

      await transactionState.putContractCode(address1, emptyCode)

      // Should still check involvement but not store
      expect(mockCallbacks.accountInvolved).toHaveBeenCalled()
    })

    test('should throw error if account cannot be involved', async () => {
      mockCallbacks.accountInvolved.mockReturnValue(false)
      const codeBytes = Buffer.from('0x608060405260', 'hex')

      await expect(
        transactionState.putContractCode(address1, codeBytes)
      ).rejects.toThrow('unable to proceed, cant involve contract code account')
    })
  })

  describe('getContractStorage', () => {
    const key = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
    const keyString = bytesToHex(key)
    const value = Buffer.from('1234', 'hex')
    const storedRlp = RLP.encode(value)

    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should return value from allContractStorageWrites if present', async () => {
      const storageMap = new Map([[keyString, storedRlp]])
      transactionState.allContractStorageWrites.set(addressString1, storageMap)

      const result = await transactionState.getContractStorage(mockTrie, address1, key, false, false)

      expect(Buffer.from(result)).toEqual(value)
    })

    test('should return value from firstContractStorageReads if present', async () => {
      const storageMap = new Map([[keyString, storedRlp]])
      transactionState.firstContractStorageReads.set(addressString1, storageMap)

      const result = await transactionState.getContractStorage(mockTrie, address1, key, true, false)

      expect(Buffer.from(result)).toEqual(value)
    })

    test('should get value from storage if not in memory', async () => {
      const wrappedAccount: WrappedEVMAccount = {
        accountType: AccountType.ContractStorage,
        ethAddress: addressString1,
        value: storedRlp,
        timestamp: 0
      } as any

      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(wrappedAccount))

      const result = await transactionState.getContractStorage(mockTrie, address1, key, false, false)

      expect(Buffer.from(result)).toEqual(value)
      expect(transactionState.firstContractStorageReads.has(addressString1)).toBe(true)
    })

    test('should return empty array for null storage value', async () => {
      mockCallbacks.tryGetRemoteAccountCB.mockResolvedValue(null)
      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(null))

      const result = await transactionState.getContractStorage(mockTrie, address1, key, false, false)

      expect(result).toEqual(Uint8Array.from([]))
      expect(transactionState.firstContractStorageReads.has(addressString1)).toBe(true)
    })

    test('should throw error if storage is in remote shard and canThrow is true', async () => {
      ;(AccountsStorage.getAccount as jest.Mock).mockImplementation(() => Promise.resolve(null))
      mockCallbacks.tryGetRemoteAccountCB.mockResolvedValue({ value: undefined })
      mockCallbacks.contractStorageMiss.mockResolvedValue(true)

      await expect(
        transactionState.getContractStorage(mockTrie, address1, key, false, true)
      ).rejects.toThrow('account not available')
    })
  })

  describe('putContractStorage', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should store contract storage value', async () => {
      const key = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
      const value = Buffer.from('1234', 'hex')

      await transactionState.putContractStorage(address1, key, value)

      expect(transactionState.allContractStorageWrites.has(addressString1)).toBe(true)
      const storageMap = transactionState.allContractStorageWrites.get(addressString1)
      expect(storageMap.has(bytesToHex(key))).toBe(true)
      expect(transactionState.touchedCAs.has(addressString1)).toBe(true)
    })

    test('should throw error if storage cannot be involved', async () => {
      mockCallbacks.contractStorageInvolved.mockReturnValue(false)
      const key = Buffer.from('0x01', 'hex')
      const value = Buffer.from('0x1234', 'hex')

      await expect(
        transactionState.putContractStorage(address1, key, value)
      ).rejects.toThrow('unable to proceed, cant involve contract storage')
    })
  })

  describe('checkpoint, commit, and revert', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('checkpoint should create new write stack layer', () => {
      expect(transactionState.allAccountWritesStack.length).toBe(0)

      transactionState.checkpoint()

      expect(transactionState.allAccountWritesStack.length).toBe(1)
      expect(transactionState.checkpointCount).toBe(1)
    })

    test('commit should merge checkpoint to parent', () => {
      transactionState.checkpoint()
      transactionState.allAccountWritesStack[0].set(addressString1, account1.serialize())

      transactionState.checkpoint()
      transactionState.allAccountWritesStack[1].set(addressString2, account2.serialize())

      transactionState.commit()

      expect(transactionState.checkpointCount).toBe(1)
      expect(transactionState.allAccountWritesStack.length).toBe(1)
      expect(transactionState.allAccountWritesStack[0].has(addressString2)).toBe(true)
    })

    test('commit at checkpoint 0 should flush to committed values', () => {
      transactionState.checkpoint()
      transactionState.allAccountWritesStack[0].set(addressString1, account1.serialize())

      transactionState.commit()

      expect(transactionState.checkpointCount).toBe(0)
      expect(transactionState.committedAccountWrites.has(addressString1)).toBe(true)
    })

    test('revert should discard checkpoint changes', () => {
      // Add account1 before first checkpoint
      transactionState.putAccount(address1, account1)
      
      // First checkpoint - saves account1 to stack, clears allAccountWrites
      transactionState.checkpoint()
      
      // Add account2 after checkpoint
      transactionState.putAccount(address2, account2)
      
      // Second checkpoint - saves account2 to stack, clears allAccountWrites  
      transactionState.checkpoint()
      
      // Add another account after second checkpoint
      const address3 = new Address(Buffer.from('0xfedcba9876543210fedcba9876543210fedcba98'.slice(2), 'hex'))
      const account3 = new Account()
      account3.balance = BigInt(300)
      transactionState.putAccount(address3, account3)

      // Revert second checkpoint
      transactionState.revert('test revert')

      expect(transactionState.checkpointCount).toBe(1)
      expect(transactionState.allAccountWritesStack.length).toBe(1)
      // After revert, allAccountWrites should contain account2 from before the second checkpoint
      expect(transactionState.allAccountWrites.size).toBe(1)
      expect(transactionState.allAccountWrites.has(addressString2)).toBe(true)
      expect(transactionState.allContractStorageWrites.size).toBe(0)
    })

    test('should handle CheckpointRevertSupport flag', () => {
      ShardeumFlags.CheckpointRevertSupport = false

      transactionState.checkpoint()
      expect(transactionState.checkpointCount).toBe(0)

      transactionState.commit()
      expect(transactionState.checkpointCount).toBe(0)

      transactionState.revert('test revert')
      expect(transactionState.checkpointCount).toBe(0)

      ShardeumFlags.CheckpointRevertSupport = true
    })
  })

  describe('getReadAccounts', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should return all first read data', () => {
      transactionState.firstAccountReads.set(addressString1, account1.serialize())
      transactionState.firstContractStorageReads.set(addressString1, new Map([['key1', Buffer.from('value1')]]))
      transactionState.firstContractBytesReads.set('codeHash1', {
        contractByte: Buffer.from('code'),
        codeHash: Buffer.from('hash'),
        contractAddress: address1
      })

      const result = transactionState.getReadAccounts()

      expect(result.accounts).toBe(transactionState.firstAccountReads)
      expect(result.contractStorages).toBe(transactionState.firstContractStorageReads)
      expect(result.contractBytes).toBe(transactionState.firstContractBytesReads)
    })
  })

  describe('getWrittenAccounts', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should return committed writes and all contract data', () => {
      transactionState.committedAccountWrites.set(addressString1, account1.serialize())
      transactionState.allContractStorageWrites.set(addressString1, new Map())
      transactionState.allContractBytesWrites.set('hash1', {
        contractByte: Buffer.from('code'),
        codeHash: Buffer.from('hash'),
        contractAddress: address1
      })

      const result = transactionState.getWrittenAccounts()

      expect(result.accounts).toBe(transactionState.committedAccountWrites)
      expect(result.contractStorages).toBe(transactionState.allContractStorageWrites)
      expect(result.contractBytes).toBe(transactionState.allContractBytesWrites)
    })

    test('should use address-based contract bytes when fixContractBytes flag is set', () => {
      ShardeumFlags.fixContractBytes = true

      transactionState.allContractBytesWritesByAddress.set(addressString1, {
        contractByte: Buffer.from('code'),
        codeHash: Buffer.from('hash'),
        contractAddress: address1
      })

      const result = transactionState.getWrittenAccounts()

      expect(result.contractBytes).toBe(transactionState.allContractBytesWritesByAddress)

      ShardeumFlags.fixContractBytes = false
    })
  })

  describe('getTransferBlob', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should return first reads for transfer', () => {
      transactionState.firstAccountReads.set(addressString1, account1.serialize())
      transactionState.firstContractStorageReads.set(addressString1, new Map())

      const result = transactionState.getTransferBlob()

      expect(result.accounts).toBe(transactionState.firstAccountReads)
      expect(result.kvPairs).toBe(transactionState.firstContractStorageReads)
    })
  })

  describe('flushToCommittedValues', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should flatten one layer at a time', () => {
      const value1 = account1.serialize()
      const value2 = account2.serialize()

      transactionState.allAccountWritesStack.push(new Map([[addressString1, value1]]))
      transactionState.allAccountWritesStack.push(new Map([[addressString1, value2]]))

      transactionState.flushToCommittedValues()

      expect(transactionState.committedAccountWrites.has(addressString1)).toBe(true)
      expect(transactionState.allAccountWritesStack.length).toBe(1)
    })
  })

  describe('Edge cases and error handling', () => {
    beforeEach(() => {
      transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
    })

    test('should handle undefined callbacks gracefully', async () => {
      transactionState.accountInvolvedCB = undefined

      await expect(
        transactionState.getAccount(mockTrie, address1, false, false)
      ).rejects.toThrow()
    })

    test('should handle empty address in warm scenarios', () => {
      transactionState.insertFirstContractStorageReads(address1, '', Buffer.from(''))

      expect(transactionState.firstContractStorageReads.has(addressString1)).toBe(true)
    })

    test('should handle logging methods without errors', () => {
      const accountWrites = new Map([[addressString1, account1.serialize()]])
      
      const loggedWrites = transactionState.logAccountWrites(accountWrites)
      expect(loggedWrites.size).toBe(1)

      const stack = [accountWrites]
      const loggedStack = transactionState.logAccountWritesStack(stack)
      expect(loggedStack.length).toBe(1)
    })
  })
})