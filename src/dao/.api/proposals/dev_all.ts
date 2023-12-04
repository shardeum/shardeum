import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const dev_all = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const devProposals = []
    for (let i = 1; i <= network.data.devIssue; i++) {
      const devIssue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${i}`))
      const devProposalCount = devIssue && devIssue.data.devProposalCount
      for (let j = 1; j <= devProposalCount; j++) {
        const devProposal = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${i}-dev-proposal-${j}`))
        if (devProposal && devProposal.data) {
          devProposals.push(devProposal.data)
        }
      }
    }
    res.json({ devProposals })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
