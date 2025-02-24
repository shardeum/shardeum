import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

describe('InitRewardTimesTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.InitRewardTimes,
            nominee: '0x1234567890abcdef',
            timestamp: 1234567890,
            nodeActivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                nodeId: 'node123',
                startTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.InitRewardTimesTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.InitRewardTimes,
            // missing nominee
            timestamp: 1234567890,
            nodeActivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                nodeId: 'node123',
                startTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.InitRewardTimesTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nominee'")
    })

    test('Invalid txData should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.InitRewardTimes,
            nominee: '0x1234567890abcdef',
            timestamp: 1234567890,
            nodeActivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                // missing nodeId
                startTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.InitRewardTimesTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nodeId'")
    })

    test('Invalid timestamp should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.InitRewardTimes,
            nominee: '0x1234567890abcdef',
            timestamp: 0, // should be > 0
            nodeActivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                nodeId: 'node123',
                startTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.InitRewardTimesTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be > 0')
    })
}) 