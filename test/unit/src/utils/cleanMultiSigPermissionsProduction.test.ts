import { cleanMultiSigPermissions } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { DevSecurityLevel } from '@shardeum-foundation/core'
import multisigPermissionsFile from '../../../../src/config/multisig-permissions.json'

describe('cleanMultiSigPermissions Production Cases', () => {
  test('should reproduce the exact scenario from the logs', () => {
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

    // The keys that were in the tx sign but not in allowed keys
    const signaturesInLog = [
      {
        owner: '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',
        sig: '0xbb47bd89abde0807b450618ff788242889d76183d5ffeba137ba046c629f15cd670abb875cc8f63beb7af4cfe03da3bc2c2a6713ca60741c8444ee5ac1117ebd1b'
      },
      {
        owner: '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00',
        sig: '0xd66bf5e80705105e11074cf1844491f0c0a88b73630c3808d03e2ac19998d5ea1e9b930031dece1572d03d0c079bb67fc44c738990f58332cdba328d83fc13611b'
      }
    ];

    // Load the actual multisig-permissions.json content
    const originalMultiSigPermissions = multisigPermissionsFile;

    console.log("Original initiateSecureAccountTransfer permissions:", 
      originalMultiSigPermissions.initiateSecureAccountTransfer);

    // Create a mock config with keys from actual config
    const mockConfig = {
      debug: {
        multisigKeys: {
          '0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe': DevSecurityLevel.High,
          '0xCeA068d8DCB4B4020D30a9950C00cF8408611F67': DevSecurityLevel.High,
          '0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E': DevSecurityLevel.High,
          '0x4FE8CaabA0BaC60AE9452DB06a983932C58cC811': DevSecurityLevel.High,
          '0x979B63E576E91eb20B5D89E9aA94FD793E6b19AD': DevSecurityLevel.High,
          '0x58845fbe90f9558a205A0d99F5a9D45a3ee6789b': DevSecurityLevel.High,
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High,
          '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00': DevSecurityLevel.High
        }
      }
    };

    // Clean the permissions
    const cleanedPermissions = cleanMultiSigPermissions(originalMultiSigPermissions, mockConfig);
    
    console.log("Cleaned initiateSecureAccountTransfer permissions:", 
      cleanedPermissions.initiateSecureAccountTransfer);

    // Check which keys from the signatures are in the cleaned permissions
    const sig1InPermissions = cleanedPermissions.initiateSecureAccountTransfer.includes(signaturesInLog[0].owner);
    const sig2InPermissions = cleanedPermissions.initiateSecureAccountTransfer.includes(signaturesInLog[1].owner);

    console.log(`Signer 1 (${signaturesInLog[0].owner}) in permissions: ${sig1InPermissions}`);
    console.log(`Signer 2 (${signaturesInLog[1].owner}) in permissions: ${sig2InPermissions}`);

    // If our understanding is correct, sig1 should NOT be in permissions but sig2 should be
    expect(sig1InPermissions).toBe(true); // This will fail if the key is missing
    expect(sig2InPermissions).toBe(true);

    // Additional check: verify each key that was in the allowed keys appears in our cleaned permissions
    for (const key of Object.keys(allowedKeysInConfig)) {
      expect(cleanedPermissions.initiateSecureAccountTransfer.includes(key)).toBe(true);
    }
  });

  test('should investigate any case differences between config and permissions', () => {
    const mockConfig = {
      debug: {
        multisigKeys: {
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High,
          '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00': DevSecurityLevel.High
        }
      }
    };

    // Create a set of keys with various case variations
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7efbb31431ac7c405e8eeba99531ff1254fca3b6', // all lowercase
        '0x7EFBB31431AC7C405E8EEBA99531FF1254FCA3B6', // all uppercase
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6', // mixed case as in permissions
        '0xcc74bf387f6c102b5a7f828796c57a6d2d19cb00', // all lowercase
        '0xCC74BF387F6C102B5A7F828796C57A6D2D19CB00', // all uppercase
        '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00'  // mixed case as in permissions
      ]
    };

    // Log some information about the case of the keys
    console.log('Keys in mockConfig:');
    for (const key of Object.keys(mockConfig.debug.multisigKeys)) {
      console.log(`  ${key}`);
    }

    console.log('Keys in multiSigPermissions:');
    for (const key of multiSigPermissions.initiateSecureAccountTransfer) {
      console.log(`  ${key}`);
    }

    // Clean the permissions
    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, mockConfig);
    
    // Log the result
    console.log('Keys in cleanedPermissions:');
    for (const key of cleanedPermissions.initiateSecureAccountTransfer) {
      console.log(`  ${key}`);
    }

    // With the normalized function, all case variants should be matched and preserved
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6');
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00');
    // All case variants should be included
    expect(cleanedPermissions.initiateSecureAccountTransfer.length).toBe(6);
  });

  test('should check if keys with 0000s suffix are handled correctly', () => {
    const multiSigPermissions = {
      initiateSecureAccountTransfer: [
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6', // Normal key
        '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6000000000000000000000000' // Key with zeros suffix
      ]
    };

    const mockConfig = {
      debug: {
        multisigKeys: {
          '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High // Only normal key in config
        }
      }
    };

    // Clean the permissions
    const cleanedPermissions = cleanMultiSigPermissions(multiSigPermissions, mockConfig);
    
    console.log('Original keys:', multiSigPermissions.initiateSecureAccountTransfer);
    console.log('Cleaned keys:', cleanedPermissions.initiateSecureAccountTransfer);

    // With normalization, the key with zeros suffix should also be preserved
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6');
    expect(cleanedPermissions.initiateSecureAccountTransfer).toContain('0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6000000000000000000000000');
    expect(cleanedPermissions.initiateSecureAccountTransfer.length).toBe(2);
  });
}); 