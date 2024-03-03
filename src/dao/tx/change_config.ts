import { Shardus, ShardusTypes } from '@shardus/core'
import { daoConfig } from '../../config/dao'
import { ApplyResponse, TransactionKeys, WrappedResponse } from '@shardus/core/dist/shardus/shardus-types'
import { ChangeConfig, OurAppDefinedData, WrappedStates } from '../../shardeum/shardeumTypes'
import { DaoGlobalAccount } from '../accounts/networkAccount'
import { UserAccount } from '../accounts/userAccount'
import { CycleRecord } from '@shardus/types/build/src/p2p/CycleCreatorTypes'
import { NodeAccount } from '../accounts/nodeAccount'

export function validateFields(
  tx: ChangeConfig,
  response: ShardusTypes.IncomingTransactionResult
): ShardusTypes.IncomingTransactionResult {
  if (typeof tx.from !== 'string') {
    response.success = false
    response.reason = 'tx "from" field must be a string'
    throw new Error(response.reason)
  } else if (typeof tx.cycle !== 'number') {
    response.success = false
    response.reason = 'tx "cycle" field must be a number'
    throw new Error(response.reason)
  } else if (typeof tx.config !== 'string') {
    response.success = false
    response.reason = 'tx "config" field must be a string'
    throw new Error(response.reason)
  }
  return response
}

export function validate(
  tx: ChangeConfig,
  wrappedStates: WrappedStates,
  response: ShardusTypes.IncomingTransactionResult,
  dapp: Shardus
): ShardusTypes.IncomingTransactionResult {
  const network: DaoGlobalAccount = wrappedStates[daoConfig.daoAccountAddress].data

  if (network.id !== daoConfig.daoAccountAddress) {
    response.reason = 'To account must be the network account'
    return response
  }
  try {
    const parsed = JSON.parse(tx.config)
    dapp.log(parsed)
    console.log(parsed)
  } catch (err) {
    dapp.log(err instanceof Error && err.message)
    response.reason = err instanceof Error ? err.message : 'Invalid JSON'
  }
  response.success = true
  response.reason = 'This transaction is valid!'
  return response
}

export function apply(
  tx: ChangeConfig,
  txTimestamp: number,
  wrappedStates: WrappedStates,
  dapp: Shardus,
  applyResponse: ShardusTypes.ApplyResponse
): void {
  const from: UserAccount = wrappedStates[tx.from].data
  let changeOnCycle: number | CycleRecord
  let cycleData: ShardusTypes.Cycle

  if ((tx.cycle as unknown as number) === -1) {
    ;[cycleData] = dapp.getLatestCycles()
    changeOnCycle = cycleData.counter + 3
  } else {
    changeOnCycle = tx.cycle
  }

  const when = txTimestamp + 1000 * 10
  const value = {
    type: 'apply_change_config',
    timestamp: when,
    network: daoConfig.daoAccountAddress,
    change: { cycle: changeOnCycle, change: JSON.parse(tx.config) },
  }

  const ourAppDefinedData = applyResponse.appDefinedData as OurAppDefinedData
  ourAppDefinedData.globalMsg = {
    address: daoConfig.daoAccountAddress,
    value,
    when,
    source: daoConfig.daoAccountAddress,
  }

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
  result.targetKeys = [daoConfig.daoAccountAddress]
  result.allKeys = [...result.sourceKeys, ...result.targetKeys]
  return result
}

export function createRelevantAccount(
  dapp: Shardus,
  account: NodeAccount,
  accountId: string,
  accountCreated = false
): WrappedResponse {
  if (!account) {
    account = new NodeAccount(accountId)
    accountCreated = true
  }
  return dapp.createWrappedResponse(accountId, accountCreated, account.hash, account.timestamp, account)
}
