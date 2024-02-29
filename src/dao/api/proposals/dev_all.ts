import { Shardus } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const dev_all =
  (dapp: Shardus) =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
      const devIssue =
        typeof network.data === 'object' && network.data && 'devIssue' in network.data
          ? (network.data.devIssue as number)
          : 0

      const devProposals = []
      for (let i = 1; i <= devIssue; i++) {
        const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${i}`))
        const devProposalCount =
          typeof devIssue?.data == 'object' && devIssue.data && 'devProposalCount' in devIssue.data
            ? (devIssue.data.devProposalCount as number)
            : 0
        for (let j = 1; j <= devProposalCount; j++) {
          const devProposal = await getShardusAPI().getLocalOrRemoteAccount(
            crypto.hash(`dev-issue-${i}-dev-proposal-${j}`)
          )
          if (devProposal && devProposal.data) {
            devProposals.push(devProposal.data)
          }
        }
      }
      res.json({ devProposals })
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
