import { initializeSecureAccount, isSecureAccount, SecureAccount, SecureAccountConfig } from '../../../../src/shardeum/secureAccounts'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'

jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions', () => ({
  updateEthAccountHash: jest.fn(),
  // Add any other functions from wrappedEVMAccountFunctions that you might be using
}));

import * as WrappedEVMAccountFunctions from '../../../../src/shardeum/wrappedEVMAccountFunctions'
describe.only('secureAccounts', () => {
  describe('isSecureAccount', () => {
    it('should return true for a valid SecureAccount', () => {
      const validAccount = {
        name: 'Test',
        unlockRecipient: '0x1234567890123456789012345678901234567890'
      }
      expect(isSecureAccount(validAccount)).toBe(true)
    })

    it('should return false for an invalid object', () => {
      const invalidAccount = {
        foo: 'bar'
      }
      expect(isSecureAccount(invalidAccount)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isSecureAccount(null)).toBe(false)
    })
  })

  describe('initializeSecureAccount', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (WrappedEVMAccountFunctions.updateEthAccountHash as jest.Mock).mockImplementation((arg) => {
        return arg;
      });
    });

    it('should initialize a SecureAccount with correct values', () => {
      const config: SecureAccountConfig = {
        id: '0x1234567890123456789012345678901234567890',
        name: 'Test Account',
        startingLockedFunds: 1000000,
        unlockRecipient: '0x0987654321098765432109876543210987654321',
        unlockLimit: 10000,
        unlockDelay: 86400,
        unlockInitalConstant: 5000,
        unlockRate: 100
      }
      const latestCycles = [{ start: 1000 }]

      const result = initializeSecureAccount(config, latestCycles)

      expect(result).toEqual({
        id: config.id,
        hash: '',
        timestamp: 1000000,
        accountType: 13,
        name: config.name,
        startingLockedFunds: config.startingLockedFunds,
        unlockRecipient: config.unlockRecipient,
        unlockLimit: config.unlockLimit,
        unlockDelay: config.unlockDelay,
        unlockInitalConstant: config.unlockInitalConstant,
        unlockRate: config.unlockRate,
        mintedFunds: 0,
        lockedFunds: config.startingLockedFunds,
        lastUnlockTime: 1000000,
        nonce: 0
      })

      expect(WrappedEVMAccountFunctions.updateEthAccountHash).toHaveBeenCalledWith(result)
    })

    it('should use 0 as cycleStart when latestCycles is empty', () => {
      const config: SecureAccountConfig = {
        id: '0x1234567890123456789012345678901234567890',
        name: 'Test Account',
        startingLockedFunds: 1000000,
        unlockRecipient: '0x0987654321098765432109876543210987654321',
        unlockLimit: 10000,
        unlockDelay: 86400,
        unlockInitalConstant: 5000,
        unlockRate: 100
      }
      const latestCycles: { start: number }[] = []

      const result = initializeSecureAccount(config, latestCycles)

      expect(result.timestamp).toBe(0)
      expect(result.lastUnlockTime).toBe(0)
    })

    it('should log the created SecureAccount when VerboseLogs flag is true', () => {
      const consoleSpy = jest.spyOn(console, 'log')
      ShardeumFlags.VerboseLogs = true

      const config: SecureAccountConfig = {
        id: '0x1234567890123456789012345678901234567890',
        name: 'Test Account',
        startingLockedFunds: 1000000,
        unlockRecipient: '0x0987654321098765432109876543210987654321',
        unlockLimit: 10000,
        unlockDelay: 86400,
        unlockInitalConstant: 5000,
        unlockRate: 100
      }
      const latestCycles = [{ start: 1000 }]

      const result = initializeSecureAccount(config, latestCycles)

      expect(consoleSpy).toHaveBeenCalledWith('SecureAccount created', result)

      consoleSpy.mockRestore()
    })
  })
})
