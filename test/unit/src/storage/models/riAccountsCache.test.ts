import riAccountsCache from '../../../../../src/storage/models/riAccountsCache'
import { SQLDataTypes } from '../../../../../src/storage/utils/schemaDefintions'

describe('riAccountsCache model', () => {
  it('should be defined as an array with correct structure', () => {
    expect(Array.isArray(riAccountsCache)).toBe(true)
    expect(riAccountsCache).toHaveLength(2)
  })

  it('should have the correct table name', () => {
    expect(riAccountsCache[0]).toBe('riAccountsCache')
  })

  it('should have the correct schema definition', () => {
    const schema = riAccountsCache[1]
    expect(schema).toBeDefined()
    expect(typeof schema).toBe('object')
  })

  describe('Schema fields', () => {
    let schema: any

    beforeEach(() => {
      schema = riAccountsCache[1]
    })

    it('should have accountId field with correct properties', () => {
      expect(schema.accountId).toBeDefined()
      expect(schema.accountId.type).toBe(SQLDataTypes.STRING)
      expect(schema.accountId.allowNull).toBe(false)
      expect(schema.accountId.unique).toBe('compositeIndex')
    })

    it('should have timestamp field with correct properties', () => {
      expect(schema.timestamp).toBeDefined()
      expect(schema.timestamp.type).toBe(SQLDataTypes.BIGINT)
      expect(schema.timestamp.allowNull).toBe(false)
      expect(schema.timestamp.unique).toBe('compositeIndex')
    })

    it('should have data field with correct properties', () => {
      expect(schema.data).toBeDefined()
      expect(schema.data.type).toBe(SQLDataTypes.JSON)
      expect(schema.data.allowNull).toBe(false)
      expect(schema.data.unique).toBeUndefined()
    })

    it('should only have the expected fields', () => {
      const expectedFields = ['accountId', 'timestamp', 'data']
      const actualFields = Object.keys(schema)
      expect(actualFields).toEqual(expect.arrayContaining(expectedFields))
      expect(actualFields).toHaveLength(expectedFields.length)
    })
  })

  it('should create composite index on accountId and timestamp', () => {
    const schema = riAccountsCache[1]
    const fieldsWithCompositeIndex = Object.entries(schema)
      .filter(([_, config]: [string, any]) => config.unique === 'compositeIndex')
      .map(([field]) => field)
    
    expect(fieldsWithCompositeIndex).toContain('accountId')
    expect(fieldsWithCompositeIndex).toContain('timestamp')
    expect(fieldsWithCompositeIndex).toHaveLength(2)
  })

  it('should export the model as default', () => {
    expect(riAccountsCache).toBeTruthy()
  })
})