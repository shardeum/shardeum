import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import {
  AccountType,
  NetworkAccount,
  NodeAccount2,
  StakeCoinsTX,
  UnstakeCoinsTX,
  WrappedEVMAccount,
  WrappedStates,
} from '../../shardeum/shardeumTypes'
import * as AccountsStorage from '../../storage/accountStorage'
import { _base16BNParser, scaleByStabilityFactor } from '../../utils'
import { Address } from '@ethereumjs/util'
import { networkAccount as globalAccount } from '../../shardeum/shardeumConstants'
import { logFlags } from '../..'
import { toShardusAddress } from '../../shardeum/evmAddress'
import { nestedCountersInstance, Shardus } from '@shardus/core'

export function verifyStakeTx(
  appData: any,
  senderAddress: Address,
  wrappedStates: WrappedStates
): { success: boolean; reason: string } {
  nestedCountersInstance.countEvent('shardeum-staking', 'verifyStakeTx: validating stake coins tx fields')

  let success = true
  let reason = ''
  if (ShardeumFlags.VerboseLogs) console.log('verifyStakeTx: Validating stake tx fields', appData)
  const stakeCoinsTx = appData as StakeCoinsTX
  // eslint-disable-next-line security/detect-object-injection
  const networkAccount: NetworkAccount = wrappedStates[globalAccount].data
  const minStakeAmountUsd = networkAccount.current.stakeRequiredUsd
  const minStakeAmount = scaleByStabilityFactor(minStakeAmountUsd, AccountsStorage.cachedNetworkAccount)
  if (typeof stakeCoinsTx.stake === 'object') stakeCoinsTx.stake = BigInt(stakeCoinsTx.stake)
  if (stakeCoinsTx.nominator == null || stakeCoinsTx.nominator.toLowerCase() !== senderAddress.toString()) {
    /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`nominator vs tx signer`, stakeCoinsTx.nominator, senderAddress.toString())
    success = false
    reason = `Invalid nominator address in stake coins tx`
  } else if (stakeCoinsTx.nominee == null) {
    success = false
    reason = `Invalid nominee address in stake coins tx`
  } else if (!/^[A-Fa-f0-9]{64}$/.test(stakeCoinsTx.nominee)) {
    //TODO: NEED to potentially write a custom faster test that avoids regex so we can avoid a regex-dos attack
    success = false
    reason = 'Invalid nominee address in stake coins tx'
  } else if (stakeCoinsTx.stake < minStakeAmount) {
    success = false
    reason = `Stake amount is less than minimum required stake amount`

    if (ShardeumFlags.fixExtraStakeLessThanMin) {
      const operatorShardusAddress = toShardusAddress(stakeCoinsTx.nominator, AccountType.Account)
      // eslint-disable-next-line security/detect-object-injection
      const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[operatorShardusAddress]
        .data as WrappedEVMAccount

      if (wrappedEVMAccount.operatorAccountInfo) {
        const existingStake =
          typeof wrappedEVMAccount.operatorAccountInfo.stake === 'string'
            ? BigInt(wrappedEVMAccount.operatorAccountInfo.stake)
            : wrappedEVMAccount.operatorAccountInfo.stake

        if (existingStake !== BigInt(0) && stakeCoinsTx.stake > BigInt(0)) {
          success = true
          reason = ''
        }
      }
    }
  }

  if (!success) {
    return {
      success,
      reason,
    }
  }

  const nomineeAccount = wrappedStates[stakeCoinsTx.nominee].data as NodeAccount2
  const nominatorAccount = wrappedStates[toShardusAddress(stakeCoinsTx.nominator, AccountType.Account)]
    .data as WrappedEVMAccount
  if (nomineeAccount) {
    if (
      nomineeAccount.nominator &&
      nomineeAccount.nominator.toLowerCase() !== stakeCoinsTx.nominator.toLowerCase()
    ) {
      return {
        success: false,
        reason: `This node is already staked by another account!`,
      }
    }
  }
  if (nominatorAccount.operatorAccountInfo) {
    if (nominatorAccount.operatorAccountInfo.nominee) {
      if (nominatorAccount.operatorAccountInfo.nominee.toLowerCase() !== stakeCoinsTx.nominee.toLowerCase())
        return {
          success: false,
          reason: `This account has already staked to a different node.`,
        }
    }
  }

  return {
    success: true,
    reason: '',
  }
}

export function verifyUnstakeTx(
  appData: any,
  senderAddress: Address,
  wrappedStates: WrappedStates,
  shardus: Shardus
): { success: boolean; reason: string } {
  nestedCountersInstance.countEvent('shardeum-unstaking', 'validating unstake coins tx fields')
  let success = true
  let reason = ''
  if (ShardeumFlags.VerboseLogs)
    console.log('verifyUnstake: Validating unstake coins tx fields', appData)
  const unstakeCoinsTX = appData as UnstakeCoinsTX
  if (
    unstakeCoinsTX.nominator == null ||
    unstakeCoinsTX.nominator.toLowerCase() !== senderAddress.toString()
  ) {
    /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-unstaking', 'invalid nominator address in stake coins tx' )
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log( `nominator vs tx signer`, unstakeCoinsTX.nominator, senderAddress.toString() )
    success = false
    reason = `Invalid nominator address in stake coins tx`
  } else if (unstakeCoinsTX.nominee == null) {
    /* prettier-ignore */ nestedCountersInstance.countEvent( 'shardeum-unstaking', 'invalid nominee address in stake coins tx' )
    success = false
    reason = `Invalid nominee address in stake coins tx`
  }
  const nomineeAccount = wrappedStates[unstakeCoinsTX.nominee].data as NodeAccount2
  const nominatorAccount = wrappedStates[toShardusAddress(unstakeCoinsTX.nominator, AccountType.Account)]
    .data as WrappedEVMAccount
  if (!nominatorAccount) {
    success = false
    reason = `This sender account is not found!`
  } else if (nomineeAccount) {
    if (!nomineeAccount.nominator) {
      success = false
      reason = `No one has staked to this account!`
    } else if (_base16BNParser(nomineeAccount.stakeLock) === BigInt(0)) {
      success = false
      reason = `There is no staked amount in this node!`
    } else if (nomineeAccount.nominator.toLowerCase() !== unstakeCoinsTX.nominator.toLowerCase()) {
      success = false
      reason = `This node is staked by another account. You can't unstake it!`
    } else if (shardus.isOnStandbyList(nomineeAccount.id) === true) {
      success = false
      reason = `This node is in the network's Standby list. You can unstake only after the node leaves the Standby list!`
    } else if (shardus.isNodeActiveByPubKey(nomineeAccount.id) === true) {
      success = false
      reason = `This node is still active in the network. You can unstake only after the node leaves the network!`
    } else if (
      nomineeAccount.rewardEndTime === 0 &&
      nomineeAccount.rewardStartTime > 0 &&
      !(unstakeCoinsTX.force && ShardeumFlags.allowForceUnstake)
    ) {
      //note that if both end time and start time are 0 it is ok to unstake
      success = false
      reason = `No reward endTime set, can't unstake node yet`
    }
  } else {
    success = false
    reason = `This nominee node is not found!`
  }

  return { success, reason }
}
