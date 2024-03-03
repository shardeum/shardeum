import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'

export const transactions =
  (dapp: Shardus) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id']
      const account = await getShardusAPI().getLocalOrRemoteAccount(id)

      const transactions =
        'data' in account &&
        typeof account.data === 'object' &&
        account.data &&
        'data' in account.data &&
        typeof account.data.data === 'object' &&
        account.data.data &&
        'transactions' in account.data.data
          ? account.data.data.transactions
          : undefined

      res.json({ transactions })
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
