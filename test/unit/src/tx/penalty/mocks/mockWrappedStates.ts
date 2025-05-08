import {
  WrappedStates,
  NodeAccount2,
  NetworkAccount,
  WrappedEVMAccount,
} from '../../../../../../src/shardeum/shardeumTypes'

/**
 * Factory function to create mock WrappedStates dynamically.
 * Accepts dynamic inputs for keys and values to build the WrappedStates object.
 */
export function createMockWrappedStates(
  mockPublicKey: string,
  networkAccount: string,
  mockNodeAccount: NodeAccount2,
  mockNetworkAccount: NetworkAccount,
  mockOperatorAccount: WrappedEVMAccount,
  transactionUtils: any, // Pass transactionUtils for dynamic address generation
  mockStateId = 'mockStateId',
  mockTimestamp = 1234567890
): WrappedStates {
  return {
    [mockPublicKey]: {
      accountId: mockPublicKey,
      stateId: mockStateId,
      timestamp: mockTimestamp,
      data: mockNodeAccount,
    },
    [networkAccount]: {
      accountId: networkAccount,
      stateId: mockStateId,
      timestamp: mockTimestamp,
      data: mockNetworkAccount,
    },
    [transactionUtils.toShardusAddress(mockOperatorAccount.ethAddress, mockOperatorAccount.accountType)]: {
      accountId: transactionUtils.toShardusAddress(mockOperatorAccount.ethAddress, mockOperatorAccount.accountType),
      stateId: mockStateId,
      timestamp: mockTimestamp,
      data: mockOperatorAccount,
    },
  }
}
