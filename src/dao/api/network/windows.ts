import { Request, Response } from 'express'
import { daoConfig } from '../../../config/dao'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const windows_all =
  () =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)

      const windows =
        typeof network.data == 'object' && network.data && 'windows' in network.data
          ? network.data.windows
          : undefined
      const devWindows =
        typeof network.data == 'object' && network.data && 'devWindows' in network.data
          ? network.data.devWindows
          : undefined

      res.json({
        windows,
        devWindows,
      })
    } catch (error) {
      res.json({ error })
    }
  }

export const windows =
  () =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(daoConfig.daoAccount)
      const windows =
        typeof network.data == 'object' && network.data && 'windows' in network.data
          ? network.data.windows
          : undefined
      res.json({ windows })
    } catch (error) {
      res.json({ error })
    }
  }

export const windows_dev =
  () =>
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const network = await getShardusAPI().getLocalOrRemoteAccount(daoConfig.daoAccount)
      const devWindows =
        typeof network.data == 'object' && network.data && 'devWindows' in network.data
          ? network.data.devWindows
          : undefined
      res.json({ devWindows })
    } catch (error) {
      res.json({ error })
    }
  }
