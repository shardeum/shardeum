import { network } from '@shardeum-foundation/core/dist/p2p/Context'
import { AccountType, NetworkAccount, NetworkParameters } from '../../../../../../src/shardeum/shardeumTypes'

/**
 * Factory function to create mock NetworkParameters.
 */
export function createMockNetworkParams(overrides: Partial<NetworkParameters> = {}): NetworkParameters {
  return {
    title: 'Test Network',
    description: 'Test Network Description',
    nodeRewardInterval: 100,
    nodeRewardAmountUsd: BigInt(100),
    nodePenaltyUsd: BigInt(500),
    stakeRequiredUsd: BigInt(5000),
    restakeCooldown: 100,
    maintenanceInterval: 100,
    maintenanceFee: 0,
    stabilityScaleMul: 1000,
    stabilityScaleDiv: 1000,
    minVersion: '1.0.0',
    activeVersion: '1.0.0',
    latestVersion: '1.0.0',
    archiver: {
      minVersion: '1.0.0',
      activeVersion: '1.0.0',
      latestVersion: '1.0.0',
    },
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
    stakeLockTime: 6000,
    chainID: 8082,
    ...overrides,
  }
}

/**
 * Factory function to create mock NetworkAccount.
 */
export function createMockNetworkAccount(overrides: Partial<NetworkAccount> = {}): NetworkAccount {
  const mockNetworkParams = createMockNetworkParams(overrides.current || {})

  return {
    type: 'network',
    id: network,
    hash: '0x0',
    timestamp: 1000,
    listOfChanges: [],
    next: {},
    current: mockNetworkParams,
    accountType: AccountType.NetworkAccount,
    mode: 'Release',
    ...overrides,
  } as NetworkAccount
}
