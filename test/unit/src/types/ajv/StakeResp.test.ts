import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'


describe('StakeResp AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas()
    })
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('Valid object should pass validation', () => {
        const obj = {
            stakeRequired: '1000000000000000000',
            stakeRequiredUsd: '100000000000000000'
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).toBeNull()
    })

    test('Missing stakeRequired field should fail validation', () => {
        const obj = {
            stakeRequiredUsd: '100000000000000000'
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'stakeRequired': {\"missingProperty\":\"stakeRequired\"}")
    })

    test('Missing stakeRequiredUsd field should fail validation', () => {
        const obj = {
            stakeRequired: '1000000000000000000'
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'stakeRequiredUsd': {\"missingProperty\":\"stakeRequiredUsd\"}")
    })

    test('Wrong type for stakeRequired should fail validation', () => {
        const obj = {
            stakeRequired: 1000000000000000000, // number instead of string
            stakeRequiredUsd: '100000000000000000'
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be string: {\"type\":\"string\"}')
    })

    test('Wrong type for stakeRequiredUsd should fail validation', () => {
        const obj = {
            stakeRequired: '1000000000000000000',
            stakeRequiredUsd: 100000000000000000 // number instead of string
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be string: {\"type\":\"string\"}')
    })

    test('Additional properties should fail validation', () => {
        const obj = {
            stakeRequired: '1000000000000000000',
            stakeRequiredUsd: '100000000000000000',
            extraField: 'should not be here'
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should NOT have additional properties: {\"additionalProperty\":\"extraField\"}')
    })
})
