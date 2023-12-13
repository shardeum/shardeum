import * as AccountsStorage from '../../../storage/accountStorage'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'

getShardusAPI().registerExternalGet('all', async (_req, res) => {
  try {
    const network = AccountsStorage.cachedNetworkAccount
    const issues = []
    const issue = "data" in network
      && typeof network.data === "object"
      && "issue" in network.data
      ? network.data.issue : 0;
    for (let i = 1; i <= issue; i++) {
      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${i}`))
      if (issue?.data) {
        issues.push(issue.data)
      }
    }
    res.json({ success: true, issues })
  } catch (error) {
    getShardusAPI().log(error)
    res.json({ success: false, error })
  }
})
