import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

interface HasIssue {
  issue: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const latest = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)

    // all this because `data` is unknown type in WrappedData
    if (!network.data) throw new Error('network.data is undefined')
    if (typeof network.data !== 'object') throw new Error('network.data is not an object')
    if (!('issue' in network.data)) throw new Error('issue is not in network.data')
    const data = network.data as HasIssue

    const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${data.issue}`))
    res.json({ issue: issue && issue.data })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
