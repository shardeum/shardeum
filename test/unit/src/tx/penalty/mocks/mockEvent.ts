import { ShardusTypes } from '@shardeum-foundation/core'

/**
 * Factory function to create mock ShardusEvent data.
 * Accepts overrides to customize the event data for specific test cases.
 */
export function createMockEventData(overrides: Partial<ShardusTypes.ShardusEvent> = {}): ShardusTypes.ShardusEvent {
  const { type = 'node-left-early' } = overrides // Default to 'node-left-early' if type is not provided

  let defaultEventData: Partial<ShardusTypes.ShardusEvent>

  switch (type) {
    case 'node-left-early':
      defaultEventData = {
        type: 'node-left-early',
        nodeId: 'mockNodeId',
        publicKey: 'mockPublicKey',
        time: 1234567890,
        reason: 'Node left the network early',
        cycleNumber: 2,
      }
      break

    case 'node-refuted':
      defaultEventData = {
        type: 'node-refuted',
        nodeId: 'mockNodeId',
        publicKey: 'mockPublicKey',
        time: 1234567890,
        reason: 'Node was refuted',
        cycleNumber: 3,
      }
      break

    case 'node-sync-timeout':
      defaultEventData = {
        type: 'node-sync-timeout',
        nodeId: 'mockNodeId',
        publicKey: 'mockPublicKey',
        time: 1234567890,
        reason: 'Node took too long to sync',
        cycleNumber: 4,
      }
      break

    default:
      defaultEventData = {
        type: 'node-left-early',
        nodeId: 'mockNodeId',
        publicKey: 'mockPublicKey',
        time: 1234567890,
        reason: 'Node left the network early',
        cycleNumber: 2,
      }
      break
  }

  // Merge the default event data with any overrides
  return {
    ...defaultEventData,
    ...overrides,
  } as ShardusTypes.ShardusEvent
}
