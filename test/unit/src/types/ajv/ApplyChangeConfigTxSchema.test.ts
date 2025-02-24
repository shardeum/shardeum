import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

describe('ApplyChangeConfigTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ApplyChangeConfig,
            from: '0x1234567890abcdef',
            network: 'testnet',
            change: { key: 'value' },
            timestamp: 1234567890
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyChangeConfigTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ApplyChangeConfig,
            from: '0x1234567890abcdef',
            network: 'testnet',
            // missing change field
            timestamp: 1234567890
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyChangeConfigTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'change'")
    })

    test('Invalid timestamp should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ApplyChangeConfig,
            from: '0x1234567890abcdef',
            network: 'testnet',
            change: { key: 'value' },
            timestamp: 0 // should be > 0
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyChangeConfigTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be > 0')
    })

    test('Additional properties should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ApplyChangeConfig,
            from: '0x1234567890abcdef',
            network: 'testnet',
            change: { key: 'value' },
            timestamp: 1234567890,
            extraField: 'should not be here'
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyChangeConfigTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should NOT have additional properties')
    })
}) 