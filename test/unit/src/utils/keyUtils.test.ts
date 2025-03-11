import { keyListAsLeveledKeys } from '../../../../src/utils/keyUtils'
import { DevSecurityLevel } from '@shardeum-foundation/core/dist/shardus/shardus-types'

describe('keyUtils utility functions', () => {
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
        '0x456': DevSecurityLevel.High
      })
    })

    it('should handle different security levels', () => {
      const keys = ['0x123', '0x456']
      const result = keyListAsLeveledKeys(keys, DevSecurityLevel.Medium)
      expect(result).toEqual({
        '0x123': DevSecurityLevel.Medium,
        '0x456': DevSecurityLevel.Medium
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