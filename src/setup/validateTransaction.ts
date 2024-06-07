import { DevSecurityLevel, Shardus } from '@shardus/core'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { InitRewardTimes, InternalTx, InternalTXType } from '../shardeum/shardeumTypes'
import { crypto, getTransactionObj, isDebugTx, isInternalTx, isInternalTXGlobal, verify } from './helpers'
import * as InitRewardTimesTx from '../tx/initRewardTimes'
import * as AccountsStorage from '../storage/accountStorage'
import { logFlags } from '..'
import config from '../config'
import { comparePropertiesTypes } from '../utils'
import { Utils } from '@shardus/types'

type Response = {
  result: string
  reason: string
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
        const devPublicKeys = shardus.getDevPublicKeys()
        let isUserVerified = false
        for (const devPublicKey in devPublicKeys) {
          const verificationStatus = verify(tx, devPublicKey)
          if (verificationStatus) {
            isUserVerified = true
            break
          }
        }
        if (!isUserVerified) {
          return { result: 'fail', reason: 'Dev key is not defined on the server!' }
        }
        const authorized = shardus.ensureKeySecurity(tx.sign.owner, DevSecurityLevel.High)
        if (!authorized) {
          return { result: 'fail', reason: 'Unauthorized User' }
        } else {
          if (tx.internalTXType === InternalTXType.ChangeConfig) {
            const givenConfig = Utils.safeJsonParse(tx.config)
            if (
              comparePropertiesTypes(omitDevKeys(givenConfig), config.server) &&
              isValidDevKeyAddition(givenConfig)
            ) {
              return { result: 'pass', reason: 'valid' }
            } else {
              return { result: 'fail', reason: 'Invalid config' }
            }
          }
          return { result: 'pass', reason: 'valid' }
        }
      } else if (tx.internalTXType === InternalTXType.SetCertTime) {
        return { result: 'pass', reason: 'valid' }
      } else if (tx.internalTXType === InternalTXType.InitRewardTimes) {
        return InitRewardTimesTx.validate(tx as InitRewardTimes, shardus)
      } else {
        //todo validate internal TX
        const isValid = crypto.verifyObj(internalTx)
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
  if (!givenConfig.debug?.devPublicKeys) {
    return givenConfig
  }

  const { debug, ...restOfConfig } = givenConfig
  const { devPublicKeys, ...restOfDebug } = debug

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

function isValidHexKey(key: string): boolean {
  const hexPattern = /^[a-f0-9]{64}$/i
  return hexPattern.test(key)
}
