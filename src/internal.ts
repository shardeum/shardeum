/*** |an
 *    #### ##    ## ######## ######## ########  ##    ##    ###    ##          ######## ##     ##
 *     ##  ###   ##    ##    ##       ##     ## ###   ##   ## ##   ##             ##     ##   ##
 *     ##  ####  ##    ##    ##       ##     ## ####  ##  ##   ##  ##             ##      ## ##
 *     ##  ## ## ##    ##    ######   ########  ## ## ## ##     ## ##             ##       ###
 *     ##  ##  ####    ##    ##       ##   ##   ##  #### ######### ##             ##      ## ##
 *     ##  ##   ###    ##    ##       ##    ##  ##   ### ##     ## ##             ##     ##   ##
 *    #### ##    ##    ##    ######## ##     ## ##    ## ##     ## ########       ##    ##     ##
 */

import { ShardusTypes } from '@shardeum-foundation/core'
import { InternalTx, InternalTXType, WrappedStates, WrappedEVMAccount, InitRewardTimes, ClaimRewardTX, PenaltyTX, SetCertTime, OurAppDefinedData, DebugTx, DebugTXType, NodeAccount2, AccountType, ReadableReceipt, NetworkAccount } from './shardeum/shardeumTypes'
import { generateTxId } from './utils'
import { shardus, ShardeumFlags, networkAccount, crypto, logFlags } from './index'
import { getIsAdminCertUnexpired } from './join'
import { fixDeserializedWrappedEVMAccount } from './shardeum/wrappedEVMAccountFunctions'
import * as WrappedEVMAccountFunctions from './shardeum/wrappedEVMAccountFunctions'
import { applySetCertTimeTx, isSetCertTimeTx } from './tx/setCertTime'
import * as InitRewardTimesTx from './tx/initRewardTimes'
import { applyClaimRewardTx } from './tx/claimReward'
import { applyPenaltyTX } from './tx/penalty/transaction'
import { apply as applyTransferFromSecureAccount } from './shardeum/secureAccounts'
import { Utils } from '@shardeum-foundation/lib-types'
import { ONE_SECOND } from './shardeum/shardeumConstants'
import { isNodeAccount2 } from './shardeum/shardeumTypes'
import { bigIntToHex } from '@ethereumjs/util'
import { getOrCreateBlockFromTimestamp } from './index'
import { readableBlocks } from './index'
import { toShardusAddress } from './shardeum/evmAddress'

/**
 * Applies an internal transaction to the given wrapped states and returns an apply response.
 *
 * @param tx - The internal transaction to be applied.
 * @param wrappedStates - The current state of the wrapped accounts.
 * @param txTimestamp - The timestamp of the transaction.
 * @returns A promise that resolves to a ShardusTypes.ApplyResponse object.
 *
 * The function handles different types of internal transactions:
 * - `SetGlobalCodeBytes`: Updates the timestamp of the wrapped EVM account and optionally creates an internal transaction receipt.
 * - `InitNetwork`: Initializes the network account and optionally creates an internal transaction receipt.
 * - `ChangeConfig`: Schedules a configuration change to be applied at a future cycle and optionally creates an internal transaction receipt.
 * - `ApplyChangeConfig`: Applies a scheduled configuration change to the network account and optionally creates an internal transaction receipt.
 * - `ChangeNetworkParam`: Schedules a network parameter change to be applied at a future cycle and optionally creates an internal transaction receipt.
 * - `ApplyNetworkParam`: Applies a scheduled network parameter change to the network account and optionally creates an internal transaction receipt.
 * - `SetCertTimeTx`: Applies a certificate time transaction.
 * - `InitRewardTimes`: Initializes reward times.
 * - `ClaimReward`: Applies a claim reward transaction.
 * - `Penalty`: Applies a penalty transaction.
 * - `TransferFromSecureAccount`: Applies a transfer from a secure account transaction.
 */
export async function applyInternalTx(
    tx: InternalTx,
    wrappedStates: WrappedStates,
    txTimestamp: number
  ): Promise<ShardusTypes.ApplyResponse> {
    const txId = generateTxId(tx)
    const applyResponse: ShardusTypes.ApplyResponse = shardus.createApplyResponse(txId, txTimestamp)
    const internalTx = tx as InternalTx
    if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
      // eslint-disable-next-line security/detect-object-injection
      const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[internalTx.from].data
      //just update the timestamp?
      wrappedEVMAccount.timestamp = txTimestamp
      //I think this will naturally accomplish the goal of the global update.
  
      //need to run this to fix buffer types after serialization
      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
      if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, internalTx, networkAccount, networkAccount, txTimestamp, txId)
      }
    }
  
    if (internalTx.internalTXType === InternalTXType.InitNetwork) {
      // eslint-disable-next-line security/detect-object-injection
      const network: NetworkAccount = wrappedStates[networkAccount].data
      if (ShardeumFlags.useAccountWrites) {
        // eslint-disable-next-line security/detect-object-injection
        const writtenAccount = wrappedStates[networkAccount]
        writtenAccount.data.timestamp = txTimestamp
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(writtenAccount.data)
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          networkAccount,
          wrappedChangedAccount as ShardusTypes.WrappedResponse,
          txId,
          txTimestamp
        )
      } else {
        network.timestamp = txTimestamp
      }
      if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, internalTx, networkAccount, networkAccount, txTimestamp, txId)
      }
      /* prettier-ignore */ if (logFlags.important_as_error) console.log(`init_network NETWORK_ACCOUNT: ${Utils.safeStringify(network)}`)
      /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied init_network transaction', network)
    }
    if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
      /* eslint-disable security/detect-object-injection */
      // const network: NetworkAccount = wrappedStates[networkAccount].data
      // const devAccount: DevAccount = wrappedStates[internalTx.from].data
      /* eslint-enable security/detect-object-injection */
  
      let changeOnCycle
      let cycleData: ShardusTypes.Cycle
  
      //NEED to sign with dev key (probably check this in validate() )
  
      if (internalTx.cycle === -1) {
        ;[cycleData] = shardus.getLatestCycles()
        changeOnCycle = cycleData.counter + 3
      } else {
        changeOnCycle = internalTx.cycle
      }
  
      const when = txTimestamp + ONE_SECOND * 10
      // value is the TX that will apply a change to the global network account 0000x0000
      const value = {
        isInternalTx: true,
        internalTXType: InternalTXType.ApplyChangeConfig,
        timestamp: when,
        from: internalTx.from,
        network: networkAccount,
        change: { cycle: changeOnCycle, change: Utils.safeJsonParse(internalTx.config) },
      }
  
      // if (ShardeumFlags.useAccountWrites) {
      //   /* eslint-disable security/detect-object-injection */
      //   const networkAccountCopy = wrappedStates[networkAccount]
      //   const devAccountCopy = wrappedStates[internalTx.from]
      //   /* eslint-enable security/detect-object-injection */
      //   networkAccountCopy.data.timestamp = txTimestamp
      //   devAccountCopy.data.timestamp = txTimestamp
      //   shardus.applyResponseAddChangedAccount(
      //     applyResponse,
      //     networkAccount,
      //     networkAccountCopy as ShardusTypes.WrappedResponse,
      //     txId,
      //     txTimestamp
      //   )
      //   shardus.applyResponseAddChangedAccount(
      //     applyResponse,
      //     internalTx.from,
      //     devAccountCopy as ShardusTypes.WrappedResponse,
      //     txId,
      //     txTimestamp
      //   )
      // } else {
      //   network.timestamp = txTimestamp
      //   devAccount.timestamp = txTimestamp
      // }
  
      // eslint-disable-next-line security/detect-object-injection
      const addressHash = wrappedStates[networkAccount].stateId
      // eslint-disable-next-line security/detect-object-injection
  
      // Create a copy of the network account to apply modifications and determine the resulting state.
      const networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = when
      networkAccountCopy.data.listOfChanges.push(value.change)
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(networkAccountCopy.data)
      //value = wrappedChangedAccount
      const afterStateHash = wrappedChangedAccount.stateId // this is the hash of the network account after it has been modified with a change
  
      const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
      // network will consens that this is the correct value
      ourAppDefinedData.globalMsg = {
        address: networkAccount,
        addressHash,
        value,
        when,
        source: value.from,
        afterStateHash: afterStateHash,
      }
      if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, internalTx, internalTx.from, networkAccount, txTimestamp, txId)
      }
      /* prettier-ignore */ if (logFlags.important_as_error) console.log('Applied change_config tx')
      /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied change_config tx')
    }
    if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
      // eslint-disable-next-line security/detect-object-injection
      const network: NetworkAccount = wrappedStates[networkAccount].data
  
      if (ShardeumFlags.useAccountWrites) {
        // eslint-disable-next-line security/detect-object-injection
        const networkAccountCopy = wrappedStates[networkAccount]
        networkAccountCopy.data.timestamp = txTimestamp
        networkAccountCopy.data.listOfChanges.push(internalTx.change)
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(networkAccountCopy.data)
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          networkAccount,
          wrappedChangedAccount as ShardusTypes.WrappedResponse,
          txId,
          txTimestamp
        )
      } else {
        network.timestamp = txTimestamp
        network.listOfChanges.push(internalTx.change)
      }
      /* prettier-ignore */ if (logFlags.important_as_error) console.log(`Applied CHANGE_CONFIG GLOBAL transaction: ${Utils.safeStringify(network)}`)
      /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied CHANGE_CONFIG GLOBAL transaction', Utils.safeStringify(network))
      if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, internalTx, internalTx.from, networkAccount, txTimestamp, txId)
      }
    }
    if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
      let changeOnCycle
      let cycleData: ShardusTypes.Cycle
  
      if (internalTx.cycle === -1) {
        ;[cycleData] = shardus.getLatestCycles()
        changeOnCycle = cycleData.counter + 1
      } else {
        changeOnCycle = internalTx.cycle
      }
  
      const when = txTimestamp + ONE_SECOND * 10
      // value is the TX that will apply a change to the global network account 0000x0000
      const value = {
        isInternalTx: true,
        internalTXType: InternalTXType.ApplyNetworkParam,
        timestamp: when,
        from: internalTx.from,
        network: networkAccount,
        change: { cycle: changeOnCycle, change: {}, appData: Utils.safeJsonParse(internalTx.config) },
      }
  
      // eslint-disable-next-line security/detect-object-injection
      const addressHash = wrappedStates[networkAccount].stateId
      // eslint-disable-next-line security/detect-object-injection
  
      // Create a copy of the network account to apply modifications and determine the resulting state.
      const networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = when
      networkAccountCopy.data.listOfChanges.push(value.change)
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(networkAccountCopy.data)
      //value = wrappedChangedAccount
      const afterStateHash = wrappedChangedAccount.stateId // this is the hash of the network account after it has been modified with a change
  
      const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
      // network will consens that this is the correct value
      ourAppDefinedData.globalMsg = {
        address: networkAccount,
        addressHash,
        value,
        when,
        source: value.from,
        afterStateHash: afterStateHash,
      }
      if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, internalTx, internalTx.from, networkAccount, txTimestamp, txId)
      }
      /* prettier-ignore */ if (logFlags.important_as_error) console.log('Applied change_network_param tx')
      /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied change_network_param tx')
    }
    if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
      // eslint-disable-next-line security/detect-object-injection
      const network: NetworkAccount = wrappedStates[networkAccount].data
  
      if (ShardeumFlags.useAccountWrites) {
        // eslint-disable-next-line security/detect-object-injection
        const networkAccountCopy = wrappedStates[networkAccount]
        networkAccountCopy.data.timestamp = txTimestamp
        networkAccountCopy.data.listOfChanges.push(internalTx.change)
        const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(networkAccountCopy.data)
        shardus.applyResponseAddChangedAccount(
          applyResponse,
          networkAccount,
          wrappedChangedAccount as ShardusTypes.WrappedResponse,
          txId,
          txTimestamp
        )
      } else {
        network.timestamp = txTimestamp
        network.listOfChanges.push(internalTx.change)
      }
      if (ShardeumFlags.supportInternalTxReceipt) {
        createInternalTxReceipt(shardus, applyResponse, internalTx, internalTx.from, networkAccount, txTimestamp, txId)
      }
      /* prettier-ignore */ if (logFlags.important_as_error) console.log(`Applied CHANGE_NETWORK_PARAM GLOBAL transaction: ${Utils.safeStringify(network)}`)
      /* prettier-ignore */ if (logFlags.important_as_error) shardus.log('Applied CHANGE_NETWORK_PARAM GLOBAL transaction', Utils.safeStringify(network))
    }
    if (isSetCertTimeTx(internalTx)) {
      const setCertTimeTx = internalTx as SetCertTime
      applySetCertTimeTx(shardus, setCertTimeTx, wrappedStates, txId, txTimestamp, applyResponse)
    }
    if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
      const rewardTimesTx = internalTx as InitRewardTimes
      InitRewardTimesTx.apply(shardus, rewardTimesTx, txId, txTimestamp, wrappedStates, applyResponse)
    }
    if (internalTx.internalTXType === InternalTXType.ClaimReward) {
      const claimRewardTx = internalTx as ClaimRewardTX
      try {
        await applyClaimRewardTx(
          shardus,
          claimRewardTx,
          wrappedStates,
          txId,
          txTimestamp,
          applyResponse,
          getIsAdminCertUnexpired()
        )
      } catch (error) {
        /* prettier-ignore */ if (logFlags.error) console.error('Error in applyClaimRewardTX', error)
        shardus.applyResponseSetFailed(
          applyResponse,
          `applyClaimRewardTX failed for nominee: ${claimRewardTx.nominee}, reason: ${error?.message ?? error}`
        )
      }
    }
    if (internalTx.internalTXType === InternalTXType.Penalty) {
      const penaltyTx = internalTx as PenaltyTX
      try {
        await applyPenaltyTX(shardus, penaltyTx, wrappedStates, txId, txTimestamp, applyResponse)
      } catch (error) {
        /* prettier-ignore */ if (logFlags.error) console.error('Error in applyPenaltyTX', error)
        shardus.applyResponseSetFailed(
          applyResponse,
          `applyPenaltyTX failed for reportedNode: ${penaltyTx.reportedNodePublickKey}, reason: ${
            error?.message ?? error
          }`
        )
      }
    }
    if (internalTx.internalTXType === InternalTXType.TransferFromSecureAccount) {
      await applyTransferFromSecureAccount(internalTx, txId, txTimestamp, wrappedStates, shardus, applyResponse)
    }
    return applyResponse
  }
  
  export const createInternalTxReceipt = (
    shardus,
    applyResponse: ShardusTypes.ApplyResponse,
    internalTx: InternalTx,
    from: string,
    to: string,
    txTimestamp: number,
    txId: string,
    amountSpent = bigIntToHex(BigInt(0)),
    rewardAmount?: bigint,
    penaltyAmount?: bigint,
    secureAccountName?: string
  ): void => {
    const blockForReceipt = getOrCreateBlockFromTimestamp(txTimestamp)
    const blockNumberForTx = blockForReceipt.header.number.toString()
    const readableReceipt: ReadableReceipt = {
      status: 1,
      transactionHash: '0x' + txId,
      transactionIndex: '0x1',
      // eslint-disable-next-line security/detect-object-injection
      blockNumber: readableBlocks[blockNumberForTx]?.number,
      nonce: '0x0',
      blockHash: readableBlocks[blockNumberForTx]?.hash, // eslint-disable-line security/detect-object-injection
      cumulativeGasUsed: '0x0',
      gasUsed: '0x0',
      gasRefund: '0x0',
      logs: [],
      logsBloom: '',
      contractAddress: null,
      from,
      to,
      value: '0x0',
      data: '0x0',
      isInternalTx: true,
      internalTx: { ...internalTx, sign: null },
      ...(rewardAmount !== undefined && { rewardAmount }),
      ...(penaltyAmount !== undefined && { penaltyAmount }),
      ...(secureAccountName !== undefined && { secureAccountName }),
    }
  
    const wrappedReceiptAccount = {
      timestamp: txTimestamp,
      ethAddress: '0x' + txId,
      hash: '',
      receipt: null,
      readableReceipt,
      amountSpent,
      txId: txId,
      accountType: ShardeumFlags.addInternalTxReceiptAccount ? AccountType.InternalTxReceipt : AccountType.Receipt,
      txFrom: readableReceipt.from,
    }
    const receiptShardusAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(wrappedReceiptAccount)
    shardus.applyResponseAddReceiptData(applyResponse, receiptShardusAccount, crypto.hashObj(receiptShardusAccount))
  }
  
  export async function applyDebugTx(
    debugTx: DebugTx,
    wrappedStates: WrappedStates,
    txTimestamp: number
  ): Promise<ShardusTypes.ApplyResponse> {
    /* eslint-disable security/detect-object-injection */
    if (ShardeumFlags.VerboseLogs) console.log('Applying debug transaction', debugTx)
    if (debugTx.debugTXType === DebugTXType.Create) {
      const fromShardusAddress = toShardusAddress(debugTx.from, AccountType.Debug)
      const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[fromShardusAddress].data
      wrappedEVMAccount.timestamp = txTimestamp
      wrappedEVMAccount.balance += 1
      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
    } else if (debugTx.debugTXType === DebugTXType.Transfer) {
      const fromAddress = toShardusAddress(debugTx.from, AccountType.Debug)
      const toAddress = toShardusAddress(debugTx.to, AccountType.Debug)
      const fromAccount: WrappedEVMAccount = wrappedStates[fromAddress].data
      const toAccount: WrappedEVMAccount = wrappedStates[toAddress].data
      fromAccount.timestamp = txTimestamp
      toAccount.timestamp = txTimestamp
      fromAccount.balance -= 1
      toAccount.balance += 1
      fixDeserializedWrappedEVMAccount(fromAccount)
      fixDeserializedWrappedEVMAccount(toAccount)
    }
  
    const txId = generateTxId(debugTx)
    return shardus.createApplyResponse(txId, txTimestamp)
    /* eslint-enable security/detect-object-injection */
  }