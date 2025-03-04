import { DevSecurityLevel, ShardusTypes } from '@shardus/core'
import { Utils } from '@shardus/types'
import { ethers } from 'ethers'
import { comparePropertiesTypes } from '../../utils/general'
import multisigPermissions from '../../config/multisig-permissions.json'

/**
 * @file validate.ts
 * @description Configuration change validation for multisig key management security
 * 
 * This module provides specialized validation for multisig key management operations.
 * It ensures that only authorized key managers can modify the multisig key list,
 * enhancing security for sensitive operations in the network.
 * 
 * Key features:
 * - Detection of multisig key changes in config updates
 * - Special validation for multisig key management actions
 * - Signature verification from authorized key managers
 * - Integration with the transaction validation flow
 */

// Define the type for the multisig-permissions.json file
interface MultisigPermissions {
  changeDevKeyList: string[];
  changeMultiSigKeyList: string[];
  initiateSecureAccountTransfer: string[];
}

// Cast the imported JSON to have the correct type
const typedPermissions = multisigPermissions as MultisigPermissions;

/**
 * Type definition for the verifyMultiSigs function to use for dependency injection
 */
export type VerifyMultiSigsFunction = (
  rawPayload: object,
  sigs: ShardusTypes.Sign[],
  allowedPubkeys: { [pubkey: string]: DevSecurityLevel },
  minSigRequired: number,
  requiredSecurityLevel: DevSecurityLevel
) => boolean

/**
 * Determines if a configuration change is modifying the multisig key list
 * 
 * @param oldConfig The current configuration
 * @param newConfig The proposed configuration change
 * @returns True if the multisig key list is being modified, false otherwise
 */
export function isMultisigKeyChange(oldConfig: any, newConfig: any): boolean {
  // Check if debug.multisigKeys exists in new config
  const newMultisigKeys = newConfig?.debug?.multisigKeys
  
  // If newConfig doesn't specify multisigKeys, it can't be changing them
  if (!newMultisigKeys) {
    return false
  }
  
  // Get old multisig keys or empty object if none exist
  const oldMultisigKeys = oldConfig?.debug?.multisigKeys || {}
  
  // Check if the keys are different (added, removed, or changed)
  const oldKeys = Object.keys(oldMultisigKeys)
  const newKeys = Object.keys(newMultisigKeys)
  
  // Different number of keys means something changed
  if (oldKeys.length !== newKeys.length) {
    return true
  }
  
  // Check if any keys were added or removed
  for (const key of oldKeys) {
    if (!newMultisigKeys[key]) {
      return true
    }
  }
  
  for (const key of newKeys) {
    if (!oldMultisigKeys[key]) {
      return true
    }
  }
  
  // Check if any key's security level has changed
  for (const key of oldKeys) {
    if (oldMultisigKeys[key] !== newMultisigKeys[key]) {
      return true
    }
  }
  
  // No changes detected
  return false
}

/**
 * Performs special validation for multisig key management operations
 * 
 * The validation requires:
 * 1. All signers must be in the keyManagerAddresses list
 * 2. Number of valid signatures must meet the minSigRequired threshold
 * 
 * @param rawPayload The transaction payload without the signature field
 * @param sigs Array of signatures to validate
 * @param keyManagerAddresses Array of addresses allowed to manage multisig keys
 * @param minSigRequired Minimum number of valid signatures required
 * @param verifyMultiSigsFunc Function to use for basic signature verification
 * @returns True if validation passes, false otherwise
 */
export function verifyMultiSigsForKeyManagement(
  rawPayload: object,
  sigs: ShardusTypes.Sign[],
  keyManagerAddresses: string[],
  minSigRequired: number,
  verifyMultiSigsFunc: VerifyMultiSigsFunction
): boolean {
  if (!rawPayload || !sigs || !keyManagerAddresses || !Array.isArray(sigs)) {
    console.log('Validation failed: Missing required parameters');
    return false
  }
  
  if (sigs.length < minSigRequired) {
    console.log(`Validation failed: Not enough signatures (${sigs.length}/${minSigRequired})`);
    return false
  }
  
  // Convert keyManagerAddresses to a format compatible with verifyMultiSigs
  // The verifyMultiSigs function expects a map of pubkey -> security level
  const allowedPubkeys: { [pubkey: string]: DevSecurityLevel } = {}
  for (const address of keyManagerAddresses) {
    allowedPubkeys[address.toLowerCase()] = DevSecurityLevel.High
  }
  
  console.log('Key Manager Addresses:', Object.keys(allowedPubkeys));
  console.log('Signatures:', sigs.map(s => ({ owner: s.owner })));
  
  // Use the provided verifyMultiSigs function for the actual verification
  // We use the highest security level to ensure all key managers are treated equally
  const result = verifyMultiSigsFunc(
    rawPayload,
    sigs,
    allowedPubkeys,
    minSigRequired,
    DevSecurityLevel.High
  )
  
  console.log(`Validation result: ${result ? 'Passed' : 'Failed'}`);
  return result
}

/**
 * Validates a configuration change transaction with special handling for multisig key changes
 * 
 * @param tx The transaction containing the config change
 * @param config The current configuration
 * @param devPublicKeys The map of allowed public keys
 * @param regularRequiredSigs The regular minimum signatures for non-key management operations
 * @param verifyMultiSigsFunc The verification function to use for signature validation
 * @returns Object with validation result and reason
 */
export function validateConfigChange(
  tx: any,
  config: any,
  devPublicKeys: { [pubkey: string]: DevSecurityLevel },
  regularRequiredSigs: number,
  verifyMultiSigsFunc: VerifyMultiSigsFunction
): { result: string; reason: string } {
  const is_array_sig = Array.isArray(tx.sign) === true
  const sigs: ShardusTypes.Sign[] = is_array_sig ? tx.sign : [tx.sign]
  const { sign, ...txWithoutSign } = tx
  
  // Parse the new config
  const givenConfig = Utils.safeJsonParse(tx.config)
  
  // Check if this is a multisig key change
  if (isMultisigKeyChange(config, givenConfig)) {
    // Get the authorized addresses for changing multisig keys
    const keyManagerAddresses = typedPermissions.changeMultiSigKeyList || []
    
    // Apply special validation for key management
    const authorized = verifyMultiSigsForKeyManagement(
      txWithoutSign,
      sigs,
      keyManagerAddresses,
      regularRequiredSigs,
      verifyMultiSigsFunc
    )
    
    if (!authorized) {
      return { result: 'fail', reason: 'Unauthorized key management operation. Requires signatures from authorized key managers.' }
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
    return { result: 'fail', reason: 'Unauthorized operation' }
  }
  
  return { result: 'success', reason: 'valid' }
}

/**
 * Removes developer key fields from a configuration for comparison purposes
 * @param givenConfig Configuration object to process
 * @returns Configuration with dev keys removed
 */
export function omitDevKeys(givenConfig: any): any {
  if (!givenConfig.debug?.devPublicKeys && !givenConfig.debug?.multisigKeys) {
    return givenConfig
  }

  const { debug, ...restOfConfig } = givenConfig
  const { devPublicKeys, multisigKeys, ...restOfDebug } = debug

  if (Object.keys(restOfDebug).length > 0) {
    return { ...restOfConfig, debug: restOfDebug }
  }

  return restOfConfig
}

/**
 * Validates that developer public keys in a configuration have valid format and security levels
 * @param givenConfig Configuration containing developer keys
 * @returns True if all keys are valid, false otherwise
 */
export function isValidDevKeyAddition(givenConfig: any): boolean {
  const devPublicKeys = givenConfig.debug?.devPublicKeys
  if (!devPublicKeys) {
    return true
  }

  for (const key in devPublicKeys) {
    if (!isValidHexKey(key)) {
      return false
    }

    // eslint-disable-next-line security/detect-object-injection
    const securityLevel = devPublicKeys[key]
    if (!Object.values(DevSecurityLevel).includes(securityLevel)) {
      return false
    }
  }
  return true
}

/**
 * Validates that multisig keys in a configuration have valid format and security levels
 * @param givenConfig Configuration containing multisig keys
 * @returns True if all keys are valid, false otherwise
 */
export function isValidMultisigKeyAddition(givenConfig: any): boolean {
  const multisigKeys = givenConfig.debug?.multisigKeys
  if (!multisigKeys) {
    return true
  }

  for (const key in multisigKeys) {
    if (!ethers.isAddress(key)) {
      return false
    }

    // eslint-disable-next-line security/detect-object-injection
    const securityLevel = multisigKeys[key]
    if (!Object.values(DevSecurityLevel).includes(securityLevel)) {
      return false
    }
  }
  return true
}

/**
 * Validates that a string is a valid 64-character hexadecimal key
 * @param key String to validate
 * @returns True if the key is a valid 64-character hex string, false otherwise
 */
export function isValidHexKey(key: string): boolean {
  const hexPattern = /^[a-f0-9]{64}$/i
  return hexPattern.test(key)
}

/**
 * Validates a configuration change transaction, checking both signatures and config structure
 * 
 * @param tx The transaction to validate
 * @param config The current configuration
 * @param devPublicKeys The map of allowed public keys
 * @param requiredSigs Minimum number of signatures required
 * @param verifyMultiSigs The verification function to use for signature validation
 * @returns Validation result with success flag and reason message
 */
export function validateConfigChangeTxFields(
  tx: any,
  config: any,
  devPublicKeys: { [pubkey: string]: DevSecurityLevel },
  requiredSigs: number,
  verifyMultiSigs: VerifyMultiSigsFunction
): { success: boolean; reason: string } {
  // First validate the config change with special checks for multisig key changes
  const validationResult = validateConfigChange(tx, config, devPublicKeys, requiredSigs, verifyMultiSigs)
  
  if (validationResult.result === 'fail') {
    return { success: false, reason: validationResult.reason }
  }
  
  // Then validate the config structure itself
  const givenConfig = Utils.safeJsonParse(tx.config)
  
  // Check if the config structure is valid
  if (!comparePropertiesTypes(omitDevKeys(givenConfig), config.server)) {
    return { success: false, reason: 'Invalid config' }
  }
  
  // Validate any developer key additions
  if (!isValidDevKeyAddition(givenConfig)) {
    return { success: false, reason: 'Invalid config' }
  }
  
  // Validate any multisig key additions
  if (!isValidMultisigKeyAddition(givenConfig)) {
    const isMultisigChange = isMultisigKeyChange(config, givenConfig)
    if (isMultisigChange) {
      return { 
        success: false, 
        reason: 'Unauthorized key management operation. Requires signatures from authorized key managers.' 
      }
    } else {
      return { success: false, reason: 'Invalid config' }
    }
  }
  
  return { success: true, reason: 'valid' }
}

/**
 * Validates a configuration change transaction, checking both signatures and config structure
 * @deprecated Use validateConfigChangeTxFields instead, which returns {success, reason} format
 * 
 * @param tx The transaction to validate
 * @param config The current configuration
 * @param devPublicKeys The map of allowed public keys
 * @param requiredSigs Minimum number of signatures required
 * @param verifyMultiSigs The verification function to use for signature validation
 * @returns Legacy format with result and reason strings
 */
export function validateConfigChangeTx(
  tx: any,
  config: any,
  devPublicKeys: { [pubkey: string]: DevSecurityLevel },
  requiredSigs: number,
  verifyMultiSigs: VerifyMultiSigsFunction
): { result: string; reason: string } {
  const result = validateConfigChangeTxFields(tx, config, devPublicKeys, requiredSigs, verifyMultiSigs);
  return {
    result: result.success ? 'pass' : 'fail',
    reason: result.reason
  };
} 