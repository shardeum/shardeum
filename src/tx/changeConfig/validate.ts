import { DevSecurityLevel, ShardusTypes } from '@shardus/core'
import { Utils } from '@shardus/types'
import { ethers } from 'ethers'
import { comparePropertiesTypes } from '../../utils/general'

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
 * Checks if a config change is modifying the multisig key list
 * @param oldConfig Current configuration
 * @param newConfig New configuration being applied
 * @returns True if multisig keys are being modified
 */
export function isMultisigKeyChange(oldConfig: any, newConfig: any): boolean {
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
    // eslint-disable-next-line security/detect-object-injection
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

/**
 * Verifies multisig signatures specifically for key management operations
 * This is a more stringent verification that requires:
 * 1. All signers must be in the keyManagerAddresses list
 * 2. Number of valid signatures must meet the keyManagementMinSignatures threshold
 * 
 * @param rawPayload The transaction payload
 * @param sigs The signatures to verify
 * @param keyManagerAddresses List of addresses authorized to manage keys
 * @param minSigRequired Minimum number of signatures required
 * @param verifyMultiSigsFunc The verification function to use for signature validation
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
    // Get key manager config
    const { keyManagerAddresses, keyManagementMinSignatures } = getKeyManagerConfig(config)
    
    // Apply special validation for key management
    const authorized = verifyMultiSigsForKeyManagement(
      txWithoutSign,
      sigs,
      keyManagerAddresses,
      keyManagementMinSignatures,
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
    return { result: 'fail', reason: 'Unauthorized. Requires signatures from authorized multisig keys.' }
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
 * Validates a config change transaction with special handling for multisig key changes
 * @param tx The transaction containing the config change
 * @param config The current configuration
 * @param devPublicKeys The map of allowed public keys
 * @param requiredSigs The regular minimum signatures for non-key management operations
 * @param verifyMultiSigs The verification function to use for signature validation
 * @returns Object with validation result and reason
 */
export function validateConfigChangeTx(
  tx: any,
  config: any,
  devPublicKeys: { [pubkey: string]: DevSecurityLevel },
  requiredSigs: number,
  verifyMultiSigs: VerifyMultiSigsFunction
): { result: string; reason: string } {
  // First validate the config change with special checks for multisig key changes
  const validationResult = validateConfigChange(tx, config, devPublicKeys, requiredSigs, verifyMultiSigs)
  
  if (validationResult.result === 'fail') {
    return validationResult
  }
  
  // Then validate the config structure itself
  const givenConfig = Utils.safeJsonParse(tx.config)
  if (
    comparePropertiesTypes(omitDevKeys(givenConfig), config.server) &&
    isValidDevKeyAddition(givenConfig) &&
    isValidMultisigKeyAddition(givenConfig)
  ) {
    return { result: 'pass', reason: 'valid' }
  } else {
    return { result: 'fail', reason: 'Invalid config' }
  }
} 