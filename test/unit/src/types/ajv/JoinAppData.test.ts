import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { initializeSerialization } from '../../../../../src/utils/serialization/SchemaHelpers'

/**
 * Test suite for JoinAppData schema
 *
 * Tests validation for the schemas defined in JoinAppData.ts:
 * 1. AppJoinData - schema for app join data
 * 2. AdminCert - schema used within AppJoinData
 */
describe('JoinAppData AJV tests', () => {
  beforeAll(() => {
    // Initialize all schemas and register them with AJV
    initAjvSchemas()
    initializeSerialization()
  })

  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks()
  })

  // Valid data components for reuse in tests
  const validSign = {
    owner: 'valid-owner-key',
    sig: 'valid-signature-data',
  }

  const validAdminCert = {
    nominee: 'valid-nominee',
    certCreation: 1000000,
    certExp: 2000000,
    sign: validSign,
    // goldenTicket is optional
  }

  // StakeCert mock - implementation doesn't matter as we're only testing schema validation
  const validStakeCert = {
    nominee: 'valid-nominee',
    stake: '1000000000000000000',
    certCreation: 1000000,
    certExp: 2000000,
    validStart: 1000000,
    sign: validSign,
  }

  describe('AppJoinData schema', () => {
    test('Valid AppJoinData with only required fields should pass validation', () => {
      const obj = {
        version: '1.0.0',
      }
      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).toBeNull()
    })

    test('Valid AppJoinData with null stakeCert and adminCert should pass validation', () => {
      const obj = {
        version: '1.0.0',
        stakeCert: null,
        adminCert: null,
        isAdminCertUnexpired: false,
      }
      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).toBeNull()
    })

    test('Missing required fields should fail validation', () => {
      const obj = {
        // version is required but missing
        stakeCert: validStakeCert,
        adminCert: validAdminCert,
      }
      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain("should have required property 'version'")
    })

    test('Invalid field types should fail validation', () => {
      const obj = {
        version: 123, // should be string
        isAdminCertUnexpired: 'true', // should be boolean
      }
      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.some((err) => err.includes('should be string'))).toBe(true)
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        version: '1.0.0',
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain('should NOT have additional properties')
    })
  })

  describe('AdminCert schema', () => {
    // Note: We're testing AdminCert indirectly via AppJoinData since AJVSchemaEnum doesn't
    // expose AdminCert directly. But we can still test it thoroughly.

    test('Valid AdminCert (via AppJoinData) should pass validation', () => {
      const obj = {
        version: '1.0.0',
        adminCert: validAdminCert,
      }
      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).toBeNull()
    })

    test('Valid AdminCert with goldenTicket (via AppJoinData) should pass validation', () => {
      const obj = {
        version: '1.0.0',
        adminCert: {
          ...validAdminCert,
          goldenTicket: true,
        },
      }
      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).toBeNull()
    })

    test('Invalid AdminCert missing required fields (via AppJoinData) should fail validation', () => {
      // Missing the 'nominee' field which is required
      const invalidAdminCert = {
        certCreation: 1000000,
        certExp: 2000000,
        sign: validSign,
      }

      const obj = {
        version: '1.0.0',
        adminCert: invalidAdminCert,
      }

      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.some((err) => err.includes("should have required property 'nominee'"))).toBe(true)
    })

    test('Invalid AdminCert with negative certExp (via AppJoinData) should fail validation', () => {
      const invalidAdminCert = {
        ...validAdminCert,
        certExp: -1, // should be >= 0
      }

      const obj = {
        version: '1.0.0',
        adminCert: invalidAdminCert,
      }

      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.some((err) => err.includes('should be >= 0'))).toBe(true)
    })

    test('Invalid AdminCert with non-integer certCreation (via AppJoinData) should fail validation', () => {
      const invalidAdminCert = {
        ...validAdminCert,
        certCreation: 10.5, // should be integer
      }

      const obj = {
        version: '1.0.0',
        adminCert: invalidAdminCert,
      }

      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.some((err) => err.includes('should be integer'))).toBe(true)
    })

    test('Invalid AdminCert with invalid sign (via AppJoinData) should fail validation', () => {
      const invalidAdminCert = {
        ...validAdminCert,
        sign: {
          // Missing 'sig' field which is required in schemaSign
          owner: 'valid-owner',
        },
      }

      const obj = {
        version: '1.0.0',
        adminCert: invalidAdminCert,
      }

      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.some((err) => err.includes("should have required property 'sig'"))).toBe(true)
    })

    test('Invalid AdminCert with additional properties (via AppJoinData) should fail validation', () => {
      const invalidAdminCert = {
        ...validAdminCert,
        extraField: 'should not be here',
      }

      const obj = {
        version: '1.0.0',
        adminCert: invalidAdminCert,
      }

      const errors = verifyPayload(AJVSchemaEnum.AppJoinData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.some((err) => err.includes('should NOT have additional properties'))).toBe(true)
    })
  })
})
