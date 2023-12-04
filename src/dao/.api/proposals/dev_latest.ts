import * as configs from '../../../config'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const dev_latest = dapp => async (req, res): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${network.data.devIssue}`))
    const devProposalCount = issue && issue.data.devProposalCount
    const devProposals = []
    for (let i = 1; i <= devProposalCount; i++) {
      const devProposal = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`dev-issue-${network.data.devIssue}-dev-proposal-${i}`))
      if (devProposal && devProposal.data) {
        devProposals.push(devProposal.data)
      }
    }
    res.json({ devProposals })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
