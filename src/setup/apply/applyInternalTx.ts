import { Shardus, ShardusTypes, __ShardFunctions } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import {
  AccountType,
  BlockMap,
  ClaimRewardTX,
  DevAccount,
  InitRewardTimes,
  InternalTx,
  InternalTXType,
  NetworkAccount,
  NodeAccount,
  OurAppDefinedData,
  ReadableReceipt,
  SetCertTime,
  WrappedEVMAccount,
  WrappedStates,
} from '../../shardeum/shardeumTypes'
import { fixDeserializedWrappedEVMAccount } from '../../shardeum/wrappedEVMAccountFunctions'
import { applySetCertTimeTx, isSetCertTimeTx } from '../../tx/setCertTime'
import { networkAccount, oneEth, ONE_SECOND } from '../constants'
import { crypto } from '../helpers'
import * as WrappedEVMAccountFunctions from '../../shardeum/wrappedEVMAccountFunctions'
import stringify from 'fast-json-stable-stringify'
import { getApplyTXState } from './helpers'
import Common from '@ethereumjs/common'
import { ShardeumState } from '../../state'
import { Address, BN } from 'ethereumjs-util'
import { getAccountShardusAddress, toShardusAddress } from '../../shardeum/evmAddress'
import * as InitRewardTimesTx from '../../tx/initRewardTimes'
import { applyClaimRewardTx } from '../../tx/claimReward'

export async function applyInternalTx(
  shardus: Shardus,
  tx: any,
  wrappedStates: WrappedStates,
  txTimestamp: number,
  shardeumStateTXMap: Map<string, ShardeumState>,
  evmCommon: Common,
  blocks: BlockMap,
  readableBlocks: any,
  latestBlock: number
): Promise<ShardusTypes.ApplyResponse> {
  let txId = crypto.hashObj(tx)
  const applyResponse: ShardusTypes.ApplyResponse = shardus.createApplyResponse(txId, txTimestamp)
  if (isSetCertTimeTx(tx)) {
    let setCertTimeTx = tx as SetCertTime
    applySetCertTimeTx(shardus, setCertTimeTx, wrappedStates, txTimestamp, applyResponse)
  }
  let internalTx = tx as InternalTx
  if (internalTx.internalTXType === InternalTXType.SetGlobalCodeBytes) {
    const wrappedEVMAccount: WrappedEVMAccount = wrappedStates[internalTx.from].data
    //just update the timestamp?
    wrappedEVMAccount.timestamp = txTimestamp
    //I think this will naturally accomplish the goal of the global update.

    //need to run this to fix buffer types after serialization
    fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
  }

  if (internalTx.internalTXType === InternalTXType.InitNetwork) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    if (ShardeumFlags.useAccountWrites) {
      let writtenAccount = wrappedStates[networkAccount]
      writtenAccount.data.timestamp = txTimestamp
      const wrappedChangedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(writtenAccount.data)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        wrappedChangedAccount,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
    }
    console.log(`init_network NETWORK_ACCOUNT: ${stringify(network)}`)
    shardus.log('Applied init_network transaction', network)
  }
  if (internalTx.internalTXType === InternalTXType.NodeReward) {
    let shardeumState = getApplyTXState(txId, shardeumStateTXMap, evmCommon, shardus)

    //ah shoot this binding will not be "thread safe" may need to make it part of the EEI for this tx? idk.
    //shardeumStateManager.setTransactionState(transactionState)

    // loop through the wrappedStates an insert them into the transactionState as first*Reads
    for (let accountId in wrappedStates) {
      let wrappedEVMAccount: WrappedEVMAccount = wrappedStates[accountId].data
      if (wrappedEVMAccount.accountType === AccountType.Account) {
        fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
        let address = Address.fromString(wrappedEVMAccount.ethAddress)

        if (ShardeumFlags.VerboseLogs) {
          let ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
          let minP = ourNodeShardData.consensusStartPartition
          let maxP = ourNodeShardData.consensusEndPartition
          let shardusAddress = getAccountShardusAddress(wrappedEVMAccount)
          let { homePartition } = __ShardFunctions.addressToPartition(
            shardus.stateManager.currentCycleShardData.shardGlobals,
            shardusAddress
          )
          let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false

          /* prettier-ignore */ console.log('DBG', 'tx insert data', txId, `accountIsRemote: ${accountIsRemote} acc:${address} key:${wrappedEVMAccount.key} type:${wrappedEVMAccount.accountType}`)
        }

        if (wrappedEVMAccount.accountType === AccountType.Account) {
          shardeumState._transactionState.insertFirstAccountReads(address, wrappedEVMAccount.account)
        }
      }
    }

    const network: NetworkAccount = wrappedStates[networkAccount].data
    const from: NodeAccount = wrappedStates[internalTx.from].data
    const to: WrappedEVMAccount = wrappedStates[toShardusAddress(internalTx.to, AccountType.Account)].data
    let nodeRewardReceipt: WrappedEVMAccount = null
    if (ShardeumFlags.EVMReceiptsAsAccounts) {
      nodeRewardReceipt = wrappedStates[txId].data // Current node reward receipt hash is set with txId
    }
    from.balance.add(network.current.nodeRewardAmount) // This is not needed and will have to delete `balance` field
    // eventually
    shardus.log(`Reward from ${internalTx.from} to ${internalTx.to}`)
    shardus.log('TO ACCOUNT', to)

    const accountAddress = Address.fromString(internalTx.to)
    if (ShardeumFlags.VerboseLogs) {
      console.log('node Reward', internalTx)
    }
    let account = await shardeumState.getAccount(accountAddress)
    if (ShardeumFlags.VerboseLogs) {
      console.log('nodeReward', 'accountAddress', account)
    }
    account.balance.iadd(oneEth.mul(new BN(network.current.nodeRewardAmount))) // Add 1 ETH
    await shardeumState.putAccount(accountAddress, account)
    account = await shardeumState.getAccount(accountAddress)
    if (ShardeumFlags.VerboseLogs) {
      console.log('nodeReward', 'accountAddress', account)
    }
    to.account = account
    to.timestamp = txTimestamp

    from.nodeRewardTime = txTimestamp
    from.timestamp = txTimestamp

    if (ShardeumFlags.useAccountWrites) {
      let toAccountShardusAddress = toShardusAddress(internalTx.to, AccountType.Account)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        toAccountShardusAddress,
        wrappedStates[toAccountShardusAddress],
        txId,
        txTimestamp
      )
    }

    let readableReceipt: ReadableReceipt = {
      transactionHash: txId,
      transactionIndex: '0x1',
      blockNumber: '0x' + blocks[latestBlock].header.number.toString('hex'),
      nonce: '0x',
      blockHash: readableBlocks[latestBlock].hash,
      cumulativeGasUsed: '0x0',
      gasUsed: '0x0',
      logs: null,
      logsBloom: null,
      contractAddress: null,
      from: from.id,
      to: to.ethAddress,
      value: oneEth.toString('hex'),
      data: '0x',
      status: 1,
    }

    if (ShardeumFlags.EVMReceiptsAsAccounts) {
      nodeRewardReceipt.timestamp = txTimestamp
      nodeRewardReceipt.readableReceipt = readableReceipt
      nodeRewardReceipt.txId = txId
      nodeRewardReceipt.txFrom = from.id
    } else {
      nodeRewardReceipt = {
        timestamp: txTimestamp,
        ethAddress: txId, //.slice(0, 42),  I think the full 32byte TX should be fine now that toShardusAddress understands account type
        hash: '',
        readableReceipt,
        txId,
        accountType: AccountType.NodeRewardReceipt,
        txFrom: from.id,
      }
      const shardusWrappedAccount = WrappedEVMAccountFunctions._shardusWrappedAccount(nodeRewardReceipt)
      //put this in the apply response
      shardus.applyResponseAddReceiptData(
        applyResponse,
        shardusWrappedAccount,
        crypto.hashObj(shardusWrappedAccount)
      )
    }
    // console.log('nodeRewardReceipt', nodeRewardReceipt)
    // shardus.log('Applied node_reward tx', from, to)
    console.log('Applied node_reward tx', txId, txTimestamp)
    //shardeumStateManager.unsetTransactionState(txId)
  }
  if (internalTx.internalTXType === InternalTXType.ChangeConfig) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    const devAccount: DevAccount = wrappedStates[internalTx.from].data

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
    let value = {
      isInternalTx: true,
      internalTXType: InternalTXType.ApplyChangeConfig,
      timestamp: when,
      from: internalTx.from,
      network: networkAccount,
      change: { cycle: changeOnCycle, change: JSON.parse(internalTx.config) },
    }

    //value = shardus.signAsNode(value)

    let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
    // network will consens that this is the correct value
    ourAppDefinedData.globalMsg = { address: networkAccount, value, when, source: value.from }

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      let devAccountCopy = wrappedStates[internalTx.from]
      networkAccountCopy.data.timestamp = txTimestamp
      devAccountCopy.data.timestamp = txTimestamp
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        internalTx.from,
        devAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      devAccount.timestamp = txTimestamp
    }
    console.log('Applied change_config tx')
    shardus.log('Applied change_config tx')
  }
  if (internalTx.internalTXType === InternalTXType.ApplyChangeConfig) {
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      network.listOfChanges.push(internalTx.change)
    }
    console.log(`Applied CHANGE_CONFIG GLOBAL transaction: ${stringify(network)}`)
    shardus.log('Applied CHANGE_CONFIG GLOBAL transaction', stringify(network))
  }
  if (internalTx.internalTXType === InternalTXType.ChangeNetworkParam) {
    const network: NetworkAccount = wrappedStates[networkAccount].data
    const devAccount: DevAccount = wrappedStates[internalTx.from].data

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
    let value = {
      isInternalTx: true,
      internalTXType: InternalTXType.ApplyNetworkParam,
      timestamp: when,
      from: internalTx.from,
      network: networkAccount,
      change: { cycle: changeOnCycle, change: {}, appData: JSON.parse(internalTx.config) },
    }

    let ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
    // network will consens that this is the correct value
    ourAppDefinedData.globalMsg = { address: networkAccount, value, when, source: value.from }

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      let devAccountCopy = wrappedStates[internalTx.from]
      networkAccountCopy.data.timestamp = txTimestamp
      devAccountCopy.data.timestamp = txTimestamp
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        internalTx.from,
        devAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      devAccount.timestamp = txTimestamp
    }
    console.log('Applied change_network_param tx')
    shardus.log('Applied change_network_param tx')
  }
  if (internalTx.internalTXType === InternalTXType.ApplyNetworkParam) {
    const network: NetworkAccount = wrappedStates[networkAccount].data

    if (ShardeumFlags.useAccountWrites) {
      let networkAccountCopy = wrappedStates[networkAccount]
      networkAccountCopy.data.timestamp = txTimestamp
      networkAccountCopy.data.listOfChanges.push(internalTx.change)
      shardus.applyResponseAddChangedAccount(
        applyResponse,
        networkAccount,
        networkAccountCopy,
        txId,
        txTimestamp
      )
    } else {
      network.timestamp = txTimestamp
      network.listOfChanges.push(internalTx.change)
    }
    console.log(`Applied CHANGE_NETWORK_PARAM GLOBAL transaction: ${stringify(network)}`)
    shardus.log('Applied CHANGE_NETWORK_PARAM GLOBAL transaction', stringify(network))
  }
  if (internalTx.internalTXType === InternalTXType.InitRewardTimes) {
    let rewardTimesTx = internalTx as InitRewardTimes
    InitRewardTimesTx.apply(shardus, rewardTimesTx, txId, txTimestamp, wrappedStates, applyResponse)
  }
  if (internalTx.internalTXType === InternalTXType.ClaimReward) {
    let claimRewardTx = internalTx as ClaimRewardTX
    applyClaimRewardTx(shardus, claimRewardTx, wrappedStates, txTimestamp, applyResponse)
  }
  return applyResponse
}
