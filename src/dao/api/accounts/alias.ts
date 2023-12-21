import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'

export const alias = (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    const handle =
      "data" in account
        && typeof account.data == "object"
        && account.data
        && "alias" in account.data
        ? account.data.alias : undefined;
    res.json({ handle })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
