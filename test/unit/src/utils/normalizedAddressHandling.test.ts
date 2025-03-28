import { 
  normalizeEthAddress, 
  cleanMultiSigPermissions 
} from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { DevSecurityLevel } from '@shardeum-foundation/core'

describe('normalizeEthAddress', () => {
  test('should handle null or empty addresses', () => {
    expect(normalizeEthAddress('')).toBe('');
    expect(normalizeEthAddress(null as any)).toBe('');
    expect(normalizeEthAddress(undefined as any)).toBe('');
  });

  test('should add 0x prefix if missing', () => {
    expect(normalizeEthAddress('abcdef1234567890abcdef1234567890abcdef12')).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
  });

  test('should trim whitespace', () => {
    expect(normalizeEthAddress(' 0xabcdef1234567890abcdef1234567890abcdef12 ')).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
  });

  test('should remove trailing zeros after standard address length', () => {
    expect(normalizeEthAddress('0xabcdef1234567890abcdef1234567890abcdef12000000')).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
  });

  test('should convert to lowercase', () => {
    expect(normalizeEthAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
  });

  test('should handle real-world addresses from the issue', () => {
    // The from address in the transaction
    const txFrom = '7efbb31431ac7c405e8eeba99531ff1254fca3b6000000000000000000000000';
    // The address in the configuration
    const configKey = '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6';
    
    // Both should normalize to the same value
    expect(normalizeEthAddress(txFrom)).toBe('0x7efbb31431ac7c405e8eeba99531ff1254fca3b6');
    expect(normalizeEthAddress(configKey)).toBe('0x7efbb31431ac7c405e8eeba99531ff1254fca3b6');
    
    // Direct comparison should show they are the same
    expect(normalizeEthAddress(txFrom)).toBe(normalizeEthAddress(configKey));
  });
});

describe('cleanMultiSigPermissions with normalization', () => {
  test('should match keys regardless of case or 0x prefix', () => {
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',        // Mixed case with 0x prefix
        '7efbb31431ac7c405e8eeba99531ff1254fca3b6',          // Lowercase without 0x prefix
        '0X7EFBB31431AC7C405E8EEBA99531FF1254FCA3B6',        // Uppercase with 0X prefix
        '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00'         // Another key for comparison
      ]
    };

    const mockConfig = {
      debug: {
        multisigKeys: {
          '0x7efbb31431ac7c405e8eeba99531ff1254fca3b6': DevSecurityLevel.High, // Lowercase in config
          '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00': DevSecurityLevel.High  // Mixed case in config
        }
      }
    };
    
    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, mockConfig);
    
    // All variants of the first address should be preserved after normalization matches
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6');
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('7efbb31431ac7c405e8eeba99531ff1254fca3b6');
    
    // This test differs from the original version - 0X is normalized to 0x during comparison, 
    // but our function is designed to keep the original keys that are in the input array
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0X7EFBB31431AC7C405E8EEBA99531FF1254FCA3B6');
    
    // The other key should be preserved
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00');
    
    // Total count should be 4 since all variants should be preserved
    expect(cleanedPermissions.initiateSecureAccountTransfer.length).toBe(4);
  });

  test('should handle addresses with trailing zeros', () => {
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6000000000000000000000000',  // With trailing zeros
        '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00'                           // Normal address
      ]
    };

    const mockConfig = {
      debug: {
        multisigKeys: {
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High, // Without zeros
          '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00': DevSecurityLevel.High
        }
      }
    };

    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, mockConfig);
    
    // Both addresses should be included
    expect(cleanedPermissions.initiateSecureAccountTransfer.length).toBe(2);
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6000000000000000000000000');
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00');
  });

  test('should handle the exact real-world scenario from the issue', () => {
    // These are the values from the error log
    const allowedKeysInConfig = {
      '0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe': DevSecurityLevel.High,
      '0xCeA068d8DCB4B4020D30a9950C00cF8408611F67': DevSecurityLevel.High,
      '0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E': DevSecurityLevel.High,
      '0x4FE8CaabA0BaC60AE9452DB06a983932C58cC811': DevSecurityLevel.High,
      '0x979B63E576E91eb20B5D89E9aA94FD793E6b19AD': DevSecurityLevel.High,
      '0x58845fbe90f9558a205A0d99F5a9D45a3ee6789b': DevSecurityLevel.High,
      '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High,
      '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00': DevSecurityLevel.High
    };

    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe',
        '0xCeA068d8DCB4B4020D30a9950C00cF8408611F67',
        '0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E',
        '0x4FE8CaabA0BaC60AE9452DB06a983932C58cC811',
        '0x979B63E576E91eb20B5D89E9aA94FD793E6b19AD',
        '0x58845fbe90f9558a205A0d99F5a9D45a3ee6789b',
        '7efbb31431ac7c405e8eeba99531ff1254fca3b6000000000000000000000000', // From tx but with zeros
        '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00'
      ]
    };

    const mockConfig = {
      debug: {
        multisigKeys: allowedKeysInConfig
      }
    };

    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, mockConfig);
    
    // All permissions should be preserved
    expect(cleanedPermissions.initiateSecureAccountTransfer.length).toBe(8);
    
    // The key with zeros should be included
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('7efbb31431ac7c405e8eeba99531ff1254fca3b6000000000000000000000000');
  });

  test('should return original permissions when currentConfig is invalid', () => {
    const multiSigPermissions = {
      changeDevKeyList: ['0xKey1', '0xKey2'],
      changeMultiSigKeyList: ['0xKey3']
    };

    const invalidConfig = {};

    expect(cleanMultiSigPermissions(multiSigPermissions, invalidConfig)).toBe(multiSigPermissions);
  });
}); 