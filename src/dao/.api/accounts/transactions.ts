import { getShardusAPI } from '../../../index'

export const transactions = dapp => async (req, res): Promise<void> => {
  try {
    const id = req.params['id']
    const account = await getShardusAPI().getLocalOrRemoteAccount(id)
    res.json({ transactions: account && account.data.data.transactions })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
