import { initializeSecureAccount, isSecureAccount, SecureAccount, SecureAccountConfig } from '../../../../src/shardeum/secureAccounts'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import * as WrappedEVMAccountFunctions from '../../../../src/shardeum/wrappedEVMAccountFunctions'
import { AccountType } from '../../../../src/shardeum/shardeumTypes'

jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions', () => ({
  updateEthAccountHash: jest.fn(),
}));

describe('secureAccounts', () => {
  describe('isSecureAccount', () => {
    it('should return true for a valid SecureAccount', () => {
      const validAccount = {
        name: 'Test',
        nextTransferAmount: BigInt(0),
        nextTransferTime: 0
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
      (WrappedEVMAccountFunctions.updateEthAccountHash as jest.Mock).mockImplementation((arg) => arg);
    });

    it('should initialize a SecureAccount with correct values', () => {
      const config: SecureAccountConfig = {
        Name: 'Test Account',
        SourceFundsAddress: '0x1234567890123456789012345678901234567890',
        RecipientFundsAddress: '0x0987654321098765432109876543210987654321',
        SecureAccountAddress: '0x2468135790246813579024681357902468135790',
        SourceFundsBalance: '1000000000000000000'
      }
      const latestCycles = [{ start: 1000 }]

      const result = initializeSecureAccount(config, latestCycles)

      expect(result).toEqual({
        id: config.SecureAccountAddress,
        hash: '',
        timestamp: 1000000,
        accountType: AccountType.SecureAccount,
        name: config.Name,
        nextTransferAmount: BigInt(0),
        nextTransferTime: 0,
        nonce: 0
      })

      expect(WrappedEVMAccountFunctions.updateEthAccountHash).toHaveBeenCalledWith(result)
    })

    it('should use 0 as cycleStart when latestCycles is empty', () => {
      const config: SecureAccountConfig = {
        Name: 'Test Account',
        SourceFundsAddress: '0x1234567890123456789012345678901234567890',
        RecipientFundsAddress: '0x0987654321098765432109876543210987654321',
        SecureAccountAddress: '0x2468135790246813579024681357902468135790',
        SourceFundsBalance: '1000000000000000000'
      }
      const latestCycles: { start: number }[] = []

      const result = initializeSecureAccount(config, latestCycles)

      expect(result.timestamp).toBe(0)
    })

    it('should log the created SecureAccount when VerboseLogs flag is true', () => {
      const consoleSpy = jest.spyOn(console, 'log')
      ShardeumFlags.VerboseLogs = true

      const config: SecureAccountConfig = {
        Name: 'Test Account',
        SourceFundsAddress: '0x1234567890123456789012345678901234567890',
        RecipientFundsAddress: '0x0987654321098765432109876543210987654321',
        SecureAccountAddress: '0x2468135790246813579024681357902468135790',
        SourceFundsBalance: '1000000000000000000'
      }
      const latestCycles = [{ start: 1000 }]

      const result = initializeSecureAccount(config, latestCycles)

      expect(consoleSpy).toHaveBeenCalledWith('SecureAccount created', result)

      consoleSpy.mockRestore()
    })
  })
})
