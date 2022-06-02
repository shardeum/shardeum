/**
 * putting some compile time flags in here.
 * Likely to refactor these away in the future
 */
const NodeRewardENV = process.env.NodeReward ? (process.env.NodeReward === 'true' ? true : false) : null
export let contractStorageKeySilo = true // do we want to calcultate contract storage keys that are close to the CA account address?
export let temporaryParallelOldMode = false // Set of temporary hacks that allow running ShardeumState with some old logic. 
                                            // TODO retire this, it should always be false now
export let globalCodeBytes = false //do codebytes (contract code) use global accounts?
export let VerboseLogs = false //set this to false to reduce logging that can impact perf tests or demos
export let Virtual0Address = true
export let GlobalNetworkAccount = true
export let NodeReward = NodeRewardENV || true //false //
export let FirstNodeRewardCycle = 100
export let blockProductionRate = 6 // generate new block every 6s
export let maxNumberOfOldBlocks = 256
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
export let DebugRestoreFile = 'account-export.json' //'accounts-by-ts.json'
export let DebugRestoreArchiveBatch = 2000
// export let CheckNonceGreaterThan = false
export let forwardGenesisAccounts = false // To send accounts from consensor rather than pulling from archiver

export let UseDBForAccounts = true //Use Sql to store in memory accounts instead of simple accounts object map

export let AppliedTxsMaps = false //some maps that are not currently used, but may need to come back later. 
                                  //Even then may need to port them to sqllite.  Disabled for now because they 
                                  //leak memory

export let SaveEVMTries = false
