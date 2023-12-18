import { Shardus } from '@shardus/core'
import shardus from '@shardus/core/dist/shardus'
import { ApplyResponse, OpaqueTransaction } from '@shardus/core/dist/shardus/shardus-types'
import { createInternalTxReceipt } from '..'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import {
  AccountType,
  InternalTXType,
  InternalTx,
  NetworkAccount,
  WrappedStates,
} from '../shardeum/shardeumTypes'
import { DaoGlobalAccount } from './accounts/networkAccount'
import { daoAccount, daoConfig } from './config'
import { decodeDaoTxFromEVMTx } from './utils'
import { Transaction, TransactionType } from '@ethereumjs/tx'
import transactions from './tx'
import { Address } from '@ethereumjs/util'
import { getTransactionObj } from '../setup/helpers'
import * as AccountsStorage from '../storage/accountStorage'

export function setupDaoAccount(shardus: Shardus, when: number): void {
  if (ShardeumFlags.EnableDaoFeatures) {
    const daoValue = {
      isInternalTx: true,
      internalTXType: InternalTXType.InitDao,
      timestamp: when,
    }
    shardus.setGlobal(daoAccount, daoValue, when, daoAccount)
  }
}

export function applyInitDaoTx(
  wrappedStates: WrappedStates,
  applyResponse: ApplyResponse,
  internalTx: InternalTx,
  txTimestamp: number,
  txId: string
): void {
  const dao: NetworkAccount = wrappedStates[daoAccount].data
  dao.timestamp = txTimestamp
  if (ShardeumFlags.supportInternalTxReceipt) {
    createInternalTxReceipt(shardus, applyResponse, internalTx, daoAccount, daoAccount, txTimestamp, txId)
  }
}

export function getRelevantDataInitDao(accountId, wrappedEVMAccount): boolean {
  if (!wrappedEVMAccount) {
    if (accountId === daoAccount) {
      wrappedEVMAccount = createDaoAccount()
      return true
    } else {
      //wrappedEVMAccount = createNodeAccount(accountId) as any
    }
    return false
  }
}

function createDaoAccount(timestamp = 0): DaoGlobalAccount {
  const proposalWindow = [timestamp, timestamp + daoConfig.TIME_FOR_PROPOSALS]
  const votingWindow = [proposalWindow[1], proposalWindow[1] + daoConfig.TIME_FOR_VOTING]
  const graceWindow = [votingWindow[1], votingWindow[1] + daoConfig.TIME_FOR_GRACE]
  const applyWindow = [graceWindow[1], graceWindow[1] + daoConfig.TIME_FOR_APPLY]

  const devProposalWindow = [timestamp, timestamp + daoConfig.TIME_FOR_DEV_PROPOSALS]
  const devVotingWindow = [devProposalWindow[1], devProposalWindow[1] + daoConfig.TIME_FOR_DEV_VOTING]
  const devGraceWindow = [devVotingWindow[1], devVotingWindow[1] + daoConfig.TIME_FOR_DEV_GRACE]
  const devApplyWindow = [devGraceWindow[1], devGraceWindow[1] + daoConfig.TIME_FOR_DEV_APPLY]

  const account: DaoGlobalAccount = {
    windows: {
      proposalWindow,
      votingWindow,
      graceWindow,
      applyWindow,
    },
    nextWindows: {},
    devWindows: {
      devProposalWindow,
      devVotingWindow,
      devGraceWindow,
      devApplyWindow,
    },
    nextDevWindows: {},
    developerFund: [],
    nextDeveloperFund: [],
    issue: 1,
    devIssue: 1,
    id: daoAccount,
    hash: '',
    timestamp: 0,
    accountType: AccountType.DaoAccount,
  }
  return account
}

export function isDaoTx(tx: OpaqueTransaction): boolean {
  // EVM txs come in as serialized hexstrings
  const transaction = getTransactionObj(tx)
  return transaction.to && transaction.to.toString() === ShardeumFlags.daoTargetAddress
}

/**
 * Liberus txs export a `keys` fn that gets called here
 */
export function handleDaoTxCrack(
  tx: OpaqueTransaction,
  result: {
    sourceKeys: any[]
    targetKeys: any[]
    storageKeys: any[]
    codeHashKeys: any[]
    allKeys: any[]
    timestamp: number
  }
): void {
  // Unserialize tx
  const unserializedTx = getTransactionObj(tx)
  // Decode data field of EVM tx to get type of DAO tx
  if ('data' in unserializedTx) {
    const daoTx: unknown = decodeDaoTxFromEVMTx(
      unserializedTx as Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930]
    )
    if (typeof daoTx === 'object' && 'type' in daoTx && typeof daoTx.type === 'string') {
      // Call the keys function of the dao tx type
      const changes = transactions[daoTx.type].keys(daoTx, {})
      // Combine changes with existing keys
      result.sourceKeys = result.sourceKeys.concat(changes.sourceKeys)
      result.targetKeys = result.targetKeys.concat(changes.targetKeys)
      result.allKeys = result.allKeys.concat(changes.allKeys)
    }
  }
}

/**
 * Liberus txs export a `createRelevantAccount` fn that gets called here
 */
export async function handleDaoTxGetRelevantData(
  accountId: string,
  tx: OpaqueTransaction,
  shardus: Shardus
): Promise<{
  accountId: any
  accountCreated: any
  isPartial: boolean
  stateId: any
  timestamp: any
  data: any
}> {
  // Unserialize the EVM tx
  const unserializedTx = getTransactionObj(tx)
  // Decode data field of EVM tx to get type of DAO tx
  if ('data' in unserializedTx) {
    const daoTx: unknown = decodeDaoTxFromEVMTx(
      unserializedTx as Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930]
    )
    if (typeof daoTx === 'object' && 'type' in daoTx && typeof daoTx.type === 'string') {
      // Try to get the account
      const account = await AccountsStorage.getAccount(accountId)
      // Return the wrappedResponse obj created by createRelevantAccount function of the dao tx type
      return transactions[daoTx.type].createRelevantAccount(shardus, account, accountId, daoTx)
    }
  }
}

/**
 * Liberus txs export a `apply` fn that gets called here
 */
export function handleDaoTxApply(shardus: Shardus, tx): void {}
