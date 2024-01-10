import * as apply_change_config from './apply_change_config'
import * as apply_dev_parameters from './apply_dev_parameters'
import * as apply_dev_tally from './apply_dev_tally'
import * as apply_developer_payment from './apply_developer_payment'
import * as apply_parameters from './apply_parameters'
import * as apply_tally from './apply_tally'
import * as change_config from './change_config'
import * as create from './create'
import * as dev_issue from './dev_issue'
import * as dev_parameters from './dev_parameters'
import * as dev_proposal from './dev_proposal'
import * as dev_tally from './dev_tally'
import * as dev_vote from './dev_vote'
import * as developer_payment from './developer_payment'
import * as distribute from './distribute'
import * as email from './email'
import * as gossip_email_hash from './gossip_email_hash'
import * as init_network from './init_network'
import * as issue from './issue'
import * as node_reward from './node_reward'
import * as parameters from './parameters'
import * as proposal from './proposal'
import * as register from './register'
import * as snapshot from './snapshot'
import * as tally from './tally'
import * as toll from './toll'
import * as transfer from './transfer'
import * as verify from './verify'
import * as vote from './vote'
import { Shardus } from '@shardus/core'
import { WrappedStates } from '@shardus/core/dist/state-manager/state-manager-types'
import {
  IncomingTransactionResult,
  TransactionKeys,
  WrappedResponse,
} from '@shardus/core/dist/shardus/shardus-types'

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
}

export default {
  init_network,
  snapshot,
  email,
  gossip_email_hash,
  verify,
  register,
  create,
  transfer,
  distribute,
  toll,
  node_reward,
  issue,
  proposal,
  vote,
  tally,
  apply_tally,
  parameters,
  apply_parameters,
  dev_issue,
  dev_proposal,
  dev_vote,
  dev_tally,
  apply_dev_tally,
  dev_parameters,
  apply_dev_parameters,
  developer_payment,
  apply_developer_payment,
  change_config,
  apply_change_config,
}
