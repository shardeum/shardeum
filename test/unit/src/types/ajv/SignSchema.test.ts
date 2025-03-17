import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'

describe('Sign AJV tests', () => {
  beforeAll(() => {
    initAjvSchemas()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Valid sign object should pass validation', () => {
    const obj = {
      owner: '0x1234567890abcdef',
      sig: 'validSignature123',
    }
    const errors = verifyPayload(AJVSchemaEnum.Sign, obj)
    expect(errors).toBeNull()
  })

  test('Missing owner should fail validation', () => {
    const obj = {
      sig: 'validSignature123',
    }
    const errors = verifyPayload(AJVSchemaEnum.Sign, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain("should have required property 'owner'")
  })

  test('Missing signature should fail validation', () => {
    const obj = {
      owner: '0x1234567890abcdef',
    }
    const errors = verifyPayload(AJVSchemaEnum.Sign, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain("should have required property 'sig'")
  })

  test('Additional properties should fail validation', () => {
    const obj = {
      owner: '0x1234567890abcdef',
      sig: 'validSignature123',
      extraField: 'should not be here',
    }
    const errors = verifyPayload(AJVSchemaEnum.Sign, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain('should NOT have additional properties')
  })

  test('Invalid owner type should fail validation', () => {
    const obj = {
      owner: 123,
      sig: 'validSignature123',
    }
    const errors = verifyPayload(AJVSchemaEnum.Sign, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain('should be string')
  })

  test('Invalid signature type should fail validation', () => {
    const obj = {
      owner: '0x1234567890abcdef',
      sig: 123,
    }
    const errors = verifyPayload(AJVSchemaEnum.Sign, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain('should be string')
  })
})
