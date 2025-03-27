import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'

/**
 * Test suite for InjectTxReq schema
 *
 * Tests validation for the InjectTxReq schema with focus on:
 * 1. Valid objects passing validation
 * 2. Type validation for defined properties
 * 3. Verifying additional properties are allowed (additionalProperties: true)
 * 4. Edge cases with empty objects and minimal required fields
 */
describe('InjectTxReq AJV tests', () => {
  beforeAll(() => {
    // Initialize all schemas before running tests
    initAjvSchemas()
  })

  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks()
  })

  test('Valid object with all properties should pass validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: {
        isInternalTx: true,
        nominee: 'nominee',
      },
      raw: 'raw-transaction-data',
      isInternalTx: true,
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Empty object should pass validation (no required fields)', () => {
    const obj = {}
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Object with only timestamp should pass validation', () => {
    const obj = {
      timestamp: 1234567890,
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Object with only tx should pass validation', () => {
    const obj = {
      tx: { data: 'transaction-data' },
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Object with only raw should pass validation', () => {
    const obj = {
      raw: 'raw-transaction-data',
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Object with only isInternalTx should pass validation', () => {
    const obj = {
      isInternalTx: true,
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Object with additional properties should pass validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: { data: 'transaction-data' },
      raw: 'raw-transaction-data',
      isInternalTx: true,
      additionalProperty1: 'extra-data',
      additionalProperty2: 123,
      additionalProperty3: { nested: 'object' },
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Invalid timestamp type should fail validation', () => {
    const obj = {
      timestamp: 'not-a-number', // should be number
      tx: { data: 'transaction-data' },
      raw: 'raw-transaction-data',
      isInternalTx: true,
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain('should be number')
  })

  test('Invalid tx type should fail validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: 'not-an-object', // should be object
      raw: 'raw-transaction-data',
      isInternalTx: true,
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain('should be object')
  })

  test('Invalid raw type should fail validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: { data: 'transaction-data' },
      raw: 123, // should be string
      isInternalTx: true,
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain('should be string')
  })

  test('Invalid isInternalTx type should fail validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: { data: 'transaction-data' },
      raw: 'raw-transaction-data',
      isInternalTx: 'not-a-boolean', // should be boolean
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.length).toBe(1)
    expect(errors?.[0]).toContain('should be boolean')
  })

  test('Complex object with various values should pass validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: {
        isInternalTx: true,
        data: 'transaction-data',
        nestedObj: {
          value1: 123,
          value2: 'string',
          value3: true,
        },
        arrayData: [1, 2, 3],
      },
      raw: 'raw-transaction-data',
      isInternalTx: false,
      extraField1: 'additional data is allowed',
      extraField2: [4, 5, 6],
      extraField3: { extra: 'object' },
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Edge case: zero timestamp should pass validation', () => {
    const obj = {
      timestamp: 0, // valid number, even though 0
      tx: { data: 'transaction-data' },
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Edge case: empty tx object should pass validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: {}, // empty object is valid
      raw: 'raw-transaction-data',
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

  test('Edge case: empty string for raw should pass validation', () => {
    const obj = {
      timestamp: 1234567890,
      tx: { data: 'transaction-data' },
      raw: '', // empty string is valid
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })
})
