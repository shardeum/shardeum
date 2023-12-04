import { Shardus, ShardusTypes } from '@shardus/core'
import config from '../../config'
import create from '../accounts'
import { ApplyResponse, TransactionKeys, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { ChangeConfig, WrappedStates } from '../../shardeum/shardeumTypes'
import { NetworkAccount } from '../accounts/networkAccount'
import { UserAccount } from '../accounts/userAccount'
import { CycleRecord } from '@shardus/types/build/src/p2p/CycleCreatorTypes'
import { OurAppDefinedData } from '../types'
import { NodeAccount } from '../accounts/nodeAccount'

export function validate_fields(tx: ChangeConfig, response: ShardusTypes.IncomingTransactionResult): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string'
    throw new Error(response.reason)
  }
  if (typeof tx.cycle !== 'number') {
    response.success = false
    response.reason = 'tx "cycle" field must be a number'
    throw new Error(response.reason)
  }
  if (typeof tx.config !== 'string') {
    response.success = false
    response.reason = 'tx "config" field must be a string'
    throw new Error(response.reason)
  }
  return response
}

export function validate(tx: ChangeConfig, wrappedStates: WrappedStates, response: ShardusTypes.IncomingTransactionResult, dapp: Shardus): ShardusTypes.IncomingTransactionResult {
  const network: NetworkAccount = wrappedStates[config.dao.networkAccount].data

  if (network.id !== config.dao.networkAccount) {
    response.reason = 'To account must be the network account'
    return response
  }
  try {
    const parsed = JSON.parse(tx.config)
    dapp.log(parsed)
    console.log(parsed)
  } catch (err) {
    dapp.log(err.message)
    response.reason = err.message
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(tx: ChangeConfig, txTimestamp: number, wrappedStates: WrappedStates, dapp: Shardus, applyResponse: ShardusTypes.ApplyResponse): void {
  const from: UserAccount = wrappedStates[tx.from].data
  let changeOnCycle: number | CycleRecord
  let cycleData: ShardusTypes.Cycle

  if (tx.cycle as unknown as number === -1) {
    ;[cycleData] = dapp.getLatestCycles()
    changeOnCycle = cycleData.counter + 3
  } else {
    changeOnCycle = tx.cycle
  }

  const when = txTimestamp + 1000 * 10
  const value = {
    type: 'apply_change_config',
    timestamp: when,
    network: config.dao.networkAccount,
    change: { cycle: changeOnCycle, change: JSON.parse(tx.config) },
  }

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = { address: config.dao.networkAccount, value, when, source: config.dao.networkAccount }

  from.timestamp = tx.timestamp
  dapp.log('Applied change_config tx')
}

export function transactionReceiptPass(dapp: Shardus, applyResponse: ApplyResponse): void {
  const { address, value, when, source } = (applyResponse.appDefinedData as OurAppDefinedData).globalMsg
  dapp.setGlobal(address, value, when, source)
  dapp.log('PostApplied change_config tx')
}

export function keys(tx: ChangeConfig, result: TransactionKeys): TransactionKeys {
  result.sourceKeys = [tx.from]
  result.targetKeys = [config.dao.networkAccount]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(dapp: Shardus, account: NodeAccount, accountId: string, accountCreated = false): WrappedResponse {
  if (!account) {
    account = create.nodeAccount(accountId)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
