import { getShardusAPI } from '../../../index'

export const account = dapp => async (req, res): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    res.json({ account: account && account.data })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
