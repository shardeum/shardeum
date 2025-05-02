import {
  LeftNetworkEarlyViolationData,
  NodeRefutedViolationData,
  SyncingTimeoutViolationData,
  ViolationType,
} from '../../../../../../src/shardeum/shardeumTypes'

/**
 * Factory function to create mock violation data.
 * Accepts overrides to customize the violation data for specific test cases.
 */
export function createMockViolationData(
  violationType: ViolationType,
  overrides: Partial<LeftNetworkEarlyViolationData | NodeRefutedViolationData | SyncingTimeoutViolationData> = {}
): LeftNetworkEarlyViolationData | NodeRefutedViolationData | SyncingTimeoutViolationData {
  switch (violationType) {
    case ViolationType.LeftNetworkEarly:
      return {
        nodeDroppedTime: 1234567890,
        nodeLostCycle: 1,
        nodeDroppedCycle: 2,
        ...overrides,
      } as LeftNetworkEarlyViolationData

    case ViolationType.NodeRefuted:
      return {
        nodeRefutedTime: 1234567890,
        ...overrides,
      } as NodeRefutedViolationData

    case ViolationType.SyncingTooLong:
      return {
        nodeDroppedTime: 1234567890,
        ...overrides,
      } as SyncingTimeoutViolationData

    default:
      throw new Error(`Unknown violation type: ${violationType}`)
  }
}
