import { Shardus } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const latest =
  (dapp: Shardus) =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)

      // all this because `data` is unknown type in WrappedData
      if (!network.data) throw new Error('network.data is undefined')
      if (typeof network.data !== 'object') throw new Error('network.data is not an object')
      if (!('issue' in network.data)) throw new Error('issue is not in network.data')
      const data = network.data

      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${data.issue}`))
      res.json({ issue: issue?.data })
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
