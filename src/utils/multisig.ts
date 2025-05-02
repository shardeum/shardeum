import { safeJsonParse } from '@shardeum-foundation/lib-types/build/src/utils/functions/stringify'
import { ChangeConfig } from '../shardeum/shardeumTypes'

/**
 * Checks if a transaction is for changing keys and returns permitted keys
 *
 * @param tx The transaction (already known to be ChangeConfig or ChangeNetworkParam)
 * @param currentConfig The current configuration object
 * @param multiSigPermissions The multiSigPermissions object
 * @returns Object with isKeyChange flag and array of permitted keys
 */
export function isKeyChange(
  tx: ChangeConfig,
  currentConfig: any,
  multiSigPermissions: any
): { isKeyChange: boolean; permittedKeys: string[] } {
  // Default response for no key changes
  const noChange = { isKeyChange: false, permittedKeys: [] }

  // Validate and parse the config
  if (!tx.config || typeof tx.config !== 'string') {
    return noChange
  }

  try {
    const newConfig = safeJsonParse(tx.config)

    // Check what type of key changes are happening
    const isMultisigChange = isKeyChangeDetailed(currentConfig, newConfig, 'multisigKeys')
    const isDevKeyChange = isKeyChangeDetailed(currentConfig, newConfig, 'devPublicKeys')

    // If no key changes, return early
    if (!isMultisigChange && !isDevKeyChange) {
      return noChange
    }

    // Determine which permitted keys to return
    if (isMultisigChange && isDevKeyChange) {
      // If both types are changing, use the intersection of permitted keys
      const multiSigList = multiSigPermissions.changeMultiSigKeyList || []
      const devKeyList = multiSigPermissions.changeDevKeyList || []
      return {
        isKeyChange: true,
        permittedKeys: multiSigList.filter((key) => devKeyList.includes(key)),
      }
    }

    // Return the appropriate permitted keys list
    return {
      isKeyChange: true,
      permittedKeys: isMultisigChange
        ? multiSigPermissions.changeMultiSigKeyList || []
        : multiSigPermissions.changeDevKeyList || [],
    }
  } catch (e) {
    // If parsing fails, it's not a valid config change
    return noChange
  }
}

/**
 * Checks if a transaction is for changing non-key configs and returns permitted keys
 *
 * @param tx The transaction (already known to be ChangeConfig or ChangeNetworkParam)
 * @param currentConfig The current configuration object
 * @param multiSigPermissions The multiSigPermissions object
 * @returns Object with isNonKeyChange flag and array of permitted keys
 */
export function isNonKeyChange(
  tx: ChangeConfig,
  currentConfig: any,
  multiSigPermissions: any
): { isNonKeyChange: boolean; permittedKeys: string[] } {
  // Default response for no non-key changes
  const noChange = { isNonKeyChange: false, permittedKeys: [] }

  // Validate and parse the config
  if (!tx.config || typeof tx.config !== 'string') {
    return noChange
  }

  try {
    const newConfig = safeJsonParse(tx.config)

    // Check if there are key changes (if so, this is not a non-key change)
    if (
      isKeyChangeDetailed(currentConfig, newConfig, 'multisigKeys') ||
      isKeyChangeDetailed(currentConfig, newConfig, 'devPublicKeys')
    ) {
      return noChange
    }

    // Check if there are any changes at all
    if (JSON.stringify(newConfig) === JSON.stringify(currentConfig)) {
      return noChange
    }

    // This is a non-key change, return the permitted keys
    return {
      isNonKeyChange: true,
      permittedKeys: multiSigPermissions.changeNonKeyConfigs || [],
    }
  } catch (e) {
    // If parsing fails, it's not a valid config change
    return noChange
  }
}

/**
 * Generic function to determine if a configuration change is modifying a key list
 *
 * @param oldConfig The current configuration
 * @param newConfig The proposed configuration change
 * @param keyType The type of keys to check ('multisigKeys' or 'devKeys')
 * @returns True if the key list is being modified, false otherwise
 */
export function isKeyChangeDetailed(oldConfig: any, newConfig: any, keyType: string): boolean {
  // Check if the key type exists in new config
  const newKeys = newConfig?.debug?.[keyType]

  // If newConfig doesn't specify this key type, it can't be changing them
  if (!newKeys) {
    return false
  }

  // Get old keys or empty object if none exist
  const oldKeys = oldConfig?.debug?.[keyType] || {}

  // Get the key lists
  const oldKeyList = Object.keys(oldKeys)
  const newKeyList = Object.keys(newKeys)

  // Different number of keys means something changed
  if (oldKeyList.length !== newKeyList.length) {
    return true
  }

  // Check if any keys were added or removed
  const oldKeySet = new Set(oldKeyList)
  const newKeySet = new Set(newKeyList)

  // If the sets are different, something changed
  if (oldKeyList.some((key) => !newKeySet.has(key)) || newKeyList.some((key) => !oldKeySet.has(key))) {
    return true
  }

  // Check if any key's security level has changed
  return oldKeyList.some((key) => oldKeys[key] !== newKeys[key])
}

/**
 * Determines if a configuration change is modifying the multisig key list
 *
 * @param oldConfig The current configuration
 * @param newConfig The proposed configuration change
 * @returns True if the multisig key list is being modified, false otherwise
 */
export function isMultisigKeyChangeDetailed(oldConfig: any, newConfig: any): boolean {
  return isKeyChangeDetailed(oldConfig, newConfig, 'multisigKeys')
}

/**
 * Determines if a configuration change is modifying the dev key list
 *
 * @param oldConfig The current configuration
 * @param newConfig The proposed configuration change
 * @returns True if the dev key list is being modified, false otherwise
 */
export function isDevKeyChangeDetailed(oldConfig: any, newConfig: any): boolean {
  return isKeyChangeDetailed(oldConfig, newConfig, 'devKeys')
}

/**
 * Normalizes an Ethereum address to a consistent format for comparison
 *
 * @param address The Ethereum address to normalize
 * @returns The normalized Ethereum address
 */
export function normalizeEthAddress(address: string): string {
  if (!address) {
    return ''
  }

  let normalized = address.trim()

  // Add 0x prefix if missing
  if (!normalized.toLowerCase().startsWith('0x')) {
    normalized = '0x' + normalized
  }

  // Convert to lowercase for comparison purposes
  // This preserves the address format but allows for case-insensitive comparison
  return normalized.toLowerCase()
}

/**
 * Removes keys from multiSigPermissions that are not in currentConfig.debug.multisigKeys
 * This version normalizes addresses for better matching across case differences and formatting.
 *
 * @param multiSigPermissions The multiSigPermissions object containing lists of permitted keys
 * @param currentConfig The current configuration object containing valid multisig keys
 * @returns A new multiSigPermissions object with invalid keys removed
 */
export function cleanMultiSigPermissions(multiSigPermissions: any, currentConfig: any): any {
  // Check if either param is falsy
  if (!multiSigPermissions || !currentConfig || !currentConfig.debug || !currentConfig.debug.multisigKeys) {
    return multiSigPermissions
  }

  // Create a map of normalized addresses to their original config values
  const validMultisigKeysMap = new Map()
  for (const key of Object.keys(currentConfig.debug.multisigKeys)) {
    const normalizedKey = normalizeEthAddress(key)
    validMultisigKeysMap.set(normalizedKey, key)
  }

  // Create a new empty object to hold the cleaned permissions
  const cleanedPermissions: Record<string, any> = {}

  // For each property in the original permissions
  for (const permissionType in multiSigPermissions) {
    const value = multiSigPermissions[permissionType]

    // If the property is not an array, throw an error
    if (!Array.isArray(value)) {
      throw new Error(`Invalid permissions type: ${permissionType}`)
    }

    // First pass: Keep all original keys that match a normalized key in the config
    cleanedPermissions[permissionType] = []

    for (const key of value) {
      const normalizedKey = normalizeEthAddress(key)

      // Check if the key is valid
      if (validMultisigKeysMap.has(normalizedKey)) {
        // Add the original key to the cleaned permissions
        cleanedPermissions[permissionType].push(key)
      }
    }
  }

  return cleanedPermissions
}
