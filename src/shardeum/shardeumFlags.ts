/**
 * putting some compile time flags in here.
 * Likely to refactor these away in the future
 */
const NodeRewardENV = process.env.NodeReward ? (process.env.NodeReward === 'true' ? true : false) : null
export let contractStorageKeySilo = true // do we want to calcultate contract storage keys that are close to the CA account address?
export let temporaryParallelOldMode = false // Set of temporary hacks that allow running ShardeumState with some old logic.
export let globalCodeBytes = true
export let VerboseLogs = false //set this to false to reduce logging that can impact perf tests or demos
export let Virtual0Address = true
export let GlobalNetworkAccount = true
export let NodeReward = NodeRewardENV || true
export let SelfTest = false
export let ServicePointsPerSecond = 100 //service function points per second
export let SetupGenesisAccount = true
export let EVMReceiptsAsAccounts = true
export let ServicePoints = {
  ['debug-points']: 20,
  ['account/:address']: 5,
  ['contract/call']: { endpoint: 5, direct: 20 },
  ['tx/:hash']: 5,
}
export let DebugRestoreFile = '' //'accounts-by-ts.json'
