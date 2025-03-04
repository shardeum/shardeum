import { ethers } from 'ethers'
import { DevSecurityLevel, ShardusTypes } from '@shardus/core'
import { Utils } from '@shardus/types'

// Import all functions from the actual implementation
import {
  isMultisigKeyChange,
  verifyMultiSigsForKeyManagement, 
  validateConfigChange,
  omitDevKeys,
  isValidDevKeyAddition,
  isValidMultisigKeyAddition,
  isValidHexKey,
  validateConfigChangeTx,
  validateConfigChangeTxFields,
  VerifyMultiSigsFunction
} from '../../../../../src/tx/changeConfig/validate'

// Import comparePropertiesTypes for proper mocking
import * as generalUtils from '../../../../../src/utils/general'

// Set up mocks for when needed
const mockVerifyMultiSigs = jest.fn() as jest.MockedFunction<VerifyMultiSigsFunction>

describe('Multisig Validation System', () => {
  // Test data - shared between all tests
  const wallet1 = ethers.Wallet.createRandom()
  const wallet2 = ethers.Wallet.createRandom()
  const wallet3 = ethers.Wallet.createRandom()
  const wallet4 = ethers.Wallet.createRandom()
  
  const keyManagerAddresses = [
    wallet1.address,
    wallet2.address,
    wallet3.address
  ]
  
  const mockConfig = {
    server: {
      debug: {
        keyManagerAddresses: keyManagerAddresses.map(addr => addr.toLowerCase()),
        multisigKeys: {
          [wallet1.address.toLowerCase()]: DevSecurityLevel.High,
          [wallet2.address.toLowerCase()]: DevSecurityLevel.High,
          [wallet3.address.toLowerCase()]: DevSecurityLevel.High
        }
      }
    }
  }
  
  const devPublicKeys = {
    [wallet1.address.toLowerCase()]: DevSecurityLevel.High,
    [wallet2.address.toLowerCase()]: DevSecurityLevel.High,
    [wallet3.address.toLowerCase()]: DevSecurityLevel.High
  }
  
  const payload = {
    internalTXType: 'ChangeConfig',
    config: JSON.stringify({
      debug: {
        multisigKeys: {
          '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
        }
      }
    })
  }
  
  // Helper function to create signed transactions for testing
  async function createSignedTx(
    wallets: Array<{ address: string; signMessage: (message: Uint8Array) => Promise<string> }>, 
    config: any, 
    customPayload: any = null
  ) {
    const changeConfigPayload = customPayload || {
      internalTXType: 'ChangeConfig',
      config: JSON.stringify({
        debug: {
          multisigKeys: {
            '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
          }
        }
      })
    }
    
    const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(changeConfigPayload)))
    
    const sigs: Array<{ owner: string; sig: string }> = []
    
    for (const wallet of wallets) {
      sigs.push({
        owner: wallet.address.toLowerCase(),
        sig: await wallet.signMessage(ethers.getBytes(payload_hash))
      })
    }
    
    return {
      ...changeConfigPayload,
      sign: sigs
    }
  }
  
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isMultisigKeyChange function', () => {
    it('should detect adding a new multisig key', () => {
      const oldConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High
          }
        }
      }
      
      const newConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High,
            '0x2222222222222222222222222222222222222222': DevSecurityLevel.High
          }
        }
      }
      
      expect(isMultisigKeyChange(oldConfig, newConfig)).toBe(true)
    })
    
    it('should detect removing an existing multisig key', () => {
      const oldConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High,
            '0x2222222222222222222222222222222222222222': DevSecurityLevel.High
          }
        }
      }
      
      const newConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High
          }
        }
      }
      
      expect(isMultisigKeyChange(oldConfig, newConfig)).toBe(true)
    })
    
    it('should detect changing a multisig key security level', () => {
      const oldConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High
          }
        }
      }
      
      const newConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.Medium
          }
        }
      }
      
      expect(isMultisigKeyChange(oldConfig, newConfig)).toBe(true)
    })
    
    it('should return false for non-multisig key changes', () => {
      const oldConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High
          },
          otherSetting: 'old value'
        }
      }
      
      const newConfig = {
        debug: {
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High
          },
          otherSetting: 'new value'
        }
      }
      
      expect(isMultisigKeyChange(oldConfig, newConfig)).toBe(false)
    })
  })
  
  describe('verifyMultiSigsForKeyManagement function', () => {
    it('should pass with enough valid signers from keyManagerAddresses', async () => {
      // Sign the payload with 3 valid key managers (wallet1, wallet2, wallet3)
      const sigs = [
        { owner: wallet1.address.toLowerCase(), sig: 'valid_sig1' },
        { owner: wallet2.address.toLowerCase(), sig: 'valid_sig2' },
        { owner: wallet3.address.toLowerCase(), sig: 'valid_sig3' }
      ] as unknown as ShardusTypes.Sign[]
      
      // Create a mock that returns true, simulating valid signatures
      mockVerifyMultiSigs.mockReturnValue(true)
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses.map(addr => addr.toLowerCase()),
        2, // Require 2 signatures
        mockVerifyMultiSigs
      )
      
      expect(result).toBe(true)
      
      // Verify mockVerifyMultiSigs was called correctly
      expect(mockVerifyMultiSigs).toHaveBeenCalledTimes(1)
      expect(mockVerifyMultiSigs.mock.calls[0][3]).toBe(2) // Check minSigRequired
    })
    
    it('should fail with not enough valid signers', async () => {
      // Only sign with 1 key manager
      const sigs = [
        { owner: wallet1.address.toLowerCase(), sig: 'valid_sig1' }
      ] as unknown as ShardusTypes.Sign[]
      
      // Even though the signature would be valid, we don't have enough signers
      mockVerifyMultiSigs.mockReturnValue(true)
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses.map(addr => addr.toLowerCase()),
        2, // Require 2 signatures
        mockVerifyMultiSigs
      )
      
      expect(result).toBe(false)
      
      // Verify mockVerifyMultiSigs was NOT called because we already failed the min sig check
      expect(mockVerifyMultiSigs).not.toHaveBeenCalled()
    })
    
    it('should fail with enough signers but some not in keyManagerAddresses', async () => {
      // Sign with 2 key managers and 1 non-key manager (wallet4)
      const sigs = [
        { owner: wallet1.address.toLowerCase(), sig: 'valid_sig1' },
        { owner: wallet4.address.toLowerCase(), sig: 'valid_sig4' }
      ] as unknown as ShardusTypes.Sign[]
      
      // Create a mock that returns true only for signatures that are in allowedPubkeys
      mockVerifyMultiSigs.mockImplementation(
        (rawPayload, sigs, allowedPubkeys, minSigRequired) => {
          // Check if all signatures are from allowed pubkeys
          for (const sig of sigs) {
            if (!allowedPubkeys[sig.owner]) {
              return false
            }
          }
          return true
        }
      )
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses.map(addr => addr.toLowerCase()),
        1, // Only require 1 signature for this test
        mockVerifyMultiSigs
      )
      
      expect(result).toBe(false)
    })
    
    it('should fail with invalid signatures', async () => {
      // Sign with 3 key managers but signatures are invalid
      const sigs = [
        { owner: wallet1.address.toLowerCase(), sig: 'invalid_sig1' },
        { owner: wallet2.address.toLowerCase(), sig: 'invalid_sig2' },
        { owner: wallet3.address.toLowerCase(), sig: 'invalid_sig3' }
      ] as unknown as ShardusTypes.Sign[]
      
      // Create a mock that returns false - we're testing failure case
      mockVerifyMultiSigs.mockReturnValue(false)
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses.map(addr => addr.toLowerCase()),
        3, // Require all 3 signatures
        mockVerifyMultiSigs
      )
      
      expect(result).toBe(false)
    })
  })
  
  describe('validateConfigChange function', () => {
    it('should pass validation for multisig key changes with valid key manager signatures', async () => {
      // Set up mock to return true for validation
      mockVerifyMultiSigs.mockReturnValue(true)
      
      // Prepare a test config change that modifies multisig keys
      const tx = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
            }
          }
        }),
        sign: [
          { owner: wallet1.address.toLowerCase(), sig: 'valid_sig1' },
          { owner: wallet2.address.toLowerCase(), sig: 'valid_sig2' },
          { owner: wallet3.address.toLowerCase(), sig: 'valid_sig3' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      // Mock typedPermissions.changeMultiSigKeyList access through Jest spyOn
      jest.spyOn(Object.getPrototypeOf(require('../../../../../src/tx/changeConfig/validate')), 'typedPermissions', 'get')
        .mockReturnValue({
          changeMultiSigKeyList: keyManagerAddresses.map(addr => addr.toLowerCase())
        });
      
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should pass
      expect(result.result).toBe('success')
      expect(result.reason).toBe('valid')
    })
    
    it('should fail validation for multisig key changes without enough signatures', async () => {
      // Set up mock to return false for validation
      mockVerifyMultiSigs.mockReturnValue(false)
      
      // Prepare a test config change that modifies multisig keys
      const tx = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
            }
          }
        }),
        sign: [
          { owner: wallet1.address.toLowerCase(), sig: 'sig1' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      // Mock typedPermissions.changeMultiSigKeyList access through Jest spyOn
      jest.spyOn(Object.getPrototypeOf(require('../../../../../src/tx/changeConfig/validate')), 'typedPermissions', 'get')
        .mockReturnValue({
          changeMultiSigKeyList: keyManagerAddresses.map(addr => addr.toLowerCase())
        });
      
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should fail
      expect(result.result).toBe('fail')
      expect(result.reason).toContain('Unauthorized key management operation')
    })
    
    it('should fail validation for multisig key changes with non-key-manager signatures', async () => {
      // Set up mock to return false for validation
      mockVerifyMultiSigs.mockReturnValue(false)
      
      // Prepare a test config change that modifies multisig keys but is signed by non-key-managers
      const tx = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
            }
          }
        }),
        sign: [
          { owner: wallet4.address.toLowerCase(), sig: 'sig4' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      // Mock typedPermissions.changeMultiSigKeyList access through Jest spyOn
      jest.spyOn(Object.getPrototypeOf(require('../../../../../src/tx/changeConfig/validate')), 'typedPermissions', 'get')
        .mockReturnValue({
          changeMultiSigKeyList: keyManagerAddresses.map(addr => addr.toLowerCase())
        });
      
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should fail
      expect(result.result).toBe('fail')
      expect(result.reason).toContain('Unauthorized key management operation')
    })
    
    it('should handle regular config changes (non-multisig key changes)', async () => {
      // Set up mock to return true for validation
      mockVerifyMultiSigs.mockReturnValue(true)
      
      // Prepare a test config change that doesn't modify multisig keys
      const tx = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          server: {
            p2p: {
              cycleDuration: 90
            }
          }
        }),
        sign: [
          { owner: wallet1.address.toLowerCase(), sig: 'sig1' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 1, mockVerifyMultiSigs)
      
      // Validation should pass
      expect(result.result).toBe('success')
      expect(result.reason).toBe('valid')
    })
  })

  describe('omitDevKeys function', () => {
    it('should remove devPublicKeys and multisigKeys from the config', () => {
      const config = {
        debug: {
          devPublicKeys: {
            'pubkey1': DevSecurityLevel.High
          },
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High
          },
          otherField: 'test'
        },
        anotherField: 'value'
      }
      
      const result = omitDevKeys(config)
      
      expect(result).toEqual({
        debug: {
          otherField: 'test'
        },
        anotherField: 'value'
      })
    })
    
    it('should handle config without debug field', () => {
      const config = {
        anotherField: 'value'
      }
      
      const result = omitDevKeys(config)
      
      expect(result).toEqual(config)
    })
    
    it('should handle config with empty debug field', () => {
      const config = {
        debug: {},
        anotherField: 'value'
      }
      
      const result = omitDevKeys(config)
      
      expect(result).toEqual(config)
    })
    
    it('should remove debug field entirely if it becomes empty', () => {
      const config = {
        debug: {
          devPublicKeys: {
            'pubkey1': DevSecurityLevel.High
          },
          multisigKeys: {
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.High
          }
        },
        anotherField: 'value'
      }
      
      const result = omitDevKeys(config)
      
      expect(result).toEqual({
        anotherField: 'value'
      })
    })
  })

  describe('isValidHexKey function', () => {
    it('should validate correct hex keys', () => {
      const validKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      expect(isValidHexKey(validKey)).toBe(true)
    })
    
    it('should validate correct hex keys with uppercase characters', () => {
      const validKey = '1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF'
      expect(isValidHexKey(validKey)).toBe(true)
    })
    
    it('should reject keys that are too short', () => {
      const invalidKey = '1234567890abcdef'
      expect(isValidHexKey(invalidKey)).toBe(false)
    })
    
    it('should reject keys that are too long', () => {
      const invalidKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00'
      expect(isValidHexKey(invalidKey)).toBe(false)
    })
    
    it('should reject keys with non-hex characters', () => {
      const invalidKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg'
      expect(isValidHexKey(invalidKey)).toBe(false)
    })
  })

  describe('isValidDevKeyAddition function', () => {
    it('should validate correct devPublicKeys', () => {
      const config = {
        debug: {
          devPublicKeys: {
            '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef': DevSecurityLevel.High
          }
        }
      }
      
      expect(isValidDevKeyAddition(config)).toBe(true)
    })
    
    it('should handle config without devPublicKeys', () => {
      const config = {
        debug: {}
      }
      
      expect(isValidDevKeyAddition(config)).toBe(true)
    })
    
    it('should reject invalid hex keys', () => {
      const config = {
        debug: {
          devPublicKeys: {
            'invalidkey': DevSecurityLevel.High
          }
        }
      }
      
      expect(isValidDevKeyAddition(config)).toBe(false)
    })
    
    it('should reject invalid security levels', () => {
      const config = {
        debug: {
          devPublicKeys: {
            '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef': 999
          }
        }
      }
      
      expect(isValidDevKeyAddition(config)).toBe(false)
    })
  })

  describe('isValidMultisigKeyAddition function', () => {
    it('should validate correct multisigKeys', () => {
      const config = {
        debug: {
          multisigKeys: {
            '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
          }
        }
      }
      
      expect(isValidMultisigKeyAddition(config)).toBe(true)
    })
    
    it('should handle config without multisigKeys', () => {
      const config = {
        debug: {}
      }
      
      expect(isValidMultisigKeyAddition(config)).toBe(true)
    })
    
    it('should reject invalid ethereum addresses', () => {
      const config = {
        debug: {
          multisigKeys: {
            'not-an-address': DevSecurityLevel.High
          }
        }
      }
      
      expect(isValidMultisigKeyAddition(config)).toBe(false)
    })
    
    it('should reject invalid security levels', () => {
      const config = {
        debug: {
          multisigKeys: {
            '0x1234567890123456789012345678901234567890': 999
          }
        }
      }
      
      expect(isValidMultisigKeyAddition(config)).toBe(false)
    })
  })

  describe('validateConfigChangeTx function', () => {
    it('should validate a multisig key change transaction with valid signatures', async () => {
      // Setup mock to return true for validation
      mockVerifyMultiSigs.mockReturnValue(true)
      
      // Prepare a test config change for multisig keys with valid signatures
      const tx = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
            }
          }
        }),
        sign: [
          { owner: wallet1.address.toLowerCase(), sig: 'valid_sig1' },
          { owner: wallet2.address.toLowerCase(), sig: 'valid_sig2' },
          { owner: wallet3.address.toLowerCase(), sig: 'valid_sig3' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      // Mock typedPermissions.changeMultiSigKeyList access through Jest spyOn
      jest.spyOn(Object.getPrototypeOf(require('../../../../../src/tx/changeConfig/validate')), 'typedPermissions', 'get')
        .mockReturnValue({
          changeMultiSigKeyList: keyManagerAddresses.map(addr => addr.toLowerCase())
        });
      
      const result = validateConfigChangeTx(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      expect(result.result).toBe('pass')
      expect(result.reason).toBe('valid')
    })
    
    it('should invalidate a multisig key change transaction with insufficient signatures', async () => {
      // Setup mock to return false for validation
      mockVerifyMultiSigs.mockReturnValue(false)
      
      // Prepare a test config change for multisig keys with insufficient signatures
      const tx = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
            }
          }
        }),
        sign: [
          { owner: wallet1.address.toLowerCase(), sig: 'sig1' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      // Mock typedPermissions.changeMultiSigKeyList access through Jest spyOn
      jest.spyOn(Object.getPrototypeOf(require('../../../../../src/tx/changeConfig/validate')), 'typedPermissions', 'get')
        .mockReturnValue({
          changeMultiSigKeyList: keyManagerAddresses.map(addr => addr.toLowerCase())
        });
      
      const result = validateConfigChangeTx(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      expect(result.result).toBe('fail')
      expect(result.reason).toContain('Unauthorized key management operation')
    })
    
    it('should validate a regular config change transaction', async () => {
      // Prepare a test for regular config change (non-multisig key change)
      const tx = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          server: {
            p2p: {
              cycleDuration: 90
            }
          }
        }),
        sign: [
          { owner: wallet1.address.toLowerCase(), sig: 'sig1' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      const result = validateConfigChangeTx(tx, mockConfig, devPublicKeys, 1, mockVerifyMultiSigs)
      
      expect(result.result).toBe('pass')
      expect(result.reason).toBe('valid')
    })
    
    it('should handle invalid config JSON in transaction', async () => {
      // Prepare a test with invalid JSON in config field
      const tx = {
        internalTXType: 'ChangeConfig',
        config: '{invalid json}',
        sign: [
          { owner: wallet1.address.toLowerCase(), sig: 'sig1' }
        ] as unknown as ShardusTypes.Sign[]
      }
      
      const result = validateConfigChangeTx(tx, mockConfig, devPublicKeys, 1, mockVerifyMultiSigs)
      
      expect(result.result).toBe('fail')
      expect(result.reason).toContain('Invalid configuration JSON')
    })
  })

  describe('validateConfigChangeTxFields function', () => {
    beforeEach(() => {
      mockVerifyMultiSigs.mockReset()
    })

    it('should return success: true for valid config changes', async () => {
      // Set up mock to return true for validation
      mockVerifyMultiSigs.mockReturnValue(true)
      
      // Create a transaction signed by all three key managers
      const tx = await createSignedTx([wallet1, wallet2, wallet3], mockConfig)
      
      const result = validateConfigChangeTxFields(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should pass with the new API format
      expect(result.success).toBe(true)
      expect(result.reason).toBe('valid')
    })

    it('should return success: false for invalid signatures', async () => {
      // Set up mock to return false for validation
      mockVerifyMultiSigs.mockReturnValue(false)
      
      // Create a transaction signed by all three key managers
      const tx = await createSignedTx([wallet1, wallet2, wallet3], mockConfig)
      
      const result = validateConfigChangeTxFields(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should fail with the new API format
      expect(result.success).toBe(false)
      expect(result.reason).toContain('Unauthorized')
    })

    it('should return success: false for invalid config structure', async () => {
      // Set up mock to return true for signature validation but invalid config
      mockVerifyMultiSigs.mockReturnValue(true)
      
      // Create an invalid config tx with non-string value where string is expected
      const invalidConfig = {
        debug: {
          someOtherSetting: 'not-multisig-keys' // Not a multisig key change
        }
      }
      
      const tx = {
        config: JSON.stringify(invalidConfig),
        sign: []
      }
      
      // Mock comparePropertiesTypes to return false to simulate invalid structure
      jest.spyOn(generalUtils, 'comparePropertiesTypes').mockReturnValueOnce(false)
      
      const result = validateConfigChangeTxFields(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should fail with the new API format
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid config')
    })
  })
}); 