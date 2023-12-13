import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'

export const account = (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    res.json({ account: account && account.data })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
