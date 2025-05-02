import { PenaltyTX, ViolationType } from '../../../../../../src/shardeum/shardeumTypes'

/**
 * Factory function to create mock PenaltyTX.
 */
export function createMockPenaltyTX(overrides: Partial<PenaltyTX> = {}): PenaltyTX {
  return {
    reportedNodeId: 'mockNodeId',
    reportedNodePublickKey: 'mockPublicKey',
    operatorEVMAddress: 'mockNominatorAddress',
    timestamp: 1234567890,
    violationType: ViolationType.LeftNetworkEarly,
    violationData: {
      nodeDroppedTime: 1234567890,
      nodeLostCycle: 1,
    },
    isInternalTx: true,
    internalTXType: 'Penalty',
    ...overrides,
  } as PenaltyTX
}
