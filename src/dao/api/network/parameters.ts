import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'
import { DaoGlobalAccount } from '../../accounts/networkAccount'

export const current = (dapp: Shardus) => async (_req: Request, res: Response): Promise<void> => {
  try {
    const account = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)
    const network: DaoGlobalAccount = account.data as DaoGlobalAccount
    res.json({
      parameters: {
        developerFund: network.developerFund,
        nextDeveloperFund: network.nextDeveloperFund,
        windows: network.windows,
        devWindows: network.devWindows,
        nextWindows: network.nextWindows,
        nextDevWindows: network.nextDevWindows,
        issue: network.issue,
        devIssue: network.devIssue,
      },
    })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}

