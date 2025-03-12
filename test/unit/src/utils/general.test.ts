import { ShardusTypes } from '@shardeum-foundation/core'
import { AccountType, NetworkAccount } from '../../../../src/shardeum/shardeumTypes'
import {
    calculateGasPrice,
    scaleByStabilityFactor,
    getRandom,
    isWithinRange,
    formatErrorMessage,
    findMajorityResult,
    comparePropertiesTypes
} from '../../../../src/utils/general'

let networkAccount: NetworkAccount = {
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


describe('calculateGasPrice', () => {
    it('should calculate gas price correctly', () => {
        const baselineTxFee = '1000'
        const baselineTxGasUsage = '100'
        const result = calculateGasPrice(baselineTxFee, baselineTxGasUsage, networkAccount)
        expect(result).toEqual(BigInt(10))
    })

    it('should handle zero gas usage by throwing error', () => {
        const baselineTxFee = '1000'
        const baselineTxGasUsage = '0'
        expect(() => {
            calculateGasPrice(baselineTxFee, baselineTxGasUsage, networkAccount)
        }).toThrow()
    })
})

describe('scaleByStabilityFactor', () => {
    it('should scale value correctly by stability factor', () => {
        const input = BigInt(10)
        const result = scaleByStabilityFactor(input, networkAccount)
        expect(result).toEqual(BigInt(10))
    })

    it('should handle zero divisor by throwing error', () => {
        const input = BigInt(10)
        networkAccount.current.stabilityScaleDiv = 0
        expect(() => {
            scaleByStabilityFactor(input, networkAccount)
        }).toThrow()
    })
})

describe('getRandom', () => {
    it('should return n random elements from array', () => {
        const arr = [1, 2, 3, 4, 5]
        const n = 3

        const result = getRandom(arr, n)

        expect(result.length).toBe(n)
        result.forEach(item => {
            expect(arr).toContain(item)
        })
    })

    it('should return all elements if n is greater than array length', () => {
        const arr = [1, 2, 3]
        const n = 5

        const result = getRandom(arr, n)

        expect(result.length).toBe(arr.length)
        expect(new Set([...result]).size).toBe(arr.length) // All elements should be unique
    })

    it('should return empty array if input array is empty', () => {
        const arr: number[] = []
        const n = 3

        const result = getRandom(arr, n)

        expect(result).toEqual([])
    })
})

describe('isWithinRange', () => {
    it('should return true when values are within range', () => {
        expect(isWithinRange(10, 15, 5)).toBe(true)
        expect(isWithinRange(15, 10, 5)).toBe(true)
        expect(isWithinRange(10, 10, 5)).toBe(true)
    })

    it('should return false when values are outside range', () => {
        expect(isWithinRange(10, 20, 5)).toBe(false)
        expect(isWithinRange(20, 10, 5)).toBe(false)
    })

    it('should return false when an error occurs', () => {
        // @ts-ignore - Testing with invalid inputs
        expect(isWithinRange(null, 10, 5)).toBe(false)
        // @ts-ignore - Testing with invalid inputs
        expect(isWithinRange(10, null, 5)).toBe(false)
    })
})

describe('formatErrorMessage', () => {
    it('should format string error correctly', () => {
        const error = 'Test error'
        const result = formatErrorMessage(error)
        expect(result).toBe('Test error')
    })

    it('should format Error object correctly', () => {
        const error = new Error('Test error')
        const result = formatErrorMessage(error)
        expect(result).toContain('Test error')
        expect(result).toContain('Stack trace:')
    })

    it('should format unknown object error correctly', () => {
        const error = { message: 'Test error' }
        const result = formatErrorMessage(error)
        expect(result).toContain('Unknown error:')
        expect(result).toContain('message')
        expect(result).toContain('Test error')
    })

    it('should handle null or undefined errors', () => {
        expect(formatErrorMessage(null)).toContain('Unknown error: null')
        expect(formatErrorMessage(undefined)).toContain('Unknown error: undefined')
    })
})

describe('findMajorityResult', () => {
    it('should find majority result when it exists', () => {
        const results = [
            { id: 1, value: 'A' },
            { id: 2, value: 'A' },
            { id: 3, value: 'B' }
        ]

        const getTargetValue = (obj) => obj.value

        const result = findMajorityResult(results, getTargetValue)
        expect(result).toEqual({ id: 1, value: 'A' })
    })

    it('should return null when no majority exists', () => {
        const results = [
            { id: 1, value: 'A' },
            { id: 2, value: 'B' },
            { id: 3, value: 'C' }
        ]

        const getTargetValue = (obj) => obj.value

        const result = findMajorityResult(results, getTargetValue)
        expect(result).toBeNull()
    })

    it('should handle empty array', () => {
        const results: any[] = []
        const getTargetValue = (obj) => obj.value

        const result = findMajorityResult(results, getTargetValue)
        expect(result).toBeNull()
    })
})

describe('comparePropertiesTypes', () => {
    it('should return true when objects have same property types', () => {
        const objA = { a: 1, b: 'string', c: true }
        const objB = { a: 2, b: 'another', c: false }

        expect(comparePropertiesTypes(objA, objB)).toBe(true)
    })

    it('should return false when objects have different property types', () => {
        const objA = { a: 1, b: 'string', c: true }
        const objB = { a: '1', b: 'string', c: true }

        expect(comparePropertiesTypes(objA, objB)).toBe(false)
    })

    it('should return false when property exists in A but not in B', () => {
        const objA = { a: 1, b: 'string', c: true }
        const objB = { a: 1, b: 'string' }

        expect(comparePropertiesTypes(objA, objB)).toBe(false)
    })

    it('should handle nested objects correctly', () => {
        const objA = { a: 1, b: { c: 'string', d: true } }
        const objB = { a: 2, b: { c: 'another', d: false } }

        expect(comparePropertiesTypes(objA, objB)).toBe(true)

        const objC = { a: 1, b: { c: 'string', d: 123 } }
        expect(comparePropertiesTypes(objA, objC)).toBe(false)
    })
}) 