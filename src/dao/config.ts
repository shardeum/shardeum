import { ONE_MINUTE, ONE_SECOND, ONE_HOUR, ONE_DAY } from "../config";
import { NetworkParameters } from "./types";
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { toShardusAddress } from "../shardeum/evmAddress";
import { AccountType } from "../shardeum/shardeumTypes";

export interface DaoConfig {
    daoAccount: string,
    TIME_FOR_PROPOSALS: number,
    TIME_FOR_VOTING: number,
    TIME_FOR_GRACE: number,
    TIME_FOR_APPLY: number,
    TIME_FOR_DEV_PROPOSALS: number,
    TIME_FOR_DEV_VOTING: number,
    TIME_FOR_DEV_GRACE: number,
    TIME_FOR_DEV_APPLY: number,
    INITIAL_PARAMETERS: NetworkParameters,
}

export const daoAccount = toShardusAddress(ShardeumFlags.daoTargetAddress, AccountType.Account)

export const daoConfig: DaoConfig = {
  daoAccount,
  // dev settings
  TIME_FOR_PROPOSALS: ONE_MINUTE + ONE_SECOND * 30,
  TIME_FOR_VOTING: ONE_MINUTE + ONE_SECOND * 30,
  TIME_FOR_GRACE: ONE_MINUTE + ONE_SECOND * 30,
  TIME_FOR_APPLY: ONE_MINUTE + ONE_SECOND * 30,
  TIME_FOR_DEV_PROPOSALS: ONE_MINUTE + ONE_SECOND * 30,
  TIME_FOR_DEV_VOTING: ONE_MINUTE + ONE_SECOND * 30,
  TIME_FOR_DEV_GRACE: ONE_MINUTE + ONE_SECOND * 30,
  TIME_FOR_DEV_APPLY: ONE_MINUTE + ONE_SECOND * 30,

  // prod settings
  // TIME_FOR_PROPOSALS: ONE_DAY,
  // TIME_FOR_VOTING: 3 * ONE_DAY,
  // TIME_FOR_GRACE: ONE_DAY,
  // TIME_FOR_APPLY: 2 * ONE_DAY,
  // TIME_FOR_DEV_PROPOSALS: ONE_DAY,
  // TIME_FOR_DEV_VOTING: 3 * ONE_DAY,
  // TIME_FOR_DEV_GRACE: ONE_DAY,
  // TIME_FOR_DEV_APPLY: 2 * ONE_DAY,

  INITIAL_PARAMETERS: {
    title: 'Initial parameters',
    description: 'These are the initial network parameters liberdus started with',
    nodeRewardInterval: ONE_HOUR, //ONE_HOUR,
    nodeRewardAmount: 1,
    nodePenalty: 10,
    transactionFee: 0.001,
    stakeRequired: 5,
    maintenanceInterval: ONE_DAY,
    maintenanceFee: 0,
    proposalFee: 50,
    devProposalFee: 50,
    faucetAmount: 10,
    defaultToll: 1,
  }
}