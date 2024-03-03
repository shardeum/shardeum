import { Shardus } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { daoAccountAddress } from '../../../config/dao'

export const latest =
  (dapp: Shardus) =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(daoAccountAddress)

      const issueId =
        typeof network.data === 'object' && network.data && 'issue' in network.data ? network.data.issue : 0
      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${issueId}`))

      const proposalCount =
        typeof issue.data === 'object' && issue.data && 'proposalCount' in issue.data
          ? (issue.data.proposalCount as number)
          : 0
      const proposals = []

      for (let i = 1; i <= proposalCount; i++) {
        const proposal = await getShardusAPI().getLocalOrRemoteAccount(
          crypto.hash(`issue-${issueId}-proposal-${i}`)
        )
        if (proposal && proposal.data) {
          proposals.push(proposal.data)
        }
      }
      res.json({ proposals })
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
