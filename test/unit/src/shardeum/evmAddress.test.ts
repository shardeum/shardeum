import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { AccountType } from '@shardeum-foundation/archiver/build/shardeum/calculateAccountHash'
import { InternalAccount, WrappedEVMAccount } from '../../../../src/shardeum/shardeumTypes'
import {
  getAccountShardusAddress,
  toShardusAddress,
  toShardusAddressWithKey,
} from '../../../../src/shardeum/evmAddress'

describe('evmAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the ShardeumFlags for each test
    ShardeumFlags.contractCodeKeySilo = false
    ShardeumFlags.contractStorageKeySilo = false
    ShardeumFlags.contractStoragePrefixBitLength = 0
    ShardeumFlags.VerboseLogs = false
  })

  describe('getAccountShardusAddress', () => {
    it('should handle WrappedEVMAccount with AccountType.Account', () => {
      const mockAccount = {
        ethAddress: '0x1234567890123456789012345678901234567890',
        accountType: AccountType.Account,
      } as WrappedEVMAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('1234567890123456789012345678901234567890000000000000000000000000')
    })

    it('should handle WrappedEVMAccount with AccountType.ContractStorage', () => {
      const mockAccount = {
        ethAddress: '0x1234567890123456789012345678901234567890',
        key: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        accountType: AccountType.ContractStorage,
      } as WrappedEVMAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should handle WrappedEVMAccount with AccountType.ContractCode', () => {
      const mockAccount = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        ethAddress: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        accountType: AccountType.ContractCode,
      } as WrappedEVMAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should handle WrappedEVMAccount with AccountType.Receipt', () => {
      const mockAccount = {
        ethAddress: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        accountType: AccountType.Receipt,
      } as WrappedEVMAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should handle WrappedEVMAccount with AccountType.NodeRewardReceipt', () => {
      const mockAccount = {
        ethAddress: '0x1234567890123456789012345678901234567890',
        accountType: AccountType.NodeRewardReceipt,
      } as WrappedEVMAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('0x1234567890123456789012345678901234567890')
    })

    it('should handle NetworkAccount', () => {
      const mockAccount = {
        id: 'network-account-id',
        accountType: AccountType.NetworkAccount,
      } as unknown as InternalAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('network-account-id')
    })

    it('should handle NodeAccount', () => {
      const mockAccount = {
        id: 'node-account-id',
        accountType: AccountType.NodeAccount,
      } as unknown as InternalAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('node-account-id')
    })

    it('should handle SecureAccount', () => {
      const mockAccount = {
        id: 'SECURE-ACCOUNT-ID',
        accountType: AccountType.SecureAccount,
      } as unknown as InternalAccount

      const result = getAccountShardusAddress(mockAccount)
      expect(result).toBe('secure-account-id')
    })
  })

  describe('toShardusAddressWithKey', () => {
    it('should handle AccountType.Account correctly', () => {
      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        'dummyKey',
        AccountType.Account
      )
      expect(result).toBe('1234567890123456789012345678901234567890000000000000000000000000')
    })

    it('should throw error for invalid Account address length', () => {
      expect(() => {
        toShardusAddressWithKey('0x12345', 'dummyKey', AccountType.Account)
      }).toThrow('must pass in a 42 character hex addressStr')
    })

    it('should handle Receipt type with 66-char address', () => {
      const result = toShardusAddressWithKey(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'dummyKey',
        AccountType.Receipt
      )
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should throw error for invalid Receipt address length', () => {
      expect(() => {
        toShardusAddressWithKey('0x12345', 'dummyKey', AccountType.Receipt)
      }).toThrow('must pass in a 64 character hex addressStr AccountType.Receipt')
    })

    it('should handle ContractCode with contractCodeKeySilo=true', () => {
      ShardeumFlags.contractCodeKeySilo = true
      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.ContractCode
      )
      expect(result).toContain('12345678')
    })

    it('should handle ContractStorage with contractStorageKeySilo=true and prefixBitLength=3', () => {
      ShardeumFlags.contractStorageKeySilo = true
      ShardeumFlags.contractStoragePrefixBitLength = 3

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.ContractStorage
      )

      // Check if the first character is correctly combined
      expect(result).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should handle ContractStorage with contractStorageKeySilo=true and variable prefixBitLength', () => {
      ShardeumFlags.contractStorageKeySilo = true
      ShardeumFlags.contractStoragePrefixBitLength = 8

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.ContractStorage
      )

      // Should have 2 hex chars from prefix (8 bits)
      expect(result.slice(0, 2)).toBe('12')
    })

    it('should handle ContractStorage with contractStorageKeySilo=false', () => {
      ShardeumFlags.contractStorageKeySilo = false

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.ContractStorage
      )

      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should handle NetworkAccount type', () => {
      const result = toShardusAddressWithKey('network-account-id', 'dummyKey', AccountType.NetworkAccount)
      expect(result).toBe('network-account-id')
    })

    it('should handle SecureAccount type', () => {
      const result = toShardusAddressWithKey('SECURE-ACCOUNT-ID', 'dummyKey', AccountType.SecureAccount)
      expect(result).toBe('secure-account-id')
    })

    it('should handle default case with 66-char address', () => {
      const result = toShardusAddressWithKey(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'dummyKey',
        AccountType.Debug
      )
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should handle default case with 64-char address', () => {
      const result = toShardusAddressWithKey(
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'dummyKey',
        AccountType.Debug
      )
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should throw error for invalid length in default case', () => {
      expect(() => {
        toShardusAddressWithKey('0x12345', 'dummyKey', AccountType.Debug)
      }).toThrow('must pass in a 66 character 32 byte address')
    })
    it('should throw error for invalid ContractCode address length', () => {
      ShardeumFlags.contractCodeKeySilo = true
      expect(() => {
        toShardusAddressWithKey(
          '0x123456', // Too short
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          AccountType.ContractCode
        )
      }).toThrow('must pass in a 42 character hex address for Account type ContractCode.')
    })

    // Test for ContractStorage with invalid address length
    it('should throw error for invalid ContractStorage address length', () => {
      ShardeumFlags.contractStorageKeySilo = true
      expect(() => {
        toShardusAddressWithKey(
          '0x123456', // Too short
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          AccountType.ContractStorage
        )
      }).toThrow('must pass in a 42 character hex address for Account type ContractStorage.')
    })

    // Test for ContractStorage with remainingBits > 0
    it('should handle ContractStorage with non-zero remaining bits', () => {
      ShardeumFlags.contractStorageKeySilo = true
      ShardeumFlags.contractStoragePrefixBitLength = 6 // 6 bits = 1 full hex char + 2 remaining bits

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.ContractStorage
      )

      // First hex char (4 bits) plus 2 bits from the second hex char should be from the address
      expect(result.charAt(0)).toBe('1')
      // Check format
      expect(result).toMatch(/^[0-9a-f]{64}$/)
    })

    // Test for ContractStorage with various prefixBitLength values
    it('should handle ContractStorage with 12-bit prefix', () => {
      ShardeumFlags.contractStorageKeySilo = true
      ShardeumFlags.contractStoragePrefixBitLength = 12 // 12 bits = 3 full hex chars

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.ContractStorage
      )

      // First 3 hex chars should be from the address
      expect(result.slice(0, 3)).toBe('123')
      expect(result).toMatch(/^[0-9a-f]{64}$/)
    })

    // Test for ContractStorage with 10-bit prefix (non-multiple of 4)
    it('should handle ContractStorage with 10-bit prefix (non-multiple of 4)', () => {
      ShardeumFlags.contractStorageKeySilo = true
      ShardeumFlags.contractStoragePrefixBitLength = 10 // 10 bits = 2 full hex chars + 2 remaining bits

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.ContractStorage
      )

      // First 2 hex chars should be from the address
      expect(result.slice(0, 2)).toBe('12')
      // Third character will be a combination
      expect(result).toMatch(/^[0-9a-f]{64}$/)
    })

    // Test for ContractCode/ContractStorage with 64-char secondaryAddressStr
    it('should handle ContractStorage with 64-char secondaryAddressStr', () => {
      ShardeumFlags.contractStorageKeySilo = false

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // 64 chars, no 0x
        AccountType.ContractStorage
      )

      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    // Test for ContractCode with 64-char secondaryAddressStr
    it('should handle ContractCode with 64-char secondaryAddressStr', () => {
      ShardeumFlags.contractCodeKeySilo = false

      const result = toShardusAddressWithKey(
        '0x1234567890123456789012345678901234567890',
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // 64 chars, no 0x
        AccountType.ContractCode
      )

      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    // Test for invalid secondaryAddressStr length with flags off
    it('should throw error for invalid secondaryAddressStr length with ContractStorage', () => {
      ShardeumFlags.contractStorageKeySilo = false

      expect(() => {
        toShardusAddressWithKey(
          '0x1234567890123456789012345678901234567890',
          '0x12345', // Too short
          AccountType.ContractStorage
        )
      }).toThrow('must pass in a 66 character 32 byte address for non Account types')
    })

    // Test for invalid secondaryAddressStr length with flags off for ContractCode
    it('should throw error for invalid secondaryAddressStr length with ContractCode', () => {
      ShardeumFlags.contractCodeKeySilo = false

      expect(() => {
        toShardusAddressWithKey(
          '0x1234567890123456789012345678901234567890',
          '0x12345', // Too short
          AccountType.ContractCode
        )
      }).toThrow('must pass in a 66 character 32 byte address for non Account types')
    })
  })

  describe('toShardusAddress', () => {
    it('should throw error for ContractStorage type', () => {
      expect(() => {
        toShardusAddress('0x1234567890123456789012345678901234567890', AccountType.ContractStorage)
      }).toThrow('toShardusAddress does not work anymore with type ContractStorage')
    })

    it('should throw error for ContractCode type', () => {
      expect(() => {
        toShardusAddress('0x1234567890123456789012345678901234567890', AccountType.ContractCode)
      }).toThrow('toShardusAddress does not work anymore with type ContractStorage')
    })

    it('should handle AccountType.Account correctly', () => {
      const result = toShardusAddress('0x1234567890123456789012345678901234567890', AccountType.Account)
      expect(result).toBe('1234567890123456789012345678901234567890000000000000000000000000')
    })

    it('should handle AccountType.Debug correctly', () => {
      const result = toShardusAddress('0x1234567890123456789012345678901234567890', AccountType.Debug)
      expect(result).toBe('1234567890123456789012345678901234567890000000000000000000000000')
    })

    it('should throw error for invalid Account address length', () => {
      expect(() => {
        toShardusAddress('0x12345', AccountType.Account)
      }).toThrow('must pass in a 42 character hex address for Account type of Account or Debug')
    })

    it('should handle SecureAccount with 64-char address', () => {
      const result = toShardusAddress(
        '1234567890123456789012345678901234567890123456789012345678901234',
        AccountType.SecureAccount
      )
      expect(result).toBe('1234567890123456789012345678901234567890123456789012345678901234')
    })

    it('should throw error for invalid SecureAccount address length', () => {
      expect(() => {
        toShardusAddress('0x12345', AccountType.SecureAccount)
      }).toThrow('must pass in a 64 character hex addressStr AccountType.Receipt')
    })

    it('should handle Receipt type with 66-char address', () => {
      const result = toShardusAddress(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.Receipt
      )
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should throw error for invalid Receipt address length', () => {
      expect(() => {
        toShardusAddress('0x12345', AccountType.Receipt)
      }).toThrow('must pass in a 64 character hex addressStr AccountType.Receipt')
    })

    it('should handle 64-char address for default case', () => {
      const result = toShardusAddress(
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.NodeAccount
      )
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should handle 66-char address for default case', () => {
      const result = toShardusAddress(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        AccountType.NodeAccount
      )
      expect(result).toBe('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
    })

    it('should throw error for invalid address length in default case', () => {
      expect(() => {
        toShardusAddress('0x12345', AccountType.NodeAccount)
      }).toThrow('must pass in a 66 character 32 byte address')
    })

    it('should log verbose information when VerboseLogs is true', () => {
      ShardeumFlags.VerboseLogs = true
      console.log = jest.fn()

      toShardusAddress('0x1234567890123456789012345678901234567890', AccountType.Account)

      expect(console.log).toHaveBeenCalledWith(
        'Running toShardusAddress',
        'string',
        '0x1234567890123456789012345678901234567890',
        AccountType.Account
      )
    })
  })
})
