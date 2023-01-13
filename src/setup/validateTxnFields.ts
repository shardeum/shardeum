import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  InternalTx,
  InternalTXType,
  SetCertTime,
  StakeCoinsTX,
  UnstakeCoinsTX,
} from '../shardeum/shardeumTypes'
import { isSetCertTimeTx, validateSetCertTimeTx } from '../tx/setCertTime'
import {
  getInjectedOrGeneratedTimestamp,
  isInternalTx,
  isInternalTXGlobal,
  verify,
  crypto,
  getTransactionObj,
} from './helpers'
import * as InitRewardTimesTx from '../tx/initRewardTimes'
import { validateClaimRewardTx } from '../tx/claimReward'
import { bufferToHex, BN } from 'ethereumjs-util'
import { __ShardFunctions, nestedCountersInstance, Shardus } from '@shardus/core'
import { _base16BNParser } from '../utils'

/**
 * Checks that Transaction fields are valid
 * @param shardus
 * @param debugAppdata
 * @returns
 */
export const validateTxnFields = (shardus: Shardus, debugAppdata: Map<string, any>) => (
  timestampedTx: any,
  appData: any
) => {
  let { tx } = timestampedTx
  let txnTimestamp: number = getInjectedOrGeneratedTimestamp(timestampedTx)

  if (!txnTimestamp) {
    return {
      success: false,
      reason: 'Invalid transaction timestamp',
      txnTimestamp,
    }
  }

  if (isSetCertTimeTx(tx)) {
    let setCertTimeTx = tx as SetCertTime
    const result = validateSetCertTimeTx(setCertTimeTx, appData)
    return {
      success: result.isValid,
      reason: result.reason,
      txnTimestamp,
    }
  }

  if (isInternalTx(tx)) {
    let internalTX = tx as InternalTx
    let success = false
    let reason = ''

    // validate internal TX
    if (isInternalTXGlobal(internalTX) === true) {
      return {
        success: true,
        reason: '',
        txnTimestamp,
      }
    } else if (tx.internalTXType === InternalTXType.ChangeConfig) {
      try {
        // const devPublicKey = shardus.getDevPublicKey() // This have to be reviewed again whether to get from shardus interface or not
        const devPublicKey = ShardeumFlags.devPublicKey
        if (devPublicKey) {
          success = verify(tx, devPublicKey)
          if (!success) reason = 'Dev key does not match!'
        } else {
          success = false
          reason = 'Dev key is not defined on the server!'
        }
      } catch (e) {
        reason = 'Invalid signature for internal tx'
      }
    } else if (tx.internalTXType === InternalTXType.InitRewardTimes) {
      let result = InitRewardTimesTx.validateFields(tx, shardus)
      success = result.success
      reason = result.reason
    } else if (tx.internalTXType === InternalTXType.ClaimReward) {
      let result = validateClaimRewardTx(tx, appData)
      success = result.isValid
      reason = result.reason
    } else {
      try {
        success = crypto.verifyObj(internalTX)
      } catch (e) {
        reason = 'Invalid signature for internal tx'
      }
    }
    if (ShardeumFlags.VerboseLogs) console.log('validateTxsField', success, reason)
    return {
      success,
      reason,
      txnTimestamp: txnTimestamp,
    }
  }

  // Validate EVM tx fields
  let success = false
  let reason = 'Invalid EVM transaction fields'

  try {
    let txObj = getTransactionObj(tx)
    let isSigned = txObj.isSigned()
    let isSignatureValid = txObj.validate()
    if (ShardeumFlags.VerboseLogs) console.log('validate evm tx', isSigned, isSignatureValid)

    //const txId = '0x' + crypto.hashObj(timestampedTx.tx)
    const txHash = bufferToHex(txObj.hash())

    //limit debug app data size.  (a queue would be nicer, but this is very simple)
    if (debugAppdata.size > 1000) {
      debugAppdata.clear()
    }
    debugAppdata.set(txHash, appData)

    if (isSigned && isSignatureValid) {
      success = true
      reason = ''
    } else {
      reason = 'Transaction is not signed or signature is not valid'
      nestedCountersInstance.countEvent('shardeum', 'validate - sign ' + isSigned ? 'failed' : 'missing')
    }

    if (ShardeumFlags.txBalancePreCheck && appData != null) {
      let minBalance = ShardeumFlags.constantTxFee ? new BN(ShardeumFlags.constantTxFee) : new BN(1)
      //check with value added in
      minBalance = minBalance.add(txObj.value)
      let accountBalance = new BN(appData.balance)
      if (accountBalance.lt(minBalance)) {
        success = false
        reason = `Sender does not have enough balance.`
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`balance fail: sender ${txObj.getSenderAddress()} does not have enough balance. Min balance: ${minBalance.toString()}, Account balance: ${accountBalance.toString()}`)
        nestedCountersInstance.countEvent('shardeum', 'validate - insufficient balance')
      } else {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`balance pass: sender ${txObj.getSenderAddress()} has balance of ${accountBalance.toString()}`)
      }
    }

    if (ShardeumFlags.txNoncePreCheck && appData != null) {
      let txNonce = txObj.nonce.toNumber()
      let perfectCount = appData.nonce + appData.queueCount
      if (txNonce != perfectCount) {
        success = false
        reason = `Transaction nonce != ${txNonce} ${perfectCount}`
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`nonce fail: perfectCount:${perfectCount} != ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount} txHash: ${txObj.hash().toString('hex')} `)
        nestedCountersInstance.countEvent('shardeum', 'validate - nonce fail')
      } else {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`nonce pass: perfectCount:${perfectCount} == ${txNonce}.    current nonce:${appData.nonce}  queueCount:${appData.queueCount}  txHash: ${txObj.hash().toString('hex')}`)
      }
    }

    if (appData && appData.internalTx && appData.internalTXType === InternalTXType.Stake) {
      if (ShardeumFlags.VerboseLogs) console.log('Validating stake coins tx fields', appData)
      let stakeCoinsTx = appData.internalTx as StakeCoinsTX
      let minStakeAmount = _base16BNParser(appData.networkAccount.current.stakeRequired)
      if (typeof stakeCoinsTx.stake === 'string') stakeCoinsTx.stake = new BN(stakeCoinsTx.stake, 16)
      if (
        stakeCoinsTx.nominator == null ||
        stakeCoinsTx.nominator.toLowerCase() !== txObj.getSenderAddress().toString()
      ) {
        if (ShardeumFlags.VerboseLogs)
          console.log(`nominator vs tx signer`, stakeCoinsTx.nominator, txObj.getSenderAddress().toString())
        success = false
        reason = `Invalid nominator address in stake coins tx`
      } else if (stakeCoinsTx.nominee == null) {
        success = false
        reason = `Invalid nominee address in stake coins tx`
      } else if (!/^[A-Fa-f0-9]{64}$/.test(stakeCoinsTx.nominee)) {
        //TODO: NEED to potentially write a custom faster test that avoids regex so we can avoid a regex-dos attack
        success = false
        reason = 'Invalid nominee address in stake coins tx'
      } else if (!stakeCoinsTx.stake.eq(txObj.value)) {
        if (ShardeumFlags.VerboseLogs)
          console.log(
            `Tx value and stake amount are different`,
            stakeCoinsTx.stake.toString(),
            txObj.value.toString()
          )
        success = false
        reason = `Tx value and stake amount are different`
      } else if (stakeCoinsTx.stake.lt(minStakeAmount)) {
        success = false
        reason = `Stake amount is less than minimum required stake amount`
      }
    }

    if (appData && appData.internalTx && appData.internalTXType === InternalTXType.Unstake) {
      nestedCountersInstance.countEvent('shardeum-unstaking', 'validating unstake coins tx fields')
      if (ShardeumFlags.VerboseLogs) console.log('Validating unstake coins tx fields', appData.internalTx)
      let unstakeCoinsTX = appData.internalTx as UnstakeCoinsTX
      if (
        unstakeCoinsTX.nominator == null ||
        unstakeCoinsTX.nominator.toLowerCase() !== txObj.getSenderAddress().toString()
      ) {
        nestedCountersInstance.countEvent('shardeum-unstaking', 'invalid nominator address in stake coins tx')
        if (ShardeumFlags.VerboseLogs)
          console.log(`nominator vs tx signer`, unstakeCoinsTX.nominator, txObj.getSenderAddress().toString())
        success = false
        reason = `Invalid nominator address in stake coins tx`
      } else if (unstakeCoinsTX.nominee == null) {
        nestedCountersInstance.countEvent('shardeum-unstaking', 'invalid nominee address in stake coins tx')
        success = false
        reason = `Invalid nominee address in stake coins tx`
      }
      // todo: check the nominator account timestamp against ? may be no needed cos it evm tx has a nonce check too
    }
  } catch (e) {
    if (ShardeumFlags.VerboseLogs) console.log('validate error', e)
    nestedCountersInstance.countEvent('shardeum-unstaking', 'validate - exception')
    success = false
    reason = e.message
  }

  nestedCountersInstance.countEvent('shardeum-unstaking', 'tx validation successful')
  return {
    success,
    reason,
    txnTimestamp,
  }
}
