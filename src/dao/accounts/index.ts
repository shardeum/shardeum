import { aliasAccount } from './aliasAccount'
import { chatAccount } from './chatAccount'
import { devProposalAccount } from './devProposalAccount'
import { devIssueAccount } from './devIssueAccount'
import { userAccount } from './userAccount'
import { issueAccount } from './issueAccount'
import { networkAccount } from './networkAccount'
import { nodeAccount } from './nodeAccount'
import { proposalAccount } from './proposalAccount'
import { Address } from 'ethereumjs-util'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'

export default {
  aliasAccount,
  chatAccount,
  devIssueAccount,
  devProposalAccount,
  issueAccount,
  networkAccount,
  nodeAccount,
  proposalAccount,
  userAccount,
}

export interface HasToAddress {
  readonly to?: Address
}

export function isGovernanceTx(transaction: HasToAddress): boolean {
  return transaction.to && transaction.to.toString() === ShardeumFlags.governanceTargetAddress
}
