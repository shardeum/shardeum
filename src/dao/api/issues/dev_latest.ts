import { Shardus } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { daoAccountAddress } from '../../../config/dao'

export const dev_latest =
  (dapp: Shardus) =>
  async (_req: Request, res: Response): Promise<void> => {
    const network = await getShardusAPI().getLocalOrRemoteAccount(daoAccountAddress)
    try {
      const count =
        'data' in network && typeof network.data === 'object' && network.data && 'devIssue' in network.data
          ? network.data.devIssue
          : 0

      const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${count}`))

      res.json({ devIssue: devIssue?.data })
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
