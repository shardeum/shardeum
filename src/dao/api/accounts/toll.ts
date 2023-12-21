import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import config from '../../../config'
import { getShardusAPI } from '../../../index'

export const toll = (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    if (account) {
      const toll =
        "data" in account
          && typeof account.data === "object"
          && account.data
          && "data" in account.data
          && typeof account.data.data === "object"
          && account.data.data
          && "toll" in account.data.data
          ? account.data.data.toll : undefined;

      if (toll == null) {
        const network = await getShardusAPI().getLocalOrRemoteAccount(config.dao.daoAccount)
        const toll =
          typeof network.data === "object"
            && network.data
            && "current" in network.data
            && typeof network.data.current === "object"
            && network.data.current
            && "defaultToll" in network.data.current
            ? network.data.current.defaultToll : undefined;
        res.json({ toll })
      } else {
        const toll =
          typeof account.data === "object"
            && account.data
            && "data" in account.data
            && typeof account.data.data === "object"
            && account.data.data
            && "toll" in account.data.data
            ? account.data.data.toll : undefined;

        res.json({ toll })
      }
    } else {
      res.json({ error: 'No account with the given id' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
