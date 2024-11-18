import { BN } from 'ethereumjs-util'
import { NetworkParameters } from './shardeumTypes'
import { ONE_HOUR, oneSHM, ONE_DAY, THIRTY_MINUTES } from './shardeumConstants'

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
  minVersion: '1.15.3',
  activeVersion: '1.15.3',
  latestVersion: '1.15.3',
  archiver: {
    minVersion: '3.5.6',
    activeVersion: '3.5.6',
    latestVersion: '3.5.6',
  },
  stabilityScaleMul: 1000,
  stabilityScaleDiv: 1000,
  txPause: false,
  certCycleDuration: 30,
  enableNodeSlashing: false,
  slashing: {
    enableLeftNetworkEarlySlashing: false,
    enableSyncTimeoutSlashing: false,
    enableNodeRefutedSlashing: false,
    leftNetworkEarlyPenaltyPercent: 0.2,
    syncTimeoutPenaltyPercent: 0.2,
    nodeRefutedPenaltyPercent: 0.2,
  },
  enableRPCEndpoints: false,
}
