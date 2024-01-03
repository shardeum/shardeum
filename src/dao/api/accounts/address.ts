import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'

export const address =
  (dapp: Shardus) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      const name = req.params['name']
      const account = await getShardusAPI().getLocalOrRemoteAccount(name)
      if (
        'data' in account &&
        typeof account.data == 'object' &&
        account.data &&
        'address' in account.data &&
        account.data.address
      ) {
        // to-do: type of account and account.data
        res.json({ address: account.data.address })
      } else {
        res.json({ error: 'No account exists for the given handle' })
      }
    } catch (error) {
      dapp.log(error)
      res.json({ error })
    }
  }
