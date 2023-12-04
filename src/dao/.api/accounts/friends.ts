import { getShardusAPI } from '../../../index'

export const friends = dapp => async (req, res): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    if (account) {
      res.json({ friends: account.data.data.friends })
    } else {
      res.json({ error: 'No account for given id' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
