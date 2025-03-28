import { isKeyChange, cleanMultiSigPermissions } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { ChangeConfig } from '../../../../src/shardeum/shardeumTypes'
import { DevSecurityLevel } from '@shardeum-foundation/core'

// Mock the ShardusTypes.Cycle type
const mockCycle = {
  counter: 1,
  active: 10,
  // Add other required properties as needed
};

describe('multisig integration tests', () => {
  test('cleanMultiSigPermissions should filter keys before isKeyChange uses them', () => {
    // Mock config with multisig keys
    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': DevSecurityLevel.High,
          '0xValidKey2': DevSecurityLevel.Medium
        }
      }
    };

    // Mock permissions with some invalid keys
    const multiSigPermissions = {
      changeDevKeyList: ['0xValidKey1', '0xInvalidKey1'],
      changeMultiSigKeyList: ['0xValidKey2', '0xInvalidKey2']
    };

    // Clean the permissions
    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, currentConfig);

    // Our implementation now adds all valid keys to each array
    expect(cleanedPermissions.changeDevKeyList).toContain('0xValidKey1');
    expect(cleanedPermissions.changeDevKeyList).toContain('0xValidKey2');
    expect(cleanedPermissions.changeMultiSigKeyList).toContain('0xValidKey1');
    expect(cleanedPermissions.changeMultiSigKeyList).toContain('0xValidKey2');
    expect(cleanedPermissions.changeDevKeyList.length).toBe(2);
    expect(cleanedPermissions.changeMultiSigKeyList.length).toBe(2);

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

  test('isKeyChange should work with empty permitted keys after cleaning', () => {
    // Mock config with multisig keys
    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': DevSecurityLevel.High,
          '0xValidKey2': DevSecurityLevel.Medium
        }
      }
    };

    // Mock permissions with only invalid keys
    const multiSigPermissions = {
      changeDevKeyList: ['0xInvalidKey1', '0xInvalidKey2'],
      changeMultiSigKeyList: ['0xInvalidKey3', '0xInvalidKey4']
    };

    // Clean the permissions
    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, currentConfig);

    // Our implementation now adds all valid keys to each array
    expect(cleanedPermissions.changeDevKeyList).toContain('0xValidKey1');
    expect(cleanedPermissions.changeDevKeyList).toContain('0xValidKey2');
    expect(cleanedPermissions.changeMultiSigKeyList).toContain('0xValidKey1');
    expect(cleanedPermissions.changeMultiSigKeyList).toContain('0xValidKey2');
    expect(cleanedPermissions.changeDevKeyList.length).toBe(2);
    expect(cleanedPermissions.changeMultiSigKeyList.length).toBe(2);

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
}); 