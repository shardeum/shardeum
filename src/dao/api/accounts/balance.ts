import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'

export const balance = (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    if (account) {
      const balance =
        "data" in account
          && typeof account.data == "object"
          && "data" in account.data
          && typeof account.data.data == "object"
          && "balance" in account.data.data
          ? account.data.data.balance : undefined;
      res.json({ balance })
    } else {
      res.json({ error: 'No account with the given id' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
