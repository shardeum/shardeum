import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

describe('ApplyNetworkParamTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ApplyNetworkParam,
            from: '0x1234567890abcdef',
            network: 'testnet',
            change: { param: 'value' },
            timestamp: 1234567890
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyNetworkParamTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ApplyNetworkParam,
            from: '0x1234567890abcdef',
            // missing network field
            change: { param: 'value' },
            timestamp: 1234567890
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyNetworkParamTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'network'")
    })

    test('Wrong internalTXType should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ApplyChangeConfig, // wrong type
            from: '0x1234567890abcdef',
            network: 'testnet',
            change: { param: 'value' },
            timestamp: 1234567890
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyNetworkParamTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be equal to one of the allowed values')
    })

    test('Invalid isInternalTx should fail validation', () => {
        const obj = {
            isInternalTx: false, // should be true
            internalTXType: InternalTXType.ApplyNetworkParam,
            from: '0x1234567890abcdef',
            network: 'testnet',
            change: { param: 'value' },
            timestamp: 1234567890
        }
        const errors = verifyPayload(AJVSchemaEnum.ApplyNetworkParamTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be equal to one of the allowed values')
    })
}) 