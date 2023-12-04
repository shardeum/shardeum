import * as configs from '../../../config'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const count = dapp => async (req, res): Promise<void> => {
  const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
  try {
    res.json({ count: network.data.issue })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
