import { describe, beforeEach, test, expect, jest } from '@jest/globals'
import { Account, Address, bytesToHex, bytesToBigInt, KECCAK256_NULL_S, KECCAK256_RLP_S } from '@ethereumjs/util'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import ShardeumState from '../../../../src/state/shardeumState'
import TransactionState from '../../../../src/state/transactionState'
import { Trie } from '@ethereumjs/trie'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { zeroAddressAccount, zeroAddressStr } from '../../../../src/utils'

// Mock dependencies
jest.mock('../../../../src/state/transactionState')
jest.mock('@ethereumjs/trie')
jest.mock('../../../../src/shardeum/shardeumFlags', () => ({
  ShardeumFlags: {
    VerboseLogs: false,
    debugTraceLogs: false
  }
}))
jest.mock('../../../../src/index', () => ({
  logFlags: {
    dapp_verbose: false
  }
}))

describe('ShardeumState', () => {
  let shardeumState: ShardeumState
  let mockTransactionState: jest.Mocked<TransactionState>
  let mockCommon: Common

  // Test addresses and accounts
  const address1 = new Address(Buffer.from('0x1234567890123456789012345678901234567890'.slice(2), 'hex'))
  const address2 = new Address(Buffer.from('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'.slice(2), 'hex'))
  const account1 = new Account()
  const account2 = new Account()

  beforeEach(() => {
    // Setup test accounts
    account1.balance = BigInt(100)
    account1.nonce = BigInt(1)
    account2.balance = BigInt(200)
    account2.nonce = BigInt(2)

    // Create mock common
    mockCommon = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Istanbul })

    // Create mock transaction state
    mockTransactionState = {
      getAccount: jest.fn(),
      putAccount: jest.fn(),
      getContractCode: jest.fn(),
      putContractCode: jest.fn(),
      getContractStorage: jest.fn(),
      putContractStorage: jest.fn(),
      checkpoint: jest.fn(),
      commit: jest.fn(),
      revert: jest.fn(),
      resetTransactionState: jest.fn(),
      linkedTX: 'tx123'
    } as any

    // Create shardeum state instance
    shardeumState = new ShardeumState({ common: mockCommon })
  })

  describe('constructor', () => {
    test('should initialize with default common if not provided', () => {
      const state = new ShardeumState()
      expect(state.common).toBeDefined()
      expect(state.common.chainName()).toBe('mainnet')
    })

    test('should initialize with provided common', () => {
      const customCommon = new Common({ chain: Chain.Goerli, hardfork: Hardfork.Berlin })
      const state = new ShardeumState({ common: customCommon })
      expect(state.common).toBe(customCommon)
    })

    test('should initialize internal state correctly', () => {
      expect(shardeumState.usedByApply).toBe(false)
      expect(shardeumState._touched).toBeInstanceOf(Set)
      expect(shardeumState._touchedStack).toEqual([])
      expect(shardeumState._accessedStorage).toHaveLength(1)
      expect(shardeumState._accessedStorageReverted).toHaveLength(1)
    })
  })

  describe('setTransactionState and unsetTransactionState', () => {
    test('should set transaction state', () => {
      shardeumState.setTransactionState(mockTransactionState)
      expect(shardeumState._transactionState).toBe(mockTransactionState)
    })

    test('should unset transaction state with matching txId', () => {
      shardeumState.setTransactionState(mockTransactionState)
      shardeumState.unsetTransactionState('tx123')
      expect(shardeumState._transactionState).toBeNull()
    })

    test('should not unset transaction state with non-matching txId', () => {
      shardeumState.setTransactionState(mockTransactionState)
      shardeumState.unsetTransactionState('different-tx')
      expect(shardeumState._transactionState).toBe(null)
    })

    test('should handle setting transaction state when one already exists', () => {
      const existingState = { linkedTX: 'existing-tx' } as any
      shardeumState._transactionState = existingState
      
      shardeumState.setTransactionState(mockTransactionState)
      expect(shardeumState._transactionState).toBe(mockTransactionState)
    })
  })

  describe('resetState', () => {
    test('should reset transaction state', () => {
      shardeumState.setTransactionState(mockTransactionState)
      shardeumState.resetState()
      expect(mockTransactionState.resetTransactionState).toHaveBeenCalled()
    })
  })

  describe('copy', () => {
    test('should create a new instance with same common', () => {
      const copy = shardeumState.copy()
      expect(copy).toBeInstanceOf(ShardeumState)
      expect((copy as any).common).toBe(shardeumState.common)
      expect(copy).not.toBe(shardeumState)
    })
  })

  describe('getAccount', () => {
    beforeEach(() => {
      shardeumState.setTransactionState(mockTransactionState)
    })

    test('should get account from transaction state', async () => {
      mockTransactionState.getAccount.mockResolvedValue(account1)

      const result = await shardeumState.getAccount(address1)

      expect(result).toBe(account1)
      expect(mockTransactionState.getAccount).toHaveBeenCalledWith(null, address1, false, false)
    })

    test('should return undefined if no transaction state', async () => {
      shardeumState._transactionState = null

      const result = await shardeumState.getAccount(address1)

      expect(result).toBeUndefined()
    })
  })

  describe('putAccount', () => {
    beforeEach(() => {
      shardeumState.setTransactionState(mockTransactionState)
    })

    test('should put account to transaction state', async () => {
      await shardeumState.putAccount(address1, account1)

      expect(mockTransactionState.putAccount).toHaveBeenCalledWith(address1, account1)
    })

    test('should do nothing if no transaction state', async () => {
      shardeumState._transactionState = null

      await shardeumState.putAccount(address1, account1)

      expect(mockTransactionState.putAccount).not.toHaveBeenCalled()
    })
  })

  describe('deleteAccount', () => {
    test('should return early (not implemented)', async () => {
      await expect(shardeumState.deleteAccount(address1)).resolves.toBeUndefined()
    })
  })

  describe('touchAccount', () => {
    test('should add address to touched set', () => {
      shardeumState.touchAccount(address1)
      expect(shardeumState._touched.has(bytesToHex(address1.bytes))).toBe(true)
    })

    test('should handle multiple touches', () => {
      shardeumState.touchAccount(address1)
      shardeumState.touchAccount(address2)
      expect(shardeumState._touched.size).toBe(2)
    })
  })

  describe('Contract code operations', () => {
    beforeEach(() => {
      shardeumState.setTransactionState(mockTransactionState)
    })

    test('putContractCode should delegate to transaction state', async () => {
      const code = Buffer.from('0x608060405260', 'hex')
      
      await shardeumState.putContractCode(address1, code)

      expect(mockTransactionState.putContractCode).toHaveBeenCalledWith(address1, code)
    })

    test('getContractCode should delegate to transaction state', async () => {
      const code = Buffer.from('0x608060405260', 'hex')
      mockTransactionState.getContractCode.mockResolvedValue(code)

      const result = await shardeumState.getContractCode(address1)

      expect(result).toBe(code)
      expect(mockTransactionState.getContractCode).toHaveBeenCalledWith(null, address1, false, false)
    })

    test('getContractCode should return undefined if no transaction state', async () => {
      shardeumState._transactionState = null

      const result = await shardeumState.getContractCode(address1)

      expect(result).toBeUndefined()
    })
  })

  describe('Contract storage operations', () => {
    const key = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
    const value = Buffer.from('1234', 'hex')

    beforeEach(() => {
      shardeumState.setTransactionState(mockTransactionState)
    })

    test('getContractStorage should delegate to transaction state', async () => {
      mockTransactionState.getContractStorage.mockResolvedValue(value)

      const result = await shardeumState.getContractStorage(address1, key)

      expect(result).toBe(value)
      expect(mockTransactionState.getContractStorage).toHaveBeenCalledWith(null, address1, key, false, false)
    })

    test('getOriginalContractStorage should get original value', async () => {
      mockTransactionState.getContractStorage.mockResolvedValue(value)

      const result = await shardeumState.getOriginalContractStorage(address1, key)

      expect(result).toBe(value)
      expect(mockTransactionState.getContractStorage).toHaveBeenCalledWith(null, address1, key, true, false)
    })

    test('putContractStorage should validate key length', async () => {
      const shortKey = Buffer.from('0x01', 'hex')

      await expect(shardeumState.putContractStorage(address1, shortKey, value)).rejects.toThrow(
        'Storage key must be 32 bytes long'
      )
    })

    test('putContractStorage should validate value length', async () => {
      const longValue = Buffer.alloc(33)

      await expect(shardeumState.putContractStorage(address1, key, longValue)).rejects.toThrow(
        'Storage value cannot be longer than 32 bytes'
      )
    })

    test('putContractStorage should delegate to transaction state', async () => {
      await shardeumState.putContractStorage(address1, key, value)

      expect(mockTransactionState.putContractStorage).toHaveBeenCalledWith(address1, key, value)
    })

    test('clearContractStorage should be a no-op', async () => {
      await expect(shardeumState.clearContractStorage()).resolves.toBeUndefined()
    })
  })

  describe('Checkpoint operations', () => {
    beforeEach(() => {
      shardeumState.setTransactionState(mockTransactionState)
    })

    test('checkpoint should save touched accounts and delegate to transaction state', async () => {
      shardeumState.touchAccount(address1)
      shardeumState.touchAccount(address2)

      await shardeumState.checkpoint()

      expect(shardeumState._touchedStack).toHaveLength(1)
      expect(shardeumState._touchedStack[0].size).toBe(2)
      expect(mockTransactionState.checkpoint).toHaveBeenCalled()
    })

    test('commit should restore touched accounts and delegate to transaction state', async () => {
      shardeumState._touchedStack.push(new Set([bytesToHex(address1.bytes)]))

      await shardeumState.commit()

      expect(shardeumState._touchedStack).toHaveLength(0)
      expect(mockTransactionState.commit).toHaveBeenCalled()
    })

    test('revert should delegate to transaction state', async () => {
      await shardeumState.revert()

      expect(mockTransactionState.revert).toHaveBeenCalled()
    })
  })

  describe('State root operations', () => {
    test('getStateRoot should return empty buffer', async () => {
      const result = await shardeumState.getStateRoot()
      expect(result).toEqual(Buffer.from([]))
    })

    test('setStateRoot should be a no-op', async () => {
      await expect(shardeumState.setStateRoot()).resolves.toBeUndefined()
    })
  })

  describe('Storage dump operations', () => {
    test('dumpStorage should return message about disabled feature', async () => {
      const result = await shardeumState.dumpStorage()
      expect(result).toEqual({ result: 'no storage when SaveEVMTries === false' })
    })

    test('dumpStorageRange should validate limit parameter', async () => {
      await expect(shardeumState.dumpStorageRange(address1, BigInt(0), -1)).rejects.toThrow(
        'Limit is not a proper uint'
      )

      await expect(shardeumState.dumpStorageRange(address1, BigInt(0), 1.5)).rejects.toThrow(
        'Limit is not a proper uint'
      )
    })

    test('flush should throw error', async () => {
      await expect(shardeumState.flush()).rejects.toThrow('flush is not valid for ShardeumState')
    })
  })

  describe('getProof', () => {
    test('should return proof for non-existent account', async () => {
      shardeumState._trie = {
        createProof: jest.fn(() => Promise.resolve([Buffer.from('proof1'), Buffer.from('proof2')]))
      } as any

      shardeumState.setTransactionState(mockTransactionState)
      mockTransactionState.getAccount.mockResolvedValue(null as any)

      const result = await shardeumState.getProof(address1)

      expect(result.address).toBe(address1.toString())
      expect(result.balance).toBe('0x')
      expect(result.codeHash).toBe(KECCAK256_NULL_S)
      expect(result.nonce).toBe('0x')
      expect(result.storageHash).toBe(KECCAK256_RLP_S)
      expect(result.accountProof).toHaveLength(2)
      expect(result.storageProof).toEqual([])
    })

    test('should return proof for existing account with storage slots', async () => {
      const storageKey = Buffer.from('01', 'hex')
      const storageValue = Buffer.from('', 'hex')

      shardeumState._trie = {
        createProof: jest.fn(() => Promise.resolve([Buffer.from('accountProof')]))
      } as any

      const mockStorageTrie = {
        createProof: jest.fn(() => Promise.resolve([Buffer.from('storageProof')]))
      }

      shardeumState._getStorageTrie = jest.fn(() => Promise.resolve(mockStorageTrie)) as any
      shardeumState.setTransactionState(mockTransactionState)
      
      mockTransactionState.getAccount.mockResolvedValue(account1)
      mockTransactionState.getContractStorage.mockResolvedValue(storageValue)

      const result = await shardeumState.getProof(address1, [storageKey])

      expect(result.address).toBe(address1.toString())
      expect(result.balance).toBe('0x64') // 100 in hex
      expect(result.nonce).toBe('0x1')
      expect(result.storageProof).toHaveLength(1)
      expect(result.storageProof[0].key).toBe(bytesToHex(storageKey))
      expect(result.storageProof[0].value).toBe('0x0')
      expect(result.accountProof).toHaveLength(1)
      expect(result.storageHash).toBe(bytesToHex(account1.storageRoot))
      expect(result.codeHash).toBe(bytesToHex(account1.codeHash))
    })
  })

  describe('Account existence and emptiness checks', () => {
    beforeEach(() => {
      shardeumState.setTransactionState(mockTransactionState)
    })

    test('accountIsEmpty should return true for null account', async () => {
      mockTransactionState.getAccount.mockResolvedValue(null)

      const result = await shardeumState.accountIsEmpty(address1)

      expect(result).toBe(true)
    })

    test('accountIsEmpty should return true for empty account', async () => {
      const emptyAccount = new Account()
      mockTransactionState.getAccount.mockResolvedValue(emptyAccount)

      const result = await shardeumState.accountIsEmpty(address1)

      expect(result).toBe(true)
    })

    test('accountIsEmpty should return false for non-empty account', async () => {
      mockTransactionState.getAccount.mockResolvedValue(account1)

      const result = await shardeumState.accountIsEmpty(address1)

      expect(result).toBe(false)
    })

    test('accountExists should return true for existing account', async () => {
      mockTransactionState.getAccount.mockResolvedValue(account1)

      const result = await shardeumState.accountExists(address1)

      expect(result).toBe(true)
    })

    test('accountExists should return false for null account', async () => {
      mockTransactionState.getAccount.mockResolvedValue(null)

      const result = await shardeumState.accountExists(address1)

      expect(result).toBe(false)
    })
  })

  describe('EIP-2929 warm account tracking', () => {
    const addressBuffer = Buffer.from(address1.bytes)
    const slot = Buffer.from('0x01', 'hex')

    test('isWarmedAddress should return false for cold address', () => {
      const result = shardeumState.isWarmedAddress(addressBuffer)
      expect(result).toBe(false)
    })

    test('isWarmedAddress should return true for warm address', () => {
      shardeumState.addWarmedAddress(addressBuffer)
      const result = shardeumState.isWarmedAddress(addressBuffer)
      expect(result).toBe(true)
    })

    test('addWarmedAddress should add address to current context', () => {
      shardeumState.addWarmedAddress(addressBuffer)
      
      const currentMap = shardeumState._accessedStorage[shardeumState._accessedStorage.length - 1]
      expect(currentMap.has(addressBuffer.toString())).toBe(true)
    })

    test('isWarmedStorage should return false for cold storage', () => {
      const result = shardeumState.isWarmedStorage(addressBuffer, slot)
      expect(result).toBe(false)
    })

    test('isWarmedStorage should return true for warm storage', () => {
      shardeumState.addWarmedStorage(addressBuffer, slot)
      const result = shardeumState.isWarmedStorage(addressBuffer, slot)
      expect(result).toBe(true)
    })

    test('addWarmedStorage should add storage slot to address', () => {
      shardeumState.addWarmedStorage(addressBuffer, slot)
      
      const currentMap = shardeumState._accessedStorage[shardeumState._accessedStorage.length - 1]
      const storageSet = currentMap.get(addressBuffer.toString())
      expect(storageSet).toBeDefined()
      expect(storageSet!.has(slot.toString())).toBe(true)
    })

    test('clearWarmedAccounts should reset tracking', () => {
      shardeumState.addWarmedAddress(addressBuffer)
      shardeumState.addWarmedStorage(addressBuffer, slot)
      
      shardeumState.clearWarmedAccounts()
      
      expect(shardeumState.isWarmedAddress(addressBuffer)).toBe(false)
      expect(shardeumState.isWarmedStorage(addressBuffer, slot)).toBe(false)
    })

    test('should track warm addresses across multiple contexts', () => {
      // Add to first context
      shardeumState.addWarmedAddress(addressBuffer)
      
      // Add new context
      shardeumState._accessedStorage.push(new Map())
      
      // Should still be warm from previous context
      expect(shardeumState.isWarmedAddress(addressBuffer)).toBe(true)
    })
  })

  describe('cleanupTouchedAccounts', () => {
    test('should clear touched accounts', async () => {
      shardeumState.touchAccount(address1)
      shardeumState.touchAccount(address2)
      
      await shardeumState.cleanupTouchedAccounts()
      
      expect(shardeumState._touched.size).toBe(0)
    })
  })

  describe('clearOriginalStorageCache', () => {
    test('should call internal clear method', () => {
      shardeumState._clearOriginalStorageCache = jest.fn()
      shardeumState.clearOriginalStorageCache()
      expect(shardeumState._clearOriginalStorageCache).toHaveBeenCalled()
    })
  })

  describe('modifyAccountFields', () => {
    beforeEach(() => {
      shardeumState.setTransactionState(mockTransactionState)
    })

    test('should create new account if not exists', async () => {
      mockTransactionState.getAccount.mockResolvedValue(null)

      await shardeumState.modifyAccountFields(address1, {
        nonce: BigInt(10),
        balance: BigInt(1000)
      })

      expect(mockTransactionState.putAccount).toHaveBeenCalledWith(
        address1,
        expect.objectContaining({
          nonce: BigInt(10),
          balance: BigInt(1000)
        })
      )
    })

    test('should modify existing account fields', async () => {
      mockTransactionState.getAccount.mockResolvedValue(account1)

      await shardeumState.modifyAccountFields(address1, {
        balance: BigInt(500)
      })

      expect(mockTransactionState.putAccount).toHaveBeenCalledWith(
        address1,
        expect.objectContaining({
          nonce: account1.nonce, // unchanged
          balance: BigInt(500) // changed
        })
      )
    })
  })

  describe('hasStateRoot', () => {
    test('should always return false', async () => {
      const result = await shardeumState.hasStateRoot(Buffer.from('root'))
      expect(result).toBe(false)
    })
  })

  describe('shallowCopy', () => {
    test('should return self', () => {
      const result = shardeumState.shallowCopy()
      expect(result).toBe(shardeumState)
    })
  })

  describe('Unsupported operations', () => {
    test('hasGenesisState should throw error', async () => {
      await expect(shardeumState.hasGenesisState()).rejects.toThrow(
        'hasGenesisState not valid because we dont run an ethjs blockchain'
      )
    })

    test('generateCanonicalGenesis should throw error', async () => {
      await expect(shardeumState.generateCanonicalGenesis()).rejects.toThrow(
        'generateCanonicalGenesis not valid because we dont run an ethjs blockchain'
      )
    })

    test('generateGenesis should throw error', async () => {
      await expect(shardeumState.generateGenesis()).rejects.toThrow(
        'generateGenesis not valid because we dont run an ethjs blockchain'
      )
    })

    test('_lookupStorageTrie should throw error', async () => {
      await expect(shardeumState._lookupStorageTrie(address1)).rejects.toThrow(
        '_lookupStorageTrie not impl'
      )
    })

    test('_getStorageTrie should throw error', async () => {
      await expect(shardeumState._getStorageTrie(address1, account1)).rejects.toThrow(
        '_getStorageTrie not valid for ShardeumState'
      )
    })
  })
})