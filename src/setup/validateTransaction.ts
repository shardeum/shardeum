import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { InternalTx, InternalTXType } from '../shardeum/shardeumTypes'
import { isInternalTx, isInternalTXGlobal, verify, isDebugTx, getTransactionObj } from './helpers'
import * as crypto from '@shardus/crypto-utils'

export const validateTransaction = tx => {
  if (isInternalTx(tx)) {
    let internalTX = tx as InternalTx
    if (isInternalTXGlobal(internalTX) === true) {
      return { result: 'pass', reason: 'valid' }
    } else if (tx.internalTXType === InternalTXType.ChangeConfig) {
      const devPublicKey = ShardeumFlags.devPublicKey
      if (devPublicKey) {
        let isValid = verify(tx, devPublicKey)
        console.log('isValid', isValid)
        if (isValid) return { result: 'pass', reason: 'valid' }
        else return { result: 'fail', reason: 'Invalid signature' }
      } else {
        return { result: 'fail', reason: 'Dev key is not defined on the server!' }
      }
    } else {
      //todo validate internal TX
      let isValid = crypto.verifyObj(internalTX)
      if (isValid) return { result: 'pass', reason: 'valid' }
      else return { result: 'fail', reason: 'Invalid signature' }
    }
  }

  if (isDebugTx(tx)) {
    //todo validate debug TX
    return { result: 'pass', reason: 'all_allowed' }
  }
  let txObj = getTransactionObj(tx)
  const response = {
    result: 'fail',
    reason: 'Transaction is not valid. Cannot get txObj.',
  }
  if (!txObj) return response

  if (!txObj.isSigned() || !txObj.validate()) {
    response.reason = 'Transaction is not signed or signature is not valid.'
    return response
  }

  try {
    let senderAddress = txObj.getSenderAddress()
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
