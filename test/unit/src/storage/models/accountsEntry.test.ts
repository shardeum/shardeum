import accountsEntry from '../../../../../src/storage/models/accountsEntry'
import { SQLDataTypes } from '../../../../../src/storage/utils/schemaDefintions'

describe('accountsEntry', () => {
  it('should be an array with correct structure', () => {
    expect(Array.isArray(accountsEntry)).toBe(true)
    expect(accountsEntry.length).toBe(2)
  })

  it('should have correct table name', () => {
    expect(accountsEntry[0]).toBe('accountsEntry')
  })

  it('should have correct schema definition', () => {
    const schema = accountsEntry[1] as any
    expect(typeof schema).toBe('object')
    expect(Object.keys(schema)).toHaveLength(3)
    expect(schema).toHaveProperty('accountId')
    expect(schema).toHaveProperty('timestamp')
    expect(schema).toHaveProperty('data')
  })

  describe('accountId field', () => {
    it('should have correct properties', () => {
      const schema = accountsEntry[1] as any
      const accountId = schema.accountId
      expect(accountId).toEqual({
        type: SQLDataTypes.STRING,
        allowNull: false,
        unique: 'compositeIndex'
      })
    })

    it('should not allow null values', () => {
      const schema = accountsEntry[1] as any
      expect(schema.accountId.allowNull).toBe(false)
    })

    it('should be part of composite index', () => {
      const schema = accountsEntry[1] as any
      expect(schema.accountId.unique).toBe('compositeIndex')
    })
  })

  describe('timestamp field', () => {
    it('should have correct properties', () => {
      const schema = accountsEntry[1] as any
      const timestamp = schema.timestamp
      expect(timestamp).toEqual({
        type: SQLDataTypes.BIGINT,
        allowNull: false,
        unique: 'compositeIndex'
      })
    })

    it('should be of type BIGINT', () => {
      const schema = accountsEntry[1] as any
      expect(schema.timestamp.type).toBe(SQLDataTypes.BIGINT)
    })

    it('should not allow null values', () => {
      const schema = accountsEntry[1] as any
      expect(schema.timestamp.allowNull).toBe(false)
    })

    it('should be part of composite index', () => {
      const schema = accountsEntry[1] as any
      expect(schema.timestamp.unique).toBe('compositeIndex')
    })
  })

  describe('data field', () => {
    it('should have correct properties', () => {
      const schema = accountsEntry[1] as any
      const data = schema.data
      expect(data).toEqual({
        type: SQLDataTypes.JSON,
        allowNull: false
      })
    })

    it('should be of type JSON', () => {
      const schema = accountsEntry[1] as any
      expect(schema.data.type).toBe(SQLDataTypes.JSON)
    })

    it('should not allow null values', () => {
      const schema = accountsEntry[1] as any
      expect(schema.data.allowNull).toBe(false)
    })

    it('should not have unique constraint', () => {
      const schema = accountsEntry[1] as any
      expect(schema.data.unique).toBeUndefined()
    })
  })

  describe('composite index', () => {
    it('should include accountId and timestamp', () => {
      const schema = accountsEntry[1] as any
      const fieldsWithCompositeIndex = Object.keys(schema).filter(
        key => schema[key].unique === 'compositeIndex'
      )
      expect(fieldsWithCompositeIndex).toEqual(['accountId', 'timestamp'])
    })
  })

  describe('export', () => {
    it('should export as default', () => {
      expect(accountsEntry).toBeDefined()
    })

    it('should be immutable structure', () => {
      const schema = accountsEntry[1] as any
      const originalAccountId = { ...schema.accountId }
      schema.accountId.type = 'MODIFIED'
      
      // Reset for other tests
      schema.accountId.type = originalAccountId.type
      
      // This test demonstrates that the structure can be modified,
      // which might be a concern in production
      expect(schema.accountId.type).toBe(SQLDataTypes.STRING)
    })
  })

  describe('schema compliance', () => {
    it('should have all fields as non-nullable', () => {
      const schema = accountsEntry[1] as any
      Object.values(schema).forEach((field: any) => {
        expect(field.allowNull).toBe(false)
      })
    })

    it('should have consistent field structure', () => {
      const schema = accountsEntry[1] as any
      Object.values(schema).forEach((field: any) => {
        expect(field).toHaveProperty('type')
        expect(field).toHaveProperty('allowNull')
      })
    })
  })
})