import { SafeBalance } from '../../../../src/utils/safeMath'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { MAX_INTEGER } from '@ethereumjs/util'

describe('SafeBalance', () => {
  const originalUnifiedAccountBalanceEnabled = ShardeumFlags.unifiedAccountBalanceEnabled

  beforeEach(() => {
    ShardeumFlags.unifiedAccountBalanceEnabled = true
  })

  afterEach(() => {
    ShardeumFlags.unifiedAccountBalanceEnabled = originalUnifiedAccountBalanceEnabled
  })

  describe('addBigintBalance', () => {
    it('should successfully add two positive bigint values', () => {
      const result = SafeBalance.addBigintBalance(BigInt(1000), BigInt(500))
      expect(result).toBe(BigInt(1500))
    })

    it('should successfully add zero to a value', () => {
      const result = SafeBalance.addBigintBalance(BigInt(1000), BigInt(0))
      expect(result).toBe(BigInt(1000))
    })

    it('should throw error when result overflows MAX_INTEGER', () => {
      expect(() => SafeBalance.addBigintBalance(MAX_INTEGER, BigInt(1))).toThrow('value overflow')
    })

    it('should throw error when result is less than either operand', () => {
      expect(() => SafeBalance.addBigintBalance(MAX_INTEGER - BigInt(1), BigInt(2))).toThrow('value overflow')
    })

    it('should not perform overflow checks when unifiedAccountBalanceEnabled is false', () => {
      ShardeumFlags.unifiedAccountBalanceEnabled = false
      const result = SafeBalance.addBigintBalance(MAX_INTEGER, BigInt(1))
      expect(result).toBe(MAX_INTEGER + BigInt(1))
    })

    // Additional edge cases and negative paths
    it('should throw overflow error when adding negative numbers', () => {
      expect(() => SafeBalance.addBigintBalance(BigInt(1000), BigInt(-500))).toThrow('value overflow')
    })

    it('should throw overflow error when adding to negative numbers', () => {
      expect(() => SafeBalance.addBigintBalance(BigInt(-1000), BigInt(500))).toThrow('value overflow')
    })

    it('should throw overflow error when adding two negative numbers', () => {
      expect(() => SafeBalance.addBigintBalance(BigInt(-1000), BigInt(-500))).toThrow('value overflow')
    })

    it('should handle edge case of adding to MAX_INTEGER', () => {
      expect(() => SafeBalance.addBigintBalance(MAX_INTEGER, BigInt(0))).not.toThrow()
      expect(() => SafeBalance.addBigintBalance(MAX_INTEGER, BigInt(-1))).toThrow('value overflow')
    })

    it("should handle very large numbers that don't overflow", () => {
      const largeNumber = MAX_INTEGER - BigInt(1000)
      const result = SafeBalance.addBigintBalance(largeNumber, BigInt(500))
      expect(result).toBe(largeNumber + BigInt(500))
    })
  })

  describe('subtractBigintBalance', () => {
    it('should successfully subtract a smaller value from a larger one', () => {
      const result = SafeBalance.subtractBigintBalance(BigInt(1000), BigInt(500))
      expect(result).toBe(BigInt(500))
    })

    it('should successfully subtract zero from a value', () => {
      const result = SafeBalance.subtractBigintBalance(BigInt(1000), BigInt(0))
      expect(result).toBe(BigInt(1000))
    })

    it('should throw error when subtracting a larger value', () => {
      expect(() => SafeBalance.subtractBigintBalance(BigInt(100), BigInt(200))).toThrow('value underflow')
    })

    it('should not perform underflow checks when unifiedAccountBalanceEnabled is false', () => {
      ShardeumFlags.unifiedAccountBalanceEnabled = false
      const result = SafeBalance.subtractBigintBalance(BigInt(100), BigInt(200))
      expect(result).toBe(BigInt(-100))
    })

    it('should successfully add when subtracting a negative number', () => {
      const result = SafeBalance.subtractBigintBalance(BigInt(1000), BigInt(-500))
      expect(result).toBe(BigInt(1500))
    })

    it('should throw underflow error when subtracting from negative numbers', () => {
      expect(() => SafeBalance.subtractBigintBalance(BigInt(-1000), BigInt(500))).toThrow('value underflow')
    })

    it('should throw underflow error when subtracting two negative numbers', () => {
      expect(() => SafeBalance.subtractBigintBalance(BigInt(-1000), BigInt(-500))).toThrow('value underflow')
    })

    it('should handle edge case of subtracting from MAX_INTEGER', () => {
      expect(() => SafeBalance.subtractBigintBalance(MAX_INTEGER, BigInt(0))).not.toThrow()
      expect(() => SafeBalance.subtractBigintBalance(MAX_INTEGER, BigInt(1))).not.toThrow()
    })

    it("should handle very large numbers that don't underflow", () => {
      const largeNumber = MAX_INTEGER - BigInt(1000)
      const result = SafeBalance.subtractBigintBalance(largeNumber, BigInt(500))
      expect(result).toBe(largeNumber - BigInt(500))
    })

    it('should handle edge case of subtracting MAX_INTEGER', () => {
      expect(() => SafeBalance.subtractBigintBalance(MAX_INTEGER, MAX_INTEGER)).not.toThrow()
      expect(() => SafeBalance.subtractBigintBalance(MAX_INTEGER - BigInt(1), MAX_INTEGER)).toThrow(
        'value underflow'
      )
    })
  })
})
