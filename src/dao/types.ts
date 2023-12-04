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

interface ApplyParameters {
  type: string
  timestamp: number
  current: NetworkParameters
  next: {}
  windows: Windows
  nextWindows: {}
  issue: number
}

interface ApplyDevPayment {
  type: string
  timestamp: number
  developerFund: DeveloperPayment[]
}

interface ApplyTally {
  type: string
  timestamp: number
  next: NetworkParameters
  nextWindows: Windows
}

export interface ApplyDevTally {
  type: string
  timestamp: number
  nextDeveloperFund: DeveloperPayment[]
  nextDevWindows: DevWindows
}

interface Create {
  type: string
  from: string
  to: string
  amount: number
  timestamp: number
}

interface Distribute {
  type: string
  from: string
  recipients: string[]
  amount: number
  timestamp: number
  sign: Signature
}

interface Email {
  type: string
  signedTx: {
    emailHash: string
    from: string
    sign: Signature
  }
  email: string
  timestamp: number
}

interface Friend {
  type: string
  alias: string
  from: string
  to: string
  timestamp: number
  sign: Signature
}

interface GossipEmailHash {
  type: string
  nodeId: string
  account: string
  from: string
  emailHash: string
  verified: string
  timestamp: number
}

interface InitNetwork {
  type: string
  timestamp: number
}

interface Issue {
  type: string
  nodeId: string
  from: string
  issue: string
  proposal: string
  timestamp: number
}

interface DevIssue {
  type: string
  nodeId: string
  from: string
  devIssue: string
  timestamp: number
}

interface Message {
  type: string
  from: string
  to: string
  chatId: string
  message: string
  timestamp: number
  sign: Signature
}

interface NodeReward {
  type: string
  nodeId: string
  from: string
  to: string
  timestamp: number
}

interface Parameters {
  type: string
  nodeId: string
  from: string
  issue: string
  timestamp: number
}

interface ChangeConfig {
  type: string
  from: string
  cycle: number
  config: string
  timestamp: number
}


interface DevParameters {
  type: string
  nodeId: string
  from: string
  devIssue: string
  timestamp: number
}

interface Proposal {
  type: string
  from: string
  proposal: string
  issue: string
  parameters: NetworkParameters
  timestamp: number
  sign: Signature
}

interface DevProposal {
  type: string
  from: string
  devProposal: string
  devIssue: string
  totalAmount: number
  payments: DeveloperPayment[]
  title: string
  description: string
  payAddress: string
  timestamp: number
  sign: Signature
}

interface Register {
  type: string
  aliasHash: string
  from: string
  alias: string
  timestamp: number
  sign: Signature
}

interface RemoveFriend {
  type: string
  from: string
  to: string
  timestamp: number
  sign: Signature
}

interface RemoveStakeRequest {
  type: string
  from: string
  stake: number
  timestamp: number
  sign: Signature
}

interface RemoveStake {
  type: string
  from: string
  stake: number
  timestamp: number
  sign: Signature
}

interface SnapshotClaim {
  type: string
  from: string
  timestamp: number
  sign: Signature
}

interface Snapshot {
  type: string
  from: string
  snapshot: any
  timestamp: number
  sign: Signature
}

interface Stake {
  type: string
  from: string
  stake: number
  timestamp: number
  sign: Signature
}

interface Tally {
  type: string
  nodeId: string
  from: string
  issue: string
  proposals: string[]
  timestamp: number
}

interface DevTally {
  type: string
  nodeId: string
  from: string
  devIssue: string
  devProposals: string[]
  timestamp: number
}

interface Toll {
  type: string
  from: string
  toll: number
  timestamp: number
  sign: Signature
}

interface Transfer {
  type: string
  from: string
  to: string
  amount: number
  timestamp: number
  sign: Signature
}

interface Verify {
  type: string
  from: string
  code: string
  timestamp: number
  sign: Signature
}

interface Vote {
  type: string
  from: string
  issue: string
  proposal: string
  amount: number
  timestamp: number
  sign: Signature
}

interface DevVote {
  type: string
  from: string
  devIssue: string
  devProposal: string
  approve: boolean
  amount: number
  timestamp: number
  sign: Signature
}

interface DevPayment {
  type: string
  nodeId: string
  from: string
  developer: string
  payment: DeveloperPayment
  timestamp: number
  sign: Signature
}

interface Signature {
  owner: string
  sig: string
}

type Accounts = NetworkAccount & IssueAccount & DevIssueAccount & UserAccount & AliasAccount & ProposalAccount & DevProposalAccount & NodeAccount & ChatAccount

/**
 * ---------------------- SDK DATA INTERFACES ----------------------
 */

interface TransactionKeys {
  sourceKeys: string[]
  targetKeys: string[]
  allKeys: string[]
  timestamp: number
}

interface WrappedResponse {
  accountId: string
  accountCreated: boolean
  isPartial: boolean
  stateId: string
  timestamp: number
  data: never
}

interface ValidationResponse {
  result: string
  reason: string
  txnTimestamp?: number
}

interface WrappedAccount {
  accountId: string
  stateId: string
  data: Accounts
  timestamp: number
  accountCreated?: boolean
}

interface WrappedStates {
  [id: string]: WrappedAccount
}

type KeyResult = {
  id: string
  timestamp: number
  keys: TransactionKeys
}

interface OurAppDefinedData {
  globalMsg: {
    address: string
    value: any
    when: number,
    source: string
  }
}
