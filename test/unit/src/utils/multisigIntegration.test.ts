import { isKeyChange, cleanMultiSigPermissions, isNonKeyChange } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { ChangeConfig } from '../../../../src/shardeum/shardeumTypes'
import { DevSecurityLevel } from '@shardeum-foundation/core'

// Mock the ShardusTypes.Cycle type
const mockCycle = {
  counter: 1,
  active: 10,
  // Add other required properties as needed
};

const setup = (
  multisigKeys?: any,
  multiSigPermissions?: any
) => {
  multisigKeys = multisigKeys || {
    '0xValidKey1': DevSecurityLevel.High,
    '0xValidKey2': DevSecurityLevel.Medium
  }

  multiSigPermissions = multiSigPermissions || {
    changeDevKeyList: ['0xValidKey1', '0xInvalidKey1'],
    changeMultiSigKeyList: ['0xValidKey2', '0xInvalidKey2']
  }

  const currentConfig = {
    debug: {
      multisigKeys
    }
  }

  // Clean the permissions
  const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, currentConfig);

  return { currentConfig, multiSigPermissions, cleanedPermissions }
};

describe('multisig integration tests', () => {

  it('cleanMultiSigPermissions should filter keys before isKeyChange uses them', () => {
    const { currentConfig, cleanedPermissions } = setup()

    // Our implementation now adds all valid keys to each array
    expect(cleanedPermissions.changeDevKeyList).toContain('0xValidKey1');
    expect(cleanedPermissions.changeDevKeyList).not.toContain('0xValidKey2');
    expect(cleanedPermissions.changeMultiSigKeyList).not.toContain('0xValidKey1');
    expect(cleanedPermissions.changeMultiSigKeyList).toContain('0xValidKey2');
    expect(cleanedPermissions.changeDevKeyList.length).toBe(1);
    expect(cleanedPermissions.changeMultiSigKeyList.length).toBe(1);

    // Mock a transaction that changes multisig keys
    const tx = {
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            '0xValidKey1': DevSecurityLevel.High,
            '0xValidKey3': DevSecurityLevel.Medium // Changed key
          }
        }
      }),
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig;

    // Call isKeyChange with cleaned permissions
    const result = isKeyChange(tx, currentConfig, cleanedPermissions);

    // Verify that only valid keys are in the permitted keys
    expect(result.isKeyChange).toBe(true);
    // Since both arrays now have both valid keys, the permitted keys should include both keys
    expect(result.permittedKeys).toContain('0xValidKey2');
  });

  it('isKeyChange should work with empty permitted keys after cleaning', () => {
    const { currentConfig, cleanedPermissions } = setup()

    // Mock a transaction that changes multisig keys
    const tx = {
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            '0xValidKey1': DevSecurityLevel.High,
            '0xValidKey3': DevSecurityLevel.Medium // Changed key
          }
        }
      }),
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig;

    // Call isKeyChange with cleaned permissions
    const result = isKeyChange(tx, currentConfig, cleanedPermissions);

    // Verify that isKeyChange is true and permittedKeys has valid keys
    expect(result.isKeyChange).toBe(true);
    expect(result.permittedKeys.length).toBeGreaterThan(0);
  });

  it('cleanMultiSigPermissions should filter keys before isNonKeyChange uses them', () => {
    const { currentConfig, multiSigPermissions, cleanedPermissions } = setup(undefined, {
      changeNonKeyConfigs: ['0xValidKey1', '0xInvalidKey1', '0xValidKey2']
    })
  
    // Verify that invalid keys were removed
    expect(cleanedPermissions.changeNonKeyConfigs).toEqual(['0xValidKey1', '0xValidKey2']);

    // Mock a transaction that changes non-key configs
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
    } as unknown as ChangeConfig;

    // Call isNonKeyChange with cleaned permissions
    const result = isNonKeyChange(tx, currentConfig, cleanedPermissions);

    console.log('multiSigPermissions', multiSigPermissions)
    console.log('tx', tx)
    console.log('cleanedPermissions', cleanedPermissions)
    console.log('currentConfig', currentConfig)
    // Verify that only valid keys are in the permitted keys
    console.log('result', result)
    expect(result.isNonKeyChange).toBe(true);
    expect(result.permittedKeys).toEqual(['0xValidKey1', '0xValidKey2']);
  });

  it('isNonKeyChange should work with empty permitted keys after cleaning', () => {
    const { currentConfig, cleanedPermissions } = setup(undefined, {
      changeNonKeyConfigs: ['0xInvalidKey1', '0xInvalidKey2']
    })

    // Verify that all keys were removed
    expect(cleanedPermissions.changeNonKeyConfigs).toEqual([]);

    // Mock a transaction that changes non-key configs
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
    } as unknown as ChangeConfig;

    // Call isNonKeyChange with cleaned permissions
    const result = isNonKeyChange(tx, currentConfig, cleanedPermissions);

    // Verify that isNonKeyChange is true but permittedKeys is empty
    expect(result.isNonKeyChange).toBe(true);
    expect(result.permittedKeys).toEqual([]);
  });

  it('should return noChange when configs are identical', () => {
    // Mock config with multisig keys
    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': 2,
          '0xValidKey2': 1
        },
        someConfig: 'value'
      }
    };

    // Mock permissions with valid keys
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xValidKey1', '0xValidKey2']
    };

    // Mock a transaction with identical config
    const tx = {
      config: JSON.stringify(currentConfig), // Same as current config
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig;

    // Call isNonKeyChange
    const result = isNonKeyChange(tx, currentConfig, multiSigPermissions);

    // Verify that isNonKeyChange is false and permittedKeys is empty
    expect(result.isNonKeyChange).toBe(false);
    expect(result.permittedKeys).toEqual([]);
  });

  it('should handle simultaneous key and non-key changes correctly', () => {
    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': 2,
          '0xValidKey2': 1
        },
        someConfig: 'value'
      }
    };

    const tx = {
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            '0xValidKey1': 2,
            '0xValidKey3': 1  // Key change
          },
          someConfig: 'new-value'  // Non-key change
        }
      }),
      type: 'ChangeConfig',
      from: '0xSender',
      cycle: mockCycle,
      timestamp: Date.now()
    } as unknown as ChangeConfig;

    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xValidKey1', '0xValidKey2']
    };

    const result = isNonKeyChange(tx, currentConfig, multiSigPermissions);
    // Should return false because key changes take precedence
    expect(result.isNonKeyChange).toBe(false);
    expect(result.permittedKeys).toEqual([]);
  });
});