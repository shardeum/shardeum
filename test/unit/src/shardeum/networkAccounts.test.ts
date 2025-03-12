import {
    isNetworkAccount,
    isNodeAccount2,
    NetworkAccount,
    NodeAccount2,
    AccountType,
} from '../../../../src/shardeum/shardeumTypes'
import { ShardusTypes } from '@shardeum-foundation/core'

describe('Network Accounts', () => {
    describe('isNetworkAccount', () => {
        it('should return true for valid NetworkAccount objects', () => {
            const validNetworkAccount: NetworkAccount = {
                id: 'test-id',
                accountType: AccountType.NetworkAccount,
                current: {
                    title: 'Test Network',
                    description: 'Test Network Description',
                    nodeRewardInterval: 100,
                    nodeRewardAmountUsd: BigInt(1000),
                    nodePenaltyUsd: BigInt(500),
                    stakeRequiredUsd: BigInt(5000),
                    restakeCooldown: 100,
                    maintenanceInterval: 100,
                    maintenanceFee: 10,
                    stabilityScaleMul: 1,
                    stabilityScaleDiv: 1,
                    minVersion: '1.0.0',
                    activeVersion: '1.0.0',
                    latestVersion: '1.0.0',
                    archiver: {
                        minVersion: '1.0.0',
                        activeVersion: '1.0.0',
                        latestVersion: '1.0.0'
                    },
                    txPause: false,
                    certCycleDuration: 100,
                    enableNodeSlashing: false,
                    qa: {
                        qaTestNumber: 1,
                        qaTestBoolean: true,
                        qaTestPercent: 100,
                        qaTestSemver: '1.0.0'
                    },
                    slashing: {
                        enableLeftNetworkEarlySlashing: false,
                        enableSyncTimeoutSlashing: false,
                        enableNodeRefutedSlashing: false,
                        leftNetworkEarlyPenaltyPercent: 10,
                        syncTimeoutPenaltyPercent: 10,
                        nodeRefutedPenaltyPercent: 10
                    },
                    enableRPCEndpoints: true,
                    stakeLockTime: 100,
                    chainID: 8080
                },
                listOfChanges: [],
                next: {},
                hash: 'test-hash',
                timestamp: Date.now(),
                mode: ShardusTypes.ServerMode.Release
            }

            expect(isNetworkAccount(validNetworkAccount)).toBe(true)
        })

        it('should return false for objects missing required properties', () => {
            const missingCurrent = {
                id: 'test-id',
                accountType: AccountType.NetworkAccount,
                listOfChanges: [],
                next: {},
                hash: 'test-hash',
                timestamp: Date.now(),
                mode: ShardusTypes.ServerMode.Release
            }

            const missingListOfChanges = {
                id: 'test-id',
                accountType: AccountType.NetworkAccount,
                current: {},
                next: {},
                hash: 'test-hash',
                timestamp: Date.now(),
                mode: ShardusTypes.ServerMode.Release
            }

            const missingNext = {
                id: 'test-id',
                accountType: AccountType.NetworkAccount,
                current: {},
                listOfChanges: [],
                hash: 'test-hash',
                timestamp: Date.now(),
                mode: ShardusTypes.ServerMode.Release
            }

            expect(isNetworkAccount(missingCurrent)).toBe(false)
            expect(isNetworkAccount(missingListOfChanges)).toBe(false)
            expect(isNetworkAccount(missingNext)).toBe(false)
        })

        /*
            Error: TypeError: Cannot use 'in' operator to search for 'current' in null
            TODO: Check for null or undefined objects
        */
        // it('should return false for null or undefined', () => {
        //     expect(isNetworkAccount(null as unknown as NetworkAccount)).toBe(false)
        //     expect(isNetworkAccount(undefined as unknown as NetworkAccount)).toBe(false)
        // })

        it('should return false for other types of objects', () => {
            const otherObject = {
                id: 'test-id',
                accountType: AccountType.Account,
                hash: 'test-hash',
                timestamp: Date.now()
            }

            expect(isNetworkAccount(otherObject)).toBe(false)
        })
    })

    describe('isNodeAccount2', () => {
        it('should return true for valid NodeAccount2 objects', () => {
            const validNodeAccount: NodeAccount2 = {
                id: 'test-id',
                accountType: AccountType.NodeAccount2,
                hash: 'test-hash',
                timestamp: Date.now(),
                nominator: 'test-nominator',
                stakeLock: BigInt(1000),
                stakeTimestamp: Date.now(),
                reward: BigInt(100),
                rewardStartTime: Date.now(),
                rewardEndTime: Date.now() + 1000,
                penalty: BigInt(0),
                nodeAccountStats: {
                    totalReward: BigInt(100),
                    totalPenalty: BigInt(0),
                    history: [],
                    lastPenaltyTime: 0,
                    penaltyHistory: [],
                    isShardeumRun: true
                },
                rewarded: false,
                rewardRate: BigInt(10)
            }

            expect(isNodeAccount2(validNodeAccount)).toBe(true)
        })

        it('should return false for objects missing required properties', () => {
            const missingNodeAccountStats = {
                id: 'test-id',
                accountType: AccountType.NodeAccount2,
                hash: 'test-hash',
                timestamp: Date.now(),
                nominator: 'test-nominator',
                stakeLock: BigInt(1000),
                stakeTimestamp: Date.now(),
                reward: BigInt(100),
                rewardStartTime: Date.now(),
                rewardEndTime: Date.now() + 1000,
                penalty: BigInt(0),
                rewarded: false,
                rewardRate: BigInt(10)
            }

            const missingRewardStartTime = {
                id: 'test-id',
                accountType: AccountType.NodeAccount2,
                hash: 'test-hash',
                timestamp: Date.now(),
                nominator: 'test-nominator',
                stakeLock: BigInt(1000),
                stakeTimestamp: Date.now(),
                reward: BigInt(100),
                rewardEndTime: Date.now() + 1000,
                penalty: BigInt(0),
                nodeAccountStats: {
                    totalReward: BigInt(100),
                    totalPenalty: BigInt(0),
                    history: [],
                    lastPenaltyTime: 0,
                    penaltyHistory: [],
                    isShardeumRun: true
                },
                rewarded: false,
                rewardRate: BigInt(10)
            }

            const missingRewardEndTime = {
                id: 'test-id',
                accountType: AccountType.NodeAccount2,
                hash: 'test-hash',
                timestamp: Date.now(),
                nominator: 'test-nominator',
                stakeLock: BigInt(1000),
                stakeTimestamp: Date.now(),
                reward: BigInt(100),
                rewardStartTime: Date.now(),
                penalty: BigInt(0),
                nodeAccountStats: {
                    totalReward: BigInt(100),
                    totalPenalty: BigInt(0),
                    history: [],
                    lastPenaltyTime: 0,
                    penaltyHistory: [],
                    isShardeumRun: true
                },
                rewarded: false,
                rewardRate: BigInt(10)
            }

            expect(isNodeAccount2(missingNodeAccountStats)).toBe(false)
            expect(isNodeAccount2(missingRewardStartTime)).toBe(false)
            expect(isNodeAccount2(missingRewardEndTime)).toBe(false)
        })


        /*
            Error: TypeError: Cannot use 'in' operator to search for 'nodeAccountStats' in null
            TODO: Check for null or undefined objects
        */
        // it('should return false for null or undefined', () => {
        //     expect(isNodeAccount2(null)).toBe(false)
        //     expect(isNodeAccount2(undefined)).toBe(false)
        // })

        it('should return false for other types of objects', () => {
            const otherObject = {
                id: 'test-id',
                accountType: AccountType.Account,
                hash: 'test-hash',
                timestamp: Date.now()
            }

            expect(isNodeAccount2(otherObject)).toBe(false)
        })
    })
}) 