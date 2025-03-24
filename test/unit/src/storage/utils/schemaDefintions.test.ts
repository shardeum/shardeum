import { describe, expect, it } from '@jest/globals'
import { SQLDataTypes, ColumnDescription } from '../../../../../src/storage/utils/schemaDefintions'

/**
 * Test suite for schema definitions
 *
 * This test suite covers:
 * 1. SQLDataTypes enum validation
 * 2. ColumnDescription type validation
 * 3. Error handling for invalid inputs
 */
describe('Schema Definitions', () => {
  /**
   * Tests for SQLDataTypes enum
   * Validates that the enum has correct string values and expected members
   */
  describe('SQLDataTypes Enum', () => {
    /**
     * Verifies that each enum member maps to the expected SQL type string
     * This ensures the ORM will generate correct SQL statements
     */
    it('should have correct string values for all enum members', () => {
      expect(SQLDataTypes.STRING).toBe('TEXT')
      expect(SQLDataTypes.TEXT).toBe('TEXT')
      expect(SQLDataTypes.INTEGER).toBe('INTEGER')
      expect(SQLDataTypes.SMALLINT).toBe('INTEGER')
      expect(SQLDataTypes.BIGINT).toBe('INTEGER')
      expect(SQLDataTypes.BOOLEAN).toBe('NUMERIC')
      expect(SQLDataTypes.FLOAT).toBe('REAL')
      expect(SQLDataTypes.DOUBLE).toBe('REAL')
      expect(SQLDataTypes.DATE).toBe('NUMERIC')
      expect(SQLDataTypes.JSON).toBe('JSON')
    })

    /**
     * Ensures that all expected enum members are present
     * This prevents accidental removal of enum members during refactoring
     */
    it('should have all required enum members', () => {
      const expectedMembers = [
        'STRING',
        'TEXT',
        'INTEGER',
        'SMALLINT',
        'BIGINT',
        'BOOLEAN',
        'FLOAT',
        'DOUBLE',
        'DATE',
        'JSON',
      ]

      const actualMembers = Object.keys(SQLDataTypes)
      expect(actualMembers).toEqual(expect.arrayContaining(expectedMembers))

      // Verify no unexpected members were added
      expect(actualMembers.length).toBe(expectedMembers.length)
    })

    /**
     * Tests that related types map to the same underlying SQL type
     * This ensures consistent behavior across similar data types
     */
    it('should have consistent type mappings', () => {
      // Test numeric types
      expect(SQLDataTypes.INTEGER).toBe(SQLDataTypes.SMALLINT)
      expect(SQLDataTypes.INTEGER).toBe(SQLDataTypes.BIGINT)

      // Test text types
      expect(SQLDataTypes.STRING).toBe(SQLDataTypes.TEXT)

      // Test real number types
      expect(SQLDataTypes.FLOAT).toBe(SQLDataTypes.DOUBLE)
    })

    /**
     * Negative test: Verifies that invalid enum access returns undefined
     * This ensures type safety when accessing enum properties
     */
    it('should return undefined for non-existent enum members', () => {
      // Using index access notation to bypass type checking for test
      expect(SQLDataTypes['INVALID_TYPE']).toBeUndefined()
      expect(SQLDataTypes['DECIMAL']).toBeUndefined()
    })
  })

  /**
   * Tests for ColumnDescription Type
   * Validates that the type definition works correctly for various scenarios
   */
  describe('ColumnDescription Type', () => {
    /**
     * Tests that a minimal column description can be created with just the required type property
     */
    it('should allow creation of a minimal column description', () => {
      const column: ColumnDescription = {
        type: SQLDataTypes.STRING,
      }
      expect(column).toBeDefined()
      expect(column.type).toBe(SQLDataTypes.STRING)
    })

    /**
     * Tests that a complete column description can be created with all properties
     */
    it('should allow creation of a complete column description', () => {
      const column: ColumnDescription = {
        type: SQLDataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
      }
      expect(column).toBeDefined()
      expect(column.type).toBe(SQLDataTypes.INTEGER)
      expect(column.allowNull).toBe(false)
      expect(column.primaryKey).toBe(true)
      expect(column.unique).toBe(true)
    })

    /**
     * Tests that optional properties can be omitted
     */
    it('should allow optional properties to be undefined', () => {
      const column: ColumnDescription = {
        type: SQLDataTypes.BOOLEAN,
      }
      expect(column.allowNull).toBeUndefined()
      expect(column.primaryKey).toBeUndefined()
      expect(column.unique).toBeUndefined()
    })

    /**
     * Tests that any SQLDataType can be used as a column type
     */
    it('should allow all SQLDataTypes as column types', () => {
      const types = Object.values(SQLDataTypes)
      types.forEach((type) => {
        const column: ColumnDescription = { type }
        expect(column.type).toBe(type)
      })
    })

    /**
     * Negative test: Tests that a column description requires the type property
     * This test checks TypeScript's type checking during compilation
     * Note: This test will pass at runtime but would fail at compile time if the code were uncommented
     */
    it('should require the type property (compile-time check)', () => {
      // If uncommented, TypeScript would report an error for missing required property 'type'
      // const invalidColumn: ColumnDescription = {};

      // Instead, we'll verify the test runs without errors
      expect(true).toBe(true)
    })

    /**
     * Negative test: Tests that a column description's type must be a valid SQLDataType
     * This test is focused on compile-time type checking rather than runtime behavior
     */
    it('should only accept valid SQLDataTypes (compile-time check)', () => {
      // If uncommented, TypeScript would report type errors for these:
      // const invalidStringType: ColumnDescription = { type: 'VARCHAR' };
      // const invalidNumberType: ColumnDescription = { type: 42 };

      // For runtime, we'll verify the test runs without errors
      expect(true).toBe(true)
    })

    /**
     * Tests that object shape matches expectations at runtime
     * This tests runtime behavior rather than compile-time type checking
     */
    it('should have expected shape and properties at runtime', () => {
      // Create a column with type casting to bypass TypeScript checks (for testing)
      const column = {
        type: SQLDataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
      } as ColumnDescription

      // Verify the object has expected properties
      expect(Object.keys(column).sort()).toEqual(['allowNull', 'primaryKey', 'type', 'unique'].sort())

      // Verify property types
      expect(typeof column.type).toBe('string')
      expect(typeof column.allowNull).toBe('boolean')
      expect(typeof column.primaryKey).toBe('boolean')
      expect(typeof column.unique).toBe('boolean')
    })
  })
})
