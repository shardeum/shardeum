import { MAX_INTEGER } from '@ethereumjs/util'
import { ShardeumFlags } from '../../src/shardeum/shardeumFlags'
import { SafeBalance } from '../../src/utils/safeMath'

describe('SafeBalance', () => {
  beforeEach(() => {
    ShardeumFlags.unifiedAccountBalanceEnabled = false
  })

  describe('addBigintBalance', () => {
    it('should add balances correctly when unifiedAccountBalanceEnabled is false, and addition is valid', () => {
      const result = SafeBalance.addBigintBalance(BigInt(10), BigInt(5))
      expect(result).toBe(BigInt(15))
    })

    it('should throw an error for value overflow when unifiedAccountBalanceEnabled is true', () => {
      ShardeumFlags.unifiedAccountBalanceEnabled = true
      expect(() => {
        SafeBalance.addBigintBalance(MAX_INTEGER, BigInt(1))
      }).toThrow('value overflow')
    })

    it('should add balances correctly when no overflow occurs and unifiedAccountBalanceEnabled is true', () => {
      ShardeumFlags.unifiedAccountBalanceEnabled = true
      const result = SafeBalance.addBigintBalance(BigInt(10), BigInt(5))
      expect(result).toBe(BigInt(15))
    })
  })

  describe('subtractBigintBalance', () => {
    it('should subtract balances correctly when unifiedAccountBalanceEnabled is false, and no underflow occurs', () => {
      const result = SafeBalance.subtractBigintBalance(BigInt(10), BigInt(5))
      expect(result).toBe(BigInt(5))
    })

    it('should throw an error for value underflow when unifiedAccountBalanceEnabled is true', () => {
      ShardeumFlags.unifiedAccountBalanceEnabled = true
      expect(() => {
        SafeBalance.subtractBigintBalance(BigInt(5), BigInt(10))
      }).toThrow('value underflow')
    })

    it('should subtract balances correctly when no underflow occurs and unifiedAccountBalanceEnabled is true', () => {
      ShardeumFlags.unifiedAccountBalanceEnabled = true
      const result = SafeBalance.subtractBigintBalance(BigInt(10), BigInt(5))
      expect(result).toBe(BigInt(5))
    })
  })
})
