import { DevSecurityLevel, Shardus, ShardusTypes } from '@shardus/core'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { InitRewardTimes, InternalTx, InternalTXType, InternalTxWithSingleSign } from '../shardeum/shardeumTypes'
import {
  crypto,
  getTransactionObj,
  isDebugTx,
  isInternalTx,
  isInternalTXGlobal,
  verifyMultiSigs,
} from './helpers'
import * as InitRewardTimesTx from '../tx/initRewardTimes'
import * as AccountsStorage from '../storage/accountStorage'
import config from '../config'
import { comparePropertiesTypes } from '../utils'
import { Utils } from '@shardus/types'
import { ethers } from 'ethers'
import { shardusConfig } from '..'
import { validateTransferFromSecureAccount } from '../shardeum/secureAccounts'
import { validateConfigChange } from './multisigKeyValidator'

type Response = {
  result: string
  reason: string
}

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
 * @returns True if validation passes, false otherwise
 */
export function verifyMultiSigsForKeyManagement(
  rawPayload: object,
  sigs: ShardusTypes.Sign[],
  keyManagerAddresses: string[],
  minSigRequired: number
): boolean {
  if (!rawPayload || !sigs || !keyManagerAddresses || !Array.isArray(sigs)) {
    return false
  }
  
  if (sigs.length < minSigRequired) {
    return false
  }
  
  // Convert keyManagerAddresses to lowercase for case-insensitive matching
  const allowedAddresses = keyManagerAddresses.map(addr => addr.toLowerCase())
  
  let validSigs = 0
  const payload_hash = ethers.keccak256(ethers.toUtf8Bytes(Utils.safeStringify(rawPayload)))
  const seen = new Set()
  
  for (let i = 0; i < sigs.length; i++) {
    const signerAddress = ethers.verifyMessage(payload_hash, sigs[i].sig).toLowerCase()
    
    // Check if signer is in the key manager list and signature is valid
    if (
      !seen.has(sigs[i].owner) &&
      allowedAddresses.includes(signerAddress) &&
      signerAddress === sigs[i].owner.toLowerCase()
    ) {
      validSigs++
      seen.add(sigs[i].owner)
    }
    
    if (validSigs >= minSigRequired) break
  }
  
  return validSigs >= minSigRequired
}

export const validateTransaction =
  (shardus: Shardus) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tx: any): Response => {
    if (isInternalTx(tx)) {
      const internalTx = tx as InternalTx

      if (isInternalTXGlobal(internalTx) === true) {
        return { result: 'pass', reason: 'valid' }
      } else if (
        tx.internalTXType === InternalTXType.ChangeConfig ||
        internalTx.internalTXType === InternalTXType.ChangeNetworkParam
      ) {
        const devPublicKeys = shardus.getMultisigPublicKeys()
        const requiredSigs = Math.max(1, shardusConfig.debug.minMultiSigRequiredForGlobalTxs)
        
        // For config changes, use specialized validation
        if (tx.internalTXType === InternalTXType.ChangeConfig) {
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
        
        // For network param changes, use regular validation
        const is_array_sig = Array.isArray(tx.sign) === true
        const sigs: ShardusTypes.Sign[] = is_array_sig ? tx.sign : [tx.sign]
        const { sign, ...txWithoutSign } = tx
        
        const authorized = verifyMultiSigs(
          txWithoutSign,
          sigs,
          devPublicKeys,
          requiredSigs,
          DevSecurityLevel.High
        )
        
        if (!authorized) {
          return { result: 'fail', reason: 'Unauthorized User' }
        }
        
        return { result: 'pass', reason: 'valid' }
      } else if (tx.internalTXType === InternalTXType.SetCertTime) {
        return { result: 'pass', reason: 'valid' }
      } else if (tx.internalTXType === InternalTXType.InitRewardTimes) {
        return InitRewardTimesTx.validate(tx as InitRewardTimes, shardus)
      } else if (tx.internalTXType === InternalTXType.TransferFromSecureAccount) {
        const verifyResult = validateTransferFromSecureAccount(tx, shardus)
        return { result: verifyResult.success ? 'pass' : 'fail', reason: verifyResult.reason }
      } else {
        //todo validate internal TX
        const isValid = crypto.verifyObj(internalTx as InternalTxWithSingleSign)
        if (isValid) return { result: 'pass', reason: 'valid' }
        else return { result: 'fail', reason: 'Invalid signature' }
      }
    }

    // Reject all other transactions if txPause is enabled
    const networkAccount = AccountsStorage.cachedNetworkAccount
    if (networkAccount.current.txPause) {
      return {
        result: 'fail',
        reason: 'Transaction is not allowed. Network is paused.',
      }
    }

    if (isDebugTx(tx)) {
      //todo validate debug TX
      return { result: 'pass', reason: 'all_allowed' }
    }

    const txObj = getTransactionObj(tx)

    const response = {
      result: 'fail',
      reason: 'Transaction is not valid. Cannot get txObj.',
    }
    if (!txObj) return response

    try {
      // FIX: seems like a bug using txObj as senderAddress
      // const senderAddress = txObj.getSenderAddress()
      const senderAddress = txObj
      if (!senderAddress) {
        return {
          result: 'fail',
          reason: 'Cannot derive sender address from tx',
        }
      }
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Validation error', e)
      response.result = 'fail'
      response.reason = e
      return response
    }

    // TODO: more validation here

    response.result = 'pass'
    response.reason = 'all_allowed'

    return response
  }

function omitDevKeys(givenConfig: any): any {
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

function isValidDevKeyAddition(givenConfig: any): boolean {
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

function isValidMultisigKeyAddition(givenConfig: any): boolean {
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

function isValidHexKey(key: string): boolean {
  const hexPattern = /^[a-f0-9]{64}$/i
  return hexPattern.test(key)
}
