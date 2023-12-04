import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const tollOfFriend = dapp => async (req, res): Promise<void> => {
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
      if (account.data.data.friends[friendId]) {
        res.json({ toll: 0 })
      } else {
        if (account.data.data.toll === null) {
          const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
          res.json({ toll: network.data.current.defaultToll })
        } else {
          res.json({ toll: account.data.data.toll })
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
