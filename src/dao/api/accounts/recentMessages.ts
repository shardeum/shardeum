import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'

export const recentMessages = (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id']
    const messages: object[] = []
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    if (account) {
      const chats =
        "data" in account
          && typeof account.data === "object"
          && account.data
          && "data" in account.data
          && typeof account.data.data === "object"
          && account.data.data
          && "chats" in account.data.data
          ? account.data.data.chats as Record<string, { messages: object[] }> : {};

      Object.values(chats).forEach((chat: { messages: object[] }) => {
        messages.push(...chat.messages)
      })
      res.json({ messages })
    } else {
      res.json({ error: 'No account for given id' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
