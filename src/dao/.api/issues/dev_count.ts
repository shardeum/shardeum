import * as configs from '../../../config'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

// to-do: why is this called 'count' but returns 'devIssue'?
export const dev_count = dapp => async (req, res): Promise<void> => {
  const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
  try {
    res.json({ count: network.data.devIssue })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
