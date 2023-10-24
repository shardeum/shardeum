import { Shardus } from '@shardus/core'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { InitRewardTimes, InternalTx, InternalTXType } from '../shardeum/shardeumTypes'
import { crypto, getTransactionObj, isDebugTx, isInternalTx, isInternalTXGlobal, verify } from './helpers'
import * as InitRewardTimesTx from '../tx/initRewardTimes'
import * as AccountsStorage from '../storage/accountStorage'
import { logFlags } from '..'

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
      } else if (tx.internalTXType === InternalTXType.ChangeConfig) {
        const devPublicKey = ShardeumFlags.devPublicKey

        if (devPublicKey) {
          const isValid = verify(tx, devPublicKey)
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('isValid', isValid)

          if (isValid) {
            return { result: 'pass', reason: 'valid' }
          } else {
            return { result: 'fail', reason: 'Invalid signature' }
          }
        } else {
          return { result: 'fail', reason: 'Dev key is not defined on the server!' }
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

    if (!txObj.isSigned() || !txObj.isValid()) {
      response.reason = 'Transaction is not signed or signature is not valid.'
      return response
    }

    try {
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
