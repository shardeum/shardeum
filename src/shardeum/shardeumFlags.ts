/**
 * putting some compile time flags in here.
 * Likely to refactor these away in the future
 */
const NodeRewardENV = process.env.NodeReward ? (process.env.NodeReward === 'true' ? true : false) : null
export let contractStorageKeySilo = true // do we want to calcultate contract storage keys that are close to the CA account address?
// export let temporaryParallelOldMode = false // Set of temporary hacks that allow running ShardeumState with some old logic.
//                                             // TODO retire this, it should always be false now
export let globalCodeBytes = false //do codebytes (contract code) use global accounts?
export let VerboseLogs = false //set this to false to reduce logging that can impact perf tests or demos
export let Virtual0Address = true
export let GlobalNetworkAccount = true
export let NodeReward = false // NodeRewardENV || true //false //
export let FirstNodeRewardCycle = 100
export let blockProductionRate = 6 // generate new block every 6s
export let maxNumberOfOldBlocks = 256
export let SelfTest = false
export let ServicePointsPerSecond = 200 //service function points per second
export let SetupGenesisAccount = true
export let EVMReceiptsAsAccounts = false
export let ServicePoints = {
  ['debug-points']: 20,
  ['account/:address']: 5,
  ['contract/call']: { endpoint: 5, direct: 20 },
  ['contract/accesslist']: { endpoint: 5, direct: 20 },
  ['tx/:hash']: 5,
}
export let DebugRestoreFile = 'account-export.json' //'accounts-by-ts.json'
export let DebugRestoreArchiveBatch = 2000
export let CheckNonce = true
export let txNoncePreCheck = true
export let forwardGenesisAccounts = true // To send accounts from consensor rather than pulling from archiver

export let UseDBForAccounts = true //Use Sql to store in memory accounts instead of simple accounts object map

export let AppliedTxsMaps = false //some maps that are not currently used, but may need to come back later.
//Even then may need to port them to sqllite.  Disabled for now because they
//leak memory

export let SaveEVMTries = false

export let ChainID = process.env.CHAIN_ID || 8080 //Chain.Rinkeby   // The EVM chain ID.  used by CHAINID opcode.  may need Chain.Rinkeby (4)  for local testing

export let CheckpointRevertSupport = true

export let UseTXPreCrack = true

export let NewStorageIndex = true

export let UseBase64BufferEncoding = true

export let useAccountWrites = true

export let useShardeumVM = true

export let chargeConstantTxFee = true

export let constantTxFee = '1000000000000000000' // '10000000000000'//0.00001 SHM   //'1000000000000000000' // 1 SHM

export let devPublicKey = '774491f80f47fedb119bb861601490f42bc3ea3b57fc63906c0d08e6d777a592'
