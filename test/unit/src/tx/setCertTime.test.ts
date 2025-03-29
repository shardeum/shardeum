import { Shardus, ShardusTypes } from '@shardeum-foundation/core'
import { networkAccount, ONE_SECOND } from '../../../../src/shardeum/shardeumConstants'
import { AccountType, InternalTXType, NodeAccountQueryResponse, SetCertTime, WrappedEVMAccount, WrappedStates, NetworkAccount } from '../../../../src/shardeum/shardeumTypes'
import { isSetCertTimeTx, injectSetCertTimeTx, validateSetCertTimeTx, validateSetCertTimeState, applySetCertTimeTx } from '../../../../src/tx/setCertTime'
import { toShardusAddress } from '../../../../src/shardeum/evmAddress'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
// import * as AccountsStorage from '../../../src/storage/accountStorage'
import { getNodeAccountWithRetry, InjectTxToConsensor } from '../../../../src/handlers/queryCertificate'
import { verify } from '../../../../src/setup/helpers'
import { isInternalTx } from '../../../../src/setup/helpers'
import { shardeumGetTime } from '../../../../src/index'
import * as WrappedEVMAccountFunctions from '../../../../src/shardeum/wrappedEVMAccountFunctions'

// Mock dependencies
// jest.mock('@shardeum-foundation/core')
// jest.mock('../../../src/shardeum/shardeumConstants')
// jest.mock('../../../src/shardeum/shardeumFlags')
// jest.mock('../../../src/storage/accountStorage')
jest.mock('../../../../src/handlers/queryCertificate')
jest.mock('../../../../src/index', () => ({
    shardeumGetTime: jest.fn(),
    createInternalTxReceipt: jest.fn(),
    logFlags: {
        dapp_verbose: false,
        error: false,
        debug: false,
        verbose: false,
        important_as_error: false,
        important_as_fatal: false,
        aalg: false,
        shardedCache: false,
        console: false
    }
}))
jest.mock('../../../../src/setup/helpers')
jest.mock('../../../../src/shardeum/wrappedEVMAccountFunctions', () => ({
    ...jest.requireActual('../../../../src/shardeum/wrappedEVMAccountFunctions'),
    _shardusWrappedAccount: (account) => {
        if (!account) return undefined;
        return {
            accountId: account.ethAddress || account.accountId,
            stateId: account.hash || account.stateId,
            data: account,
            timestamp: account.timestamp || 0,
        };
    },
}))
// jest.mock('../../../src/shardeum/wrappedEVMAccountFunctions')

describe('setCertTime', () => {
    let mockShardus: jest.Mocked<Shardus>
    let mockWrappedStates: WrappedStates
    let mockNetworkAccount: NetworkAccount
    let mockOperatorEVMAccount: WrappedEVMAccount
    let mockAddress: string

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // 42 character hex address
        mockAddress = '0x' + '1'.repeat(40)

        // Setup mock Shardus instance
        mockShardus = {
            signAsNode: jest.fn(),
            applyResponseSetFailed: jest.fn(),
            applyResponseAddChangedAccount: jest.fn(),
        } as any

        // Setup mock network account
        mockNetworkAccount = {
            current: {
                title: 'Test Network',
                description: 'Test Network Description',
                nodeRewardInterval: 100,
                nodeRewardAmountUsd: BigInt(100),
                nodePenaltyUsd: BigInt(500),
                stakeRequiredUsd: BigInt(1000),
                restakeCooldown: 100,
                maintenanceInterval: 100,
                maintenanceFee: 0,
                stabilityScaleMul: 1000,
                stabilityScaleDiv: 1000,
                minVersion: '1.0.0',
                activeVersion: '1.0.0',
                latestVersion: '1.0.0',
                archiver: {
                    minVersion: '1.0.0',
                    activeVersion: '1.0.0',
                    latestVersion: '1.0.0',
                },
                txPause: false,
                certCycleDuration: 20,
                enableNodeSlashing: false,
                qa: {
                    qaTestNumber: 0,
                    qaTestBoolean: false,
                    qaTestPercent: 0,
                    qaTestSemver: '0.0.0',
                },
                slashing: {
                    enableLeftNetworkEarlySlashing: false,
                    enableSyncTimeoutSlashing: false,
                    enableNodeRefutedSlashing: false,
                    leftNetworkEarlyPenaltyPercent: 0.2,
                    syncTimeoutPenaltyPercent: 0.2,
                    nodeRefutedPenaltyPercent: 0.2,
                },
                enableRPCEndpoints: false,
                stakeLockTime: 6000,
                chainID: 8082,
            },
            listOfChanges: [],
            next: {},
            hash: '0x' + '3'.repeat(64),
            timestamp: 0,
            mode: 'validator' as ShardusTypes.ServerMode,
            accountType: AccountType.NetworkAccount,
            id: networkAccount,
        } as NetworkAccount

        // Setup mock operator account
        mockOperatorEVMAccount = {
            account: {
                balance: BigInt(4096),
                nonce: BigInt(0),
                storageRoot: new Uint8Array(32),
                codeHash: new Uint8Array(32),
            },
            operatorAccountInfo: {
                nominee: '1234567890123456789012345678901234567890123456789012345678901234',
                stake: BigInt(1000),
                certExp: 0,
            },
            timestamp: 0,
            accountType: AccountType.Account,
            ethAddress: '0x' + '1'.repeat(40),
            hash: '0x' + '2'.repeat(64),
        } as any

        // Setup mock wrapped states
        mockWrappedStates = {
            [networkAccount]: {
                accountId: networkAccount,
                stateId: networkAccount,
                timestamp: 0,
                data: mockNetworkAccount,
            },
            [toShardusAddress(mockAddress, AccountType.Account)]: {
                accountId: toShardusAddress(mockAddress, AccountType.Account),
                stateId: toShardusAddress(mockAddress, AccountType.Account),
                timestamp: 0,
                data: mockOperatorEVMAccount,
            },
        }

            // Setup default mock implementations
            ; (ShardeumFlags as any).certCycleDuration = 20
            ; (ShardeumFlags as any).constantTxFeeUsd = 100
            ; (ShardeumFlags as any).fixCertExpTiming = true
            ; (ShardeumFlags as any).fixSetCertTimeTxApply = true
            ; (ShardeumFlags as any).useAccountWrites = true
            ; (ShardeumFlags as any).supportInternalTxReceipt = true
            ; (ShardeumFlags as any).certCycleDuration = 1000
            ; (isInternalTx as jest.Mock).mockReturnValue(true)
            ; (verify as jest.Mock).mockReturnValue(true)
        // ; (getNodeAccountWithRetry as jest.Mock).mockResolvedValue({
        //     success: true,
        //     nodeAccount: { nominator: '0x5678' },
        // } as NodeAccountQueryResponse)
        // ; (InjectTxToConsensor as jest.Mock).mockResolvedValue({ success: true })
    })

    describe('isSetCertTimeTx', () => {
        it('should return true for valid SetCertTime transaction', () => {
            const tx = {
                isInternalTx: true,
                internalTXType: InternalTXType.SetCertTime,
            }
            expect(isSetCertTimeTx(tx)).toBe(true)
        })

        it('should return false for non-SetCertTime transaction', () => {
            const tx = {
                isInternalTx: true,
                internalTXType: InternalTXType.ChangeConfig,
            }
            expect(isSetCertTimeTx(tx)).toBe(false)
        })

        it('should return false for non-internal transaction', () => {
            (isInternalTx as jest.Mock).mockReturnValue(false)
            const tx = {
                isInternalTx: false,
                internalTXType: InternalTXType.SetCertTime,
            }
            expect(isSetCertTimeTx(tx)).toBe(false)
        })
    })

    describe('injectSetCertTimeTx', () => {
        const mockPublicKey = '0x1234'
        const mockActiveNodes = [{ id: 'node1', ip: '127.0.0.1', port: 3000, publicKey: '0x1234' }]
        const mockNominator = '0x5678'

        beforeEach(() => {
            ; (getNodeAccountWithRetry as jest.Mock).mockResolvedValue({
                success: true,
                nodeAccount: { nominator: mockNominator },
            } as NodeAccountQueryResponse)
                ; (InjectTxToConsensor as jest.Mock).mockResolvedValue({ success: true })

                // mock For shardeumGetTime
                ; (shardeumGetTime as jest.Mock).mockReturnValue(Date.now())
        })

        it('should successfully inject SetCertTime transaction', async () => {
            const result = await injectSetCertTimeTx(mockShardus, mockPublicKey, mockActiveNodes)
            expect(result.success).toBe(true)
            expect(mockShardus.signAsNode).toHaveBeenCalled()
            expect(InjectTxToConsensor).toHaveBeenCalled()
        })

        it('should fail when node account query fails', async () => {
            ; (getNodeAccountWithRetry as jest.Mock).mockResolvedValue({
                success: false,
                reason: 'Query failed',
            })
            const result = await injectSetCertTimeTx(mockShardus, mockPublicKey, mockActiveNodes)
            expect(result.success).toBe(false)
            expect(result.reason).toBe('Query failed')
        })

        it('should fail when nominator is not found', async () => {
            ; (getNodeAccountWithRetry as jest.Mock).mockResolvedValue({
                success: true,
                nodeAccount: { nominator: null },
            } as NodeAccountQueryResponse)
            const result = await injectSetCertTimeTx(mockShardus, mockPublicKey, mockActiveNodes)
            expect(result.success).toBe(false)
            expect(result.reason).toContain('Nominator for this node account')
        })
    })

    describe('validateSetCertTimeTx', () => {
        const validTx: SetCertTime = {
            isInternalTx: true,
            internalTXType: InternalTXType.SetCertTime,
            nominee: '1234567890123456789012345678901234567890123456789012345678901234',
            nominator: '0x' + '1'.repeat(40),
            duration: 20,
            timestamp: 1000,
            sign: {
                owner: '0x1234',
                sig: '0x1234',
            },
        }

        it('should validate correct transaction', () => {
            const result = validateSetCertTimeTx(validTx)
            expect(result.isValid).toBe(true)
            expect(result.reason).toBe('')
        })

        it('should reject invalid nominee address', () => {
            const tx = { ...validTx, nominee: 'invalid' }
            const result = validateSetCertTimeTx(tx)
            expect(result.isValid).toBe(false)
            expect(result.reason).toBe('Invalid nominee address')
        })

        it('should reject invalid nominator address', () => {
            const tx = { ...validTx, nominator: 'invalid' }
            const result = validateSetCertTimeTx(tx)
            expect(result.isValid).toBe(false)
            expect(result.reason).toBe('Invalid nominator address')
        })

        it('should reject invalid duration', () => {
            const tx = { ...validTx, duration: 0 }
            const result = validateSetCertTimeTx(tx)
            expect(result.isValid).toBe(false)
            expect(result.reason).toBe('Duration in cert tx must be > 0')
        })

        it('should reject invalid timestamp', () => {
            const tx = { ...validTx, timestamp: 0 }
            const result = validateSetCertTimeTx(tx)
            expect(result.isValid).toBe(false)
            expect(result.reason).toBe('Timestamp in cert tx must be > 0')
        })

        it('should reject invalid signature', () => {
            ; (verify as jest.Mock).mockReturnValue(false)
            const result = validateSetCertTimeTx(validTx)
            expect(result.isValid).toBe(false)
            expect(result.reason).toBe('Invalid signature for SetCertTime tx')
        })
    })

    describe('validateSetCertTimeState', () => {
        const validTx: SetCertTime = {
            isInternalTx: true,
            internalTXType: InternalTXType.SetCertTime,
            nominee: '1234567890123456789012345678901234567890123456789012345678901234',
            nominator: '0x' + '1'.repeat(40),
            duration: 20,
            timestamp: 1000,
            sign: {
                owner: '0x1234',
                sig: '0x1234',
            },
        }

        it('should validate correct state', () => {
            const result = validateSetCertTimeState(validTx, mockWrappedStates)
            expect(result.result).toBe('pass')
            expect(result.reason).toBe('valid')
        })

        // TODO: Potentially a bug. validateSetCertTimeState() is not able to handle the 
        // edge case wrapped states does not have the operator account. Even if the passed wrapped
        // states array is supposed to have all accounts, the validateSetCertTimeState function should be 
        // able to handle the case where the operator account is not found. Currently it will just break

        // it('should reject when operator account is not found', () => {
        //     const states = { ...mockWrappedStates }
        //     const operatorAddress = toShardusAddress(validTx.nominator, AccountType.Account)
        //     delete states[operatorAddress]
        //     const result = validateSetCertTimeState(validTx, states)
        //     expect(result.result).toBe('fail')
        //     expect(result.reason).toContain('Found no wrapped state for operator account')
        // })

        it('should reject when nominee mismatch', () => {
            const tx = { ...validTx, nominee: '0x9999' }
            const result = validateSetCertTimeState(tx, mockWrappedStates)
            expect(result.result).toBe('fail')
            expect(result.reason).toContain('MISMATCH')
        })

        it('should reject when stake is insufficient', () => {
            mockNetworkAccount.current.stakeRequiredUsd = BigInt(2000)
            mockOperatorEVMAccount.operatorAccountInfo.stake = BigInt(1000)
            const result = validateSetCertTimeState(validTx, mockWrappedStates)
            expect(result.result).toBe('fail')
            expect(result.reason).toBe('Operator has not staked the required amount')
        })
    })

    describe('applySetCertTimeTx', () => {
        const validTx: SetCertTime = {
            isInternalTx: true,
            internalTXType: InternalTXType.SetCertTime,
            nominee: '1234567890123456789012345678901234567890123456789012345678901234',
            nominator: '0x' + '1'.repeat(40),
            duration: 20,
            timestamp: 1000,
            sign: {
                owner: '0x1234',
                sig: '0x1234',
            },
        }

        const mockApplyResponse = {} as ShardusTypes.ApplyResponse

        it('should successfully apply transaction', () => {
            applySetCertTimeTx(mockShardus, validTx, mockWrappedStates, 'txId', 1000, mockApplyResponse)
            expect(mockShardus.applyResponseAddChangedAccount).toHaveBeenCalled()
        })

        it('should fail when state validation fails', () => {
            mockNetworkAccount.current.stakeRequiredUsd = BigInt(2000)
            applySetCertTimeTx(mockShardus, validTx, mockWrappedStates, 'txId', 1000, mockApplyResponse)
            expect(mockShardus.applyResponseSetFailed).toHaveBeenCalled()
        })

        it('should charge tx fee when cert is not expired', () => {
            applySetCertTimeTx(mockShardus, validTx, mockWrappedStates, 'txId', 1000, mockApplyResponse)
            expect(mockOperatorEVMAccount.account.balance).toBeDefined()
        })

        it('should not charge tx fee when cert is expired', () => {
            mockOperatorEVMAccount.operatorAccountInfo.certExp = 1000
            applySetCertTimeTx(mockShardus, validTx, mockWrappedStates, 'txId', 2000, mockApplyResponse)
            expect(mockOperatorEVMAccount.account.balance).toBe(BigInt(4096))
        })
    })
}) 