import { cleanMultiSigPermissions } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { DevSecurityLevel } from '@shardeum-foundation/core'

describe('cleanMultiSigPermissions', () => {
  it('should remove keys not in currentConfig.debug.multisigKeys (basic functionality)', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xValidKey1', '0xInvalidKey1'],
      changeMultiSigKeyList: ['0xValidKey1', '0xInvalidKey2'],
      initiateSecureAccountTransfer: ['0xValidKey2', '0xInvalidKey3']
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': DevSecurityLevel.High,
          '0xValidKey2': DevSecurityLevel.High
        }
      }
    };

    // Only keep valid keys that were in the original permissions
    const expected = {
      changeDevKeyList: ['0xValidKey1'],
      changeMultiSigKeyList: ['0xValidKey1'],
      initiateSecureAccountTransfer: ['0xValidKey2']
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });

  it('should handle case sensitivity when comparing keys', () => {
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0xabcdef1234567890abcdef1234567890abcdef12',
        '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', // Same as first but uppercase
        '0xValidKey2'
      ]
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xabcdef1234567890abcdef1234567890abcdef12': DevSecurityLevel.High,
          '0xValidKey2': DevSecurityLevel.High
        }
      }
    };

    // With normalization, both case variants should be kept
    const expected = {
      initiateSecureAccountTransfer: ['0xabcdef1234567890abcdef1234567890abcdef12', '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', '0xValidKey2']
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });

  it('should handle real-world keys from the logs', () => {
    // Using keys from your specific error case
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',  // Key that was filtered out in your logs
        '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00',  // Key that remained in your logs
        '0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe',  // Another key from your logs
        '0xCeA068d8DCB4B4020D30a9950C00cF8408611F67',  // Another key from your logs
        '0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E',  // Another key from your logs
        '0x4FE8CaabA0BaC60AE9452DB06a983932C58cC811',  // Another key from your logs
        '0x979B63E576E91eb20B5D89E9aA94FD793E6b19AD',  // Another key from your logs
        '0x58845fbe90f9558a205A0d99F5a9D45a3ee6789b'   // Another key from your logs
      ]
    };

    // Simulating the config as shown in your src/config/index.ts
    const currentConfig = {
      debug: {
        multisigKeys: {
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High,
          '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00': DevSecurityLevel.High,
          '0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe': DevSecurityLevel.High,
          '0xCeA068d8DCB4B4020D30a9950C00cF8408611F67': DevSecurityLevel.High,
          '0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E': DevSecurityLevel.High,
          '0x4FE8CaabA0BaC60AE9452DB06a983932C58cC811': DevSecurityLevel.High,
          '0x979B63E576E91eb20B5D89E9aA94FD793E6b19AD': DevSecurityLevel.High,
          '0x58845fbe90f9558a205A0d99F5a9D45a3ee6789b': DevSecurityLevel.High
        }
      }
    };

    // If all is working correctly, all keys should remain
    const expected = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',
        '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00',
        '0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe',
        '0xCeA068d8DCB4B4020D30a9950C00cF8408611F67',
        '0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E',
        '0x4FE8CaabA0BaC60AE9452DB06a983932C58cC811',
        '0x979B63E576E91eb20B5D89E9aA94FD793E6b19AD',
        '0x58845fbe90f9558a205A0d99F5a9D45a3ee6789b'
      ]
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });

  it('should handle exact case matches only', () => {
    // Test if the function requires exact case matches 
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7efbb31431ac7c405e8eeba99531ff1254fca3b6', // lowercase version
        '0x7EFBB31431AC7C405E8EEBA99531FF1254FCA3B6', // uppercase version
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6'  // mixed case (original)
      ]
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High
        }
      }
    };

    // With normalization, all variants should be kept
    const expected = {
      initiateSecureAccountTransfer: [
        '0x7efbb31431ac7c405e8eeba99531ff1254fca3b6',
        '0x7EFBB31431AC7C405E8EEBA99531FF1254FCA3B6',
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6'
      ]
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });

  it('should handle keys with different formatting styles', () => {
    // Test with various formats that could be causing issues
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',        // Standard format
        '7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',          // No 0x prefix
        ' 0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6 '       // With whitespace
      ]
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High
        }
      }
    };

    // With normalization, all these variations should be kept
    const expected = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',
        '7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',
        ' 0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6 '
      ]
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });

  it('should handle key normalization issues', () => {
    // Test both function with slightly different key formats
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',
        '0x7efbb31431ac7c405e8eeba99531ff1254fca3b6'
      ]
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High
        }
      }
    };

    // With normalization enabled, both addresses should be kept
    const result = cleanMultiSigPermissions(multiSigPermissions, currentConfig);
    
    expect(result).toEqual({
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',
        '0x7efbb31431ac7c405e8eeba99531ff1254fca3b6'
      ]
    });
  });

  it('should return original permissions when currentConfig is invalid', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xKey1', '0xKey2'],
      changeMultiSigKeyList: ['0xKey3']
    };

    const invalidConfig = {};

    expect(cleanMultiSigPermissions(multiSigPermissions, invalidConfig)).toBe(multiSigPermissions);
  });

  it('should return original permissions when currentConfig.debug is missing', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xKey1', '0xKey2'],
      changeMultiSigKeyList: ['0xKey3']
    };

    const invalidConfig = { debug: {} };

    expect(cleanMultiSigPermissions(multiSigPermissions, invalidConfig)).toBe(multiSigPermissions);
  });

  it('should handle empty multiSigPermissions', () => {
    const multiSigPermissions = {};

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': DevSecurityLevel.High,
          '0xValidKey2': DevSecurityLevel.High
        }
      }
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual({});
  });

  it('should handle non-array properties in multiSigPermissions', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xValidKey1', '0xInvalidKey1'],
      someOtherProperty: 'not an array',
      anotherObject: { key: 'value' }
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': DevSecurityLevel.High
        }
      }
    };

    const expected = {
      changeDevKeyList: ['0xValidKey1'],
      someOtherProperty: 'not an array',
      anotherObject: { key: 'value' }
    };

    expect(() => cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toThrow('Invalid permissions type: someOtherProperty');
  });

  it('should handle empty arrays in multiSigPermissions', () => {
    const multiSigPermissions = {
      changeDevKeyList: [],
      changeMultiSigKeyList: ['0xValidKey1']
    };

    const currentConfig = {
      debug: {
        multisigKeys: {
          '0xValidKey1': DevSecurityLevel.High
        }
      }
    };

    // Empty arrays should remain empty, only keep valid keys that were in the original permissions
    const expected = {
      changeDevKeyList: [],
      changeMultiSigKeyList: ['0xValidKey1']
    };

    expect(cleanMultiSigPermissions(multiSigPermissions, currentConfig)).toEqual(expected);
  });
}); 