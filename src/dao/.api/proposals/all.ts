import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const all = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const proposals = []
    for (let i = 1; i <= network.data.issue; i++) {
      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${i}`))
      const proposalCount = issue && issue.data.proposalCount
      for (let j = 1; j <= proposalCount; j++) {
        const proposal = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${i}-proposal-${j}`))
        if (proposal && proposal.data) {
          proposals.push(proposal.data)
        }
      }
    }
    res.json({ proposals })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
