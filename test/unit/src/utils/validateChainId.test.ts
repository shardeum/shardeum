import { validateTxChainId } from '../../../../src/utils/validateChainId'
import { expect, describe, test } from '@jest/globals'

describe('Chain ID Validation', () => {
  describe('validateTxChainId with no expected chain ID', () => {
    test('should return true for valid chain IDs', () => {
      expect(validateTxChainId('0x1')).toBe(true) // Ethereum Mainnet
      expect(validateTxChainId('0x38')).toBe(true) // BSC
      expect(validateTxChainId('0x89')).toBe(true) // Polygon
      expect(validateTxChainId('0x1f92')).toBe(true) // Shardeum (8082)
      expect(validateTxChainId('0xa')).toBe(true) // Optimism (10)
      expect(validateTxChainId('0xa4b1')).toBe(true) // Arbitrum (42161)
      expect(validateTxChainId('0xA4B1')).toBe(true) // Uppercase hex is also valid
    })

    test('should return false for non-hex string formats', () => {
      expect(validateTxChainId(1)).toBe(false) // Number is not allowed
      expect(validateTxChainId('1')).toBe(false) // Decimal string is not allowed
      expect(validateTxChainId(BigInt(1))).toBe(false) // BigInt is not allowed
      expect(validateTxChainId('8082')).toBe(false) // Decimal string not allowed
    })

    test('should return false for undefined or null', () => {
      expect(validateTxChainId(undefined)).toBe(false)
      expect(validateTxChainId(null)).toBe(false)
    })

    test('should return false for invalid hex strings', () => {
      expect(validateTxChainId('mainnet')).toBe(false)
      expect(validateTxChainId('chain-1')).toBe(false)
      expect(validateTxChainId('1a')).toBe(false)
      expect(validateTxChainId('0xZ')).toBe(false) // Invalid hex
      expect(validateTxChainId('0x')).toBe(false) // Incomplete hex
      expect(validateTxChainId('0x0g')).toBe(false) // Invalid hex character
    })

    test('should return false for zero or negative numbers', () => {
      expect(validateTxChainId('0x0')).toBe(false) // Hex zero
      expect(validateTxChainId('-0x1')).toBe(false) // Invalid negative hex
    })

    test('should return false for excessively large numbers', () => {
      expect(validateTxChainId('0x' + 'f'.repeat(64))).toBe(false) // Very large hex
      expect(validateTxChainId('0x80000000')).toBe(false) // Just over 2^31 (2147483648)
    })

    test('should return false for objects, arrays, and other non-string values', () => {
      expect(validateTxChainId({})).toBe(false)
      expect(validateTxChainId([])).toBe(false)
      expect(validateTxChainId(() => {})).toBe(false)
      expect(validateTxChainId(true)).toBe(false)
    })
  })

  describe('validateTxChainId with expected chain ID', () => {
    test('should validate matching chain IDs', () => {
      expect(validateTxChainId('0x1', 1)).toBe(true) // Hex string matching decimal
      expect(validateTxChainId('0x1f92', 8082)).toBe(true) // Hex Shardeum matching decimal
      expect(validateTxChainId('0x89', 137)).toBe(true) // Hex Polygon matching decimal
      expect(validateTxChainId('0x38', 56)).toBe(true) // Hex BSC matching decimal
    })

    test('should reject non-matching chain IDs', () => {
      expect(validateTxChainId('0x1', 56)).toBe(false)
      expect(validateTxChainId('0x89', 56)).toBe(false) // Hex Polygon not matching BSC
    })

    test('should reject invalid expected chainId', () => {
      expect(validateTxChainId('0x1', 0)).toBe(false)
      expect(validateTxChainId('0x1', -1)).toBe(false)
      expect(validateTxChainId('0x1', NaN)).toBe(false)
    })

    test('should reject invalid given chainId', () => {
      expect(validateTxChainId('invalid', 1)).toBe(false)
      expect(validateTxChainId('0x0', 1)).toBe(false) // Hex zero
      expect(validateTxChainId(undefined, 1)).toBe(false)
      expect(validateTxChainId(null, 1)).toBe(false)
    })

    test('should handle edge cases', () => {
      // Both invalid
      expect(validateTxChainId(null, 0)).toBe(false)
      expect(validateTxChainId('invalid', -1)).toBe(false)
      
      // Special cases
      expect(validateTxChainId('0x1', 1)).toBe(true) // 0x1 = 1
      expect(validateTxChainId('0x10', 16)).toBe(true) // 0x10 = 16
    })
  })
}) 