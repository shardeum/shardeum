import { getShardusAPI } from '../../../index'

export const address = dapp => async (req, res): Promise<void> => {
  try {
    const name = req.params['name']
    const account = await getShardusAPI().getLocalOrRemoteAccount(name)
    if (account && account.data) {
      // to-do: type of account and account.data
      res.json({ address: account.data.address })
    } else {
      res.json({ error: 'No account exists for the given handle' })
    }
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}
