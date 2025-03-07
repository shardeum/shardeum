import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

describe('StakeTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Stake,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            stake: BigInt('1000000000000000000'),
            timestamp: 1234567890,
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Stake,
            nominee: '0x1234567890abcdef',
            // missing nominator
            stake: BigInt('1000000000000000000'),
            timestamp: 1234567890,
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nominator'")
    })

    test('Invalid timestamp should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Stake,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            stake: BigInt('1000000000000000000'),
            timestamp: 0, // should be > 0
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be > 0')
    })

    test('Invalid sign object should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Stake,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            stake: BigInt('1000000000000000000'),
            timestamp: 1234567890,
            sign: { owner: 'owner1' } // missing sig field
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'sig'")
    })
}) 