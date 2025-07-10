import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { getPenaltyForViolation } from '../../../../../src/tx/penalty/violation'
import { PenaltyTX, ViolationType } from '../../../../../src/shardeum/shardeumTypes'

// Mock the entire module before importing
jest.mock('../../../../../src/utils')
jest.mock('../../../../../src/storage/accountStorage', () => ({
  cachedNetworkAccount: {
    current: {
      slashing: {
        leftNetworkEarlyPenaltyPercent: 0.2,
        nodeRefutedPenaltyPercent: 0.2,
        syncTimeoutPenaltyPercent: 0.2
      }
    }
  }
}))
jest.mock('@shardeum-foundation/core')
jest.mock('../../../../../src', () => ({
  logFlags: {
    dapp_verbose: false
  }
}))

// Import mocked modules
import * as utils from '../../../../../src/utils'
import { cachedNetworkAccount } from '../../../../../src/storage/accountStorage'
import { nestedCountersInstance } from '@shardeum-foundation/core'
import { logFlags } from '../../../../../src'

// Type the mocks
const mockedUtils = utils as jest.Mocked<typeof utils>
const mockedNestedCounters = nestedCountersInstance as jest.Mocked<typeof nestedCountersInstance>

describe('getPenaltyForViolation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default mock implementations
    ;(mockedUtils._base16BNParser as any) = jest.fn((value: any) => {
      if (typeof value === 'bigint') return value
      if (typeof value === 'string') return BigInt(value)
      if (typeof value === 'number') return BigInt(value)
      return BigInt(0)
    })

    mockedNestedCounters.countEvent = jest.fn()
  })

  describe('with valid inputs', () => {
    it('should calculate penalty for LeftNetworkEarly violation', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.LeftNetworkEarly
      } as PenaltyTX
      
      const stakeLock = BigInt('1000000000000000000') // 1 ETH in wei
      const result = getPenaltyForViolation(tx, stakeLock)
      
      // 20% of 1 ETH = 0.2 ETH
      expect(result).toBe(BigInt('200000000000000000'))
    })

    it('should calculate penalty for NodeRefuted violation', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.NodeRefuted
      } as PenaltyTX
      
      const stakeLock = BigInt('5000000000000000000') // 5 ETH
      const result = getPenaltyForViolation(tx, stakeLock)
      
      // 20% of 5 ETH = 1 ETH
      expect(result).toBe(BigInt('1000000000000000000'))
    })

    it('should calculate penalty for SyncingTooLong violation', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.SyncingTooLong
      } as PenaltyTX
      
      const stakeLock = BigInt('2000000000000000000') // 2 ETH
      const result = getPenaltyForViolation(tx, stakeLock)
      
      // 20% of 2 ETH = 0.4 ETH
      expect(result).toBe(BigInt('400000000000000000'))
    })

    it('should handle zero stake lock', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.LeftNetworkEarly
      } as PenaltyTX
      
      const stakeLock = BigInt('0')
      const result = getPenaltyForViolation(tx, stakeLock)
      
      expect(result).toBe(BigInt('0'))
    })

    it('should handle very large stake amounts', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.NodeRefuted
      } as PenaltyTX
      
      const stakeLock = BigInt('99999999999999999999999999') // Very large amount
      const result = getPenaltyForViolation(tx, stakeLock)
      
      // 20% of large amount
      expect(result).toBe(BigInt('19999999999999999999999999'))
    })
  })

  describe('with different penalty percentages', () => {
    it('should use correct percentage from cached network account', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.LeftNetworkEarly
      } as PenaltyTX
      
      const stakeLock = BigInt('10000000000000000000') // 10 ETH
      const result = getPenaltyForViolation(tx, stakeLock)
      
      // Using mocked 20% (0.2)
      const expectedPenalty = (stakeLock * BigInt(20)) / BigInt(100)
      expect(result).toBe(expectedPenalty)
    })
  })

  describe('error handling', () => {
    it('should throw error for DoubleVote violation (not implemented)', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.DoubleVote
      } as PenaltyTX
      
      const stakeLock = BigInt('1000000000000000000')
      
      expect(() => getPenaltyForViolation(tx, stakeLock)).toThrow(
        'Violation type: ' + ViolationType.DoubleVote + ' Not implemented'
      )
    })

    it('should throw error for unexpected violation type', () => {
      const tx: PenaltyTX = {
        violationType: 999 as ViolationType // Invalid violation type
      } as PenaltyTX
      
      const stakeLock = BigInt('1000000000000000000')
      
      expect(() => getPenaltyForViolation(tx, stakeLock)).toThrow(
        'Unexpected violation type: 999'
      )
    })

    it('should throw error if stakeLock is not a bigint after parsing', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.LeftNetworkEarly
      } as PenaltyTX
      
      // Mock _base16BNParser to return non-bigint
      ;(mockedUtils._base16BNParser as any).mockReturnValue('not-a-bigint' as any)
      
      expect(() => getPenaltyForViolation(tx, 'invalid' as any)).toThrow(
        'stakeLock is not a BigInt. Type: string, Value: not-a-bigint'
      )
    })
  })

  describe('type conversion and crash prevention', () => {
    it('should handle string input and convert to bigint', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.LeftNetworkEarly
      } as PenaltyTX
      
      const result = getPenaltyForViolation(tx, '1000000000000000000' as any)
      
      expect(result).toBe(BigInt('200000000000000000'))
    })

    it('should handle number input and convert to bigint', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.NodeRefuted
      } as PenaltyTX
      
      const result = getPenaltyForViolation(tx, 1000000 as any)
      
      expect(result).toBe(BigInt('200000'))
    })

    it('should count crash prevention event when input is not bigint', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.SyncingTooLong
      } as PenaltyTX
      
      getPenaltyForViolation(tx, '1000000000000000000' as any)
      
      expect(mockedNestedCounters.countEvent).toHaveBeenCalledWith(
        'shardeum',
        'getPenaltyForViolation crash fixed: bigint'
      )
    })

    it('should not count crash prevention event when input is already bigint', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.LeftNetworkEarly
      } as PenaltyTX
      
      getPenaltyForViolation(tx, BigInt('1000000000000000000'))
      
      expect(mockedNestedCounters.countEvent).not.toHaveBeenCalled()
    })
  })

  describe('penalty calculation precision', () => {
    it('should handle decimal precision correctly', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.LeftNetworkEarly
      } as PenaltyTX
      
      // Test with amount that doesn't divide evenly
      const stakeLock = BigInt('333333333333333333') // ~0.333 ETH
      const result = getPenaltyForViolation(tx, stakeLock)
      
      // 20% of 333333333333333333
      const expected = (stakeLock * BigInt(20)) / BigInt(100)
      expect(result).toBe(expected)
      expect(result).toBe(BigInt('66666666666666666'))
    })

    it('should handle rounding down for integer division', () => {
      const tx: PenaltyTX = {
        violationType: ViolationType.NodeRefuted
      } as PenaltyTX
      
      // Amount that will result in fractional penalty
      const stakeLock = BigInt('7')
      const result = getPenaltyForViolation(tx, stakeLock)
      
      // (7 * 2000) / 100 = 140 / 100 = 1 (rounded down)
      expect(result).toBe(BigInt('1'))
    })
  })
})