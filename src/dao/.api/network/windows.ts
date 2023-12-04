import * as configs from '../../../config/'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const windows_all = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    res.json({
      windows: network.data.windows,
      devWindows: network.data.devWindows,
    })
  } catch (error) {
    res.json({ error })
  }
}

export const windows = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(configs.networkAccount)
    res.json({ windows: network.data.windows })
  } catch (error) {
    res.json({ error })
  }
}

export const windows_dev = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(configs.networkAccount)
    res.json({ devWindows: network.data.devWindows })
  } catch (error) {
    res.json({ error })
  }
}
