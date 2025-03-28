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
    expect(normalizeEthAddress('abc123')).toBe('0xabc123');
    expect(normalizeEthAddress('0Xabc123')).toBe('0xabc123');
  });

  test('should trim whitespace', () => {
    expect(normalizeEthAddress(' 0xabc123 ')).toBe('0xabc123');
    expect(normalizeEthAddress('  abc123  ')).toBe('0xabc123');
  });

  test('should convert to lowercase', () => {
    expect(normalizeEthAddress('0xABCDEF')).toBe('0xabcdef');
    expect(normalizeEthAddress('ABCDEF')).toBe('0xabcdef');
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
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0X7EFBB31431AC7C405E8EEBA99531FF1254FCA3B6');
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00');
    
    // Total count should be 4 since all variants should be preserved
    expect(cleanedPermissions.initiateSecureAccountTransfer.length).toBe(4);
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