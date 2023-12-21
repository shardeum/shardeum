import { AliasAccount } from "./accounts/aliasAccount"
import { ChatAccount } from "./accounts/chatAccount"
import { DevIssueAccount } from "./accounts/devIssueAccount"
import { DevProposalAccount } from "./accounts/devProposalAccount"
import { IssueAccount } from "./accounts/issueAccount"
import { DaoGlobalAccount } from "./accounts/networkAccount"
import { NodeAccount } from "./accounts/nodeAccount"
import { ProposalAccount } from "./accounts/proposalAccount"
import { UserAccount } from "./accounts/userAccount"

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

export type DaoAccounts = DaoGlobalAccount & IssueAccount & DevIssueAccount & UserAccount & AliasAccount & ProposalAccount & DevProposalAccount & NodeAccount & ChatAccount
