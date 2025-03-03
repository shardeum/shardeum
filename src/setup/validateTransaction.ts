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
import { shardusConfig } from '..'
import { validateTransferFromSecureAccount } from '../shardeum/secureAccounts'
import { 
  validateConfigChange, 
  omitDevKeys, 
  isValidDevKeyAddition, 
  isValidMultisigKeyAddition,
  isValidHexKey
} from '../tx/changeConfig/validate'

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
        const devPublicKeys = shardus.getMultisigPublicKeys()
        const requiredSigs = Math.max(1, shardusConfig.debug.minMultiSigRequiredForGlobalTxs)
        
        // For config changes, use specialized validation
        if (tx.internalTXType === InternalTXType.ChangeConfig) {
          return validateConfigChange(tx, config, devPublicKeys, requiredSigs, verifyMultiSigs)
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
