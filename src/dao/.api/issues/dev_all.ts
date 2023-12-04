import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const dev_all = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const devIssues = []
    for (let i = 1; i <= network.data.devIssue; i++) {
      const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${i}`))
      if (devIssue && devIssue.data) {
        devIssues.push(devIssue.data)
      }
    }
    res.json({ devIssues })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
