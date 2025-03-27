import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { initializeSerialization } from '../../../../../src/utils/serialization/SchemaHelpers'
import { InternalTXType, ViolationType } from '../../../../../src/shardeum/shardeumTypes'

/**
 * Test suite for PenaltyTXSchema and related schemas
 *
 * Tests validation for all the schemas defined in PenaltyTXSchema.ts:
 * 1. InternalTxBase - base schema for internal transactions
 * 2. LeftNetworkEarlyViolationData - specific violation type data
 * 3. SyncingTimeoutViolationData - specific violation type data
 * 4. NodeRefutedViolationData - specific violation type data
 * 5. PenaltyTX - complete penalty transaction schema
 */
describe('PenaltyTX AJV tests', () => {
  beforeAll(() => {
    // Initialize all schemas and register them with AJV
    initAjvSchemas()
    initializeSerialization()
  })

  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks()
  })

  // Valid data for different components
  const validSign = {
    owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5',
    sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968',
  }

  const validLeftNetworkViolationData = {
    nodeLostCycle: 81,
    nodeDroppedCycle: 82,
    nodeDroppedTime: 1730816853,
  }

  const validSyncingTimeoutViolationData = {
    nodeLostCycle: 81,
    nodeDroppedTime: 1730816853,
  }

  const validNodeRefutedViolationData = {
    nodeRefutedCycle: 82,
    nodeRefutedTime: 1730816853,
  }

  describe('InternalTxBase schema', () => {
    test('Valid InternalTxBase object should pass validation', () => {
      const obj = {
        isInternalTx: true,
        internalTXType: InternalTXType.Penalty,
      }
      const errors = verifyPayload(AJVSchemaEnum.InternalTxBase, obj)
      expect(errors).toBeNull()
    })

    test('Missing required fields should fail validation', () => {
      // Test missing isInternalTx
      const obj1 = {
        internalTXType: InternalTXType.Penalty,
      }
      const errors1 = verifyPayload(AJVSchemaEnum.InternalTxBase, obj1)
      expect(errors1).not.toBeNull()
      expect(errors1?.[0]).toContain("should have required property 'isInternalTx'")

      // Test missing internalTXType
      const obj2 = {
        isInternalTx: true,
      }
      const errors2 = verifyPayload(AJVSchemaEnum.InternalTxBase, obj2)
      expect(errors2).not.toBeNull()
      expect(errors2?.[0]).toContain("should have required property 'internalTXType'")
    })

    test('Invalid field types should fail validation', () => {
      const obj = {
        isInternalTx: 'not-a-boolean', // should be boolean
        internalTXType: 999, // Invalid type
      }
      const errors = verifyPayload(AJVSchemaEnum.InternalTxBase, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        isInternalTx: true,
        internalTXType: InternalTXType.Penalty,
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.InternalTxBase, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain('should NOT have additional properties')
    })
  })

  describe('LeftNetworkEarlyViolationData schema', () => {
    test('Valid LeftNetworkEarlyViolationData object should pass validation', () => {
      const errors = verifyPayload(AJVSchemaEnum.LeftNetworkEarlyViolationData, validLeftNetworkViolationData)
      expect(errors).toBeNull()
    })

    test('Missing required fields in LeftNetworkEarlyViolationData should fail validation', () => {
      const obj = { nodeDroppedTime: 1730816853 }
      const errors = verifyPayload(AJVSchemaEnum.LeftNetworkEarlyViolationData, obj)
      expect(errors).not.toBeNull()
    })

    test('Invalid field types should fail validation', () => {
      const obj = {
        nodeLostCycle: '81', // Should be number
        nodeDroppedCycle: '82', // Should be number
        nodeDroppedTime: '1730816853', // Should be number
      }
      const errors = verifyPayload(AJVSchemaEnum.LeftNetworkEarlyViolationData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      errors?.forEach((error) => {
        expect(error).toContain('should be number')
      })
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        ...validLeftNetworkViolationData,
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.LeftNetworkEarlyViolationData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain('should NOT have additional properties')
    })
  })

  describe('SyncingTimeoutViolationData schema', () => {
    test('Valid SyncingTimeoutViolationData object should pass validation', () => {
      const errors = verifyPayload(AJVSchemaEnum.SyncingTimeoutViolationData, validSyncingTimeoutViolationData)
      expect(errors).toBeNull()
    })

    test('Missing required fields in SyncingTimeoutViolationData should fail validation', () => {
      const obj = { nodeLostCycle: 81 }
      const errors = verifyPayload(AJVSchemaEnum.SyncingTimeoutViolationData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain("should have required property 'nodeDroppedTime'")
    })

    test('Invalid field types should fail validation', () => {
      const obj = {
        nodeLostCycle: '81', // Should be number
        nodeDroppedTime: '1730816853', // Should be number
      }
      const errors = verifyPayload(AJVSchemaEnum.SyncingTimeoutViolationData, obj)
      expect(errors).not.toBeNull()
      console.log('The errors re', errors)
      expect(errors?.length).toBe(1)
      errors?.forEach((error) => {
        expect(error).toContain('should be number')
      })
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        ...validSyncingTimeoutViolationData,
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.SyncingTimeoutViolationData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain('should NOT have additional properties')
    })
  })

  describe('NodeRefutedViolationData schema', () => {
    test('Valid NodeRefutedViolationData object should pass validation', () => {
      const errors = verifyPayload(AJVSchemaEnum.NodeRefutedViolationData, validNodeRefutedViolationData)
      expect(errors).toBeNull()
    })

    test('Missing required fields in NodeRefutedViolationData should fail validation', () => {
      const obj = { nodeRefutedTime: 1730816853 }
      const errors = verifyPayload(AJVSchemaEnum.NodeRefutedViolationData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain("should have required property 'nodeRefutedCycle'")
    })

    test('Invalid field types should fail validation', () => {
      const obj = {
        nodeRefutedCycle: '82', // Should be number
        nodeRefutedTime: '1730816853', // Should be number
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRefutedViolationData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      errors?.forEach((error) => {
        expect(error).toContain('should be number')
      })
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        ...validNodeRefutedViolationData,
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRefutedViolationData, obj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain('should NOT have additional properties')
    })
  })

  describe('PenaltyTX schema', () => {
    // Base valid object for tests
    const baseValidObj = {
      internalTXType: InternalTXType.Penalty,
      isInternalTx: true,
      operatorEVMAddress: '0x2f97a188a40dcceb533f47a8dabe24b0e165d569',
      reportedNodeId: '9db68adb8b550cb215607c6aafea9b42ec67bc8bf3b6ae36c48c7e490d484fda',
      reportedNodePublickKey: '4cc0375f00817f70eb88a7191eddb9cabd6730adfe69afc43517894d2c2e112a',
      sign: validSign,
      timestamp: 1730816913000,
    }

    // Test all violation types in a single parameterized test
    test('Valid PenaltyTX with different violation types should pass validation', () => {
      // Test cases for different violation types
      const testCases = [
        {
          violationType: ViolationType.LeftNetworkEarly,
          violationData: validLeftNetworkViolationData,
        },
        {
          violationType: ViolationType.SyncingTooLong,
          violationData: validSyncingTimeoutViolationData,
        },
        {
          violationType: ViolationType.NodeRefuted,
          violationData: validNodeRefutedViolationData,
        },
      ]

      // Run each test case
      testCases.forEach(({ violationType, violationData }) => {
        const obj = {
          ...baseValidObj,
          violationType,
          violationData,
        }
        const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj)
        expect(errors).toBeNull()
      })
    })

    test('Invalid reportedNodeId length should fail validation', () => {
      const obj = {
        ...baseValidObj,
        reportedNodeId: '9db8adb8b550cb215607c6aafea9b42ec67bc8bf3b6ae36c48c7e490d484fda', // Incorrect length
        violationData: validLeftNetworkViolationData,
        violationType: ViolationType.LeftNetworkEarly,
      }
      const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj)
      expect(errors).not.toBeNull()
    })

    test('Missing required fields should fail validation', () => {
      // Test a representative required field - creating object without reportedNodeId
      const obj = {
        internalTXType: InternalTXType.Penalty,
        isInternalTx: true,
        operatorEVMAddress: '0x2f97a188a40dcceb533f47a8dabe24b0e165d569',
        // reportedNodeId intentionally omitted
        reportedNodePublickKey: '4cc0375f00817f70eb88a7191eddb9cabd6730adfe69afc43517894d2c2e112a',
        sign: validSign,
        timestamp: 1730816913000,
        violationData: validLeftNetworkViolationData,
        violationType: ViolationType.LeftNetworkEarly,
      }

      const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain("should have required property 'reportedNodeId'")
    })

    test('Invalid timestamp value (0) should fail validation', () => {
      const obj = {
        ...baseValidObj,
        timestamp: 0, // Should be > 0
        violationData: validLeftNetworkViolationData,
        violationType: ViolationType.LeftNetworkEarly,
      }
      const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain('should be > 0')
    })

    test('Invalid violationType should fail validation', () => {
      const obj = {
        ...baseValidObj,
        violationData: validLeftNetworkViolationData,
        violationType: 9999, // Invalid violation type
      }
      const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain('should be equal to one of the allowed values')
    })

    test('Additional properties should fail validation', () => {
      const obj = {
        ...baseValidObj,
        violationData: validLeftNetworkViolationData,
        violationType: ViolationType.LeftNetworkEarly,
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj)
      expect(errors).not.toBeNull()
      expect(errors?.[0]).toContain('should NOT have additional properties')
    })
  })
})
