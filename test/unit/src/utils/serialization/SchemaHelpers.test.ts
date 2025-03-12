import Ajv from 'ajv'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'
import {
  getVerifyFunction,
  addSchema,
  initializeSerialization,
} from '../../../../../src/utils/serialization/SchemaHelpers'

describe('SchemaHelpers', () => {
  beforeEach(() => {
    // Clear any existing schemas between tests
    jest.clearAllMocks()
  })

  describe('initializeSerialization', () => {
    it('should initialize serialization by adding schemas to AJV', () => {
      const ajvSpy = jest.spyOn(Ajv.prototype, 'addSchema')

      addSchema(AJVSchemaEnum.InjectTxReq, {
        type: 'object',
        properties: { timestamp: { type: 'number' } },
        required: ['timestamp'],
      })
      addSchema(AJVSchemaEnum.PenaltyTx, {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      })

      initializeSerialization()
      expect(ajvSpy).toHaveBeenCalledTimes(2)
    })

    // TODO: fix the code to handle empty schema map gracefully.  cant test this until we expose schemaMap
    // it('should handle empty schema map gracefully', () => {
    //   const ajvSpy = jest.spyOn(Ajv.prototype, 'addSchema')
    //   initializeSerialization()
    //   expect(ajvSpy).not.toHaveBeenCalled()
    // })
  })

  describe('addSchema and getVerifyFunction', () => {
    const testSchema = {
      type: 'object',
      properties: { testProp: { type: 'string' } },
      required: ['testProp'],
    }
    const testSchemaName1 = 'TestSchema1'
    const testSchemaName2 = 'TestSchema2'
    const testSchemaName3 = 'TestSchema3'

    // FIX ME: wont work until we expose schemaMap
    // it('should add a schema to the schema map', () => {
    //   addSchema(testSchemaName1, testSchema)
    //   // eslint-disable-next-line security/detect-object-injection
    //   expect((addSchema as any).schemaMap.get(testSchemaName1)).toBe(testSchema)
    // })

    it('should throw an error if trying to add a schema with a duplicate name', () => {
      addSchema(testSchemaName2, testSchema)
      expect(() => addSchema(testSchemaName2, testSchema)).toThrowError(
        `error already registered ${testSchemaName2}`
      )
    })

    it('should return a validator function for a schema added', () => {
      addSchema(testSchemaName3, testSchema)
      const validator = getVerifyFunction(testSchemaName3)
      expect(typeof validator).toBe('function')
    })

    it('should throw an error if trying to get a validator function for a non-existent schema', () => {
      expect(() => getVerifyFunction('NonExistentSchema')).toThrowError(
        'error missing schema NonExistentSchema'
      )
    })

    it('should validate data against schema correctly', () => {
      addSchema('ValidationTest', {
        type: 'object',
        properties: {
          age: { type: 'number' },
          name: { type: 'string' },
        },
        required: ['age', 'name'],
      })

      const validator = getVerifyFunction('ValidationTest')

      // Valid data should pass
      expect(validator({ age: 25, name: 'test' })).toBe(true)

      // Invalid data should fail
      expect(validator({ age: '25', name: 'test' })).toBe(false)
      expect(validator({ age: 25 })).toBe(false)
      expect(validator({})).toBe(false)
    })

    it('should handle complex nested schema validation', () => {
      const complexSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              address: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                },
                required: ['street', 'city'],
              },
            },
            required: ['address'],
          },
        },
        required: ['user'],
      }

      addSchema('ComplexSchema', complexSchema)
      const validator = getVerifyFunction('ComplexSchema')

      // Valid nested data
      expect(
        validator({
          user: {
            address: {
              street: '123 Main St',
              city: 'Test City',
            },
          },
        })
      ).toBe(true)

      // Invalid nested data
      expect(
        validator({
          user: {
            address: {
              street: '123 Main St',
            },
          },
        })
      ).toBe(false)
    })
  })
})
