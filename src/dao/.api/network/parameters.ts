import * as configs from '../../../config'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const current = dapp => async (req, res): Promise<void> => {
  try {
    const account = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const network: NetworkAccount = account.data
    res.json({
      parameters: {
        current: network.current,
        next: network.next,
        developerFund: network.developerFund,
        nextDeveloperFund: network.nextDeveloperFund,
        windows: network.windows,
        devWindows: network.devWindows,
        nextWindows: network.nextWindows,
        nextDevWindows: network.nextDevWindows,
        issue: network.issue,
        devIssue: network.devIssue,
        listOfChanges: network.listOfChanges,
      },
    })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}

export const next = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(configs.networkAccount)
    res.json({ parameters: network.data.next })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
