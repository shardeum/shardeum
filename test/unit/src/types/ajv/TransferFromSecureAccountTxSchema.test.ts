import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'
import { ShardeumFlags } from '../../../../../src/shardeum/shardeumFlags'

describe('TransferFromSecureAccountTx AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.TransferFromSecureAccount,
            accountName: 'testAccount',
            nonce: 1,
            amount: '1000000000000000000',
            timestamp: 1234567890,
            from: '0x1234567890abcdef',
            sign: [{ owner: 'owner1', sig: 'signature1' }],
            chainId: '0x' + ShardeumFlags.ChainID.toString(16)
        }
        const errors = verifyPayload(AJVSchemaEnum.TransferFromSecureAccountTx, obj)
        expect(errors).toBeNull()
    })

    test('Missing required field should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.TransferFromSecureAccount,
            // missing accountName
            nonce: 1,
            amount: '1000000000000000000',
            timestamp: 1234567890,
            from: '0x1234567890abcdef',
            sign: [{ owner: 'owner1', sig: 'signature1' }]
        }
        const errors = verifyPayload(AJVSchemaEnum.TransferFromSecureAccountTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'accountName'")
    })

    test('Invalid timestamp should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.TransferFromSecureAccount,
            accountName: 'testAccount',
            nonce: 1,
            amount: '1000000000000000000',
            timestamp: 0, // should be > 0
            from: '0x1234567890abcdef',
            sign: [{ owner: 'owner1', sig: 'signature1' }]
        }
        const errors = verifyPayload(AJVSchemaEnum.TransferFromSecureAccountTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be > 0')
    })

    test('Invalid sign array should fail validation', () => {
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.TransferFromSecureAccount,
            accountName: 'testAccount',
            nonce: 1,
            amount: '1000000000000000000',
            timestamp: 1234567890,
            from: '0x1234567890abcdef',
            sign: [{ owner: 'owner1' }],
            chainId: '0x' + ShardeumFlags.ChainID.toString(16)// missing sig field
        }
        const errors = verifyPayload(AJVSchemaEnum.TransferFromSecureAccountTx, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'sig'")
    })
}) 