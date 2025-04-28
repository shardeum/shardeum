import { BN } from 'ethereumjs-util'
import { NetworkParameters } from './shardeumTypes'
import { ONE_HOUR, oneSHM, ONE_DAY, THIRTY_MINUTES } from './shardeumConstants'
import { ShardeumFlags } from './shardeumFlags'

// INITIAL NETWORK PARAMETERS FOR Shardeum

//It is important to follow the release guidelines when updating these parameters

export const initialNetworkParamters: NetworkParameters = {
  title: 'Initial parameters',
  description: 'These are the initial network parameters Shardeum started with',
  nodeRewardInterval: ONE_HOUR,
  nodeRewardAmountUsd: oneSHM,
  nodePenaltyUsd: oneSHM * BigInt(10),
  stakeRequiredUsd: oneSHM * BigInt(10),
  restakeCooldown: THIRTY_MINUTES,
  maintenanceInterval: ONE_DAY,
  maintenanceFee: 0,
  minVersion: '1.18.0-prerelease.0',
  activeVersion: '1.18.0-prerelease.0',
  latestVersion: '1.18.1',
  archiver: {
    minVersion: '3.6.0-prerelease.0',
    activeVersion: '3.6.0-prerelease.0',
    latestVersion: '3.6.0',
  },
  stabilityScaleMul: 1000,
  stabilityScaleDiv: 1000,
  txPause: false,
  certCycleDuration: 30,
  enableNodeSlashing: false,
  qa: {
    qaTestNumber: 0,
    qaTestBoolean: false,
    qaTestPercent: 0,
    qaTestSemver: '0.0.0',
  },
  slashing: {
    enableLeftNetworkEarlySlashing: false,
    enableSyncTimeoutSlashing: false,
    enableNodeRefutedSlashing: false,
    leftNetworkEarlyPenaltyPercent: 0.2,
    syncTimeoutPenaltyPercent: 0.2,
    nodeRefutedPenaltyPercent: 0.2,
  },
  enableRPCEndpoints: false,
  stakeLockTime: 1000 * 60 * 60 * 24 * 14, // 1000 ms * 60s * 60m * 24h * 14d = 2 weeks in ms
  chainID: ShardeumFlags.ChainID, // 8082
}
