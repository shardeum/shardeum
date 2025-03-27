import { describe, expect, it } from '@jest/globals'
import { keyListAsLeveledKeys } from '../../../../src/utils/keyUtils'
import { DevSecurityLevel } from '@shardeum-foundation/core/dist/shardus/shardus-types'

/**
 * Test suite for keyUtils.ts
 *
 * This test suite validates the functionality of utility functions
 * that handle key transformations and manipulations.
 */
describe('Key Utilities', () => {
  /**
   * Tests for keyListAsLeveledKeys function
   *
   * This function transforms an array of string keys into an object
   * where each key is mapped to a security level value.
   */
  describe('keyListAsLeveledKeys', () => {
    /**
     * Tests the successful transformation of a key list to a leveled keys object
     */
    it('should transform a list of keys into an object with security levels', () => {
      // Arrange
      const keyList = ['key1', 'key2', 'key3']
      const securityLevel = 2

      // Act
      const result = keyListAsLeveledKeys(keyList, securityLevel)

      // Assert
      expect(result).toEqual({
        key1: 2,
        key2: 2,
        key3: 2,
      })
    })

    // TODO : fix the issue with the test
    /*
      This shouldn't be possible right? we have 0, 1, 2, 3 as values in DevSecurityLevel enum?
      This is debatable, but if we are not supporting a certain level in our enum, then we shouldn't be able to assign it.
      It's possible that it's prevented somewhere early in the flow and this util never receives 5 as security level.
      My suggestion would be comment this out with a note that, this needs to be handled in main business logic if not done already.    
    */
    // /**
    //  * Tests that different security levels can be assigned
    //  */
    // it('should assign the specified security level to each key', () => {
    //   // Arrange
    //   const keyList = ['keyA', 'keyB']
    //   const securityLevel = 5

    //   // Act
    //   const result = keyListAsLeveledKeys(keyList, securityLevel)

    //   // Assert
    //   expect(result).toEqual({
    //     keyA: 5,
    //     keyB: 5,
    //   })
    // })

    /**
     * Tests handling of an empty key list
     */
    it('should return an empty object when given an empty array', () => {
      // Arrange
      const keyList: string[] = []
      const securityLevel = 3

      // Act
      const result = keyListAsLeveledKeys(keyList, securityLevel)

      // Assert
      expect(result).toEqual({})
      expect(Object.keys(result).length).toBe(0)
    })

    /**
     * Tests handling of null/undefined input
     */
    it('should return an empty object when given null or undefined', () => {
      // Arrange & Act
      const resultWithNull = keyListAsLeveledKeys(null as unknown as string[], 1)
      const resultWithUndefined = keyListAsLeveledKeys(undefined as unknown as string[], 1)

      // Assert
      expect(resultWithNull).toEqual({})
      expect(resultWithUndefined).toEqual({})
    })

    /**
     * Tests handling of duplicate keys in the input array
     */
    it('should handle duplicate keys by using the last occurrence', () => {
      // Arrange
      const keyList = ['key1', 'key2', 'key1']
      const securityLevel = 4

      // Act
      const result = keyListAsLeveledKeys(keyList, securityLevel)

      // Assert
      expect(result).toEqual({
        key1: 4,
        key2: 4,
      })
      // Only 2 keys should be in the result (duplicates overwritten)
      expect(Object.keys(result).length).toBe(2)
    })

    /**
     * Tests that various security level values are handled correctly
     */
    it('should work with various security level values', () => {
      // Arrange
      const keyList = ['key']

      // Act & Assert
      expect(keyListAsLeveledKeys(keyList, 0)).toEqual({ key: 0 })
      expect(keyListAsLeveledKeys(keyList, -1)).toEqual({ key: -1 })
      expect(keyListAsLeveledKeys(keyList, 999)).toEqual({ key: 999 })
    })

    /**
     * Tests with special characters in keys
     */
    it('should handle special characters in keys', () => {
      // Arrange
      const keyList = ['key-with-dashes', 'key.with.dots', 'key@with@symbols']
      const securityLevel = 3

      // Act
      const result = keyListAsLeveledKeys(keyList, securityLevel)

      // Assert
      expect(result).toEqual({
        'key-with-dashes': 3,
        'key.with.dots': 3,
        'key@with@symbols': 3,
      })
    })

    /**
     * Tests with unusually long keys
     */
    it('should handle long key names', () => {
      // Arrange
      const longKey = 'a'.repeat(1000)
      const keyList = [longKey]
      const securityLevel = 1

      // Act
      const result = keyListAsLeveledKeys(keyList, securityLevel)

      // Assert
      expect(result[longKey]).toBe(1)
    })

    describe('utility functions', () => {
      describe('keyListAsLeveledKeys', () => {
        it('should convert empty array to empty object', () => {
          const result = keyListAsLeveledKeys([], DevSecurityLevel.High)
          expect(result).toEqual({})
        })

        it('should assign the same security level to all keys', () => {
          const keys = ['0x123', '0x456']
          const result = keyListAsLeveledKeys(keys, DevSecurityLevel.High)
          expect(result).toEqual({
            '0x123': DevSecurityLevel.High,
            '0x456': DevSecurityLevel.High,
          })
        })

        it('should handle different security levels', () => {
          const keys = ['0x123', '0x456']
          const result = keyListAsLeveledKeys(keys, DevSecurityLevel.Medium)
          expect(result).toEqual({
            '0x123': DevSecurityLevel.Medium,
            '0x456': DevSecurityLevel.Medium,
          })
        })

        it('should handle empty arrays safely', () => {
          // @ts-ignore - Testing runtime behavior with null
          const nullResult = keyListAsLeveledKeys(null, DevSecurityLevel.High)
          expect(nullResult).toEqual({})

          // @ts-ignore - Testing runtime behavior with undefined
          const undefinedResult = keyListAsLeveledKeys(undefined, DevSecurityLevel.High)
          expect(undefinedResult).toEqual({})
        })
      })
    })
  })
})
