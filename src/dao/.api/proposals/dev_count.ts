import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const dev_count = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${network.data.devIssue}`))
    res.json({ count: devIssue && devIssue.data.devProposalCount })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
