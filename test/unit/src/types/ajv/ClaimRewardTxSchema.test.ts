import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

describe('ClaimRewardTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ClaimReward,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            timestamp: 1234567890,
            cycle: 123,
            deactivatedNodeId: 'node123',
            nodeDeactivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                nodeId: 'node123',
                endTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ClaimReward,
            nominee: '0x1234567890abcdef',
            // missing nominator
            timestamp: 1234567890,
            cycle: 123,
            deactivatedNodeId: 'node123',
            nodeDeactivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                nodeId: 'node123',
                endTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nominator'")
    })

    test('Invalid txData should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ClaimReward,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            timestamp: 1234567890,
            cycle: 123,
            deactivatedNodeId: 'node123',
            nodeDeactivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                // missing nodeId
                endTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'nodeId'")
    })

    test('Invalid timestamp should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ClaimReward,
            nominee: '0x1234567890abcdef',
            nominator: '0xabcdef1234567890',
            timestamp: 0, // should be > 0
            cycle: 123,
            deactivatedNodeId: 'node123',
            nodeDeactivatedTime: 1234567880,
            txData: {
                publicKey: 'pubKey123',
                nodeId: 'node123',
                endTime: 1234567890
            },
            sign: { owner: 'owner1', sig: 'signature1' }
        }
        const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be > 0')
    })
}) 