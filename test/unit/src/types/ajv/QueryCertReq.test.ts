import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { initializeSerialization } from '../../../../../src/utils/serialization/SchemaHelpers'
import { initQueryCertReq } from '../../../../../src/types/ajv/QueryCertReq'

/**
 * Test suite for QueryCertReq schema
 * 
 * Tests validation for the schema defined in QueryCertReq.ts:
 * - An empty object schema with no properties or required fields
 * - No additional properties allowed
 */
describe('QueryCertReq AJV tests', () => {
  beforeAll(() => {
    // Initialize all schemas and register them with AJV
    initAjvSchemas()
    initializeSerialization()
    
    // Explicitly initialize the QueryCertReq schema
    initQueryCertReq()
  })
  
  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks()
  })

  test('Empty object should pass validation', () => {
    const obj = {}
    const errors = verifyPayload(AJVSchemaEnum.QueryCertReq, obj)
    expect(errors).toBeNull()
  })

  test('Array should fail validation (type should be object)', () => {
    const obj = []
    const errors = verifyPayload(AJVSchemaEnum.QueryCertReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.[0]).toContain('should be object')
  })

  test('Null should fail validation (type should be object)', () => {
    const obj = null
    const errors = verifyPayload(AJVSchemaEnum.QueryCertReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.[0]).toContain('should be object')
  })

  test('String should fail validation (type should be object)', () => {
    const obj = 'not an object'
    const errors = verifyPayload(AJVSchemaEnum.QueryCertReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.[0]).toContain('should be object')
  })

  test('Number should fail validation (type should be object)', () => {
    const obj = 123
    const errors = verifyPayload(AJVSchemaEnum.QueryCertReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.[0]).toContain('should be object')
  })

  test('Boolean should fail validation (type should be object)', () => {
    const obj = true
    const errors = verifyPayload(AJVSchemaEnum.QueryCertReq, obj)
    expect(errors).not.toBeNull()
    expect(errors?.[0]).toContain('should be object')
  })
}) 