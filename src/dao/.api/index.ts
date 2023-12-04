import network from './network'
import issues from './issues'
import proposals from './proposals'
import accounts from './accounts'
import messages from './messages'

export default (dapp: any): void => { // to-do: type the dapp
  dapp.registerExternalGet('dao/network/parameters', network.current(dapp))
  dapp.registerExternalGet('dao/network/parameters/next', network.next(dapp))
  dapp.registerExternalGet('dao/network/windows/all', network.windows_all(dapp))
  dapp.registerExternalGet('dao/network/windows', network.windows(dapp))
  dapp.registerExternalGet('dao/network/windows/dev', network.windows_dev(dapp))

  dapp.registerExternalGet('dao/issues', issues.all(dapp))
  dapp.registerExternalGet('dao/issues/latest', issues.latest(dapp))
  dapp.registerExternalGet('dao/issues/count', issues.count(dapp))
  dapp.registerExternalGet('dao/issues/dev', issues.dev_all(dapp))
  dapp.registerExternalGet('dao/issues/dev/latest', issues.dev_latest(dapp))
  dapp.registerExternalGet('dao/issues/dev/count', issues.dev_count(dapp))

  dapp.registerExternalGet('dao/proposals', proposals.all(dapp))
  dapp.registerExternalGet('dao/proposals/latest', proposals.latest(dapp))
  dapp.registerExternalGet('dao/proposals/count', proposals.count(dapp))
  dapp.registerExternalGet('dao/proposals/dev', proposals.dev_all(dapp))
  dapp.registerExternalGet('dao/proposals/dev/latest', proposals.dev_latest(dapp))
  dapp.registerExternalGet('dao/proposals/dev/count', proposals.dev_count(dapp))

  dapp.registerExternalGet('dao/account/:id', accounts.account(dapp))
  dapp.registerExternalGet('dao/account/:id/alias', accounts.alias(dapp))
  dapp.registerExternalGet('dao/account/:id/transactions', accounts.transactions(dapp))
  dapp.registerExternalGet('dao/account/:id/balance', accounts.balance(dapp))
  dapp.registerExternalGet('dao/account/:id/toll', accounts.toll(dapp))
  dapp.registerExternalGet('dao/address/:name', accounts.address(dapp))
  dapp.registerExternalGet('dao/account/:id/:friendId/toll', accounts.tollOfFriend(dapp))
  dapp.registerExternalGet('dao/account/:id/friends', accounts.friends(dapp))
  dapp.registerExternalGet('dao/account/:id/recentMessages', accounts.recentMessages(dapp))
  // dapp.registerExternalGet('dao/accounts', accounts.all(dapp))

  dapp.registerExternalGet('dao/messages/:chatId', messages(dapp))
}
