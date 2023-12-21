import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'
import { Request, Response } from 'express'
import { Shardus } from '@shardus/core'

export const dev_count = (dapp: Shardus) => async (_req: Request, res: Response): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)

    const devIssueNum =
      typeof network.data === "object"
        && network.data
        && "devIssue" in network.data
        ? network.data.devIssue : 0;
    const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${devIssueNum}`))

    const devProposalCount =
      typeof devIssue?.data == "object"
        && devIssue.data
        && "devProposalCount" in devIssue.data
        ? devIssue.data.devProposalCount : 0;
    res.json({ count: devIssue && devProposalCount })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
