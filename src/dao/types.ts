import { AliasAccount } from "./accounts/aliasAccount"
import { ChatAccount } from "./accounts/chatAccount"
import { DevIssueAccount } from "./accounts/devIssueAccount"
import { DevProposalAccount } from "./accounts/devProposalAccount"
import { IssueAccount } from "./accounts/issueAccount"
import { NetworkAccount } from "./accounts/networkAccount"
import { NodeAccount } from "./accounts/nodeAccount"
import { ProposalAccount } from "./accounts/proposalAccount"
import { UserAccount } from "./accounts/userAccount"

// TODO: merge this with existing NetworkParameters
export interface NetworkParameters {
  title: string
  description: string
  nodeRewardInterval: number
  nodeRewardAmount: number
  nodePenalty: number
  transactionFee: number
  stakeRequired: number
  maintenanceInterval: number
  maintenanceFee: number
  proposalFee: number
  devProposalFee: number
  faucetAmount: number
  defaultToll: number
}

export interface Windows {
  proposalWindow: number[]
  votingWindow: number[]
  graceWindow: number[]
  applyWindow: number[]
}

export interface DevWindows {
  devProposalWindow: number[]
  devVotingWindow: number[]
  devGraceWindow: number[]
  devApplyWindow: number[]
}

export interface DeveloperPayment {
  id: string
  address: string
  amount: number
  delay: number
  timestamp: number
}

export type DaoAccounts = NetworkAccount & IssueAccount & DevIssueAccount & UserAccount & AliasAccount & ProposalAccount & DevProposalAccount & NodeAccount & ChatAccount

/**
 * ---------------------- SDK DATA INTERFACES ----------------------
 */

interface TransactionKeys {
  sourceKeys: string[]
  targetKeys: string[]
  allKeys: string[]
  timestamp: number
}

interface ValidationResponse {
  result: string
  reason: string
  txnTimestamp?: number
}

interface WrappedAccount {
  accountId: string
  stateId: string
  data: DaoAccounts
  timestamp: number
  accountCreated?: boolean
}

type KeyResult = {
  id: string
  timestamp: number
  keys: TransactionKeys
}
