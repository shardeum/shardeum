import { nestedCountersInstance, Shardus, ShardusTypes } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { ONE_SECOND } from '../shardeum/shardeumConstants'
import config from '../config'
import { getNodeAccountWithRetry, InjectTxToConsensor } from '../handlers/queryCertificate'
import { toShardusAddress } from '../shardeum/evmAddress'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  AccountType,
  InternalTXType,
  NodeAccountQueryResponse,
  SetCertTime,
  WrappedEVMAccount,
  WrappedStates,
  InjectTxResponse,
} from '../shardeum/shardeumTypes'
import * as WrappedEVMAccountFunctions from '../shardeum/wrappedEVMAccountFunctions'
import { fixDeserializedWrappedEVMAccount } from '../shardeum/wrappedEVMAccountFunctions'
import * as AccountsStorage from '../storage/accountStorage'
import { getRandom, scaleByStabilityFactor, _base16BNParser, _readableSHM } from '../utils'

import { createInternalTxReceipt, logFlags, shardeumGetTime } from '..'
import { bigIntToHex, isValidAddress } from '@ethereumjs/util'
import { Utils } from '@shardus/types'
import { SafeBalance } from '../utils/safeMath'

export function isSetCertTimeTx(tx): boolean {
  if (tx.isInternalTx && tx.internalTXType === InternalTXType.SetCertTime) {
    return true
  }
  return false
}

export type setCertTimeTx = {
  isInternalTx: true
  internalTXType: InternalTXType.SetCertTime
  nominee: string
  nominator: string
  duration: number
  timestamp: number
}

export function getCertCycleDuration(): number {
  if (
    AccountsStorage.cachedNetworkAccount &&
    AccountsStorage.cachedNetworkAccount.current.certCycleDuration !== null
  ) {
    return AccountsStorage.cachedNetworkAccount.current.certCycleDuration
  }
  return ShardeumFlags.certCycleDuration
}

export async function injectSetCertTimeTx(
  shardus: Shardus,
  publicKey: string,
  activeNodes: ShardusTypes.ValidatorNodeDetails[]
): Promise<InjectTxResponse> {
  // Query the nodeAccount and see if it is ready before injecting setCertTime
  const accountQueryResponse = await getNodeAccountWithRetry(publicKey, activeNodes)
  if (!accountQueryResponse.success) return accountQueryResponse

  const nodeAccountQueryResponse = accountQueryResponse as NodeAccountQueryResponse
  const nominator = nodeAccountQueryResponse.nodeAccount?.nominator

  if (!nominator) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Nominator for this node account ${publicKey} is not found!`)
    return { success: false, reason: `Nominator for this node account ${publicKey} is not found!` }
  }
  // TODO: I think we can add another validation here that checks that nominator stakeAmount has enough for minStakeRequired in the network

  // Inject the setCertTime Tx
  const randomConsensusNode: ShardusTypes.ValidatorNodeDetails = getRandom(activeNodes, 1)[0]
  let tx: setCertTimeTx = {
    isInternalTx: true,
    internalTXType: InternalTXType.SetCertTime,
    nominee: publicKey,
    nominator,
    duration: getCertCycleDuration(), //temp setting to 20 to make debugging easier
    timestamp: shardeumGetTime(),
  }
  tx = shardus.signAsNode(tx)
  const result = await InjectTxToConsensor([randomConsensusNode], tx)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('INJECTED_SET_CERT_TIME_TX', result, tx)
  return result
}

export function validateSetCertTimeTx(tx: SetCertTime): { isValid: boolean; reason: string } {
  // nominee is NodeAccount2, will need here to verify address with other methods
  // if (!isValidAddress(tx.nominee)) {
  //   return { isValid: false, reason: 'Invalid nominee address' }
  // }
  if (!tx.nominee || tx.nominee.length !== 64) return { isValid: false, reason: 'Invalid nominee address' }
  if (!isValidAddress(tx.nominator)) {
    return { isValid: false, reason: 'Invalid nominator address' }
  }
  if (tx.duration <= 0) {
    return { isValid: false, reason: 'Duration in cert tx must be > 0' }
  }
  if (tx.duration > getCertCycleDuration()) {
    return { isValid: false, reason: 'Duration in cert tx must be not greater than certCycleDuration' }
  }
  if (tx.timestamp <= 0) {
    return { isValid: false, reason: 'Timestamp in cert tx must be > 0' }
  }
  try {
    if (!crypto.verifyObj(tx)) return { isValid: false, reason: 'Invalid signature for SetCertTime tx' }
  } catch (e) {
    return { isValid: false, reason: 'Invalid signature for SetCertTime tx' }
  }

  return { isValid: true, reason: '' }
}

export function validateSetCertTimeState(
  tx: SetCertTime,
  wrappedStates: WrappedStates
): { result: string; reason: string } {
  let committedStake = BigInt(0)

  let operatorEVMAccount: WrappedEVMAccount
  const acct = wrappedStates[toShardusAddress(tx.nominator, AccountType.Account)].data
  if (WrappedEVMAccountFunctions.isWrappedEVMAccount(acct)) {
    operatorEVMAccount = acct
  }
  fixDeserializedWrappedEVMAccount(operatorEVMAccount)
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('validateSetCertTimeState', tx, operatorEVMAccount)
  if (operatorEVMAccount == undefined) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`setCertTime validate state: found no wrapped state for operator account ${tx.nominator}`)
    if (ShardeumFlags.fixCertExpTiming)
      return {
        result: 'fail',
        reason: `Found no wrapped state for operator account ${tx.nominator}`,
      }
  } else {
    if (operatorEVMAccount && operatorEVMAccount.operatorAccountInfo) {
      try {
        committedStake = _base16BNParser(operatorEVMAccount.operatorAccountInfo.stake)
      } catch (er) {
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateSetCertTimeState' + ' stake failed to parse')
        return {
          result: 'fail',
          reason: `stake failed to parse: ${Utils.safeStringify(
            operatorEVMAccount.operatorAccountInfo.stake
          )} er:${er.message}`,
        }
      }
    } else if (operatorEVMAccount && operatorEVMAccount.operatorAccountInfo == null) {
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateSetCertTimeState' + ' Operator account info is null')
      return {
        result: 'fail',
        reason: `Operator account info is null: ${Utils.safeStringify(operatorEVMAccount)}`,
      }
    }
  }

  if (AccountsStorage.cachedNetworkAccount == null && ShardeumFlags.fixCertExpTiming) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateSetCertTimeState' + ' Cached network account is null')
    return {
      result: 'fail',
      reason: `Cached network account is null`,
    }
  }

  const minStakeRequiredUsd = AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
  const minStakeRequired = scaleByStabilityFactor(minStakeRequiredUsd, AccountsStorage.cachedNetworkAccount)

  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( 'validate operator stake', _readableSHM(committedStake), _readableSHM(minStakeRequired), ' committedStake < minStakeRequired : ', committedStake < minStakeRequired )

  // validate operator stake
  if (committedStake < minStakeRequired) {
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'validateSetCertTimeState' + ' Operator has not staked the required amount')
    return {
      result: 'fail',
      reason: 'Operator has not staked the required amount',
    }
  }
  return { result: 'pass', reason: 'valid' }
}

export function applySetCertTimeTx(
  shardus,
  tx: SetCertTime,
  wrappedStates: WrappedStates,
  txId: string,
  txTimestamp: number,
  applyResponse: ShardusTypes.ApplyResponse
): void {
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`applySetCertTimeTx txTimestamp:${txTimestamp}   tx.timestamp:${tx.timestamp}`, tx)

  //TODO this is failing with a warning like this:
  //Invalid SetCertTimeTx state, operator account 0x0950c3ecc7d1c4dd093c9652f335f9391d83ee99, reason: Operator has not staked the required amount
  //the stake time is still getting set correctly.  need to figure out if this is a false negative, and then hook it up so that
  //we can fail the TX if it has failed validation
  const isValidRequest = validateSetCertTimeState(tx, wrappedStates)
  if (isValidRequest.result === 'fail') {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Invalid SetCertTimeTx state, operator account ${tx.nominator}, reason: ${isValidRequest.reason}`)
    shardus.applyResponseSetFailed(
      applyResponse,
      `Invalid SetCertTimeTx state, operator account ${tx.nominator}, reason: ${isValidRequest.reason}`
    )
    /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'applySetCertTimeTx' + ' applyResponseSetFailed failed')
    return
  }

  let operatorEVMAccount: WrappedEVMAccount
  const acct = wrappedStates[toShardusAddress(tx.nominator, AccountType.Account)].data
  if (WrappedEVMAccountFunctions.isWrappedEVMAccount(acct)) {
    operatorEVMAccount = acct
  }

  operatorEVMAccount.timestamp = txTimestamp
  fixDeserializedWrappedEVMAccount(operatorEVMAccount)

  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('operatorEVMAccount Before', operatorEVMAccount)

  // Update state
  const serverConfig = config.server
  let shouldChargeTxFee = true
  const certExp = operatorEVMAccount.operatorAccountInfo.certExp

  if (certExp > 0) {
    const certStartTimestamp = certExp - getCertCycleDuration() * ONE_SECOND * serverConfig.p2p.cycleDuration

    let expiredPercentage: number
    if (ShardeumFlags.fixSetCertTimeTxApply === true) {
      //use tx timestampe for a deterministic result
      expiredPercentage = (txTimestamp - certStartTimestamp) / (certExp - certStartTimestamp)
    } else {
      //old way
      expiredPercentage = (shardeumGetTime() - certStartTimestamp) / (certExp - certStartTimestamp)
    }

    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`applySetCertTimeTx expiredPercentage: ${expiredPercentage}`)

    if (expiredPercentage >= (ShardeumFlags.fixCertExpTiming ? 0.5 : 0.8)) {
      // don't charge gas after 50% of the cert has
      // expired
      shouldChargeTxFee = false
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'applySetCertTimeTx' + ' renew' +
        ' certExp chargeTxFee: false')
    } else {
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', 'applySetCertTimeTx' + ' renew' +
        ' certExp chargeTxFee: true')
    }
  }

  let duration = tx.duration

  // If this feature is enabled (1.1.8) then just use the network setting for duration
  // this avoids a problem where new nodes syncing into the network may not have correct duration setting
  // as they are not aware of the global network setting
  // ...but in the future we should perhaps do a trustless get of the network object for standby nodes
  //    in case there are other settings that are important to know
  if (ShardeumFlags.setCertTimeDurationOverride) {
    duration = getCertCycleDuration()
  }

  // update operator cert expiration
  operatorEVMAccount.operatorAccountInfo.certExp =
    txTimestamp + serverConfig.p2p.cycleDuration * ONE_SECOND * duration

  // deduct tx fee if certExp is not set yet or far from expiration
  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`applySetCertTimeTx shouldChargeTxFee: ${shouldChargeTxFee}`)

  let amountSpent = bigIntToHex(BigInt(0))
  if (shouldChargeTxFee) {
    const costTxFee = scaleByStabilityFactor(
      BigInt(ShardeumFlags.constantTxFeeUsd),
      AccountsStorage.cachedNetworkAccount
    )
    operatorEVMAccount.account.balance = SafeBalance.subtractBigintBalance(operatorEVMAccount.account.balance, costTxFee)
    amountSpent = bigIntToHex(costTxFee)
  }

  /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('operatorEVMAccount After', operatorEVMAccount)

  // Apply state
  if (ShardeumFlags.useAccountWrites) {
    const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(operatorEVMAccount)
    shardus.applyResponseAddChangedAccount(
      applyResponse,
      wrappedChangedAccount.accountId,
      wrappedChangedAccount,
      txId,
      txTimestamp
    )
  }

  if (ShardeumFlags.supportInternalTxReceipt) {
    createInternalTxReceipt(
      shardus,
      applyResponse,
      tx,
      tx.nominee,
      tx.nominator,
      txTimestamp,
      txId,
      amountSpent
    )
  }
}
