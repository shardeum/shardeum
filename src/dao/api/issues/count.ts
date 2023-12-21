import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const count = (dapp: Shardus) => async (_req: Request, res: Response): Promise<void> => {
  const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
  try {
    const count = "data" in network
      && typeof network.data === "object"
      && network.data
      && "issue" in network.data
      ? network.data.issue : 0;

    res.json({ count })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
