import * as configs from '../../../config'
import * as AccountsStorage from '../../../storage/accountStorage'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'

getShardusAPI().registerExternalGet('all', async (req, res) => {
  try {
    const network = AccountsStorage.cachedNetworkAccount
    const issues = []
    for (let i = 1; i <= network.data.issue; i++) {
      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${i}`))
      if (issue && issue.data) {
        issues.push(issue.data)
      }
    }
    res.json({ success: true, issues })
  } catch (error) {
    getShardusAPI().log(error)
    res.json({ success: false, error })
  }
})
