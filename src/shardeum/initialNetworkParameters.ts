import { BN } from 'ethereumjs-util'
import { NetworkParameters } from './shardeumTypes'
import { ONE_HOUR, oneSHM, ONE_DAY } from './shardeumConstants'

// INITIAL NETWORK PARAMETERS FOR Shardeum

//It is important to follow the release guidelines when updating these parameters

export const initialNetworkParamters: NetworkParameters = {
  title: 'Initial parameters',
  description: 'These are the initial network parameters Shardeum started with',
  nodeRewardInterval: ONE_HOUR,
  nodeRewardAmountUsd: oneSHM,
  nodePenaltyUsd: oneSHM * BigInt(10),
  stakeRequiredUsd: oneSHM * BigInt(10),
  maintenanceInterval: ONE_DAY,
  maintenanceFee: 0,
  minVersion: '1.12.1',
  activeVersion: '1.12.1',
  latestVersion: '1.12.1',
  archiver: {
    minVersion: '3.4.23',
    activeVersion: '3.4.23',
    latestVersion: '3.4.23',
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
  }
}
