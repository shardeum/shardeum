import { Shardus } from '@shardus/core'
import { WrappedStates } from '@shardus/core/dist/state-manager/state-manager-types'
import {
  ApplyResponse,
  IncomingTransactionResult,
  TransactionKeys,
  WrappedResponse,
} from '@shardus/core/dist/shardus/shardus-types'
import { INetworkProposal, NetworkProposal } from './network_proposal'
import { IIssue, Issue } from './issue'
import { ApplyChangeConfig, IApplyChangeConfig } from './apply_change_config'
import { ApplyDevParameters, IApplyDevParameters } from './apply_dev_parameters'
import { ApplyDevTally, IApplyDevTally } from './apply_dev_tally'
import { ApplyDevPayment, IApplyDevPayment } from './apply_developer_payment'
import { ApplyParameters, IApplyParameters } from './apply_parameters'
import { ApplyTally, IApplyTally } from './apply_tally'
import { getTransactionObj } from '../../setup/helpers'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { DevProposal, IDevProposal } from './dev_proposal'
import { DevIssue, IDevIssue } from './dev_issue'
import { DevTally, IDevTally } from './dev_tally'
import { DevParameters, IDevParameters } from './dev_parameters'
import { DevVote, IDevVote } from './dev_vote'
import { IVote, Vote } from './network_vote'

export abstract class DaoTx<Account> {
  abstract readonly type: string
  abstract validateFields(response: IncomingTransactionResult): IncomingTransactionResult
  abstract validate(
    wrappedStates: WrappedStates,
    response: IncomingTransactionResult,
    dapp: Shardus
  ): IncomingTransactionResult
  abstract apply(txTimestamp: number, txId: string | null, wrappedStates: WrappedStates, dapp: Shardus, applyResponse?: ApplyResponse): void
  abstract keys(result: TransactionKeys): TransactionKeys
  abstract createRelevantAccount(
    dapp: Shardus,
    account: Account,
    accountId: string,
    accountCreated: boolean
  ): WrappedResponse

  /**
   * Instantiates some `DaoTx` subclass from a plain transaction object. Use
   * this to instantiate a `DaoTx` from a transaction object received from the
   * network.
   */
  static fromTxObject(tx: PlainDaoTx): DaoTx<unknown> | null {
    switch (tx.type) {
      case 'apply_change_config':
        return new ApplyChangeConfig(tx)
      case 'apply_dev_parameters':
        return new ApplyDevParameters(tx)
      case 'apply_dev_tally':
        return new ApplyDevTally(tx)
      case 'apply_dev_payment':
        return new ApplyDevPayment(tx)
      case 'apply_parameters':
        return new ApplyParameters(tx)
      case 'apply_tally':
        return new ApplyTally(tx)
      case 'issue':
        return new Issue(tx)
      case 'network_proposal':
        return new NetworkProposal(tx)
      case 'network_vote':
        return new Vote(tx)
      case 'dev_proposal':
        return new DevProposal(tx)
      case 'dev_issue':
        return new DevIssue(tx)
      case 'dev_tally':
        return new DevTally(tx)
      case 'dev_parameters':
        return new DevParameters(tx)
      case 'dev_vote':
        return new DevVote(tx)
    }
  }
}

export type PlainDaoTx =
  | IApplyChangeConfig
  | IApplyDevParameters
  | IApplyDevTally
  | IApplyDevPayment
  | IApplyParameters
  | IApplyTally
  | INetworkProposal
  | IIssue
  | IVote
  | IDevProposal
  | IDevIssue
  | IDevTally
  | IDevParameters
  | IDevVote

function hasDaoTxType(tx: object): tx is PlainDaoTx {
  return (
    'type' in tx &&
    typeof tx.type === 'string' &&
    [
      'apply_change_config',
      'apply_dev_parameters',
      'apply_dev_tally',
      'apply_dev_payment',
      'apply_parameters',
      'apply_tally',
      'issue',
      'network_proposal',
      'network_vote',
      'dev_proposal',
      'dev_issue',
      'dev_tally',
      'dev_parameters',
      'dev_vote',
    ].includes(tx.type)
  )
}

export function isOpaqueDaoTx(tx: OpaqueTransaction): boolean {
  // EVM txs come in as serialized hexstrings
  let transaction = null
  if ('raw' in tx && typeof tx.raw === 'string') {
    transaction = getTransactionObj(tx as { raw: string })
  }
  return transaction?.to?.toString() === ShardeumFlags.daoTargetAddress
}
