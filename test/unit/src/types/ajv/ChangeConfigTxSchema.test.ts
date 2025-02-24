import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'
import { initSign } from '../../../../../src/types/ajv/SignSchema'



initAjvSchemas()

describe('ChangeConfigTx AJV tests', () => {
    beforeAll(() => {
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        console.log("test")
        const obj = {
            isInternalTx: true,
            internalTXType: InternalTXType.ChangeConfig,
            type: 'configType',
            from: '0x1234567890abcdef',
            cycle: 123,
            config: 'configData',
            timestamp: 1234567890,
            sign: [{ owner: 'owner1', sig: 'signature1' }]
        }
        console.log("obj: ", obj)
        const errors = verifyPayload(AJVSchemaEnum.ChangeConfigTx, obj)
        console.log("errors: ", errors)
        expect(errors).toBeNull()
    })

    // test('Invalid timestamp should fail validation', () => {
    //     const obj = {
    //         isInternalTx: true,
    //         internalTXType: InternalTXType.ChangeConfig,
    //         type: 'configType',
    //         from: '0x1234567890abcdef',
    //         cycle: 123,
    //         config: 'configData',
    //         timestamp: 0, // should be > 0
    //         sign: [{ owner: 'owner1', sig: 'signature1' }]
    //     }
    //     const errors = verifyPayload(AJVSchemaEnum.ChangeConfigTx, obj)
    //     expect(errors).not.toBeNull()
    //     expect(errors?.length).toBe(1)
    //     expect(errors?.[0]).toContain('should be > 0')
    // })

    // test('Invalid sign array should fail validation', () => {
    //     const obj = {
    //         isInternalTx: true,
    //         internalTXType: InternalTXType.ChangeConfig,
    //         type: 'configType',
    //         from: '0x1234567890abcdef',
    //         cycle: 123,
    //         config: 'configData',
    //         timestamp: 1234567890,
    //         sign: [{ owner: 'owner1' }] // missing sig field
    //     }
    //     const errors = verifyPayload(AJVSchemaEnum.ChangeConfigTx, obj)
    //     expect(errors).not.toBeNull()
    //     expect(errors?.length).toBe(1)
    //     expect(errors?.[0]).toContain("should have required property 'sig'")
    // })
}) 