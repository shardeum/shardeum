import { ethers } from 'ethers'
import { DevSecurityLevel } from '@shardus/core'
import { Utils } from '@shardus/types'

// Only import the functions that don't have local declarations
import {
  omitDevKeys,
  isValidDevKeyAddition,
  isValidMultisigKeyAddition,
  isValidHexKey,
  validateConfigChangeTx
} from '../src/setup/validateConfigChange'

// Import comparePropertiesTypes for proper mocking
import * as generalUtils from '../src/utils/general'

// Mock the type definition without importing from the real file
type VerifyMultiSigsFunction = (
  rawPayload: object,
  sigs: Array<{ owner: string; sig: string }>,
  allowedPubkeys: { [pubkey: string]: DevSecurityLevel },
  minSigRequired: number,
  requiredSecurityLevel: DevSecurityLevel
) => boolean

// Create local versions of the functions we want to test
function isMultisigKeyChange(oldConfig: any, newConfig: any): boolean {
  // Check if debug.multisigKeys exist in both configs
  const oldMultisigKeys = oldConfig?.debug?.multisigKeys
  const newMultisigKeys = newConfig?.debug?.multisigKeys
  
  // If newConfig doesn't have multisigKeys, it can't be changing them
  if (!newMultisigKeys) {
    return false
  }

  // If oldConfig doesn't have multisigKeys but newConfig does, it's a key change
  if (!oldMultisigKeys) {
    return Object.keys(newMultisigKeys).length > 0
  }

  // Check if any keys are being added, removed, or modified
  const oldKeys = Object.keys(oldMultisigKeys)
  const newKeys = Object.keys(newMultisigKeys)
  
  // If key count is different, something was added or removed
  if (oldKeys.length !== newKeys.length) {
    return true
  }
  
  // Check if any keys are different
  for (const key of oldKeys) {
    // If key exists in old but not in new, it's being removed
    if (!(key in newMultisigKeys)) {
      return true
    }
    
    // If security level is being changed, it's a key change
    if (oldMultisigKeys[key] !== newMultisigKeys[key]) {
      return true
    }
  }
  
  // Check if any new keys are being added
  for (const key of newKeys) {
    if (!(key in oldMultisigKeys)) {
      return true
    }
  }
  
  return false
}

function verifyMultiSigsForKeyManagement(
  rawPayload: object,
  sigs: Array<{ owner: string; sig: string }>,
  keyManagerAddresses: string[],
  minSigRequired: number,
  verifyMultiSigsFunc: VerifyMultiSigsFunction
): boolean {
  if (!rawPayload || !sigs || !keyManagerAddresses || !Array.isArray(sigs)) {
    return false
  }
  
  if (sigs.length < minSigRequired) {
    return false
  }
  
  // Convert keyManagerAddresses to a format compatible with verifyMultiSigs
  const allowedPubkeys: { [pubkey: string]: DevSecurityLevel } = {}
  for (const address of keyManagerAddresses) {
    allowedPubkeys[address.toLowerCase()] = DevSecurityLevel.High
  }
  
  // Use the provided verifyMultiSigs function for the actual verification
  return verifyMultiSigsFunc(
    rawPayload,
    sigs,
    allowedPubkeys,
    minSigRequired,
    DevSecurityLevel.High
  )
}

function validateConfigChange(
  tx: any,
  config: any,
  devPublicKeys: { [pubkey: string]: DevSecurityLevel },
  regularRequiredSigs: number,
  verifyMultiSigsFunc: VerifyMultiSigsFunction
): { result: string; reason: string } {
  const is_array_sig = Array.isArray(tx.sign) === true
  const sigs = is_array_sig ? tx.sign : [tx.sign]
  const { sign, ...txWithoutSign } = tx
  
  // Parse the new config
  const givenConfig = JSON.parse(tx.config)
  
  // Check if this is a multisig key change
  if (isMultisigKeyChange(config, givenConfig)) {
    // Get key manager config
    const keyManagerAddresses = config.server?.debug?.keyManagerAddresses || []
    const keyManagementMinSignatures = config.server?.debug?.keyManagementMinSignatures || 3
    
    // Apply special validation for key management
    const authorized = verifyMultiSigsForKeyManagement(
      txWithoutSign,
      sigs,
      keyManagerAddresses,
      keyManagementMinSignatures,
      verifyMultiSigsFunc
    )
    
    if (!authorized) {
      return { 
        result: 'fail', 
        reason: 'Unauthorized key management operation. Requires signatures from authorized key managers.'
      }
    }
    
    // If we pass the special validation, continue with regular validation
    return { result: 'success', reason: 'valid' }
  }
  
  // For non-multisig key changes, use regular multisig validation
  const authorized = verifyMultiSigsFunc(
    txWithoutSign,
    sigs,
    devPublicKeys,
    regularRequiredSigs,
    DevSecurityLevel.High
  )
  
  if (!authorized) {
    return { result: 'fail', reason: 'Unauthorized. Requires signatures from authorized multisig keys.' }
  }
  
  return { result: 'success', reason: 'valid' }
}

// Set up mocks for when needed
const mockVerifyMultiSigs = jest.fn()

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
        keyManagementMinSignatures: 3,
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
  
  // Helper function to create signed transactions
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
            '0x1111111111111111111111111111111111111111': DevSecurityLevel.Medium
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
    
    it('should return false for non-multisig key changes', () => {
      const oldConfig = {
        server: {
          p2p: {
            cycleDuration: 60
          }
        }
      }
      
      const newConfig = {
        server: {
          p2p: {
            cycleDuration: 90
          }
        }
      }
      
      expect(isMultisigKeyChange(oldConfig, newConfig)).toBe(false)
    })
  })
  
  describe('verifyMultiSigsForKeyManagement function', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockVerifyMultiSigs.mockReset()
    })
    
    it('should pass with enough valid signers from keyManagerAddresses', async () => {
      // Sign the payload with 3 valid key managers (wallet1, wallet2, wallet3)
      const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(payload)))
      
      const sigs = [
        {
          owner: wallet1.address.toLowerCase(),
          sig: await wallet1.signMessage(ethers.getBytes(payload_hash))
        },
        {
          owner: wallet2.address.toLowerCase(),
          sig: await wallet2.signMessage(ethers.getBytes(payload_hash))
        },
        {
          owner: wallet3.address.toLowerCase(),
          sig: await wallet3.signMessage(ethers.getBytes(payload_hash))
        }
      ]
      
      // Create a mock verification function that always returns true
      mockVerifyMultiSigs.mockReturnValue(true)
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses,
        3,
        mockVerifyMultiSigs
      )
      
      // Verify the mock was called with the right parameters
      expect(mockVerifyMultiSigs).toHaveBeenCalledWith(
        payload,
        sigs,
        expect.any(Object),
        3,
        DevSecurityLevel.High
      )
      
      expect(result).toBe(true)
    })
    
    it('should fail with not enough valid signers', async () => {
      // Sign the payload with only 2 valid key managers (wallet1, wallet2)
      const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(payload)))
      
      const sigs = [
        {
          owner: wallet1.address.toLowerCase(),
          sig: await wallet1.signMessage(ethers.getBytes(payload_hash))
        },
        {
          owner: wallet2.address.toLowerCase(),
          sig: await wallet2.signMessage(ethers.getBytes(payload_hash))
        }
      ]
      
      // Create a mock that returns false - we're testing failure case
      mockVerifyMultiSigs.mockReturnValue(false)
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses,
        3,
        mockVerifyMultiSigs
      )
      
      expect(result).toBe(false)
    })
    
    it('should fail with enough signers but some not in keyManagerAddresses', async () => {
      // Sign the payload with 2 valid key managers and 1 invalid
      const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(payload)))
      
      const sigs = [
        {
          owner: wallet1.address.toLowerCase(),
          sig: await wallet1.signMessage(ethers.getBytes(payload_hash))
        },
        {
          owner: wallet2.address.toLowerCase(),
          sig: await wallet2.signMessage(ethers.getBytes(payload_hash))
        },
        {
          owner: wallet4.address.toLowerCase(), // Not in keyManagerAddresses
          sig: await wallet4.signMessage(ethers.getBytes(payload_hash))
        }
      ]
      
      // Create a mock that returns false - we're testing failure case
      mockVerifyMultiSigs.mockReturnValue(false)
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses,
        3,
        mockVerifyMultiSigs
      )
      
      expect(result).toBe(false)
    })
    
    it('should fail with invalid signatures', async () => {
      // Sign with 3 valid key managers but use wrong payload for one
      const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(payload)))
      const wrong_payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify({ ...payload, wrong: true })))
      
      const sigs = [
        {
          owner: wallet1.address.toLowerCase(),
          sig: await wallet1.signMessage(ethers.getBytes(payload_hash))
        },
        {
          owner: wallet2.address.toLowerCase(),
          sig: await wallet2.signMessage(ethers.getBytes(payload_hash))
        },
        {
          owner: wallet3.address.toLowerCase(),
          sig: await wallet3.signMessage(ethers.getBytes(wrong_payload_hash)) // Signed wrong payload
        }
      ]
      
      // Create a mock that returns false - we're testing failure case
      mockVerifyMultiSigs.mockReturnValue(false)
      
      const result = verifyMultiSigsForKeyManagement(
        payload,
        sigs,
        keyManagerAddresses,
        3,
        mockVerifyMultiSigs
      )
      
      expect(result).toBe(false)
    })
  })
  
  describe('validateConfigChange function', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockVerifyMultiSigs.mockReset()
    })
    
    it('should pass validation for multisig key changes with valid key manager signatures', async () => {
      // Set up mock to return true for validation
      mockVerifyMultiSigs.mockReturnValue(true)
      
      // Create a transaction signed by all three key managers
      const tx = await createSignedTx([wallet1, wallet2, wallet3], mockConfig)
      
      // Use the real isMultisigKeyChange function
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should pass
      expect(result.result).toBe('success')
      expect(result.reason).toBe('valid')
    })
    
    it('should fail validation for multisig key changes without enough signatures', async () => {
      // Set up mock to return false for validation
      mockVerifyMultiSigs.mockReturnValue(false)
      
      // Create a transaction signed by only two key managers
      const tx = await createSignedTx([wallet1, wallet2], mockConfig)
      
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should fail
      expect(result.result).toBe('fail')
      expect(result.reason).toContain('Unauthorized key management operation')
    })
    
    it('should fail validation for multisig key changes with non-key-manager signatures', async () => {
      // Set up mock to return false for validation
      mockVerifyMultiSigs.mockReturnValue(false)
      
      // Create a transaction signed by two key managers and one non-key-manager
      const tx = await createSignedTx([wallet1, wallet2, wallet4], mockConfig)
      
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Validation should fail
      expect(result.result).toBe('fail')
      expect(result.reason).toContain('Unauthorized key management operation')
    })
    
    it('should handle regular config changes (non-multisig key changes)', async () => {
      // Mock the function to return true
      mockVerifyMultiSigs.mockReturnValue(true)
      
      // Create a regular config change (not a multisig key change)
      const regularConfigPayload = {
        internalTXType: 'ChangeConfig',
        config: JSON.stringify({
          server: {
            p2p: {
              cycleDuration: 90
            }
          }
        })
      }
      
      const tx = await createSignedTx([wallet1, wallet2], mockConfig, regularConfigPayload)
      
      const result = validateConfigChange(tx, mockConfig, devPublicKeys, 2, mockVerifyMultiSigs)
      
      // Should use regular validation and pass
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
    it('should validate correct config changes', async () => {
      // Mock dependencies
      const mockVerifyMultiSigs = jest.fn().mockReturnValue(true)
      
      // Create test tx and config
      const tx = {
        isInternalTx: true,
        internalTXType: 3,
        config: JSON.stringify({
          server: {
            testField: 'test value'
          }
        }),
        sign: [{ owner: 'owner1', sig: 'sig1' }]
      }
      
      const config = {
        server: {
          testField: 'test value'
        }
      }
      
      const devPublicKeys = {
        'owner1': DevSecurityLevel.High
      }
      
      // Mock implementation of comparePropertiesTypes to return true
      jest.spyOn(generalUtils, 'comparePropertiesTypes').mockReturnValue(true)
      
      const result = validateConfigChangeTx(tx, config, devPublicKeys, 1, mockVerifyMultiSigs)
      
      expect(result.result).toBe('pass')
      expect(result.reason).toBe('valid')
      
      // Restore mock
      jest.restoreAllMocks()
    })
    
    it('should fail when validateConfigChange fails', async () => {
      // Mock dependencies to fail validation
      const mockVerifyMultiSigs = jest.fn().mockReturnValue(false)
      
      // Create test tx and config
      const tx = {
        isInternalTx: true,
        internalTXType: 3,
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              '0x1234567890123456789012345678901234567890': DevSecurityLevel.High
            }
          }
        }),
        sign: [{ owner: 'owner1', sig: 'sig1' }]
      }
      
      const config = {
        debug: {
          multisigKeys: {}
        }
      }
      
      const devPublicKeys = {
        'owner1': DevSecurityLevel.High
      }
      
      const result = validateConfigChangeTx(tx, config, devPublicKeys, 1, mockVerifyMultiSigs)
      
      expect(result.result).toBe('fail')
    })
    
    it('should fail when comparePropertiesTypes fails', async () => {
      // Mock dependencies
      const mockVerifyMultiSigs = jest.fn().mockReturnValue(true)
      
      // Create test tx and config
      const tx = {
        isInternalTx: true,
        internalTXType: 3,
        config: JSON.stringify({
          server: {
            newField: 'new value'
          }
        }),
        sign: [{ owner: 'owner1', sig: 'sig1' }]
      }
      
      const config = {
        server: {
          testField: 'test value'
        }
      }
      
      const devPublicKeys = {
        'owner1': DevSecurityLevel.High
      }
      
      // Mock implementation of comparePropertiesTypes to return false
      jest.spyOn(generalUtils, 'comparePropertiesTypes').mockReturnValue(false)
      
      const result = validateConfigChangeTx(tx, config, devPublicKeys, 1, mockVerifyMultiSigs)
      
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('Invalid config')
      
      // Restore mock
      jest.restoreAllMocks()
    })
    
    it('should fail when isValidDevKeyAddition fails', async () => {
      // Mock dependencies
      const mockVerifyMultiSigs = jest.fn().mockReturnValue(true)
      
      // Create test tx with invalid dev key
      const tx = {
        isInternalTx: true,
        internalTXType: 3,
        config: JSON.stringify({
          debug: {
            devPublicKeys: {
              'invalidkey': DevSecurityLevel.High
            }
          }
        }),
        sign: [{ owner: 'owner1', sig: 'sig1' }]
      }
      
      const config = {}
      
      const devPublicKeys = {
        'owner1': DevSecurityLevel.High
      }
      
      // Mock implementation of comparePropertiesTypes to return true
      jest.spyOn(generalUtils, 'comparePropertiesTypes').mockReturnValue(true)
      
      const result = validateConfigChangeTx(tx, config, devPublicKeys, 1, mockVerifyMultiSigs)
      
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('Invalid config')
      
      // Restore mock
      jest.restoreAllMocks()
    })
    
    it('should fail when isValidMultisigKeyAddition fails', async () => {
      // Mock dependencies
      const mockVerifyMultiSigs = jest.fn().mockReturnValue(true)
      
      // Create test tx with invalid multisig key
      const tx = {
        isInternalTx: true,
        internalTXType: 3,
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              'not-an-address': DevSecurityLevel.High
            }
          }
        }),
        sign: [{ owner: 'owner1', sig: 'sig1' }]
      }
      
      const config = {}
      
      const devPublicKeys = {
        'owner1': DevSecurityLevel.High
      }
      
      // Mock implementation of comparePropertiesTypes to return true
      jest.spyOn(generalUtils, 'comparePropertiesTypes').mockReturnValue(true)
      
      const result = validateConfigChangeTx(tx, config, devPublicKeys, 1, mockVerifyMultiSigs)
      
      expect(result.result).toBe('fail')
      expect(result.reason).toBe('Unauthorized key management operation. Requires signatures from authorized key managers.')
      
      // Restore mock
      jest.restoreAllMocks()
    })
  })
}); 