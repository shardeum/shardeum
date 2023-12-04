import { getShardusAPI } from '../../../index'

export const recentMessages = dapp => async (req, res): Promise<void> => {
  try {
    const id = req.params['id']
    const messages: object[] = []
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    if (account) {
      Object.values(account.data.data.chats).forEach((chat: any) => {
        messages.push(...chat.messages)
      })
      res.json({ messages: messages })
    } else {
      res.json({ error: 'No account for given id' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
