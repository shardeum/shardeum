import { Journal } from '../../../../src/evm_v2/journal'
import { Address, RIPEMD160_ADDRESS_STRING, toBytes } from '@ethereumjs/util'
import { Common, Hardfork } from '@ethereumjs/common'

// Mock dependencies
const mockAddress = (str: string) => {
  return {
    toString: () => str.startsWith('0x') ? str : '0x' + str,
    equals: (other: any) => false
  }
}

const stripHexPrefix = require('@ethereumjs/util').stripHexPrefix

jest.mock('@ethereumjs/util', () => {
  const actual = jest.requireActual('@ethereumjs/util')
  
  // Create Address class mock
  class MockAddress {
    private hex: string
    
    constructor(bytes: Uint8Array) {
      if (!bytes) {
        this.hex = '0x'
      } else {
        this.hex = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      }
    }
    
    toString() {
      return this.hex
    }
    
    equals(other: any) {
      return false
    }
  }
  
  return {
    ...actual,
    stripHexPrefix: actual.stripHexPrefix,
    bytesToUnprefixedHex: (bytes: Uint8Array) => {
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    },
    toBytes: (str: string) => {
      const hex = str.replace(/^0x/, '')
      const bytes = new Uint8Array(hex.length / 2)
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
      }
      return bytes
    },
    Address: MockAddress,
    RIPEMD160_ADDRESS_STRING: '0000000000000000000000000000000000000003'
  }
})

describe('Journal', () => {
  let journal: any // Use any to access private properties in tests
  let mockStateManager: any
  let mockCommon: any

  beforeEach(() => {
    // Mock state manager
    mockStateManager = {
      putAccount: jest.fn().mockResolvedValue(undefined),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
      getAccount: jest.fn().mockResolvedValue(undefined),
      checkpoint: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      revert: jest.fn().mockResolvedValue(undefined)
    }

    // Mock common
    mockCommon = {
      gteHardfork: jest.fn().mockReturnValue(true)
    }

    // Silence debug logs in tests
    process.env.DEBUG = ''
    
    journal = new Journal(mockStateManager, mockCommon)
  })

  describe('constructor', () => {
    it('should initialize with clean journal', () => {
      expect(journal.journal).toBeDefined()
      expect(journal.journal.size).toBe(0)
      expect(journal.touched.size).toBe(0)
      expect(journal.journalHeight).toBe(0)
    })

    it('should set DEBUG flag based on environment', () => {
      process.env.DEBUG = 'ethjs'
      const debugJournal = new Journal(mockStateManager, mockCommon) as any
      expect(debugJournal.DEBUG).toBe(true)
    })
  })

  describe('startReportingAccessList', () => {
    it('should initialize accessList map', () => {
      expect(journal.accessList).toBeUndefined()
      journal.startReportingAccessList()
      expect(journal.accessList).toBeInstanceOf(Map)
      expect(journal.accessList!.size).toBe(0)
    })
  })

  describe('putAccount', () => {
    it('should touch address and delegate to state manager', async () => {
      const address = new Address(toBytes('0x1234567890123456789012345678901234567890'))
      const account = {
        balance: BigInt(100),
        nonce: BigInt(1),
        codeHash: new Uint8Array(),
        storageRoot: new Uint8Array(),
        isEmpty: () => false,
        serialize: () => new Uint8Array(),
        raw: () => [],
        isContract: () => false,
        _validate: () => {}
      } as any
      
      await journal.putAccount(address, account)
      
      expect(mockStateManager.putAccount).toHaveBeenCalledWith(address, account)
      expect(journal.touched.has('1234567890123456789012345678901234567890')).toBe(true)
    })

    it('should handle undefined account', async () => {
      const address = new Address(toBytes('0x1234567890123456789012345678901234567890'))
      
      await journal.putAccount(address, undefined)
      
      expect(mockStateManager.putAccount).toHaveBeenCalledWith(address, undefined)
    })
  })

  describe('deleteAccount', () => {
    it('should touch address and delete from state manager', async () => {
      const address = new Address(toBytes('0x1234567890123456789012345678901234567890'))
      
      await journal.deleteAccount(address)
      
      expect(mockStateManager.deleteAccount).toHaveBeenCalledWith(address)
      expect(journal.touched.has('1234567890123456789012345678901234567890')).toBe(true)
    })
  })

  describe('checkpoint and commit', () => {
    it('should increase and decrease journal height appropriately', async () => {
      expect(journal.journalHeight).toBe(0)
      
      await journal.checkpoint()
      expect(journal.journalHeight).toBe(1)
      
      await journal.checkpoint()
      expect(journal.journalHeight).toBe(2)
      
      await journal.commit()
      expect(journal.journalHeight).toBe(1)
      
      await journal.commit()
      expect(journal.journalHeight).toBe(0)
    })

    it('should delegate to state manager', async () => {
      await journal.checkpoint()
      expect(mockStateManager.checkpoint).toHaveBeenCalled()
      
      await journal.commit()
      expect(mockStateManager.commit).toHaveBeenCalled()
    })

    it('should maintain journal diff history', async () => {
      await journal.checkpoint()
      expect(journal.journalDiff.length).toBe(2)
      
      await journal.commit()
      expect(journal.journalDiff.length).toBe(3)
    })
  })

  describe('revert', () => {
    it('should revert warm addresses', async () => {
      await journal.checkpoint()
      journal.addWarmedAddress(toBytes('0x1234'))
      expect(journal.isWarmedAddress(toBytes('0x1234'))).toBe(true)
      
      await journal.revert()
      expect(journal.isWarmedAddress(toBytes('0x1234'))).toBe(false)
    })

    it('should revert warm storage slots', async () => {
      await journal.checkpoint()
      const address = toBytes('0x1234')
      const slot = toBytes('0x5678')
      journal.addWarmedStorage(address, slot)
      expect(journal.isWarmedStorage(address, slot)).toBe(true)
      
      await journal.revert()
      expect(journal.isWarmedStorage(address, slot)).toBe(false)
    })

    it('should revert touched addresses except RIPEMD160', async () => {
      await journal.checkpoint()
      
      // Add regular touched address
      journal.touchAccount('1234567890123456789012345678901234567890')
      // Add RIPEMD160 address
      journal.touchAccount(RIPEMD160_ADDRESS_STRING)
      
      expect(journal.touched.has('1234567890123456789012345678901234567890')).toBe(true)
      expect(journal.touched.has(RIPEMD160_ADDRESS_STRING)).toBe(true)
      
      await journal.revert()
      
      expect(journal.touched.has('1234567890123456789012345678901234567890')).toBe(false)
      expect(journal.touched.has(RIPEMD160_ADDRESS_STRING)).toBe(true) // Should remain touched
    })

    it('should handle multiple checkpoint/revert cycles', async () => {
      // Add to base state
      journal.addWarmedAddress(toBytes('0x1111111111111111'))
      
      await journal.checkpoint()
      journal.addWarmedAddress(toBytes('0x2222222222222222'))
      
      await journal.revert()
      expect(journal.isWarmedAddress(toBytes('0x1111111111111111'))).toBe(true)
      expect(journal.isWarmedAddress(toBytes('0x2222222222222222'))).toBe(false)
    })

    it('should delegate to state manager', async () => {
      await journal.checkpoint()
      await journal.revert()
      expect(mockStateManager.revert).toHaveBeenCalled()
    })
  })

  describe('cleanJournal', () => {
    it('should reset all internal state', () => {
      // Add some data
      journal.addWarmedAddress(toBytes('0x1234'))
      journal.touchAccount('1234')
      journal.journalHeight = 5
      
      journal.cleanJournal()
      
      expect(journal.journalHeight).toBe(0)
      expect(journal.journal.size).toBe(0)
      expect(journal.touched.size).toBe(0)
      expect(journal.journalDiff.length).toBe(1)
      expect(journal.journalDiff[0]).toEqual([0, [new Set(), new Map(), new Set()]])
    })
  })

  describe('cleanup', () => {
    it('should delete empty accounts when Spurious Dragon or later', async () => {
      const emptyAccount = {
        isEmpty: () => true,
        balance: BigInt(0),
        nonce: BigInt(0),
        codeHash: new Uint8Array(),
        storageRoot: new Uint8Array()
      }
      mockStateManager.getAccount.mockResolvedValue(emptyAccount)
      
      journal.touchAccount('1234567890123456789012345678901234567890')
      
      await journal.cleanup()
      
      expect(mockStateManager.deleteAccount).toHaveBeenCalled()
    })

    it('should not delete non-empty accounts', async () => {
      const nonEmptyAccount = {
        isEmpty: () => false,
        balance: BigInt(100),
        nonce: BigInt(1),
        codeHash: new Uint8Array(),
        storageRoot: new Uint8Array()
      }
      mockStateManager.getAccount.mockResolvedValue(nonEmptyAccount)
      
      journal.touchAccount('1234567890123456789012345678901234567890')
      
      await journal.cleanup()
      
      expect(mockStateManager.deleteAccount).not.toHaveBeenCalled()
    })

    it('should skip cleanup before Spurious Dragon', async () => {
      mockCommon.gteHardfork.mockReturnValue(false)
      
      journal.touchAccount('1234567890123456789012345678901234567890')
      
      await journal.cleanup()
      
      expect(mockStateManager.getAccount).not.toHaveBeenCalled()
    })

    it('should clean journal and delete accessList', async () => {
      journal.startReportingAccessList()
      expect(journal.accessList).toBeDefined()
      
      await journal.cleanup()
      
      expect(journal.accessList).toBeUndefined()
      expect(journal.journal.size).toBe(0)
    })
  })

  describe('always warm addresses and slots', () => {
    it('should add always warm address', () => {
      journal.addAlwaysWarmAddress('0x1234')
      // stripHexPrefix is mocked to remove 0x prefix
      expect(journal.alwaysWarmJournal.has('1234')).toBe(true)
      expect(journal.alwaysWarmJournal.get('1234')).toBeInstanceOf(Set)
    })

    it('should add always warm address to access list when requested', () => {
      journal.startReportingAccessList()
      journal.addAlwaysWarmAddress('0x1234', true)
      
      // stripHexPrefix is mocked to remove 0x prefix
      expect(journal.accessList!.has('1234')).toBe(true)
    })

    it('should add always warm slot', () => {
      journal.addAlwaysWarmSlot('0x1234', '0x5678')
      
      // stripHexPrefix is mocked to remove 0x prefix
      expect(journal.alwaysWarmJournal.has('1234')).toBe(true)
      expect(journal.alwaysWarmJournal.get('1234')!.has('5678')).toBe(true)
    })

    it('should add always warm slot to access list when requested', () => {
      journal.startReportingAccessList()
      journal.addAlwaysWarmSlot('0x1234', '0x5678', true)
      
      // stripHexPrefix is mocked to remove 0x prefix  
      expect(journal.accessList!.has('1234')).toBe(true)
      expect(journal.accessList!.get('1234')!.has('5678')).toBe(true)
    })

    it('should consider always warm addresses as warm', () => {
      journal.addAlwaysWarmAddress('0x1234')
      // For short hex like '1234', our toBytes mock returns Uint8Array that bytesToUnprefixedHex converts to '1234'
      expect(journal.isWarmedAddress(toBytes('0x1234'))).toBe(true)
    })

    it('should consider always warm slots as warm', () => {
      journal.addAlwaysWarmSlot('0x1234', '0x5678')
      // For short hex like '1234' and '5678', they match after conversion
      expect(journal.isWarmedStorage(toBytes('0x1234'), toBytes('0x5678'))).toBe(true)
    })
  })

  describe('warmed addresses', () => {
    it('should add warmed address', () => {
      const address = toBytes('0x1234')
      journal.addWarmedAddress(address)
      
      expect(journal.isWarmedAddress(address)).toBe(true)
    })

    it('should track warm address in journal diff', () => {
      const address = toBytes('0x1234567890abcdef')
      journal.addWarmedAddress(address)
      
      const lastDiff = journal.journalDiff[journal.journalDiff.length - 1][1]
      // bytesToUnprefixedHex will return the full hex string
      expect(lastDiff[0].has('1234567890abcdef')).toBe(true)
    })

    it('should add to access list when reporting', () => {
      journal.startReportingAccessList()
      const address = toBytes('0x1234567890abcdef')
      journal.addWarmedAddress(address)
      
      // bytesToUnprefixedHex will return the full hex string
      expect(journal.accessList!.has('1234567890abcdef')).toBe(true)
    })

    it('should not add duplicate warm addresses', () => {
      const address = toBytes('0x1234')
      journal.addWarmedAddress(address)
      
      const sizeBefore = journal.journal.size
      journal.addWarmedAddress(address)
      
      expect(journal.journal.size).toBe(sizeBefore)
    })
  })

  describe('warmed storage', () => {
    it('should add warmed storage slot', () => {
      const address = toBytes('0x1234')
      const slot = toBytes('0x5678')
      journal.addWarmedStorage(address, slot)
      
      expect(journal.isWarmedStorage(address, slot)).toBe(true)
    })

    it('should auto-add address when adding storage', () => {
      const address = toBytes('0x1234')
      const slot = toBytes('0x5678')
      journal.addWarmedStorage(address, slot)
      
      expect(journal.isWarmedAddress(address)).toBe(true)
    })

    it('should track warm storage in journal diff', () => {
      const address = toBytes('0x1234567890abcdef')
      const slot = toBytes('0x567890abcdef1234')
      journal.addWarmedStorage(address, slot)
      
      const lastDiff = journal.journalDiff[journal.journalDiff.length - 1][1]
      expect(lastDiff[1].has('1234567890abcdef')).toBe(true)
      expect(lastDiff[1].get('1234567890abcdef')!.has('567890abcdef1234')).toBe(true)
    })

    it('should add to access list when reporting', () => {
      journal.startReportingAccessList()
      const address = toBytes('0x1234567890abcdef')
      const slot = toBytes('0x567890abcdef1234')
      journal.addWarmedStorage(address, slot)
      
      expect(journal.accessList!.has('1234567890abcdef')).toBe(true)
      expect(journal.accessList!.get('1234567890abcdef')!.has('567890abcdef1234')).toBe(true)
    })

    it('should handle multiple slots for same address', () => {
      const address = toBytes('0x1234')
      journal.addWarmedStorage(address, toBytes('0x5678'))
      journal.addWarmedStorage(address, toBytes('0x9abc'))
      
      expect(journal.isWarmedStorage(address, toBytes('0x5678'))).toBe(true)
      expect(journal.isWarmedStorage(address, toBytes('0x9abc'))).toBe(true)
    })

    it('should check always warm storage when regular storage not found', () => {
      journal.addAlwaysWarmSlot('0x1234567890abcdef', '0x567890abcdef1234')
      expect(journal.isWarmedStorage(toBytes('0x1234567890abcdef'), toBytes('0x567890abcdef1234'))).toBe(true)
    })
  })

  describe('touched accounts', () => {
    it('should track touched accounts', () => {
      journal.touchAccount('1234')
      expect(journal.touched.has('1234')).toBe(true)
    })

    it('should not add duplicate touched accounts', () => {
      journal.touchAccount('1234')
      const sizeBefore = journal.touched.size
      journal.touchAccount('1234')
      expect(journal.touched.size).toBe(sizeBefore)
    })

    it('should track in journal diff', () => {
      journal.touchAccount('1234')
      const lastDiff = journal.journalDiff[journal.journalDiff.length - 1][1]
      expect(lastDiff[2].has('1234')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle hex prefixes correctly', () => {
      journal.addWarmedAddress(toBytes('0xabcd'))
      journal.addWarmedAddress(toBytes('abcd'))
      // Both should resolve to same address
      expect(journal.journal.size).toBe(1)
    })

    it('should handle empty addresses and slots', () => {
      const emptyAddress = new Uint8Array(0)
      const emptySlot = new Uint8Array(0)
      
      journal.addWarmedStorage(emptyAddress, emptySlot)
      expect(journal.isWarmedStorage(emptyAddress, emptySlot)).toBe(true)
    })

    it('should handle very long addresses', () => {
      const longAddress = toBytes('0x' + '12'.repeat(40))
      journal.addWarmedAddress(longAddress)
      expect(journal.isWarmedAddress(longAddress)).toBe(true)
    })
  })
})