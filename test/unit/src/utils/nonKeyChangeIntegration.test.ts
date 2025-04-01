import { isNonKeyChange, cleanMultiSigPermissions } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { ChangeConfig } from '../../../../src/shardeum/shardeumTypes'

// Mock the ShardusTypes.Cycle type
const mockCycle = {
  counter: 1,
  active: 10,
  // Add other required properties as needed
};

describe('nonKeyChange integration tests', () => {
  test('cleanMultiSigPermissions should filter keys before isNonKeyChange uses them', () => {
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

    // Mock permissions with some invalid keys
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xValidKey1', '0xInvalidKey1', '0xValidKey2']
    };

    // Clean the permissions
    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, currentConfig);

    // Verify that invalid keys were removed
    expect(cleanedPermissions.changeNonKeyConfigs).toEqual(['0xValidKey1', '0xValidKey2']);

    // Mock a transaction that changes non-key configs
    const tx = {
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            '0xValidKey1': 2,
            '0xValidKey2': 1
          },
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

    // Verify that only valid keys are in the permitted keys
    expect(result.isNonKeyChange).toBe(true);
    expect(result.permittedKeys).toEqual(['0xValidKey1', '0xValidKey2']);
  });

  test('isNonKeyChange should work with empty permitted keys after cleaning', () => {
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

    // Mock permissions with only invalid keys
    const multiSigPermissions = {
      changeNonKeyConfigs: ['0xInvalidKey1', '0xInvalidKey2']
    };

    // Clean the permissions
    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, currentConfig);

    // Verify that all keys were removed
    expect(cleanedPermissions.changeNonKeyConfigs).toEqual([]);

    // Mock a transaction that changes non-key configs
    const tx = {
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            '0xValidKey1': 2,
            '0xValidKey2': 1
          },
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
}); 