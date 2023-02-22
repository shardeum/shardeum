import { DecimalString } from './shardeumTypes'

interface ShardeumFlags {
  contractStorageKeySilo: boolean
  globalCodeBytes: boolean
  VerboseLogs: boolean
  Virtual0Address: boolean
  GlobalNetworkAccount: boolean
  FirstNodeRewardCycle: number
  blockProductionRate: number // generate new block every 6s
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
  SaveEVMTries: boolean
  ChainID: number // The EVM chain ID.  used by CHAINID opcode.
  CheckpointRevertSupport: boolean
  UseTXPreCrack: boolean
  NewStorageIndex: boolean
  UseBase64BufferEncoding: boolean
  useAccountWrites: boolean
  useShardeumVM: boolean
  chargeConstantTxFee: boolean
  constantTxFeeUsd: DecimalString
  devPublicKey: string
  stakeTargetAddress: string
  certCycleDuration: number
  cacheMaxCycleAge: number
  cacheMaxItemPerTopic: number
  generateMemoryPatternData: boolean
  StakingEnabled: boolean
  minActiveNodesForStaking: number
  MinStakeCertSig: number
  FullCertChecksEnabled: boolean // do we run all of the cert checks when signing.  This config may go away soon after testing.
  extraTxTime: number
  ClaimRewardRetryCount: number
}

export let ShardeumFlags: ShardeumFlags = {
  contractStorageKeySilo: true,
  globalCodeBytes: false,
  VerboseLogs: false,
  Virtual0Address: true,
  GlobalNetworkAccount: true,
  FirstNodeRewardCycle: 100,
  blockProductionRate: 6,
  maxNumberOfOldBlocks: 256,
  SelfTest: false,
  SetupGenesisAccount: true,
  EVMReceiptsAsAccounts: false,
  DebugRestoreFile: 'account-export.json',
  DebugRestoreArchiveBatch: 2000,
  CheckNonce: true,
  txNoncePreCheck: true,
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
  chargeConstantTxFee: true,
  // '10000000000000'// $0.00001 * 10 ^ 18
  // '1000000000000000'// $0.001 * 10 ^ 18
  // '10000000000000000'// $0.01 * 10 ^ 18
  // '1000000000000000000' // $1 * 10 ^ 18
  constantTxFeeUsd: '10000000000000000', // $0.01 * 10 ^ 18
  devPublicKey: '774491f80f47fedb119bb861601490f42bc3ea3b57fc63906c0d08e6d777a592',
  stakeTargetAddress: '0x0000000000000000000000000000000000000001',
  certCycleDuration: 10,
  cacheMaxCycleAge: 5,
  cacheMaxItemPerTopic: 4500,
  ServicePointsPerSecond: 200,
  ServicePoints: {
    ['debug-points']: 20,
    ['account/:address']: 5,
    ['contract/call']: { endpoint: 5, direct: 20 },
    ['contract/accesslist']: { endpoint: 5, direct: 20 },
    ['tx/:hash']: 5,
  },
  generateMemoryPatternData: true,
  StakingEnabled: true,
  minActiveNodesForStaking: 5,
  MinStakeCertSig: 1, // this is the minimum amount of signature required for stake certification. will move to network param in future.
  FullCertChecksEnabled: true,
  extraTxTime: 8, // This is to predict the cycleNumber from the tx timestamp + 8s
  ClaimRewardRetryCount: 2,
}

export function updateShardeumFlag(key: string, value: any) {
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
}

export function updateServicePoints(key1: string, key2: string, value: number) {
  try {
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
}
