import { initializeSecureAccount, isSecureAccount, SecureAccount, SecureAccountConfig, validateTransferFromSecureAccount, verify, apply, secureAccountDataMap } from '../../../../src/shardeum/secureAccounts'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import * as WrappedEVMAccountFunctions from '../../../../src/shardeum/wrappedEVMAccountFunctions'
import { AccountMap, AccountType, InternalTx, InternalTXType, WrappedStates } from '../../../../src/shardeum/shardeumTypes'
import { Shardus } from '@shardeum-foundation/core'
import { shardusConfig } from '../../../../src'
import { VectorBufferStream } from '@shardeum-foundation/core'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'
import { serializeSecureAccount, deserializeSecureAccount } from '../../../../src/types/SecureAccount'
import { ApplyResponse } from '@shardeum-foundation/core/dist/state-manager/state-manager-types'
import { DevSecurityLevel, StrictShardusConfiguration } from '@shardeum-foundation/core/dist/shardus/shardus-types'
import * as ethers from 'ethers'
import { Utils } from '@shardeum-foundation/lib-types'
import { toShardusAddress } from '../../../../src/shardeum/evmAddress'

// Mock the multisig-permissions.json file
jest.mock('../../../../src/config/multisig-permissions.json', () => ({
  initiateSecureAccountTransfer: ['0x1234567890123456789012345678901234567890']
}), { virtual: true });

jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions', () => ({
  updateEthAccountHash: jest.fn(),
  _shardusWrappedAccount: (wrappedEVMAccount) => ({
    accountId: wrappedEVMAccount.ethAddress || 'mock-account-id',
    stateId: wrappedEVMAccount.hash || 'mock-state-id',
    data: wrappedEVMAccount,
    timestamp: wrappedEVMAccount.timestamp || Date.now()
  })
}));

jest.mock('@shardeum-foundation/core', () => {
  const actual = jest.requireActual('@shardeum-foundation/core')
  return {
    Shardus: jest.fn().mockImplementation(() => ({
      getMultisigPublicKeys: jest.fn().mockReturnValue({
        '0x123': 2
      }),
      applyResponseAddChangedAccount: jest.fn(),
      applyResponseAddReceiptData: jest.fn(),
      setDebugSetLastAppAwait: jest.fn()
    })),
    VectorBufferStream: actual.VectorBufferStream,
    DevSecurityLevel: {
      High: 2,
      Medium: 1,
      Low: 0
    },
    DebugComplete: {
      Completed: 'Completed'
    }
  }
})

// Mock the shardusConfig
jest.mock('../../../../src', () => ({
  shardusConfig: {
    debug: {
      minMultiSigRequiredForGlobalTxs: 1
    }
  }
}));

// Add mock config with required properties
const mockShardusConfig = {
  ...shardusConfig,
  heartbeatInterval: 1000,
  baseDir: '/tmp',
  transactionExpireTime: 3600,
  port: 9001,
  host: 'localhost',
  server: {},
  logs: { level: 'info' },
  storage: { type: 'memory' }
} as unknown as StrictShardusConfiguration

// Add this before your test cases in secureAccounts.test.ts
jest.mock('../../../../src', () => ({
  shardusConfig: {
    debug: {
      minMultisigRequiredForGlobalTxs: 1
    }
  },
  createInternalTxReceipt: jest.fn(),
  getApplyTXState: jest.fn().mockReturnValue({
    checkpoint: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    revert: jest.fn().mockResolvedValue(undefined),
    putAccount: jest.fn().mockResolvedValue(undefined)
  })
}))

describe('secureAccounts', () => {
  let shardus: Shardus

  beforeEach(() => {
    jest.clearAllMocks()
    shardus = new Shardus(mockShardusConfig)
    ;(WrappedEVMAccountFunctions.updateEthAccountHash as jest.Mock).mockImplementation((arg) => arg)
  })

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

  describe('validateTransferFromSecureAccount', () => {
    it('should validate a correct transfer transaction', async () => {
      // Use the address from the mocked multisig-permissions.json
      const testPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const testWallet = new ethers.Wallet(testPrivateKey);
      const testAddress = '0x1234567890123456789012345678901234567890'; // This matches our mocked permission
      
      const txData = {
        amount: '1000000000000000000',
        accountName: 'Foundation',
        nonce: 0
      }

      // Create proper signature
      const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(txData)))
      const signature = await testWallet.signMessage(payload_hash)

      const validTx = {
        ...txData,
        sign: [{
          owner: testAddress, // Use the address from our mocked permissions
          sig: signature
        }],
        isInternalTx: true,
        internalTXType: InternalTXType.TransferFromSecureAccount
      } as InternalTx

      // Mock the verifyMultiSigs function to return true for our test
      jest.spyOn(require('../../../../src/setup/helpers'), 'verifyMultiSigs').mockReturnValue(true);

      const result = validateTransferFromSecureAccount(validTx, shardus)
      expect(result.reason).toBe('')
      expect(result.success).toBe(true)
    })

    it('should reject invalid transaction type', () => {
      const invalidTx = {
        internalTXType: InternalTXType.ApplyNetworkParam,
        amount: '1000000000000000000',
        accountName: 'Foundation',
        nonce: 0,
        sign: []
      }
      
      const result = validateTransferFromSecureAccount(invalidTx as any, shardus)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid transaction type')
    })

    it('should reject invalid amount format', () => {
      const invalidTx = {
        internalTXType: InternalTXType.TransferFromSecureAccount,
        amount: 'not-a-number',
        accountName: 'TestAccount',
        nonce: 0,
        sign: []
      }
      
      const result = validateTransferFromSecureAccount(invalidTx as any, shardus)
      expect(result.reason).toBe('Invalid amount format')
      expect(result.success).toBe(false)
    })
  })

  describe('verify', () => {
    it('should verify a valid transfer transaction', async () => {
      // Use the address from the mocked multisig-permissions.json
      const testPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const testWallet = new ethers.Wallet(testPrivateKey);
      const testAddress = '0x1234567890123456789012345678901234567890'; // This matches our mocked permission
      
      const txData = {
        amount: '1000000000000000000',
        accountName: 'Foundation',
        nonce: 1
      }
      
      const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(txData)))
      const signature = await testWallet.signMessage(payload_hash)

      const validTx = {
        ...txData,
        sign: [{
          owner: testAddress, // Use the address from our mocked permissions
          sig: signature
        }],
        isInternalTx: true,
        internalTXType: InternalTXType.TransferFromSecureAccount,
        timestamp: Date.now()
      } as InternalTx

      // Mock the verifyMultiSigs function to return true for our test
      jest.spyOn(require('../../../../src/setup/helpers'), 'verifyMultiSigs').mockReturnValue(true);

      const foundationAccount = secureAccountDataMap.get('Foundation')
      if (!foundationAccount) throw new Error('Foundation account not found in secure account map')

      const wrappedStates = {
        [foundationAccount.SecureAccountAddress]: {
          accountId: foundationAccount.SecureAccountAddress,
          stateId: foundationAccount.SecureAccountAddress,
          timestamp: Date.now(),
          accountType: AccountType.SecureAccount,
          data: {
            hash: '',
            timestamp: Date.now(),
            accountType: AccountType.SecureAccount,
            nonce: 0,
            name: 'Foundation',
            nextTransferAmount: BigInt('1000000000000000000'),
            nextTransferTime: 0
          }
        },
        [foundationAccount.SourceFundsAddress]: {
          accountId: foundationAccount.SourceFundsAddress,
          stateId: foundationAccount.SourceFundsAddress,
          timestamp: Date.now(),
          data: {
            ethAddress: foundationAccount.SourceFundsAddress,
            hash: '',
            timestamp: Date.now(),
            accountType: AccountType.Account,
            account: { balance: BigInt('2000000000000000000') }
          }
        },
        [foundationAccount.RecipientFundsAddress]: {
          accountId: foundationAccount.RecipientFundsAddress,
          stateId: foundationAccount.RecipientFundsAddress,
          timestamp: Date.now(),
          accountType: AccountType.Account,
          data: {
            ethAddress: foundationAccount.RecipientFundsAddress,
            hash: '',
            timestamp: Date.now(),
            accountType: AccountType.Account,
            account: { balance: BigInt('0') }
          }
        }
      } as WrappedStates

      const result = verify(validTx, wrappedStates, shardus)
      expect(result.reason).toBe('Valid transaction')
      expect(result.success).toBe(true)
    })
  })

  describe('apply', () => {
    it('should apply a valid transfer transaction', async () => {
      const tx = {
        amount: '1000000000000000000',
        accountName: 'Foundation',
        nonce: 1,
        isInternalTx: true,
        internalTXType: InternalTXType.TransferFromSecureAccount,
        timestamp: Date.now()
      } as InternalTx
      const foundationAccount = secureAccountDataMap.get('Foundation')
      if (!foundationAccount) throw new Error('Foundation account not found in secure account map')

      const wrappedStates: WrappedStates = {
        [toShardusAddress(foundationAccount.SecureAccountAddress, AccountType.SecureAccount)]: {
          accountId: foundationAccount.SecureAccountAddress,
          stateId: foundationAccount.SecureAccountAddress,
          timestamp: Date.now(),
          data: {
            hash: '',
            timestamp: Date.now(),
            accountType: AccountType.SecureAccount,
            nonce: 1,
            name: 'Foundation',
            nextTransferAmount: BigInt('1000000000000000000'),
            nextTransferTime: 0
          }
        },
        [toShardusAddress(foundationAccount.SourceFundsAddress, AccountType.Account)]: {
          accountId: foundationAccount.SourceFundsAddress,
          stateId: foundationAccount.SourceFundsAddress,
          timestamp: Date.now(),
          data: {
            ethAddress: foundationAccount.SourceFundsAddress,
            hash: '',
            timestamp: Date.now(),
            accountType: AccountType.Account,
            account: { balance: BigInt('2000000000000000000'), nonce: BigInt(1) }
          }
        },
        [toShardusAddress(foundationAccount.RecipientFundsAddress, AccountType.Account)]: {
          accountId: foundationAccount.RecipientFundsAddress,
          stateId: foundationAccount.RecipientFundsAddress,
          timestamp: Date.now(),
          data: {
            ethAddress: foundationAccount.RecipientFundsAddress,
            hash: '',
            timestamp: Date.now(),
            accountType: AccountType.Account,
            account: { balance: BigInt('0') }
          }
        }
      }

      // Set the flag to true since we're testing with receipts
      ShardeumFlags.supportInternalTxReceipt = true

      const applyResponse: ApplyResponse = {
        txTimestamp: Date.now(),
        accountWrites: [],
        appReceiptData: [],
        stateTableResults: [],
        txId: 'txId',
        accountData: [],
        appDefinedData: {},
        failed: false,
        failMessage: '',
        appReceiptDataHash: ''
      }

      await expect(apply(tx, 'txId', Date.now(), wrappedStates, shardus, applyResponse))
        .resolves.not.toThrow()
    })
  })
})