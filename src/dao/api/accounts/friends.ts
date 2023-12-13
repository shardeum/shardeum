import { Shardus } from '@shardus/core';
import { Request, Response } from 'express';
import { getShardusAPI } from '../../../index'

export const friends = (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    if (account) {
      const friends =
        "data" in account
          && typeof account.data === "object"
          && "data" in account.data
          && typeof account.data.data === "object"
          && "friends" in account.data.data
          ? account.data.data.friends : undefined;
      res.json({ friends })
    } else {
      res.json({ error: 'No account for given id' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
