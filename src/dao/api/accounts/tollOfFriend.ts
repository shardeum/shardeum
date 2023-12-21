import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const tollOfFriend = (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id']
    const friendId = req.params['friendId']
    if (!id) {
      res.json({
        error: 'No provided id in the route: account/:id/:friendId/toll',
      })
    }
    if (!friendId) {
      res.json({
        error: 'No provided friendId in the route: account/:id/:friendId/toll',
      })
    }
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    if (account) {
      if (
        "data" in account
        && typeof account.data === "object"
        && account.data
        && "data" in account.data
        && typeof account.data.data === "object"
        && account.data.data
        && "friends" in account.data.data
        && account.data.data.friends[friendId]
      ) {
        res.json({ toll: 0 })
      } else {
        const accountDataToll = "data" in account
          && typeof account.data === "object"
          && account.data
          && "data" in account.data
          && typeof account.data.data === "object"
          && account.data.data
          && "toll" in account.data.data
          ? account.data.data.toll : undefined;

        if (accountDataToll == null) {
          const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)

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
      }
    } else {
      res.json({ error: 'No account with the given id' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
