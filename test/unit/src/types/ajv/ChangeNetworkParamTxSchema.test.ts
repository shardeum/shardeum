import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

describe('ChangeNetworkParamTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ChangeNetworkParam,
            type: 'paramType',
            from: '0x1234567890abcdef',
            cycle: 123,
            config: 'paramConfig',
            timestamp: 1234567890,
            chainId: '0x1f92',
            sign: [{ owner: 'owner1', sig: 'signature1' }]
        }
        const errors = verifyPayload(AJVSchemaEnum.ChangeNetworkParamTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ChangeNetworkParam,
            from: '0x1234567890abcdef',
            // missing cycle field
            config: 'paramConfig',
            timestamp: 1234567890,
            chainId: '0x1f92',
            sign: [{ owner: 'owner1', sig: 'signature1' }]
        }
        const errors = verifyPayload(AJVSchemaEnum.ChangeNetworkParamTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'cycle'")
    })

    test('Missing chainId should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ChangeNetworkParam,
            type: 'paramType',
            from: '0x1234567890abcdef',
            cycle: 123,
            config: 'paramConfig',
            timestamp: 1234567890,
            sign: [{ owner: 'owner1', sig: 'signature1' }]
        }
        const errors = verifyPayload(AJVSchemaEnum.ChangeNetworkParamTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'chainId'")
    })

    test('Wrong internalTXType should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ChangeConfig, // wrong type
            type: 'paramType',
            from: '0x1234567890abcdef',
            cycle: 123,
            config: 'paramConfig',
            timestamp: 1234567890,
            chainId: '0x1f92',
            sign: [{ owner: 'owner1', sig: 'signature1' }]
        }
        const errors = verifyPayload(AJVSchemaEnum.ChangeNetworkParamTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be equal to one of the allowed values')
    })

    test('Additional properties should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ChangeNetworkParam,
            type: 'paramType',
            from: '0x1234567890abcdef',
            cycle: 123,
            config: 'paramConfig',
            timestamp: 1234567890,
            chainId: '0x1f92',
            sign: [{ owner: 'owner1', sig: 'signature1' }],
            extraField: 'should not be here'
        }
        const errors = verifyPayload(AJVSchemaEnum.ChangeNetworkParamTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should NOT have additional properties')
    })
}) 