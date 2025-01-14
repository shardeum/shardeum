import { DevSecurityLevel, Shardus, ShardusTypes } from '@shardeum-foundation/core'
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
import { Utils } from '@shardeum-foundation/lib-types'
import { ethers } from 'ethers'
import { shardusConfig } from '..'
import { validateTransferFromSecureAccount } from '../shardeum/secureAccounts'
import fs from 'fs'

type Response = {
  result: string
  reason: string
}

const logFile = fs.createWriteStream('customLog.txt', { flags: 'a' });
const errorLogs = fs.createWriteStream('errors.txt', { flags: 'a' });

const process = require('node:process');
process.on('uncaughtException', (error: any) => {
  errorLogs.write(`${new Date().toISOString()} - Uncaught Exception: ${error.message}\n`);
});
process.on('unhandledRejection', (reason: any, promise: any) => {
  errorLogs.write(`${new Date().toISOString()} - Unhandled Rejection: ${reason}\n`);
});
process.on('rejectionHandled', (promise: any) => {
  errorLogs.write(`${new Date().toISOString()} - Rejection Handled: ${promise}\n`);
});


// create a simple logger implementation that writes to a file
export const log = (message: string) => {
  logFile.write(`${new Date().toISOString()} - ${message}\n`);
}

export const validateTransaction =
  (shardus: Shardus) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tx: any): Response => {
    log('validateTransaction: entering validateTransaction');
    if (isInternalTx(tx)) {
      log('validateTransaction: isInternalTx true');
      const internalTx = tx as InternalTx
      log('validateTransaction: validating internal tx');
      if (isInternalTXGlobal(internalTx) === true) {
        log('validateTransaction: isInternalTXGlobal true so we are skipping the rest of the validation');
        return { result: 'pass', reason: 'valid' }
      } else if (
        tx.internalTXType === InternalTXType.ChangeConfig ||
        internalTx.internalTXType === InternalTXType.ChangeNetworkParam
      ) {
        log('validateTransaction: internalTXType is ChangeConfig or ChangeNetworkParam');
        const devPublicKeys = shardus.getMultisigPublicKeys()
        const is_array_sig = Array.isArray(tx.sign) === true
        const requiredSigs = Math.max(1, shardusConfig.debug.minMultiSigRequiredForGlobalTxs)
        //Ensure old single sig / non-array are still compitable
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
          log('validateTransaction: verifyMultiSigs failed');
          return { result: 'fail', reason: 'Unauthorized User' }
        } else {
          log('validateTransaction: verifyMultiSigs passed');
          if (tx.internalTXType === InternalTXType.ChangeConfig) {
            log('validateTransaction: validating change config tx');
            const givenConfig = Utils.safeJsonParse(tx.config)
            log('validateTransaction: givenConfig: ' + JSON.stringify(givenConfig));
            if (
              comparePropertiesTypes(omitDevKeys(givenConfig), config.server) &&
              isValidDevKeyAddition(givenConfig) &&
              isValidMultisigKeyAddition(givenConfig)
            ) {
              log('validateTransaction: comparePropertiesTypes, isValidDevKeyAddition, and isValidMultisigKeyAddition passed');
              return { result: 'pass', reason: 'valid' }
            } else {
              log(`validateTransaction: comparePropertiesTypes, isValidDevKeyAddition, and isValidMultisigKeyAddition failed: comparePropertiesTypes: ${comparePropertiesTypes(omitDevKeys(givenConfig), config.server)}, isValidDevKeyAddition: ${isValidDevKeyAddition(givenConfig)}, isValidMultisigKeyAddition: ${isValidMultisigKeyAddition(givenConfig)}`);
              return { result: 'fail', reason: 'Invalid config' }
            }
          }
          log('validateTransaction: is changenetworkparam, so at this point its valid.');
          return { result: 'pass', reason: 'valid' }
        }
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
      if (!ShardeumFlags.debugTxEnabled) {
        return { result: 'fail', reason: 'Debug TX is not allowed' }
      }
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
