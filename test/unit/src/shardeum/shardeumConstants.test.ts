import {
  networkAccount,
  ONE_SECOND,
  ONE_MINUTE,
  ONE_HOUR,
  THIRTY_MINUTES,
  ONE_DAY,
  oneSHM,
} from '../../../../src/shardeum/shardeumConstants'
import config from '../../../../src/config'

/**
 * Test suite for Shardeum-specific constants used throughout the application
 * These constants define core values for network operation, time intervals, and token representation
 */
describe('ShardeumConstants', () => {
  /**
   * Tests for networkAccount constant
   * The network account is a special account used for network-level operations
   * It should match the global account defined in the server configuration
   */
  describe('networkAccount', () => {
    it('should match the global account from config', () => {
      expect(networkAccount).toBe(config.server.globalAccount)
    })
  })

  /**
   * Tests for time-related constants
   * These constants provide standardized time units throughout the application
   * Ensuring consistent time representations helps with scheduling, timeouts, and synchronization
   */
  describe('time constants', () => {
    it('ONE_SECOND should be 1000 milliseconds', () => {
      // Base unit for time calculations in JavaScript (milliseconds)
      expect(ONE_SECOND).toBe(1000)
    })

    it('ONE_MINUTE should be 60 seconds', () => {
      // Derived from ONE_SECOND to ensure consistency across the application
      expect(ONE_MINUTE).toBe(60 * ONE_SECOND)
    })

    it('ONE_HOUR should be 60 minutes', () => {
      // Derived from ONE_MINUTE to maintain the time unit hierarchy
      expect(ONE_HOUR).toBe(60 * ONE_MINUTE)
    })

    it('THIRTY_MINUTES should be 30 minutes', () => {
      // Common interval used for medium-duration operations and timeouts
      expect(THIRTY_MINUTES).toBe(30 * ONE_MINUTE)
    })

    it('ONE_DAY should be 24 hours', () => {
      // Used for daily operations, long-term scheduling, and data retention policies
      expect(ONE_DAY).toBe(24 * ONE_HOUR)
    })
  })

  /**
   * Tests for oneSHM constant
   * This constant represents one whole SHM token in its smallest denomination (wei)
   * Critical for accurate token calculations and conversions throughout the application
   */
  describe('oneSHM', () => {
    it('should be 10^18', () => {
      // Following Ethereum's standard of 18 decimal places for token representation
      expect(oneSHM).toBe(BigInt(10) ** BigInt(18))
    })

    it('should represent one whole SHM token', () => {
      // Verifies the exact string representation to avoid precision issues with large numbers
      // This value is used for token calculations, fee computations, and balance displays
      expect(oneSHM.toString()).toBe('1000000000000000000')
    })
  })
})
