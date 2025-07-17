import {
  AccountType,
  InternalTXType,
  DebugTXType,
  ViolationType,
  isNetworkAccount,
  isNodeAccount2,
  NetworkAccount,
  NodeAccount2,
  WrappedEVMAccount,
  ShardeumAccount,
  BaseAccount,
  InternalTx,
  SetCertTime,
  StakeCoinsTX,
  UnstakeCoinsTX,
  InitRewardTimes,
  ClaimRewardTX,
  PenaltyTX,
  DebugTx,
  WrappedAccount,
  ReadableReceipt,
  NetworkParameters,
  NodeAccountStats,
  DevAccount,
  OperatorAccountInfo,
  ChangeConfig,
  ApplyChangeConfig,
  ChangeNetworkParam,
  ApplyNetworkParam,
  InjectTxResponse,
  NodeInfoAppData,
  AppJoinData,
} from '../../../../src/shardeum/shardeumTypes'
import { Account } from '@ethereumjs/util'
import { oneSHM } from '../../../../src/shardeum/shardeumConstants'

describe('shardeumTypes', () => {
  describe('Enums', () => {
    describe('AccountType', () => {
      it('should have correct values for account types', () => {
        expect(AccountType.Account).toBe(0)
        expect(AccountType.ContractStorage).toBe(1)
        expect(AccountType.ContractCode).toBe(2)
        expect(AccountType.Receipt).toBe(3)
        expect(AccountType.Debug).toBe(4)
        expect(AccountType.NetworkAccount).toBe(5)
        expect(AccountType.NodeAccount).toBe(6)
        expect(AccountType.NodeRewardReceipt).toBe(7)
        expect(AccountType.DevAccount).toBe(8)
        expect(AccountType.NodeAccount2).toBe(9)
        expect(AccountType.StakeReceipt).toBe(10)
        expect(AccountType.UnstakeReceipt).toBe(11)
        expect(AccountType.InternalTxReceipt).toBe(12)
        expect(AccountType.SecureAccount).toBe(13)
      })
    })

    describe('InternalTXType', () => {
      it('should have correct values for internal transaction types', () => {
        expect(InternalTXType.SetGlobalCodeBytes).toBe(0)
        expect(InternalTXType.InitNetwork).toBe(1)
        expect(InternalTXType.NodeReward).toBe(2)
        expect(InternalTXType.ChangeConfig).toBe(3)
        expect(InternalTXType.ApplyChangeConfig).toBe(4)
        expect(InternalTXType.SetCertTime).toBe(5)
        expect(InternalTXType.Stake).toBe(6)
        expect(InternalTXType.Unstake).toBe(7)
        expect(InternalTXType.InitRewardTimes).toBe(8)
        expect(InternalTXType.ClaimReward).toBe(9)
        expect(InternalTXType.ChangeNetworkParam).toBe(10)
        expect(InternalTXType.ApplyNetworkParam).toBe(11)
        expect(InternalTXType.Penalty).toBe(12)
        expect(InternalTXType.TransferFromSecureAccount).toBe(13)
      })
    })

    describe('DebugTXType', () => {
      it('should have correct values for debug transaction types', () => {
        expect(DebugTXType.Create).toBe(0)
        expect(DebugTXType.Transfer).toBe(1)
      })
    })

    describe('ViolationType', () => {
      it('should have correct values for violation types', () => {
        expect(ViolationType.LeftNetworkEarly).toBe(1000)
        expect(ViolationType.SyncingTooLong).toBe(1001)
        expect(ViolationType.DoubleVote).toBe(1002)
        expect(ViolationType.NodeRefuted).toBe(1003)
      })
    })
  })

  describe('Type Guards', () => {
    describe('isNetworkAccount', () => {
      it('should return true for valid NetworkAccount', () => {
        const networkAccount: NetworkAccount = {
          accountType: AccountType.NetworkAccount,
          id: 'test-id',
          current: {} as NetworkParameters,
          listOfChanges: [],
          next: {},
          hash: 'test-hash',
          timestamp: 123456,
          mode: 'forming' as any,
        }
        expect(isNetworkAccount(networkAccount)).toBe(true)
      })

      it('should return false for non-NetworkAccount objects', () => {
        expect(isNetworkAccount({})).toBe(false)
        expect(isNetworkAccount({ current: {} })).toBe(false)
        expect(isNetworkAccount({ listOfChanges: [] })).toBe(false)
        expect(isNetworkAccount({ next: {} })).toBe(false)
        expect(isNetworkAccount('string')).toBe(false)
        expect(isNetworkAccount(123)).toBe(false)
      })

      it('should return false for objects missing required properties', () => {
        expect(isNetworkAccount({ current: {}, listOfChanges: [] })).toBe(false)
        expect(isNetworkAccount({ current: {}, next: {} })).toBe(false)
        expect(isNetworkAccount({ listOfChanges: [], next: {} })).toBe(false)
      })
    })

    describe('isNodeAccount2', () => {
      it('should return true for valid NodeAccount2', () => {
        const nodeAccount: NodeAccount2 = {
          accountType: AccountType.NodeAccount2,
          id: 'test-id',
          hash: 'test-hash',
          timestamp: 123456,
          nominator: 'test-nominator',
          stakeLock: BigInt(1000),
          stakeTimestamp: 123456,
          reward: BigInt(100),
          rewardStartTime: 123456,
          rewardEndTime: 234567,
          penalty: BigInt(0),
          nodeAccountStats: {} as NodeAccountStats,
          rewarded: false,
          rewardRate: BigInt(10),
        }
        expect(isNodeAccount2(nodeAccount)).toBe(true)
      })

      it('should return false for non-NodeAccount2 objects', () => {
        expect(isNodeAccount2({})).toBe(false)
        expect(isNodeAccount2({ nodeAccountStats: {} })).toBe(false)
        expect(isNodeAccount2({ rewardStartTime: 123 })).toBe(false)
        expect(isNodeAccount2({ rewardEndTime: 123 })).toBe(false)
        expect(isNodeAccount2('string')).toBe(false)
        expect(isNodeAccount2(123)).toBe(false)
      })

      it('should return false for objects missing required properties', () => {
        expect(isNodeAccount2({ nodeAccountStats: {}, rewardStartTime: 123 })).toBe(false)
        expect(isNodeAccount2({ nodeAccountStats: {}, rewardEndTime: 123 })).toBe(false)
        expect(isNodeAccount2({ rewardStartTime: 123, rewardEndTime: 123 })).toBe(false)
      })
    })
  })

  describe('Classes', () => {
    describe('ShardeumAccount', () => {
      it('should create instance extending Account', () => {
        const account = new ShardeumAccount()
        expect(account).toBeInstanceOf(Account)
        expect(account).toBeInstanceOf(ShardeumAccount)
      })

      it('should support virtual property', () => {
        const account = new ShardeumAccount()
        expect(account.virtual).toBeUndefined()
        account.virtual = true
        expect(account.virtual).toBe(true)
      })
    })
  })

  describe('Interfaces', () => {
    describe('BaseAccount', () => {
      it('should require accountType property', () => {
        const baseAccount: BaseAccount = {
          accountType: AccountType.Account,
        }
        expect(baseAccount.accountType).toBe(AccountType.Account)
      })
    })

    describe('WrappedEVMAccount', () => {
      it('should have required properties', () => {
        const wrappedAccount: WrappedEVMAccount = {
          accountType: AccountType.Account,
          ethAddress: '0x123',
          hash: 'hash123',
          timestamp: 123456,
        }
        expect(wrappedAccount.ethAddress).toBe('0x123')
        expect(wrappedAccount.hash).toBe('hash123')
        expect(wrappedAccount.timestamp).toBe(123456)
      })

      it('should support optional variant data', () => {
        const wrappedAccount: WrappedEVMAccount = {
          accountType: AccountType.ContractStorage,
          ethAddress: '0x123',
          hash: 'hash123',
          timestamp: 123456,
          key: 'storage-key',
          value: new Uint8Array([1, 2, 3]),
          codeHash: new Uint8Array([4, 5, 6]),
          codeByte: new Uint8Array([7, 8, 9]),
          contractAddress: '0x456',
          txId: 'tx123',
          txFrom: '0x789',
          balance: 1000,
        }
        expect(wrappedAccount.key).toBe('storage-key')
        expect(wrappedAccount.value).toEqual(new Uint8Array([1, 2, 3]))
      })
    })

    describe('InternalTx', () => {
      it('should have required base properties', () => {
        const internalTx: InternalTx = {
          isInternalTx: true,
          internalTXType: InternalTXType.Stake,
          timestamp: 123456,
          sign: { owner: 'test', sig: 'sig' } as any,
        }
        expect(internalTx.isInternalTx).toBe(true)
        expect(internalTx.internalTXType).toBe(InternalTXType.Stake)
      })

      it('should support array of signatures', () => {
        const internalTx: InternalTx = {
          isInternalTx: true,
          internalTXType: InternalTXType.ChangeConfig,
          timestamp: 123456,
          sign: [
            { owner: 'test1', sig: 'sig1' },
            { owner: 'test2', sig: 'sig2' },
          ] as any,
        }
        expect(Array.isArray(internalTx.sign)).toBe(true)
        expect(internalTx.sign).toHaveLength(2)
      })
    })

    describe('ReadableReceipt', () => {
      it('should have all required properties', () => {
        const receipt: ReadableReceipt = {
          status: 1,
          transactionHash: '0xabc',
          transactionIndex: '0',
          blockNumber: '100',
          nonce: '5',
          blockHash: '0xdef',
          cumulativeGasUsed: '21000',
          gasUsed: '21000',
          gasRefund: '0',
          logs: [],
          logsBloom: '0x00',
          contractAddress: null,
          from: '0x123',
          to: '0x456',
          value: '1000',
          data: '0x',
        }
        expect(receipt.status).toBe(1)
        expect(receipt.transactionHash).toBe('0xabc')
        expect(receipt.from).toBe('0x123')
        expect(receipt.to).toBe('0x456')
      })

      it('should support optional properties', () => {
        const receipt: ReadableReceipt = {
          status: 0,
          transactionHash: '0xabc',
          transactionIndex: '0',
          blockNumber: '100',
          nonce: '5',
          blockHash: '0xdef',
          cumulativeGasUsed: '21000',
          gasUsed: '21000',
          gasRefund: '0',
          logs: [],
          logsBloom: '0x00',
          contractAddress: '0x789',
          from: '0x123',
          to: '0x456',
          value: '1000',
          data: '0x',
          type: '2',
          gasPrice: '1000000000',
          gasLimit: '50000',
          chainId: '1',
          reason: 'Out of gas',
          maxFeePerGas: '2000000000',
          maxPriorityFeePerGas: '1000000000',
          v: '0x1b',
          r: '0xabc',
          s: '0xdef',
        }
        expect(receipt.type).toBe('2')
        expect(receipt.reason).toBe('Out of gas')
        expect(receipt.chainId).toBe('1')
      })
    })

    describe('NetworkParameters', () => {
      it('should have all required properties', () => {
        const params: NetworkParameters = {
          title: 'Test Network',
          description: 'Test Description',
          nodeRewardInterval: 3600,
          nodeRewardAmountUsd: BigInt(100),
          nodePenaltyUsd: BigInt(50),
          stakeRequiredUsd: BigInt(1000),
          nodeRewardCap: oneSHM * BigInt(10001),
          restakeCooldown: 7200,
          maintenanceInterval: 86400,
          maintenanceFee: 10,
          stabilityScaleMul: 100,
          stabilityScaleDiv: 100,
          minVersion: '1.0.0',
          activeVersion: '1.0.0',
          latestVersion: '1.1.0',
          archiver: {
            minVersion: '1.0.0',
            activeVersion: '1.0.0',
            latestVersion: '1.1.0',
          },
          txPause: false,
          certCycleDuration: 100,
          enableNodeSlashing: true,
          qa: {
            qaTestNumber: 42,
            qaTestBoolean: true,
            qaTestPercent: 50,
            qaTestSemver: '1.0.0',
          },
          slashing: {
            enableLeftNetworkEarlySlashing: true,
            enableSyncTimeoutSlashing: true,
            enableNodeRefutedSlashing: true,
            leftNetworkEarlyPenaltyPercent: 10,
            syncTimeoutPenaltyPercent: 5,
            nodeRefutedPenaltyPercent: 20,
          },
          enableRPCEndpoints: true,
          stakeLockTime: 3600,
          chainID: 1,
          smartContractSupport: true,
        }
        expect(params.title).toBe('Test Network')
        expect(params.nodeRewardAmountUsd).toBe(BigInt(100))
        expect(params.slashing.enableLeftNetworkEarlySlashing).toBe(true)
      })
    })
  })
})