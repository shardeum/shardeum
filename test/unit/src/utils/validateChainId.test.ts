import { validateTxChainId } from '../../../../src/utils/validateChainId'
import { expect, describe, test } from '@jest/globals'

describe('Chain ID Validation', () => {
  // Use a default test chain ID
  const testChainId = 8082

  describe('validateTxChainId with expected chain ID', () => {
    test('should validate matching chain IDs', () => {
      expect(validateTxChainId('0x1', 1)).toBe(true) // Ethereum Mainnet
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

    test('should reject undefined or null expected chainId', () => {
      // @ts-ignore - TypeScript will complain about these calls, but we want to test the runtime behavior
      expect(validateTxChainId('0x1', undefined)).toBe(false)
      // @ts-ignore
      expect(validateTxChainId('0x1', null)).toBe(false)
    })

    test('should reject invalid given chainId formats', () => {
      expect(validateTxChainId(1, testChainId)).toBe(false) // Number is not allowed
      expect(validateTxChainId('1', testChainId)).toBe(false) // Decimal string is not allowed
      expect(validateTxChainId(BigInt(1), testChainId)).toBe(false) // BigInt is not allowed
      expect(validateTxChainId('8082', testChainId)).toBe(false) // Decimal string not allowed
    })

    test('should reject undefined or null given chainId', () => {
      expect(validateTxChainId(undefined, testChainId)).toBe(false)
      expect(validateTxChainId(null, testChainId)).toBe(false)
    })

    test('should reject invalid hex strings', () => {
      expect(validateTxChainId('mainnet', testChainId)).toBe(false)
      expect(validateTxChainId('chain-1', testChainId)).toBe(false)
      expect(validateTxChainId('1a', testChainId)).toBe(false)
      expect(validateTxChainId('0xZ', testChainId)).toBe(false) // Invalid hex
      expect(validateTxChainId('0x', testChainId)).toBe(false) // Incomplete hex
      expect(validateTxChainId('0x0g', testChainId)).toBe(false) // Invalid hex character
    })

    test('should reject zero or negative chainId values', () => {
      expect(validateTxChainId('0x0', testChainId)).toBe(false) // Hex zero
      expect(validateTxChainId('-0x1', testChainId)).toBe(false) // Invalid negative hex
    })

    test('should reject excessively large numbers', () => {
      expect(validateTxChainId('0x' + 'f'.repeat(64), testChainId)).toBe(false) // Very large hex
      expect(validateTxChainId('0x80000000', testChainId)).toBe(false) // Just over 2^31 (2147483648)
    })

    test('should reject objects, arrays, and other non-string values', () => {
      expect(validateTxChainId({}, testChainId)).toBe(false)
      expect(validateTxChainId([], testChainId)).toBe(false)
      expect(validateTxChainId(() => {}, testChainId)).toBe(false)
      expect(validateTxChainId(true, testChainId)).toBe(false)
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