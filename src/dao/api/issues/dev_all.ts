import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'
import { Request, Response } from 'express'
import { Shardus } from '@shardus/core'

export const dev_all = (dapp: Shardus) => async (_req: Request, res: Response): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const devIssues = []
    const devIssue =
      "data" in network
        && typeof network.data === "object"
        && network.data
        && "devIssue" in network.data
        ? network.data.devIssue as number : 0;

    for (let i = 1; i <= devIssue; i++) {
      const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${i}`))
      if (devIssue && devIssue.data) {
        devIssues.push(devIssue.data)
      }
    }
    res.json({ devIssues })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
