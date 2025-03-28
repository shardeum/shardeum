import { describe, beforeAll, beforeEach, test, expect, jest } from '@jest/globals'
import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import { InternalTXType } from '../../../../../src/shardeum/shardeumTypes'

/**
 * Test suite for ClaimRewardTxSchema
 *
 * Tests schema validation for the ClaimRewardTx and NodeRewardTxData schemas
 * Focus on validating required fields, data types, and preventing additional properties
 */
describe('ClaimRewardTx AJV tests', () => {
  beforeAll(() => {
    // Initialize all schemas before running tests
    initAjvSchemas()
  })

  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks()
  })

  // Valid data sample for nodeRewardTxData
  const validTxData = {
    publicKey: 'valid-public-key',
    nodeId: 'valid-node-id',
    endTime: 1234567890,
  }

  // Valid data sample for sign
  const validSign = {
    owner: 'valid-owner',
    sig: 'valid-signature',
  }

  describe('NodeRewardTxData schema', () => {
    test('Valid NodeRewardTxData object should pass validation', () => {
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, validTxData)
      expect(errors).toBeNull()
    })

    test('Missing publicKey field should fail validation', () => {
      const invalidObj = {
        nodeId: 'valid-node-id',
        endTime: 1234567890,
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should have required property 'publicKey'")
    })

    test('Missing nodeId field should fail validation', () => {
      const invalidObj = {
        publicKey: 'valid-public-key',
        endTime: 1234567890,
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should have required property 'nodeId'")
    })

    test('Missing endTime field should fail validation', () => {
      const invalidObj = {
        publicKey: 'valid-public-key',
        nodeId: 'valid-node-id',
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain("should have required property 'endTime'")
    })

    test('Invalid publicKey type should fail validation', () => {
      const invalidObj = {
        publicKey: 123, // should be string
        nodeId: 'valid-node-id',
        endTime: 1234567890,
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain('should be string')
    })

    test('Invalid nodeId type should fail validation', () => {
      const invalidObj = {
        publicKey: 'valid-public-key',
        nodeId: 123, // should be string
        endTime: 1234567890,
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain('should be string')
    })

    test('Invalid endTime type should fail validation', () => {
      const invalidObj = {
        publicKey: 'valid-public-key',
        nodeId: 'valid-node-id',
        endTime: '1234567890', // should be number
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain('should be number')
    })

    test('Additional properties should fail validation', () => {
      const invalidObj = {
        publicKey: 'valid-public-key',
        nodeId: 'valid-node-id',
        endTime: 1234567890,
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.NodeRewardTxData, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.length).toBe(1)
      expect(errors?.[0]).toContain('should NOT have additional properties')
    })
  })

  describe('ClaimRewardTx schema', () => {
    // Valid ClaimRewardTx object
    const validObj = {
      isInternalTx: true,
      internalTXType: InternalTXType.ClaimReward,
      nominee: 'valid-nominee',
      nominator: 'valid-nominator',
      timestamp: 1234567890,
      cycle: 123,
      deactivatedNodeId: 'valid-deactivated-node-id',
      nodeDeactivatedTime: 1234567000,
      txData: validTxData,
      sign: validSign,
    }

    test('Valid ClaimRewardTx object should pass validation', () => {
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, validObj)
      expect(errors).toBeNull()
    })

    test('Missing isInternalTx field should fail validation', () => {
      const invalidObj = {
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'isInternalTx'"))).toBeDefined()
    })

    test('Invalid isInternalTx value should fail validation', () => {
      const invalidObj = {
        isInternalTx: false, // must be true
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes('should be equal to one of the allowed values'))).toBeDefined()
    })

    test('Missing internalTXType field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'internalTXType'"))).toBeDefined()
    })

    test('Invalid internalTXType value should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.Stake, // should be ClaimReward
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes('should be equal to one of the allowed values'))).toBeDefined()
    })

    test('Missing nominee field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'nominee'"))).toBeDefined()
    })

    test('Missing nominator field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'nominator'"))).toBeDefined()
    })

    test('Missing timestamp field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'timestamp'"))).toBeDefined()
    })

    test('Invalid timestamp value should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 0, // should be > 0
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes('should be > 0'))).toBeDefined()
    })

    test('Missing cycle field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'cycle'"))).toBeDefined()
    })

    test('Cycle field can be object, number, or string', () => {
      // Test with object
      const objCycleObj = {
        ...validObj,
        cycle: { cycleId: 123 },
      }
      expect(verifyPayload(AJVSchemaEnum.ClaimRewardTx, objCycleObj)).toBeNull()

      // Test with number
      const numberCycleObj = {
        ...validObj,
        cycle: 123,
      }
      expect(verifyPayload(AJVSchemaEnum.ClaimRewardTx, numberCycleObj)).toBeNull()

      // Test with string
      const stringCycleObj = {
        ...validObj,
        cycle: '123',
      }
      expect(verifyPayload(AJVSchemaEnum.ClaimRewardTx, stringCycleObj)).toBeNull()
    })

    test('Missing deactivatedNodeId field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'deactivatedNodeId'"))).toBeDefined()
    })

    test('Missing nodeDeactivatedTime field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        txData: validTxData,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'nodeDeactivatedTime'"))).toBeDefined()
    })

    test('Missing txData field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'txData'"))).toBeDefined()
    })

    test('Invalid txData type should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: 'not-an-object', // should be object
        sign: validSign,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes('should be object'))).toBeDefined()
    })

    test('Missing sign field should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes("should have required property 'sign'"))).toBeDefined()
    })

    test('Additional properties should fail validation', () => {
      const invalidObj = {
        isInternalTx: true,
        internalTXType: InternalTXType.ClaimReward,
        nominee: 'valid-nominee',
        nominator: 'valid-nominator',
        timestamp: 1234567890,
        cycle: 123,
        deactivatedNodeId: 'valid-deactivated-node-id',
        nodeDeactivatedTime: 1234567000,
        txData: validTxData,
        sign: validSign,
        extraField: 'should not be here',
      }
      const errors = verifyPayload(AJVSchemaEnum.ClaimRewardTx, invalidObj)
      expect(errors).not.toBeNull()
      expect(errors?.find((err) => err.includes('should NOT have additional properties'))).toBeDefined()
    })
  })
})
