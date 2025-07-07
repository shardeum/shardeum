// Mock VectorBufferStream before imports
class MockVectorBufferStream {
  private buffer: Buffer
  position: number

  constructor(size: number) {
    this.buffer = Buffer.alloc(size || 65536) // Increased default size
    this.position = 0
  }
  
  getBuffer(): Buffer {
    return this.buffer.slice(0, this.position)
  }

  writeUInt8(value: number): void {
    this.buffer.writeUInt8(value, this.position)
    this.position += 1
  }

  readUInt8(): number {
    const value = this.buffer.readUInt8(this.position)
    this.position += 1
    return value
  }

  writeUInt16(value: number): void {
    this.ensureCapacity(2)
    this.buffer.writeUInt16BE(value, this.position)
    this.position += 2
  }

  readUInt16(): number {
    const value = this.buffer.readUInt16BE(this.position)
    this.position += 2
    return value
  }

  writeBigUInt64(value: bigint): void {
    this.ensureCapacity(8)
    this.buffer.writeBigUInt64BE(value, this.position)
    this.position += 8
  }
  
  private ensureCapacity(bytes: number): void {
    if (this.position + bytes > this.buffer.length) {
      const newSize = Math.max(this.buffer.length * 2, this.position + bytes)
      const newBuffer = Buffer.alloc(newSize)
      this.buffer.copy(newBuffer)
      this.buffer = newBuffer
    }
  }

  readBigUInt64(): bigint {
    const value = this.buffer.readBigUInt64BE(this.position)
    this.position += 8
    return value
  }

  writeString(str: string): void {
    const strToWrite = str || ''
    const len = Buffer.byteLength(strToWrite)
    
    this.ensureCapacity(4 + len)
    
    this.buffer.writeUInt32BE(len, this.position)
    this.position += 4
    this.buffer.write(strToWrite, this.position)
    this.position += len
  }

  readString(): string {
    const len = this.buffer.readUInt32BE(this.position)
    this.position += 4
    const str = this.buffer.toString('utf8', this.position, this.position + len)
    this.position += len
    return str
  }
}

jest.mock('@shardeum-foundation/core', () => ({
  VectorBufferStream: MockVectorBufferStream,
  DevSecurityLevel: {
    Unauthorized: 0,
    Low: 1,
    Medium: 2,
    High: 3
  },
  nestedCountersInstance: {
    countEvent: jest.fn(),
    countRareEvent: jest.fn()
  }
}))

jest.mock('@shardeum-foundation/lib-types', () => ({
  Utils: {
    safeStringify: jest.fn((obj) => {
      try {
        return JSON.stringify(obj, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      } catch (e) {
        return '{}'
      }
    }),
    safeJsonParse: jest.fn((str) => {
      try {
        const parsed = JSON.parse(str)
        // Convert string numbers back to BigInt where needed
        if (parsed && typeof parsed === 'object') {
          if (parsed.totalReward !== undefined) parsed.totalReward = BigInt(parsed.totalReward)
          if (parsed.totalPenalty !== undefined) parsed.totalPenalty = BigInt(parsed.totalPenalty)
          if (parsed.penaltyHistory && Array.isArray(parsed.penaltyHistory)) {
            parsed.penaltyHistory.forEach((p: any) => {
              if (p.amount !== undefined) p.amount = BigInt(p.amount)
            })
          }
        }
        return parsed
      } catch (e) {
        throw e
      }
    }),
  },
}))

import { VectorBufferStream } from '@shardeum-foundation/core'
import { serializeNodeAccount, deserializeNodeAccount, NodeAccount } from '../../../../src/types/NodeAccount'
import { TypeIdentifierEnum } from '../../../../src/types/enum/TypeIdentifierEnum'
import { NodeAccountStats, AccountType, ViolationType } from '../../../../src/shardeum/shardeumTypes'
import { Utils } from '@shardeum-foundation/lib-types'

// Custom Jest serializer for BigInt
expect.addSnapshotSerializer({
  serialize(val: any) {
    return String(val);
  },
  test(val: any) {
    return typeof val === 'bigint';
  },
});

describe('NodeAccount', () => {
  const createTestNodeAccount = (): NodeAccount => ({
    accountType: AccountType.NodeAccount,
    id: 'node-id-123',
    hash: 'node-hash-456',
    timestamp: 1234567890,
    nominator: '0xNominator123',
    stakeLock: BigInt(1000000),
    stakeTimestamp: 1234567800,
    reward: BigInt(500),
    rewardStartTime: 1234567000,
    rewardEndTime: 1234568000,
    penalty: BigInt(100),
    nodeAccountStats: {
      totalReward: BigInt(5000),
      totalPenalty: BigInt(200),
      history: [
        { b: 1234567000, e: 1234567500 },
        { b: 1234567600, e: 1234568000 },
      ],
      lastPenaltyTime: 1234567700,
      penaltyHistory: [
        {
          type: ViolationType.LeftNetworkEarly,
          amount: BigInt(100),
          timestamp: 1234567700,
        },
      ],
      isShardeumRun: true,
    },
    rewarded: false,
    rewardRate: BigInt(10),
  })

  describe('serializeNodeAccount', () => {
    beforeEach(() => {
      // Reset the mock implementation before each test
      const mockSafeStringify = Utils.safeStringify as jest.MockedFunction<typeof Utils.safeStringify>
      mockSafeStringify.mockImplementation((obj) => {
        try {
          return JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
        } catch (e) {
          return '{}'
        }
      })
    })
    
    it('should serialize a NodeAccount without root identifier', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      expect(stream.readUInt8()).toBe(1) // version
      expect(stream.readUInt8()).toBe(1) // base account version
      expect(stream.readUInt16()).toBe(AccountType.NodeAccount) // accountType
      expect(stream.readString()).toBe('node-id-123')
      expect(stream.readString()).toBe('node-hash-456')
      expect(Number(stream.readBigUInt64())).toBe(1234567890)
      expect(stream.readUInt8()).toBe(1) // nominator exists
      expect(stream.readString()).toBe('0xNominator123')
      expect(stream.readString()).toBe('1000000')
      expect(Number(stream.readBigUInt64())).toBe(1234567800)
      expect(stream.readString()).toBe('500')
      expect(Number(stream.readBigUInt64())).toBe(1234567000)
      expect(Number(stream.readBigUInt64())).toBe(1234568000)
      expect(stream.readString()).toBe('100')
      expect(stream.readString()).toBe(JSON.stringify(account.nodeAccountStats, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ))
      expect(stream.readUInt8()).toBe(0) // rewarded = false
      expect(Number(stream.readBigUInt64())).toBe(10)
    })

    it('should serialize a NodeAccount with root identifier', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, true)
      
      stream.position = 0
      expect(stream.readUInt16()).toBe(TypeIdentifierEnum.cNodeAccount)
      expect(stream.readUInt8()).toBe(1) // version
    })

    it('should handle null nominator', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      account.nominator = null
      
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      stream.readUInt8() // version
      stream.readUInt8() // base account version
      stream.readUInt16() // accountType
      stream.readString() // id
      stream.readString() // hash
      stream.readBigUInt64() // timestamp
      expect(stream.readUInt8()).toBe(0) // nominator null flag
    })

    it('should handle rewarded = true', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      account.rewarded = true
      
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      // Skip to rewarded field
      stream.readUInt8() // version
      stream.readUInt8() // base account version
      stream.readUInt16() // accountType
      stream.readString() // id
      stream.readString() // hash
      stream.readBigUInt64() // timestamp
      stream.readUInt8() // nominator flag
      stream.readString() // nominator
      stream.readString() // stakeLock
      stream.readBigUInt64() // stakeTimestamp
      stream.readString() // reward
      stream.readBigUInt64() // rewardStartTime
      stream.readBigUInt64() // rewardEndTime
      stream.readString() // penalty
      stream.readString() // nodeAccountStats
      expect(stream.readUInt8()).toBe(1) // rewarded = true
    })

    it('should handle large bigint values', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      account.stakeLock = BigInt('9007199254740991') // MAX_SAFE_INTEGER
      account.reward = BigInt('999999999999999999')
      account.penalty = BigInt('0')
      account.rewardRate = BigInt('1000000000000')
      
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      // Skip to bigint fields
      stream.readUInt8() // version
      stream.readUInt8() // base account version
      stream.readUInt16() // accountType
      stream.readString() // id
      stream.readString() // hash
      stream.readBigUInt64() // timestamp
      stream.readUInt8() // nominator flag
      stream.readString() // nominator
      expect(stream.readString()).toBe('9007199254740991')
      stream.readBigUInt64() // stakeTimestamp
      expect(stream.readString()).toBe('999999999999999999')
      stream.readBigUInt64() // rewardStartTime
      stream.readBigUInt64() // rewardEndTime
      expect(stream.readString()).toBe('0')
    })

    it('should use different type identifiers', () => {
      const stream1 = new VectorBufferStream(0)
      const stream2 = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      
      serializeNodeAccount(stream1, account, TypeIdentifierEnum.cNodeAccount, true)
      serializeNodeAccount(stream2, account, TypeIdentifierEnum.cNodeAccount2, true)
      
      stream1.position = 0
      stream2.position = 0
      expect(stream1.readUInt16()).toBe(TypeIdentifierEnum.cNodeAccount)
      expect(stream2.readUInt16()).toBe(TypeIdentifierEnum.cNodeAccount2)
    })
  })

  describe('deserializeNodeAccount', () => {
    beforeEach(() => {
      // Reset the mock implementations before each test
      const mockSafeStringify = Utils.safeStringify as jest.MockedFunction<typeof Utils.safeStringify>
      const mockSafeJsonParse = Utils.safeJsonParse as jest.MockedFunction<typeof Utils.safeJsonParse>
      
      mockSafeStringify.mockImplementation((obj) => {
        try {
          return JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
        } catch (e) {
          return '{}'
        }
      })
      
      mockSafeJsonParse.mockImplementation((str) => {
        try {
          const parsed = JSON.parse(str)
          // Convert string numbers back to BigInt where needed
          if (parsed && typeof parsed === 'object') {
            if (parsed.totalReward !== undefined) parsed.totalReward = BigInt(parsed.totalReward)
            if (parsed.totalPenalty !== undefined) parsed.totalPenalty = BigInt(parsed.totalPenalty)
            if (parsed.penaltyHistory && Array.isArray(parsed.penaltyHistory)) {
              parsed.penaltyHistory.forEach((p: any) => {
                if (p.amount !== undefined) p.amount = BigInt(p.amount)
              })
            }
          }
          return parsed
        } catch (e) {
          throw e
        }
      })
    })
    
    it('should deserialize a NodeAccount correctly', () => {
      const stream = new VectorBufferStream(0)
      const originalAccount = createTestNodeAccount()
      
      serializeNodeAccount(stream, originalAccount, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      const deserializedAccount = deserializeNodeAccount(stream)
      
      // Convert BigInt values to strings for comparison to avoid serialization issues
      const normalizeAccount = (acc: NodeAccount) => ({
        ...acc,
        stakeLock: acc.stakeLock.toString(),
        reward: acc.reward.toString(),
        penalty: acc.penalty.toString(),
        rewardRate: acc.rewardRate.toString(),
        nodeAccountStats: {
          ...acc.nodeAccountStats,
          totalReward: acc.nodeAccountStats.totalReward.toString(),
          totalPenalty: acc.nodeAccountStats.totalPenalty.toString(),
          penaltyHistory: acc.nodeAccountStats.penaltyHistory.map(p => ({
            ...p,
            amount: p.amount.toString()
          }))
        }
      })
      
      expect(normalizeAccount(deserializedAccount)).toEqual(normalizeAccount(originalAccount))
    })

    it('should throw error for version mismatch', () => {
      const stream = new VectorBufferStream(0)
      stream.writeUInt8(2) // version higher than supported
      
      stream.position = 0
      expect(() => deserializeNodeAccount(stream)).toThrow('NodeAccount version mismatch')
    })

    it('should handle null nominator', () => {
      const stream = new VectorBufferStream(0)
      const originalAccount = createTestNodeAccount()
      originalAccount.nominator = null
      
      serializeNodeAccount(stream, originalAccount, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      const deserializedAccount = deserializeNodeAccount(stream)
      
      expect(deserializedAccount.nominator).toBeNull()
    })

    it('should deserialize complex nodeAccountStats', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      account.nodeAccountStats = {
        totalReward: BigInt(100000),
        totalPenalty: BigInt(5000),
        history: [
          { b: 1000, e: 2000 },
          { b: 3000, e: 4000 },
          { b: 5000, e: 6000 },
        ],
        lastPenaltyTime: 3500,
        penaltyHistory: [
          {
            type: ViolationType.LeftNetworkEarly,
            amount: BigInt(1000),
            timestamp: 1500,
          },
          {
            type: ViolationType.SyncingTooLong,
            amount: BigInt(2000),
            timestamp: 2500,
          },
          {
            type: ViolationType.DoubleVote,
            amount: BigInt(2000),
            timestamp: 3500,
          },
        ],
        isShardeumRun: false,
      }
      
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      const deserializedAccount = deserializeNodeAccount(stream)
      
      // Convert BigInt values to strings for comparison
      const normalizeStats = (stats: NodeAccountStats) => ({
        ...stats,
        totalReward: stats.totalReward.toString(),
        totalPenalty: stats.totalPenalty.toString(),
        penaltyHistory: stats.penaltyHistory.map(p => ({
          ...p,
          amount: p.amount.toString()
        }))
      })
      
      expect(normalizeStats(deserializedAccount.nodeAccountStats)).toEqual(normalizeStats(account.nodeAccountStats))
    })

    it('should handle empty nodeAccountStats history arrays', () => {
      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      account.nodeAccountStats = {
        totalReward: BigInt(0),
        totalPenalty: BigInt(0),
        history: [],
        lastPenaltyTime: 0,
        penaltyHistory: [],
        isShardeumRun: true,
      }
      
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      const deserializedAccount = deserializeNodeAccount(stream)
      
      expect(deserializedAccount.nodeAccountStats.history).toEqual([])
      expect(deserializedAccount.nodeAccountStats.penaltyHistory).toEqual([])
    })
  })

  describe('round-trip serialization', () => {
    beforeEach(() => {
      // Reset the mock implementations before each test
      const mockSafeStringify = Utils.safeStringify as jest.MockedFunction<typeof Utils.safeStringify>
      const mockSafeJsonParse = Utils.safeJsonParse as jest.MockedFunction<typeof Utils.safeJsonParse>
      
      mockSafeStringify.mockImplementation((obj) => {
        try {
          return JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
        } catch (e) {
          return '{}'
        }
      })
      
      mockSafeJsonParse.mockImplementation((str) => {
        try {
          const parsed = JSON.parse(str)
          // Convert string numbers back to BigInt where needed
          if (parsed && typeof parsed === 'object') {
            if (parsed.totalReward !== undefined) parsed.totalReward = BigInt(parsed.totalReward)
            if (parsed.totalPenalty !== undefined) parsed.totalPenalty = BigInt(parsed.totalPenalty)
            if (parsed.penaltyHistory && Array.isArray(parsed.penaltyHistory)) {
              parsed.penaltyHistory.forEach((p: any) => {
                if (p.amount !== undefined) p.amount = BigInt(p.amount)
              })
            }
          }
          return parsed
        } catch (e) {
          throw e
        }
      })
    })
    
    it('should maintain data integrity through serialize/deserialize cycle', () => {
      const testCases: NodeAccount[] = [
        createTestNodeAccount(),
        {
          accountType: AccountType.NodeAccount2,
          id: '',
          hash: '',
          timestamp: 0,
          nominator: null,
          stakeLock: BigInt(0),
          stakeTimestamp: 0,
          reward: BigInt(0),
          rewardStartTime: 0,
          rewardEndTime: 0,
          penalty: BigInt(0),
          nodeAccountStats: {
            totalReward: BigInt(0),
            totalPenalty: BigInt(0),
            history: [],
            lastPenaltyTime: 0,
            penaltyHistory: [],
            isShardeumRun: false,
          },
          rewarded: true,
          rewardRate: BigInt(0),
        },
        {
          accountType: AccountType.NodeAccount,
          id: 'unicode-✓-id',
          hash: 'hash-with-special-chars-!@#$%',
          timestamp: Date.now(),
          nominator: '0x' + '9'.repeat(40),
          stakeLock: BigInt('999999999999999999999999'),
          stakeTimestamp: Date.now() - 1000,
          reward: BigInt('123456789012345678901234567890'),
          rewardStartTime: Date.now() - 10000,
          rewardEndTime: Date.now() + 10000,
          penalty: BigInt('1'),
          nodeAccountStats: {
            totalReward: BigInt('999999999999999999999999999999'),
            totalPenalty: BigInt('111111111111111111111111111111'),
            history: Array(100).fill({ b: 1000, e: 2000 }),
            lastPenaltyTime: Date.now() - 5000,
            penaltyHistory: [
              {
                type: ViolationType.NodeRefuted,
                amount: BigInt('50000000000000000000'),
                timestamp: Date.now() - 5000,
              },
            ],
            isShardeumRun: true,
          },
          rewarded: false,
          rewardRate: BigInt('100000000000000'),
        },
      ]

      for (const original of testCases) {
        const stream = new VectorBufferStream(0)
        serializeNodeAccount(stream, original, TypeIdentifierEnum.cNodeAccount, false)
        stream.position = 0
        const deserialized = deserializeNodeAccount(stream)
        
        // Use the same normalization function for comparison
        const normalizeAccount = (acc: NodeAccount) => ({
          ...acc,
          stakeLock: acc.stakeLock.toString(),
          reward: acc.reward.toString(),
          penalty: acc.penalty.toString(),
          rewardRate: acc.rewardRate.toString(),
          nodeAccountStats: {
            ...acc.nodeAccountStats,
            totalReward: acc.nodeAccountStats.totalReward.toString(),
            totalPenalty: acc.nodeAccountStats.totalPenalty.toString(),
            penaltyHistory: acc.nodeAccountStats.penaltyHistory.map(p => ({
              ...p,
              amount: p.amount.toString()
            }))
          }
        })
        
        expect(normalizeAccount(deserialized)).toEqual(normalizeAccount(original))
      }
    })
  })

  describe('edge cases', () => {
    it('should handle Utils.safeStringify errors gracefully', () => {
      const mockSafeStringify = Utils.safeStringify as jest.MockedFunction<typeof Utils.safeStringify>
      mockSafeStringify.mockImplementationOnce(() => {
        throw new Error('Stringify error')
      })

      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      
      expect(() =>
        serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      ).toThrow('Stringify error')
    })

    it('should handle Utils.safeJsonParse errors gracefully', () => {
      const mockSafeJsonParse = Utils.safeJsonParse as jest.MockedFunction<typeof Utils.safeJsonParse>
      const originalImplementation = mockSafeJsonParse.getMockImplementation()
      
      mockSafeJsonParse.mockImplementationOnce(() => {
        throw new Error('Parse error')
      })

      const stream = new VectorBufferStream(0)
      const account = createTestNodeAccount()
      serializeNodeAccount(stream, account, TypeIdentifierEnum.cNodeAccount, false)
      
      stream.position = 0
      expect(() => deserializeNodeAccount(stream)).toThrow('Parse error')
      
      // Restore original implementation
      if (originalImplementation) {
        mockSafeJsonParse.mockImplementation(originalImplementation)
      }
    })
  })
})