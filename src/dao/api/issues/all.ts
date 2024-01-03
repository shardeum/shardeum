import * as AccountsStorage from '../../../storage/accountStorage'
import * as crypto from '@shardus/crypto-utils'
import { getShardusAPI } from '../../../index'
import { Request, Response } from 'express'

export const all = async (_req: Request, res: Response): Promise<void> => {
  try {
    const network = AccountsStorage.cachedNetworkAccount
    const issues = []
    const issue =
      'data' in network && typeof network.data === 'object' && network.data && 'issue' in network.data
        ? (network.data.issue as number)
        : 0
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
}

getShardusAPI().registerExternalGet('all', all)
