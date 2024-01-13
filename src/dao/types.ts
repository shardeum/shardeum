import * as util from 'util'
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
  #size: number

  constructor(start: number, size: number) {
    if (typeof start !== 'number') throw new Error('start must be a number')
    if (typeof size !== 'number') throw new Error('size must be a number')
    if (Number.isNaN(start)) throw new Error('start must be a number')
    if (Number.isNaN(size)) throw new Error('size must be a number')
    if (start < 0) throw new Error('start must be >= 0')
    if (size < 0) throw new Error('size must be >= 0')
    this.#start = start
    this.#size = size
  }

  get start(): number {
    return this.#start
  }

  get size(): number {
    return this.#size
  }

  get stop(): number {
    return this.#start + this.#size
  }

  toJSON(): object {
    return {
      start: this.#start,
      size: this.#size,
    }
  }

  toString(): string {
    return `WindowRange { start: ${this.#start}, size: ${this.#size} }`
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  [util.inspect.custom](depth: number, options: any): string {
    return this.toString()
  }

  /**
   * @returns true if the value is in this range.
   */
  includes(value: number): boolean {
    // Ranges are half-open on the end so they can be adjacent without overlap.
    // This enables a sequence of ranges without gaps or ambiguities.
    return value >= this.start && value < this.stop
  }

  excludes(value: number): boolean {
    return value < this.start || value >= this.stop
  }

  /**
   * @returns true if the given range overlaps this one.
   */
  overlaps(other: WindowRange): boolean {
    return this.includes(other.start) || other.includes(this.start)
  }

  /**
   * @returns true if the given range is the next one after this one.
   */
  isNext(other: WindowRange): boolean {
    return other.start == this.stop
  }

  /**
   * @returns the next range after this one with the given size.
   */
  nextRange(size: number): WindowRange {
    if (typeof size !== 'number') throw new Error('size must be a number')
    if (Number.isNaN(size)) throw new Error('size must be a number')
    if (size < 0) throw new Error('size must be >= 0')
    return new WindowRange(this.stop, size)
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
