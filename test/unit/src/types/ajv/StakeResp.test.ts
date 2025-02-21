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
            stakeRequired: {
                dataType: 'bi',
                value: '1000000000000000000'
            },
            stakeRequiredUsd: {
                dataType: 'bi',
                value: '100000000000000000'
            }
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).toBeNull()
    })

    test('Missing stakeRequired field should fail validation', () => {
        const obj = {
            stakeRequiredUsd: {
                dataType: 'bi',
                value: '100000000000000000'
            }
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'stakeRequired'")
    })

    test('Missing stakeRequiredUsd field should fail validation', () => {
        const obj = {
            stakeRequired: {
                dataType: 'bi',
                value: '1000000000000000000'
            }
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain("should have required property 'stakeRequiredUsd'")
    })

    test('Wrong type for stakeRequired should fail validation', () => {
        const obj = {
            stakeRequired: 1000000000000000000, // wrong type
            stakeRequiredUsd: {
                dataType: 'bi',
                value: '100000000000000000'
            }
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be object')
    })

    test('Wrong type for stakeRequiredUsd should fail validation', () => {
        const obj = {
            stakeRequired: {
                dataType: 'bi',
                value: '1000000000000000000'
            },
            stakeRequiredUsd: 100000000000000000 // wrong type
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should be object')
    })

    test('Additional properties should fail validation', () => {
        const obj = {
            stakeRequired: {
                dataType: 'bi',
                value: '1000000000000000000'
            },
            stakeRequiredUsd: {
                dataType: 'bi',
                value: '100000000000000000'
            },
            extraField: 'should not be here'
        }
        const errors = verifyPayload(AJVSchemaEnum.StakeResp, obj)
        expect(errors).not.toBeNull()
        expect(errors?.length).toBe(1)
        expect(errors?.[0]).toContain('should NOT have additional properties')
    })
})
