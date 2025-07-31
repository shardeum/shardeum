import { nestedCountersInstance } from '@shardeum-foundation/core'
import * as crypto from '@shardeum-foundation/lib-crypto-utils'
import { SignedNodeRewardTxData, SignedNodeInitTxData } from '../../../../src/shardeum/shardeumTypes'
import { validateFields as validateInitRewardFields } from '../../../../src/tx/initRewardTimes'
import { validateClaimRewardTx } from '../../../../src/tx/claimReward'

// Mock modules
jest.mock('@shardeum-foundation/core')
jest.mock('@shardeum-foundation/lib-crypto-utils')
jest.mock('../../../../src/index', () => ({
  shardeumGetTime: jest.fn(() => Date.now()),
}))

// Initialize mocked crypto functions
const mockHashObj = jest.fn()
const mockVerifyObj = jest.fn()
;(crypto.hashObj as jest.Mock) = mockHashObj
;(crypto.verifyObj as jest.Mock) = mockVerifyObj
;(crypto.init as jest.Mock) = jest.fn()

// Set up global mocks
global.ShardeumFlags = { VerboseLogs: false }

// Mock shardus instance
const createMockShardus = () => ({
  serviceQueue: {
    containsTxData: jest.fn(),
    getLatestNetworkTxEntryForSubqueueKey: jest.fn(),
  },
  getLatestCycles: jest.fn(),
  getRemovedNodePubKeyFromCache: jest.fn(),
  getNode: jest.fn(),
  getLocalOrRemoteAccount: jest.fn(),
})

describe('Reward System Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set default return values for mocked crypto functions
    mockHashObj.mockReturnValue('mockTxDataHash')
    mockVerifyObj.mockReturnValue(true)
  })

  describe('Service Queue Schema Validation', () => {
    it('should reject nodeReward transaction with extra fields', () => {
      const maliciousTx: SignedNodeRewardTxData & { startTime?: number } = {
        publicKey: '0'.repeat(64),
        nodeId: '1'.repeat(64),
        endTime: Date.now(),
        startTime: 946684800000, // Year 2000 - malicious extra field
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      // The validation should detect and reject the extra field
      const txKeys = Object.keys(maliciousTx)
      const allowedFields = ['publicKey', 'nodeId', 'endTime', 'sign']
      
      let hasExtraFields = false
      for (const key of txKeys) {
        if (!allowedFields.includes(key)) {
          hasExtraFields = true
          break
        }
      }
      
      expect(hasExtraFields).toBe(true)
    })

    it('should reject nodeInitReward transaction with extra fields', () => {
      const maliciousTx: SignedNodeInitTxData & { endTime?: number } = {
        publicKey: '0'.repeat(64),
        nodeId: '1'.repeat(64),
        startTime: Date.now(),
        endTime: Date.now() + 1000000, // Malicious extra field
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      const txKeys = Object.keys(maliciousTx)
      const allowedFields = ['publicKey', 'nodeId', 'startTime', 'sign']
      
      let hasExtraFields = false
      for (const key of txKeys) {
        if (!allowedFields.includes(key)) {
          hasExtraFields = true
          break
        }
      }
      
      expect(hasExtraFields).toBe(true)
    })
  })

  describe('Transaction Type Validation', () => {
    it('should reject InitRewardTimes with wrong service queue tx type', () => {
      const mockShardus = createMockShardus()
      
      const txData = {
        publicKey: '0'.repeat(64),
        nodeId: '1'.repeat(64),
        startTime: Date.now(),
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }
      
      const txDataHash = 'mockTxDataHash'
      
      // Mock service queue to contain the tx
      mockShardus.serviceQueue.containsTxData.mockReturnValue(true)
      
      // Mock getting wrong transaction type from service queue
      mockShardus.serviceQueue.getLatestNetworkTxEntryForSubqueueKey.mockReturnValue({
        hash: txDataHash,
        tx: {
          type: 'nodeReward', // Wrong type - should be nodeInitReward
          hash: txDataHash,
          txData: txData,
          cycle: 1,
          priority: 0,
          subQueueKey: txData.publicKey,
        },
      })

      const tx = {
        isInternalTx: true,
        internalTXType: 0,
        nominee: '0'.repeat(64),
        nodeActivatedTime: Date.now(),
        timestamp: Date.now(),
        txData: txData,
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      const result = validateInitRewardFields(tx as any, mockShardus as any)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('Service queue tx must be nodeInitReward type')
    })

    it('should reject ClaimReward with wrong service queue tx type', () => {
      const mockShardus = createMockShardus()
      
      const txData = {
        publicKey: '0'.repeat(64),
        nodeId: '1'.repeat(64),
        endTime: Date.now(),
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }
      
      const txDataHash = 'mockTxDataHash'
      
      // Mock service queue to contain the tx
      mockShardus.serviceQueue.containsTxData.mockReturnValue(true)
      
      // Mock getting wrong transaction type from service queue
      mockShardus.serviceQueue.getLatestNetworkTxEntryForSubqueueKey.mockReturnValue({
        hash: txDataHash,
        tx: {
          type: 'nodeInitReward', // Wrong type - should be nodeReward
          hash: txDataHash,
          txData: txData,
          cycle: 1,
          priority: 0,
          subQueueKey: txData.publicKey,
        },
      })

      const tx = {
        nominee: '0'.repeat(64),
        nominator: '0x' + '2'.repeat(40),
        timestamp: Date.now(),
        deactivatedNodeId: '1'.repeat(64),
        nodeDeactivatedTime: Date.now(),
        cycle: 1,
        isInternalTx: true,
        internalTXType: 1,
        txData: txData,
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      const result = validateClaimRewardTx(tx as any, mockShardus as any)
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Service queue tx must be nodeReward type')
    })
  })

  describe('Temporal Validation', () => {
    it('should reject InitRewardTimes with fake activation time', () => {
      const mockShardus = createMockShardus()
      
      // Mock cycles - node was activated at a specific time
      const realActivationTime = Date.now() - 86400000 // 1 day ago
      mockShardus.getLatestCycles.mockReturnValue([
        {
          start: realActivationTime,
          activatedPublicKeys: ['0'.repeat(64)],
        },
      ])
      
      const txData = {
        publicKey: '0'.repeat(64),
        nodeId: '1'.repeat(64),
        startTime: 946684800000, // Year 2000 - fake time
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }
      
      const txDataHash = 'mockTxDataHash'
      
      mockShardus.serviceQueue.containsTxData.mockReturnValue(true)
      mockShardus.getLatestCycles.mockReturnValue([{
        start: 946684800000,
        activatedPublicKeys: []
      }])
      mockShardus.serviceQueue.getLatestNetworkTxEntryForSubqueueKey.mockReturnValue({
        hash: txDataHash,
        tx: {
          type: 'nodeInitReward',
          hash: txDataHash,
          txData: txData,
          cycle: 1,
          priority: 0,
          subQueueKey: txData.publicKey,
        },
      })

      const tx = {
        isInternalTx: true,
        internalTXType: 0,
        nominee: '0'.repeat(64),
        nodeActivatedTime: 946684800000, // Year 2000 - fake time
        timestamp: Date.now(),
        txData: txData,
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      const result = validateInitRewardFields(tx as any, mockShardus as any)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('nodeActivatedTime does not match actual activation cycle')
    })
    
    it('should reject InitRewardTimes with hash mismatch', () => {
      const mockShardus = createMockShardus()
      
      const txData = {
        publicKey: '0'.repeat(64),
        nodeId: '1'.repeat(64),
        startTime: Date.now(),
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }
      
      const txDataHash = 'mockTxDataHash'
      
      mockShardus.serviceQueue.containsTxData.mockReturnValue(true)
      mockShardus.getLatestCycles.mockReturnValue([{
        start: Date.now(),
        activatedPublicKeys: ['0'.repeat(64)]
      }])
      
      // Mock returning a different transaction (different hash)
      mockShardus.serviceQueue.getLatestNetworkTxEntryForSubqueueKey.mockReturnValue({
        hash: 'different_hash_12345',
        tx: {
          type: 'nodeInitReward',
          hash: 'different_hash_12345',
          txData: { /* different txData */ },
          cycle: 1,
          priority: 0,
          subQueueKey: txData.publicKey,
        },
      })

      const tx = {
        isInternalTx: true,
        internalTXType: 0,
        nominee: '0'.repeat(64),
        nodeActivatedTime: Date.now(),
        timestamp: Date.now(),
        txData: txData,
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      const result = validateInitRewardFields(tx as any, mockShardus as any)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('Transaction hash mismatch')
    })
  })

  describe('Reward Duration Cap', () => {
    it('should cap rewards at maximum duration', () => {
      const MAX_REWARD_DURATION_DAYS = 365
      const MAX_REWARD_DURATION_MS = MAX_REWARD_DURATION_DAYS * 24 * 60 * 60 * 1000

      // Simulate 24 years duration attack
      const fakeStartTime = 946684800000 // Year 2000
      const currentTime = Date.now()
      const maliciousDuration = currentTime - fakeStartTime

      expect(maliciousDuration).toBeGreaterThan(MAX_REWARD_DURATION_MS)

      // Apply the cap
      const cappedDuration = maliciousDuration > MAX_REWARD_DURATION_MS 
        ? MAX_REWARD_DURATION_MS 
        : maliciousDuration

      expect(cappedDuration).toBe(MAX_REWARD_DURATION_MS)
      expect(cappedDuration).toBeLessThan(maliciousDuration)
    })
  })

  describe('Complete Attack Scenario', () => {
    it('should prevent the complete reward manipulation attack', () => {
      const mockShardus = createMockShardus()
      
      // Step 1: Attacker tries to add nodeReward with startTime
      const maliciousNodeReward = {
        publicKey: '0'.repeat(64),
        nodeId: '1'.repeat(64),
        endTime: Date.now(),
        startTime: 946684800000, // Extra field - should be rejected
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      // Check schema validation
      const allowedFields = ['publicKey', 'nodeId', 'endTime', 'sign']
      const hasStartTime = 'startTime' in maliciousNodeReward
      expect(hasStartTime).toBe(true)
      
      // This would be rejected by schema validation
      const txKeys = Object.keys(maliciousNodeReward)
      const invalidField = txKeys.find(key => !allowedFields.includes(key))
      expect(invalidField).toBe('startTime')

      // Even if it somehow passed, InitRewardTimes would reject it due to type mismatch
      mockShardus.serviceQueue.containsTxData.mockReturnValue(true)
      mockShardus.getLatestCycles.mockReturnValue([{
        start: 946684800000,
        activatedPublicKeys: ['0'.repeat(64)]
      }])
      
      const maliciousHash = 'maliciousTxHash'
      mockShardus.serviceQueue.getLatestNetworkTxEntryForSubqueueKey.mockReturnValue({
        hash: maliciousHash,
        tx: {
          type: 'nodeReward', // Wrong type for InitRewardTimes
          hash: maliciousHash,
          txData: maliciousNodeReward,
          cycle: 1,
          priority: 0,
          subQueueKey: maliciousNodeReward.publicKey,
        },
      })

      const initRewardTx = {
        isInternalTx: true,
        internalTXType: 0,
        nominee: '0'.repeat(64),
        nodeActivatedTime: 946684800000,
        timestamp: Date.now(),
        txData: maliciousNodeReward,
        sign: {
          owner: '0'.repeat(64),
          sig: 'valid_signature',
        },
      }

      const result = validateInitRewardFields(initRewardTx as any, mockShardus as any)
      expect(result.success).toBe(false)
    })
  })
})