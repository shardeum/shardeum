import { AliasAccount } from './accounts/aliasAccount'
import { DevIssueAccount } from './accounts/devIssueAccount'
import { DevProposalAccount } from './accounts/devProposalAccount'
import { IssueAccount } from './accounts/issueAccount'
import { DaoGlobalAccount } from './accounts/networkAccount'
import { NodeAccount } from './accounts/nodeAccount'
import { ProposalAccount } from './accounts/proposalAccount'
import { UserAccount } from './accounts/userAccount'

export class WindowRange {
  #start: number
  #stop: number

  constructor(start: number, stop: number) {
    if (typeof start !== 'number') throw new Error('start must be a number')
    if (typeof stop !== 'number') throw new Error('stop must be a number')
    if (Number.isNaN(start)) throw new Error('start must be a number')
    if (Number.isNaN(stop)) throw new Error('stop must be a number')
    if (stop < start) throw new Error('stop must be greater than start')
    this.#start = start
    this.#stop = stop
  }

  get start(): number {
    return this.#start
  }

  get stop(): number {
    return this.#stop
  }

  toString(): string {
    return `WindowRange(${this.start}, ${this.stop})`
  }

  includes(value: number): boolean {
    // Ranges are half-open on the end so they can be adjacent without overlap.
    // This enables a sequence of ranges without gaps or ambiguities.
    return value >= this.start && value < this.stop
  }

  overlaps(other: WindowRange): boolean {
    return this.includes(other.start) || other.includes(this.start)
  }

  isSubsequent(other: WindowRange): boolean {
    return this.stop === other.start
  }
}

export interface Windows {
  proposalWindow: WindowRange
  votingWindow: WindowRange
  graceWindow: WindowRange
  applyWindow: WindowRange
}

export interface DeveloperPayment {
  id: string
  address: string
  amount: number
  delay: number
  timestamp: number
}

export type DaoAccounts = DaoGlobalAccount &
  IssueAccount &
  DevIssueAccount &
  UserAccount &
  AliasAccount &
  ProposalAccount &
  DevProposalAccount &
  NodeAccount
