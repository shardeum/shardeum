import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { daoAccountAddress } from '../../../config/dao'
import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'

export const count =
  (dapp: Shardus) =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(daoAccountAddress)

      const issueCount =
        typeof network.data == 'object' && network.data && 'issue' in network.data
          ? network.data.issue
          : undefined
      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${issueCount}`))

      const count =
        typeof issue?.data == 'object' && issue.data && 'proposalCount' in issue.data
          ? issue.data.proposalCount
          : undefined
      res.json({ count: count || 0 })
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
