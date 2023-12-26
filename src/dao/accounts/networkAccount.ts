import * as crypto from '@shardus/crypto-utils'
import { daoConfig } from '../../config/dao'
import { DeveloperPayment, DevWindows, Windows } from '../types'
import { AccountType, BaseAccount, NetworkParameters } from '../../shardeum/shardeumTypes'
import { initialNetworkParamters } from '../../shardeum/initialNetworkParameters'

export interface DaoGlobalAccount extends BaseAccount {
  accountType: AccountType.DaoAccount
  id: string

  windows: Windows
  nextWindows: Windows | object

  devWindows: DevWindows
  nextDevWindows: DevWindows | object

  issue: number
  devIssue: number

  developerFund: DeveloperPayment[]
  nextDeveloperFund: DeveloperPayment[]

  current: NetworkParameters
  next: NetworkParameters | Record<string, never>

  hash: crypto.hexstring
  timestamp: number
}

export function isDaoGlobalAccount(obj: object | null | undefined): obj is DaoGlobalAccount {
  // to-do: add or remove
  // 'type' in obj
  // obj.type === 'NetworkAccount'
  return obj != null
    && 'id' in obj
    && 'issue' in obj
    && 'hash' in obj
    && 'timestamp' in obj
}

export const createDaoGlobalAccount = (accountId: string, timestamp: number): DaoGlobalAccount => {
  const proposalWindow = [timestamp, timestamp + daoConfig.TIME_FOR_PROPOSALS]
  const votingWindow = [proposalWindow[1], proposalWindow[1] + daoConfig.TIME_FOR_VOTING]
  const graceWindow = [votingWindow[1], votingWindow[1] + daoConfig.TIME_FOR_GRACE]
  const applyWindow = [graceWindow[1], graceWindow[1] + daoConfig.TIME_FOR_APPLY]

  const devProposalWindow = [timestamp, timestamp + daoConfig.TIME_FOR_DEV_PROPOSALS]
  const devVotingWindow = [devProposalWindow[1], devProposalWindow[1] + daoConfig.TIME_FOR_DEV_VOTING]
  const devGraceWindow = [devVotingWindow[1], devVotingWindow[1] + daoConfig.TIME_FOR_DEV_GRACE]
  const devApplyWindow = [devGraceWindow[1], devGraceWindow[1] + daoConfig.TIME_FOR_DEV_APPLY]

  const account: DaoGlobalAccount = {
    // to-do: There are a lot of hard coded values in the change: value below.
    //        Can/should they be taken from another source to avoid duplication?
    accountType: AccountType.DaoAccount,
    id: accountId,

    /* to-do: add to type or remove from literal
    listOfChanges: [
      {
        cycle: 1,
        change: {
          server: {
            transactionExpireTime: 5,
            p2p: {
              syncLimit: 180,
              cycleDuration: 30,
              maxRejoinTime: 20,
              difficulty: 2,
              queryDelay: 1,
              gossipRecipients: 8,
              gossipFactor: 4,
              gossipStartSeed: 15,
              gossipSeedFallof: 15,
              gossipTimeout: 180,
              maxSeedNodes: 10,
              minNodesToAllowTxs: 3,
              minNodes: 15,
              maxNodes: 30,
              seedNodeOffset: 4,
              nodeExpiryAge: 30,
              maxJoinedPerCycle: 1,
              maxSyncingPerCycle: 5,
              maxRotatedPerCycle: 1,
              maxPercentOfDelta: 40,
              minScaleReqsNeeded: 5,
              maxScaleReqs: 200,
              scaleConsensusRequired: 0.25,
              amountToGrow: 1,
              amountToShrink: 1,
              startInWitnessMode: false,
            },
            reporting: {
              report: true,
              recipient: 'http://127.0.0.1:3000/api',
              interval: 2,
              console: false,
            },
            loadDetection: {
              queueLimit: 1000,
              desiredTxTime: 15,
              highThreshold: 0.5,
              lowThreshold: 0.2,
            },
            rateLimiting: {
              limitRate: true,
              loadLimit: {
                internal: 0.5,
                external: 0.4,
                txTimeInQueue: 0.2,
                queueLength: 0.2,
              },
            },
          },
        },
      },
    ],
    */
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
    current: initialNetworkParamters,
    next: {},
    issue: 1,
    devIssue: 1,
    hash: '',
    timestamp: 0,
  }
  account.hash = crypto.hashObj(account)
  console.log('INITIAL_HASH: ', account.hash)
  return account
}
