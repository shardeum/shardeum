import { Shardus } from '@shardus/core'
import { WrappedStates } from '@shardus/core/dist/state-manager/state-manager-types'
import {
  IncomingTransactionResult,
  TransactionKeys,
  WrappedResponse,
} from '@shardus/core/dist/shardus/shardus-types'
import { IProposal, Proposal } from './proposal'
import { IIssue, Issue } from './issue'
import { ApplyChangeConfig, IApplyChangeConfig } from './apply_change_config'
import { ApplyDevParameters, IApplyDevParameters } from './apply_dev_parameters'
import { ApplyDevTally, IApplyDevTally } from './apply_dev_tally'
import { ApplyDevPayment, IApplyDevPayment } from './apply_developer_payment'
import { ApplyParameters, IApplyParameters } from './apply_parameters'
import { ApplyTally, IApplyTally } from './apply_tally'

export abstract class DaoTx<Account> {
  abstract readonly type: string
  abstract validateFields(response: IncomingTransactionResult): IncomingTransactionResult
  abstract validate(
    wrappedStates: WrappedStates,
    response: IncomingTransactionResult,
    dapp: Shardus
  ): IncomingTransactionResult
  abstract apply(txTimestamp: number, txId: string, wrappedStates: WrappedStates, dapp: Shardus): void
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
      case 'proposal':
        return new Proposal(tx)
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
  | IProposal
  | IIssue
