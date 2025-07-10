import { 
  isKeyChange, 
  isNonKeyChange, 
  isKeyChangeDetailed, 
  isMultisigKeyChangeDetailed,
  isDevKeyChangeDetailed,
  normalizeEthAddress,
  cleanMultiSigPermissions 
} from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { DevSecurityLevel } from '@shardeum-foundation/core'
import { ChangeConfig } from '../../../../src/shardeum/shardeumTypes'

describe('multisig.ts comprehensive tests', () => {
  describe('isKeyChange', () => {
    it('should return false when tx.config is missing', () => {
      const tx: ChangeConfig = {} as ChangeConfig
      const currentConfig = { debug: { multisigKeys: {} } }
      const multiSigPermissions = { changeMultiSigKeyList: ['0xKey1'] }
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isKeyChange: false, permittedKeys: [] })
    })

    it('should return false when tx.config is not a string', () => {
      const tx: ChangeConfig = { config: 123 as any } as ChangeConfig
      const currentConfig = { debug: { multisigKeys: {} } }
      const multiSigPermissions = { changeMultiSigKeyList: ['0xKey1'] }
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isKeyChange: false, permittedKeys: [] })
    })

    it('should return false when JSON parsing fails', () => {
      const tx: ChangeConfig = { config: 'invalid json' } as ChangeConfig
      const currentConfig = { debug: { multisigKeys: {} } }
      const multiSigPermissions = { changeMultiSigKeyList: ['0xKey1'] }
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isKeyChange: false, permittedKeys: [] })
    })

    it('should detect multisig key change and return permitted keys', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ debug: { multisigKeys: { '0xNewKey': 1 } } })
      } as ChangeConfig
      const currentConfig = { debug: { multisigKeys: { '0xOldKey': 1 } } }
      const multiSigPermissions = { 
        changeMultiSigKeyList: ['0xKey1', '0xKey2'],
        changeDevKeyList: ['0xKey3'] 
      }
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ 
        isKeyChange: true, 
        permittedKeys: ['0xKey1', '0xKey2'] 
      })
    })

    it('should detect dev key change and return permitted keys', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ debug: { devPublicKeys: { '0xNewKey': 1 } } })
      } as ChangeConfig
      const currentConfig = { debug: { devPublicKeys: { '0xOldKey': 1 } } }
      const multiSigPermissions = { 
        changeMultiSigKeyList: ['0xKey1'],
        changeDevKeyList: ['0xKey3', '0xKey4'] 
      }
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ 
        isKeyChange: true, 
        permittedKeys: ['0xKey3', '0xKey4'] 
      })
    })

    it('should return intersection when both multisig and dev keys change', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ 
          debug: { 
            multisigKeys: { '0xNewKey': 1 },
            devPublicKeys: { '0xNewDevKey': 1 }
          } 
        })
      } as ChangeConfig
      const currentConfig = { 
        debug: { 
          multisigKeys: { '0xOldKey': 1 },
          devPublicKeys: { '0xOldDevKey': 1 }
        } 
      }
      const multiSigPermissions = { 
        changeMultiSigKeyList: ['0xKey1', '0xKey2', '0xKey3'],
        changeDevKeyList: ['0xKey2', '0xKey3', '0xKey4'] 
      }
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ 
        isKeyChange: true, 
        permittedKeys: ['0xKey2', '0xKey3'] // intersection
      })
    })

    it('should return false when no key changes detected', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ debug: { someOtherConfig: 'value' } })
      } as ChangeConfig
      const currentConfig = { debug: { multisigKeys: { '0xKey': 1 } } }
      const multiSigPermissions = { changeMultiSigKeyList: ['0xKey1'] }
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isKeyChange: false, permittedKeys: [] })
    })

    it('should handle missing multiSigPermissions properties gracefully', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ debug: { multisigKeys: { '0xNewKey': 1 } } })
      } as ChangeConfig
      const currentConfig = { debug: { multisigKeys: { '0xOldKey': 1 } } }
      const multiSigPermissions = {} // missing properties
      
      const result = isKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ 
        isKeyChange: true, 
        permittedKeys: [] 
      })
    })
  })

  describe('isNonKeyChange', () => {
    it('should return false when tx.config is missing', () => {
      const tx: ChangeConfig = {} as ChangeConfig
      const currentConfig = { debug: {} }
      const multiSigPermissions = { changeNonKeyConfigs: ['0xKey1'] }
      
      const result = isNonKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isNonKeyChange: false, permittedKeys: [] })
    })

    it('should return false when tx.config is not a string', () => {
      const tx: ChangeConfig = { config: 123 as any } as ChangeConfig
      const currentConfig = { debug: {} }
      const multiSigPermissions = { changeNonKeyConfigs: ['0xKey1'] }
      
      const result = isNonKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isNonKeyChange: false, permittedKeys: [] })
    })

    it('should return false when JSON parsing fails', () => {
      const tx: ChangeConfig = { config: 'invalid json' } as ChangeConfig
      const currentConfig = { debug: {} }
      const multiSigPermissions = { changeNonKeyConfigs: ['0xKey1'] }
      
      const result = isNonKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isNonKeyChange: false, permittedKeys: [] })
    })

    it('should return false when key changes are detected', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ debug: { multisigKeys: { '0xNewKey': 1 } } })
      } as ChangeConfig
      const currentConfig = { debug: { multisigKeys: { '0xOldKey': 1 } } }
      const multiSigPermissions = { changeNonKeyConfigs: ['0xKey1'] }
      
      const result = isNonKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isNonKeyChange: false, permittedKeys: [] })
    })

    it('should return false when no changes detected', () => {
      const config = { debug: { someConfig: 'value' } }
      const tx: ChangeConfig = { 
        config: JSON.stringify(config)
      } as ChangeConfig
      const currentConfig = config
      const multiSigPermissions = { changeNonKeyConfigs: ['0xKey1'] }
      
      const result = isNonKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ isNonKeyChange: false, permittedKeys: [] })
    })

    it('should detect non-key changes and return permitted keys', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ debug: { someConfig: 'newValue' } })
      } as ChangeConfig
      const currentConfig = { debug: { someConfig: 'oldValue' } }
      const multiSigPermissions = { changeNonKeyConfigs: ['0xKey1', '0xKey2'] }
      
      const result = isNonKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ 
        isNonKeyChange: true, 
        permittedKeys: ['0xKey1', '0xKey2'] 
      })
    })

    it('should handle missing multiSigPermissions.changeNonKeyConfigs', () => {
      const tx: ChangeConfig = { 
        config: JSON.stringify({ debug: { someConfig: 'newValue' } })
      } as ChangeConfig
      const currentConfig = { debug: { someConfig: 'oldValue' } }
      const multiSigPermissions = {} // missing changeNonKeyConfigs
      
      const result = isNonKeyChange(tx, currentConfig, multiSigPermissions)
      expect(result).toEqual({ 
        isNonKeyChange: true, 
        permittedKeys: [] 
      })
    })
  })

  describe('isKeyChangeDetailed', () => {
    it('should return false when newConfig does not have the key type', () => {
      const oldConfig = { debug: { multisigKeys: { '0xKey': 1 } } }
      const newConfig = { debug: {} }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(false)
    })

    it('should return true when number of keys differs', () => {
      const oldConfig = { debug: { multisigKeys: { '0xKey1': 1 } } }
      const newConfig = { debug: { multisigKeys: { '0xKey1': 1, '0xKey2': 1 } } }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(true)
    })

    it('should return true when keys are added', () => {
      const oldConfig = { debug: { multisigKeys: { '0xKey1': 1 } } }
      const newConfig = { debug: { multisigKeys: { '0xKey1': 1, '0xKey2': 1 } } }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(true)
    })

    it('should return true when keys are removed', () => {
      const oldConfig = { debug: { multisigKeys: { '0xKey1': 1, '0xKey2': 1 } } }
      const newConfig = { debug: { multisigKeys: { '0xKey1': 1 } } }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(true)
    })

    it('should return true when key security level changes', () => {
      const oldConfig = { debug: { multisigKeys: { '0xKey1': 1 } } }
      const newConfig = { debug: { multisigKeys: { '0xKey1': 2 } } }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(true)
    })

    it('should return false when keys are identical', () => {
      const oldConfig = { debug: { multisigKeys: { '0xKey1': 1, '0xKey2': 2 } } }
      const newConfig = { debug: { multisigKeys: { '0xKey1': 1, '0xKey2': 2 } } }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(false)
    })

    it('should handle oldConfig with no keys gracefully', () => {
      const oldConfig = { debug: {} }
      const newConfig = { debug: { multisigKeys: { '0xKey1': 1 } } }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(true)
    })

    it('should handle missing debug property', () => {
      const oldConfig = {}
      const newConfig = { debug: { multisigKeys: { '0xKey1': 1 } } }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')).toBe(true)
    })
  })

  describe('isMultisigKeyChangeDetailed', () => {
    it('should call isKeyChangeDetailed with multisigKeys', () => {
      const oldConfig = { debug: { multisigKeys: { '0xKey1': 1 } } }
      const newConfig = { debug: { multisigKeys: { '0xKey1': 1, '0xKey2': 1 } } }
      
      expect(isMultisigKeyChangeDetailed(oldConfig, newConfig)).toBe(true)
    })
  })

  describe('isDevKeyChangeDetailed', () => {
    it('should call isKeyChangeDetailed with devKeys', () => {
      const oldConfig = { debug: { devKeys: { '0xKey1': 1 } } }
      const newConfig = { debug: { devKeys: { '0xKey1': 1, '0xKey2': 1 } } }
      
      expect(isDevKeyChangeDetailed(oldConfig, newConfig)).toBe(true)
    })
  })

  describe('normalizeEthAddress', () => {
    it('should return empty string for falsy input', () => {
      expect(normalizeEthAddress('')).toBe('')
      expect(normalizeEthAddress(null as any)).toBe('')
      expect(normalizeEthAddress(undefined as any)).toBe('')
    })

    it('should trim whitespace', () => {
      expect(normalizeEthAddress('  0xABC  ')).toBe('0xabc')
    })

    it('should add 0x prefix if missing', () => {
      expect(normalizeEthAddress('ABC123')).toBe('0xabc123')
    })

    it('should convert to lowercase', () => {
      expect(normalizeEthAddress('0xABC123')).toBe('0xabc123')
    })

    it('should handle addresses that already have 0x prefix', () => {
      expect(normalizeEthAddress('0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6'))
        .toBe('0x7efbb31431ac7c405e8eeba99531ff1254fca3b6')
    })

    it('should not double-add 0x prefix', () => {
      expect(normalizeEthAddress('0xabc')).toBe('0xabc')
      expect(normalizeEthAddress('0XABC')).toBe('0xabc')
    })
  })

  describe('cleanMultiSigPermissions edge cases', () => {
    it('should throw error for non-array permission values', () => {
      const multiSigPermissions = {
        validList: ['0xKey1'],
        invalidValue: 'not an array'
      }
      const currentConfig = {
        debug: {
          multisigKeys: { '0xKey1': DevSecurityLevel.High }
        }
      }
      
      expect(() => cleanMultiSigPermissions(multiSigPermissions, currentConfig))
        .toThrow('Invalid permissions type: invalidValue')
    })

    it('should handle null multiSigPermissions', () => {
      const currentConfig = {
        debug: {
          multisigKeys: { '0xKey1': DevSecurityLevel.High }
        }
      }
      
      expect(cleanMultiSigPermissions(null, currentConfig)).toBe(null)
    })

    it('should handle undefined multiSigPermissions', () => {
      const currentConfig = {
        debug: {
          multisigKeys: { '0xKey1': DevSecurityLevel.High }
        }
      }
      
      expect(cleanMultiSigPermissions(undefined, currentConfig)).toBe(undefined)
    })

    it('should handle null currentConfig', () => {
      const multiSigPermissions = {
        someList: ['0xKey1']
      }
      
      expect(cleanMultiSigPermissions(multiSigPermissions, null)).toBe(multiSigPermissions)
    })

    it('should handle currentConfig without debug.multisigKeys', () => {
      const multiSigPermissions = {
        someList: ['0xKey1']
      }
      const currentConfig = {
        debug: {
          // no multisigKeys
        }
      }
      
      expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toBe(multiSigPermissions)
    })

    it('should preserve original key format while matching normalized versions', () => {
      const multiSigPermissions = {
        changeDevKeyList: [
          '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',  // uppercase
          'abcdef1234567890abcdef1234567890abcdef12',    // no prefix
          '  0xabcdef1234567890abcdef1234567890abcdef12  ' // with spaces
        ]
      }
      const currentConfig = {
        debug: {
          multisigKeys: {
            '0xabcdef1234567890abcdef1234567890abcdef12': DevSecurityLevel.High
          }
        }
      }
      
      const result = cleanMultiSigPermissions(multiSigPermissions, currentConfig)
      expect(result.changeDevKeyList).toHaveLength(3)
      expect(result.changeDevKeyList).toContain('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')
      expect(result.changeDevKeyList).toContain('abcdef1234567890abcdef1234567890abcdef12')
      expect(result.changeDevKeyList).toContain('  0xabcdef1234567890abcdef1234567890abcdef12  ')
    })
  })
})