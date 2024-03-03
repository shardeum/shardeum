import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { daoAccountAddress } from '../../../config/dao'
import { Request, Response } from 'express'
import { Shardus } from '@shardus/core'

export const dev_latest =
  (dapp: Shardus) =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(daoAccountAddress)

      const devIssueNum =
        typeof network.data === 'object' && network.data && 'devIssue' in network.data
          ? network.data.devIssue
          : 0
      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${devIssueNum}`))

      const devProposalCount =
        typeof issue?.data == 'object' && issue.data && 'devProposalCount' in issue.data
          ? (issue.data.devProposalCount as number)
          : 0

      const devProposals = []
      for (let i = 1; i <= devProposalCount; i++) {
        const devProposal = await getShardusAPI().getLocalOrRemoteAccount(
          crypto.hash(`dev-issue-${devIssueNum}-dev-proposal-${i}`)
        )
        if (devProposal && devProposal.data) {
          devProposals.push(devProposal.data)
        }
      }
      res.json({ devProposals })
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
