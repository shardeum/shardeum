import { getShardusAPI } from '../../../index'

export default dapp => async (req, res): Promise<void> => {
  try {
    const { chatId } = req.params
    const chat = await getShardusAPI().getLocalOrRemoteAccount(chatId)
    if (!chat) {
      res.json({ error: "Chat doesn't exist" })
      return
    }
    if (!chat.data.messages) {
      res.json({ error: 'no chat history for this request' })
    } else {
      res.json({ messages: chat.data.messages })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
