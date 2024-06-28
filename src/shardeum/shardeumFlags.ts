import { DecimalString } from './shardeumTypes'

interface ShardeumFlags {
  contractStorageKeySilo: boolean
  contractStoragePrefixBitLength: number
  contractCodeKeySilo: boolean
  globalCodeBytes: boolean
  VerboseLogs: boolean
  debugTraceLogs: boolean
  Virtual0Address: boolean
  GlobalNetworkAccount: boolean
  FirstNodeRewardCycle: number
  blockProductionRate: number // generate new block every 6s
  initialBlockNumber: number // The initial block number to start the chain at.
  maxNumberOfOldBlocks: number
  SelfTest: boolean
  ServicePointsPerSecond: number //service function points per second
  SetupGenesisAccount: boolean
  EVMReceiptsAsAccounts: boolean
  ServicePoints: {
    ['debug-points']: number
    ['account/:address']: number
    ['contract/call']: {
      endpoint: number
      direct: number
    }
    ['contract/accesslist']: {
      endpoint: number
      direct: number
    }
    ['contract/estimateGas']: {
      endpoint: number
      direct: number
    }
    ['tx/:hash']: number
  }
  DebugRestoreFile: string //'accounts-by-ts.json'
  DebugRestoreArchiveBatch: number
  CheckNonce: boolean
  txNoncePreCheck: boolean
  txBalancePreCheck: boolean
  autoGenerateAccessList: boolean
  forwardGenesisAccounts: boolean // To send accounts from consensor rather than pulling from archiver
  UseDBForAccounts: boolean //Use Sql to store in memory accounts instead of simple accounts object map
  AppliedTxsMaps: boolean
  SaveEVMTries: boolean //deprecated.  this was an old option to save evm tries
  ChainID: number // The EVM chain ID.  used by CHAINID opcode.
  CheckpointRevertSupport: boolean
  UseTXPreCrack: boolean
  NewStorageIndex: boolean
  UseBase64BufferEncoding: boolean
  useAccountWrites: boolean
  useShardeumVM: boolean
  chargeConstantTxFee: boolean
  constantTxFeeUsd: DecimalString
  stakeTargetAddress: string
  certCycleDuration: number
  cacheMaxCycleAge: number
  cacheMaxItemPerTopic: number
  generateMemoryPatternData: boolean
  StakingEnabled: boolean
  ModeEnabled: boolean
  AdminCertEnabled: boolean //it appears this must be true for a node to use a non golden ticket admin cert. raising a question on this
  minActiveNodesForStaking: number
  MinStakeCertSig: number
  FullCertChecksEnabled: boolean // do we run all of the cert checks when signing.  This config may go away soon after testing.
  extraTxTime: number
  minNodesEVMtx: number
  checkNodesEVMtx: boolean
  allowForceUnstake: boolean
  ClaimRewardRetryCount: number
  shardeumTimeout: number
  FailedTxLinearBackOffConstantInSecs: number
  fixExtraStakeLessThanMin: boolean
  unstakeCertCheckFix: boolean
  fixCertExpRenew: boolean
  rewardedFalseInInitRewardTx: boolean
  supportInternalTxReceipt: boolean
  totalUnstakeAmount: boolean
  txHashingFix: boolean
  addInternalTxReceiptAccount: boolean
  fixSetCertTimeTxApply: boolean
  logServicePointSenders: boolean
  labTest: boolean
  fixContractBytes: boolean
  setCertTimeDurationOverride: boolean
  fixCertExpTiming: boolean
  shardeumVMPrecompiledFix: boolean
  baselineTxGasUsage: string
  baselineTxFee: string
  lowStakePercent: number
  removeTokenBalanceCache: boolean
  enableNodeSlashing: boolean
  penaltyPercent: number
  receiptLogIndexFix: boolean
  blockedAtVerbose: boolean
  accesslistNonceFix: boolean
  nonceCheckRange: number
  looseNonceCheck: boolean
  exactNonceCheck: boolean
  supportEstimateGas: boolean
  startInServiceMode: boolean
  allowedEndpointsInServiceMode: string[]
  enableRIAccountsCache: boolean
  riAccountsCacheSize: number
  riAccountsDeleteBatchSize: number
  numberOfNodesToInjectPenaltyTx: number
  enableLeftNetworkEarlySlashing: boolean
  enableSyncTimeoutSlashing: boolean
  enableNodeRefutedSlashing: boolean
  loadGenesisNodeNetworkConfigToNetworkAccount: boolean
  networkAccountCacheDuration: number
  enableClaimRewardAdminCert: boolean
  debugLocalAALG: boolean //run the AALG on this node to make it easier to debug in a large network
  tryGetRemoteAccountCB_OnlyErrorsLoop: boolean
  expiredTransactionStateFix: boolean
  startInArchiveMode: boolean
  collectorUrl: string
  aalgWarmupSleep: number
  internalTxTimestampFix: boolean
  debugExtraNonceLookup: boolean
  cleanStaleShardeumStateMap: boolean
  beta1_11_2: boolean
}

export const ShardeumFlags: ShardeumFlags = {
  contractStorageKeySilo: true,
  contractStoragePrefixBitLength: 3,
  contractCodeKeySilo: false,
  globalCodeBytes: false,
  VerboseLogs: false,
  debugTraceLogs: false,
  Virtual0Address: true,
  GlobalNetworkAccount: true,
  FirstNodeRewardCycle: 100,
  blockProductionRate: 6,
  initialBlockNumber: 0,
  maxNumberOfOldBlocks: 256,
  SelfTest: false,
  SetupGenesisAccount: true,
  EVMReceiptsAsAccounts: false,
  DebugRestoreFile: 'account-export.json',
  DebugRestoreArchiveBatch: 2000,
  CheckNonce: true,
  txNoncePreCheck: false,
  txBalancePreCheck: true,
  autoGenerateAccessList: true,
  forwardGenesisAccounts: true,
  UseDBForAccounts: true,
  AppliedTxsMaps: false,
  SaveEVMTries: false,
  ChainID: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 8082,
  CheckpointRevertSupport: true,
  UseTXPreCrack: true,
  NewStorageIndex: true,
  UseBase64BufferEncoding: true,
  useAccountWrites: true,
  useShardeumVM: true,

  // '10000000000000'// $0.00001 * 10 ^ 18
  // '1000000000000000'// $0.001 * 10 ^ 18
  // '10000000000000000'// $0.01 * 10 ^ 18
  // '1000000000000000000' // $1 * 10 ^ 18
  constantTxFeeUsd: '10000000000000000', // $0.01 * 10 ^ 18
  stakeTargetAddress: '0x0000000000000000000000000000000000010000',
  certCycleDuration: 10,
  cacheMaxCycleAge: 5,
  cacheMaxItemPerTopic: 4500,
  ServicePointsPerSecond: 200,
  ServicePoints: {
    ['debug-points']: 20,
    ['account/:address']: 5,
    ['contract/call']: { endpoint: 5, direct: 20 },
    ['contract/accesslist']: { endpoint: 5, direct: 20 },
    ['contract/estimateGas']: { endpoint: 5, direct: 20 },
    ['tx/:hash']: 5,
  },
  generateMemoryPatternData: true,
  StakingEnabled: true,
  ModeEnabled: true,
  AdminCertEnabled: false,
  minActiveNodesForStaking: 5,
  MinStakeCertSig: 1, // this is the minimum amount of signature required for stake certification. will move to network param in future.
  FullCertChecksEnabled: true,
  extraTxTime: 8, // This is to predict the cycleNumber from the tx timestamp + 8s
  minNodesEVMtx: 5,
  ClaimRewardRetryCount: 20,
  shardeumTimeout: 50000,
  FailedTxLinearBackOffConstantInSecs: 30,
  logServicePointSenders: false,
  labTest: false,
  lowStakePercent: 0.2,
  blockedAtVerbose: false,
  enableRIAccountsCache: true,
  riAccountsCacheSize: 10000,
  riAccountsDeleteBatchSize: 500,

  // 1.1.3 migration
  fixExtraStakeLessThanMin: true,
  checkNodesEVMtx: true,
  allowForceUnstake: true,
  unstakeCertCheckFix: true,
  rewardedFalseInInitRewardTx: true,
  fixCertExpRenew: true,
  supportInternalTxReceipt: true,
  totalUnstakeAmount: true,
  txHashingFix: true,
  addInternalTxReceiptAccount: true, // This setting is not part of 1.1.3 migration

  // 1.1.6 migration
  fixSetCertTimeTxApply: true,

  // 1.1.8 migration
  setCertTimeDurationOverride: true,

  // 1.2.3 migration
  fixContractBytes: true,
  fixCertExpTiming: true,
  shardeumVMPrecompiledFix: true, // This setting is not part of 1.2.3 migration

  // 1.3.1 migration
  chargeConstantTxFee: false, //true is the old way.  and false is to activate the variable TXs

  // These two setting is not part of 1.3.1 migration
  baselineTxGasUsage: '36655',
  baselineTxFee: '10000000000000000', // $0.01 * 10 ^ 18

  // 1.4.1 migration
  removeTokenBalanceCache: true,
  enableNodeSlashing: true,

  //  This setting is not part of 1.4.1 migration
  penaltyPercent: 0.2, //this is just a setting and does not need to be adjusted for migration

  // 1.5.2 migration
  receiptLogIndexFix: true,

  // 1.5.4 migration
  accesslistNonceFix: true,

  // 1.5.5 migration
  nonceCheckRange: 3, //  This setting is not part of 1.5.5 migration
  looseNonceCheck: false,
  exactNonceCheck: true,

  // 1.5.7 migration
  supportEstimateGas: true,

  startInServiceMode: false,
  allowedEndpointsInServiceMode: [
    'POST /contract/estimateGas',
    'POST /contract/call',
    'POST /contract/accesslist',
    'GET /eth_gasPrice',
    'GET /account/*',
    'GET /eth_getCode',
  ],

  numberOfNodesToInjectPenaltyTx: 5,
  enableLeftNetworkEarlySlashing: false,
  enableSyncTimeoutSlashing: false,
  enableNodeRefutedSlashing: false,
  loadGenesisNodeNetworkConfigToNetworkAccount: false,
  networkAccountCacheDuration: 3600, // 60 minutes
  enableClaimRewardAdminCert: true,
  debugLocalAALG: false,
  tryGetRemoteAccountCB_OnlyErrorsLoop: true,
  expiredTransactionStateFix: false,
  startInArchiveMode: false,
  collectorUrl: 'http://0.0.0.0:6001',

  aalgWarmupSleep: 100,

  internalTxTimestampFix: true,

  debugExtraNonceLookup: false,

  //1.1.2 migration
  cleanStaleShardeumStateMap: false,
  beta1_11_2: true,
}

export function updateShardeumFlag(key: string, value: string | number | boolean): void {
  /* eslint-disable security/detect-object-injection */
  try {
    if (ShardeumFlags[key] == null) {
      console.log(`There is no shardeum flag for ${key}`)
      return
    }
    if (key === 'ServicePoints') return
    if (typeof ShardeumFlags[key] !== typeof value) {
      console.log(`Type of new value is different from the type of existing flag ${key}`)
      return
    }
    ShardeumFlags[key] = value
    console.log(`Shardeum flag ${key} is set to ${value}`)
  } catch (e) {
    console.log(`Error: updateShardeumFlag`, e)
  }
  /* eslint-enable security/detect-object-injection */
}

export function updateServicePoints(key1: string, key2: string, value: number): void {
  try {
    /* eslint-disable security/detect-object-injection */
    if (!ShardeumFlags['ServicePoints'][key1]) return
    if (typeof value !== 'number') {
      console.log(`Type of new service point value is not a number`)
      return
    }
    if (key1 && ShardeumFlags['ServicePoints'][key1] == null) {
      console.log(`updateServicePoint: ${key1} is not a valid key`)
      return
    }
    if (key1 && key2 && ShardeumFlags['ServicePoints'][key1][key2] == null) {
      console.log(`updateServicePoint: ${key2} is not a valid key`)
      return
    }

    if (key1 && key2) ShardeumFlags['ServicePoints'][key1][key2] = value
    else if (key1) ShardeumFlags['ServicePoints'][key1] = value

    console.log(`Shardeum service point is updated`, ShardeumFlags['ServicePoints'][key1])
  } catch (e) {
    console.log(`Error: updateServicePoints`, e)
  }
  /* eslint-enable security/detect-object-injection */
}

export const enum FilePaths {
  SHARDEUM_DB = 'db/shardeum.sqlite',
  DB = 'db.sqlite',
  HISTORY_DB = 'history.sqlite',
  ACCOUNT_EXPORT = 'account-export.json',
  CONFIG = 'config.json',
  CLI_PACKAGE = '/home/node/app/cli/package.json',
  GUI_PACKAGE = '/home/node/app/gui/package.json',
}
