import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const dev_latest = dapp => async (req, res): Promise<void> => {
  const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
  try {
    const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${network.data.devIssue}`))
    res.json({ devIssue: devIssue && devIssue.data })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
