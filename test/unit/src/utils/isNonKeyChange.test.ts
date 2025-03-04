import { isNonKeyChange } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { ChangeConfig } from '../../../../src/shardeum/shardeumTypes'

// Mock the ShardusTypes.Cycle type
const mockCycle = {
  counter: 1,
  active: 10,
  // Add other required properties as needed
};

describe('isNonKeyChange', () => {
  test('should return { isNonKeyChange: false, permittedKeys: [] } when config is not a string', () => {
    const tx = { config: {} } as any
    const currentConfig = {}
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xAddress1', '0xAddress2']
    }
    
    expect(isNonKeyChange(tx, currentConfig, multiSigPermissions)).toEqual({
      isNonKeyChange: false,
      permittedKeys: []
    })
  })

  test('should return { isNonKeyChange: false, permittedKeys: [] } when config is not valid JSON', () => {
    const tx = { config: '{invalid json' } as any
    const currentConfig = {}
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xAddress1', '0xAddress2']
    }
    
    expect(isNonKeyChange(tx, currentConfig, multiSigPermissions)).toEqual({
      isNonKeyChange: false,
      permittedKeys: []
    })
  })

  test('should return { isNonKeyChange: false, permittedKeys: [] } when there are no changes', () => {
    const currentConfig = {
      debug: {
        someConfig: 'value'
      }
    }
    
    const tx = { 
      config: JSON.stringify(currentConfig),
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig
    
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xAddress1', '0xAddress2']
    }
    
    expect(isNonKeyChange(tx, currentConfig, multiSigPermissions)).toEqual({
      isNonKeyChange: false,
      permittedKeys: []
    })
  })

  test('should return { isNonKeyChange: false, permittedKeys: [] } when there are key changes', () => {
    const currentConfig = {
      debug: {
        multisigKeys: {
          'key1': 2,
          'key2': 1
        }
      }
    }
    
    const tx = { 
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            'key1': 2,
            'key3': 1 // Changed key
          }
        }
      }),
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig
    
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xAddress1', '0xAddress2']
    }
    
    expect(isNonKeyChange(tx, currentConfig, multiSigPermissions)).toEqual({
      isNonKeyChange: false,
      permittedKeys: []
    })
  })

  test('should return { isNonKeyChange: true, permittedKeys: [...] } when there are non-key changes', () => {
    const currentConfig = {
      debug: {
        multisigKeys: {
          'key1': 2,
          'key2': 1
        },
        someConfig: 'value'
      }
    }
    
    const tx = { 
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            'key1': 2,
            'key2': 1
          },
          someConfig: 'new-value' // Changed non-key config
        }
      }),
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig
    
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xAddress1', '0xAddress2']
    }
    
    expect(isNonKeyChange(tx, currentConfig, multiSigPermissions)).toEqual({
      isNonKeyChange: true,
      permittedKeys: ['0xAddress1', '0xAddress2']
    })
  })

  test('should return empty permittedKeys when changeNonKeyConfigs is not defined', () => {
    const currentConfig = {
      debug: {
        someConfig: 'value'
      }
    }
    
    const tx = { 
      config: JSON.stringify({
        debug: {
          someConfig: 'new-value' // Changed non-key config
        }
      }),
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig
    
    const multiSigPermissions = {}
    
    expect(isNonKeyChange(tx, currentConfig, multiSigPermissions)).toEqual({
      isNonKeyChange: true,
      permittedKeys: []
    })
  })
}) 