import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

describe('UnstakeTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Unstake,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            timestamp: 1234567890,
            sign: { owner: 'owner1', sig: 'signature1' },
            force: false
        }
        const errors = verifyPayload(AJVSchemaEnum.UnstakeTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Unstake,
            nominee: '0x1234567890abcdef',
            // missing nominator
            timestamp: 1234567890,
            sign: { owner: 'owner1', sig: 'signature1' },
            force: false
        }
        const errors = verifyPayload(AJVSchemaEnum.UnstakeTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nominator'")
    })

    test('Invalid timestamp should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Unstake,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            timestamp: 0, // should be > 0
            sign: { owner: 'owner1', sig: 'signature1' },
            force: false
        }
        const errors = verifyPayload(AJVSchemaEnum.UnstakeTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be > 0')
    })

    test('Missing force field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.Unstake,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            timestamp: 1234567890,
            sign: { owner: 'owner1', sig: 'signature1' }
            // missing force field
        }
        const errors = verifyPayload(AJVSchemaEnum.UnstakeTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'force'")
    })
}) 