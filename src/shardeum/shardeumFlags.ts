import { DecimalString } from "./shardeumTypes"

interface ShardeumFlags {
  contractStorageKeySilo: boolean
  globalCodeBytes: boolean
  VerboseLogs: boolean
  Virtual0Address: boolean
  GlobalNetworkAccount: boolean
  NodeReward: boolean
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
  constantTxFee: DecimalString // '10000000000000'//0.00001 SHM   //'1000000000000000000' // 1 SHM
  devPublicKey: string
  stakeTargetAddress: string
  stakeAmount: DecimalString // stake amount in wei
  cacheMaxCycleAge: number
  cacheMaxItemPerTopic: number
  generateMemoryPatternData: boolean
  StakingEnabled: boolean
  MinStakeCertSig: number
  FullCertChecksEnabled: boolean // do we run all of the cert checks when signing.  This config may go away soon after testing.
}

const NodeRewardENV = process.env.NodeReward ? (process.env.NodeReward === 'true' ? true : false) : null

export let ShardeumFlags: ShardeumFlags = {
  contractStorageKeySilo: true,
  globalCodeBytes: false,
  VerboseLogs: true,
  Virtual0Address: true,
  GlobalNetworkAccount: true,
  NodeReward: false,
  FirstNodeRewardCycle: 100,
  blockProductionRate: 6,
  maxNumberOfOldBlocks: 256,
  SelfTest: false,
  ServicePointsPerSecond: 200,
  SetupGenesisAccount: true,
  EVMReceiptsAsAccounts: false,
  DebugRestoreFile: 'account-export.json',
  DebugRestoreArchiveBatch: 2000,
  CheckNonce: true,
  txNoncePreCheck: true,
  txBalancePreCheck: false,
  autoGenerateAccessList: true,
  forwardGenesisAccounts: true,
  UseDBForAccounts: true,
  AppliedTxsMaps: false,
  SaveEVMTries: false,
  ChainID: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 8081,
  CheckpointRevertSupport: true,
  UseTXPreCrack: true,
  NewStorageIndex: true,
  UseBase64BufferEncoding: true,
  useAccountWrites: true,
  useShardeumVM: true,
  chargeConstantTxFee: true,
  constantTxFee: '10000000000000', // '10000000000000'//0.00001 SHM   //'1000000000000000000' // 1 SHM
  devPublicKey: '774491f80f47fedb119bb861601490f42bc3ea3b57fc63906c0d08e6d777a592',
  stakeTargetAddress: '0x0000000000000000000000000000000000000001',
  stakeAmount: '5000000000000000000', // 5 SHM
  cacheMaxCycleAge: 5,
  cacheMaxItemPerTopic: 4500,
  ServicePoints: {
    ['debug-points']: 20,
    ['account/:address']: 5,
    ['contract/call']: { endpoint: 5, direct: 20 },
    ['contract/accesslist']: { endpoint: 5, direct: 20 },
    ['tx/:hash']: 5,
  },
  generateMemoryPatternData: true,
  StakingEnabled: true,
  MinStakeCertSig: 1, // this is the minimum amount of signature required for stake certification. will move to network param in future.
  FullCertChecksEnabled: true,
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
