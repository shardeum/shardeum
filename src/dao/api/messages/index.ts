import { Shardus } from '@shardus/core'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'

export default (dapp: Shardus) => async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params
    const chat = await getShardusAPI().getLocalOrRemoteAccount(chatId)
    if (!chat) {
      res.json({ error: "Chat doesn't exist" })
      return
    }
    if (typeof chat.data === 'object' && chat.data && 'messages' in chat.data) {
      res.json({ messages: chat.data.messages })
    } else {
      res.json({ error: 'no chat history for this request' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
