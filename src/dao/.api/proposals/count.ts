import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const count = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${network.data.issue}`))
    res.json({ count: issue && issue.data.proposalCount })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
