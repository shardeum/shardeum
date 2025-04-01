import { cleanMultiSigPermissions } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'

describe('cleanMultiSigPermissions', () => {
  test('should remove keys not in currentConfig.debug.multisigKeys', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xValidKey1', '0xInvalidKey1', '0xValidKey2'],
      changeMultiSigKeyList: ['0xValidKey1', '0xInvalidKey2'],
      initiateSecureAccountTransfer: ['0xValidKey2', '0xInvalidKey3']
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': 2,
          '0xValidKey2': 1
        }
      }
    };

    const expected = {
      changeDevKeyList: ['0xValidKey1', '0xValidKey2'],
      changeMultiSigKeyList: ['0xValidKey1'],
      initiateSecureAccountTransfer: ['0xValidKey2']
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });

  test('should return original permissions when currentConfig is invalid', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xKey1', '0xKey2'],
      changeMultiSigKeyList: ['0xKey3']
    };

    const invalidConfig = {};

    expect(cleanMultiSigPermissions(multiSigPermissions, invalidConfig)).toBe(multiSigPermissions);
  });

  test('should return original permissions when currentConfig.debug is missing', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xKey1', '0xKey2'],
      changeMultiSigKeyList: ['0xKey3']
    };

    const invalidConfig = { debug: {} };

    expect(cleanMultiSigPermissions(multiSigPermissions, invalidConfig)).toBe(multiSigPermissions);
  });

  test('should handle empty multiSigPermissions', () => {
    const multiSigPermissions = {};

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': 2,
          '0xValidKey2': 1
        }
      }
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual({});
  });

  test('should handle non-array properties in multiSigPermissions', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xValidKey1', '0xInvalidKey1'],
      someOtherProperty: 'not an array',
      anotherObject: { key: 'value' }
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': 2
        }
      }
    };

    const expected = {
      changeDevKeyList: ['0xValidKey1'],
      someOtherProperty: 'not an array',
      anotherObject: { key: 'value' }
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });

  test('should handle empty arrays in multiSigPermissions', () => {
    const multiSigPermissions = {
      changeDevKeyList: [],
      changeMultiSigKeyList: ['0xValidKey1', '0xInvalidKey1']
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': 2
        }
      }
    };

    const expected = {
      changeDevKeyList: [],
      changeMultiSigKeyList: ['0xValidKey1']
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });
}); 