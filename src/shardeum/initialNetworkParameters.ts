import { BN } from 'ethereumjs-util'
import { NetworkParameters } from './shardeumTypes'
import { ONE_HOUR, oneSHM, ONE_DAY } from './shardeumConstants'

// INITIAL NETWORK PARAMETERS FOR Shardeum

//It is important to follow the release guidelines when updating these parameters

export const initialNetworkParamters: NetworkParameters = {
  title: 'Initial parameters',
  description: 'These are the initial network parameters Shardeum started with',
  nodeRewardInterval: ONE_HOUR,
  nodeRewardAmountUsd: oneSHM.mul(new BN(1)),
  nodePenaltyUsd: oneSHM.mul(new BN(10)),
  stakeRequiredUsd: oneSHM.mul(new BN(10)),
  maintenanceInterval: ONE_DAY,
  maintenanceFee: 0,
  minVersion: '1.5.5',
  activeVersion: '1.5.5',
  latestVersion: '1.5.6',
  archiver: {
    minVersion: '3.3.5',
    activeVersion: '3.3.5',
    latestVersion: '3.3.5',
  },
  stabilityScaleMul: 1000,
  stabilityScaleDiv: 1000,
  txPause: false,
  certCycleDuration: 30,
}
