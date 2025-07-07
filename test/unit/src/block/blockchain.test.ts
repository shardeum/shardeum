import { ShardeumBlock } from '../../../../src/block/blockchain'
import { Block } from '@ethereumjs/block'
import { Blockchain } from '@ethereumjs/blockchain'

// Mock the dependencies
jest.mock('../../../../src', () => {
  const mockShardeumGetTime = jest.fn(() => 1234567890)
  return {
    blocks: {},
    evmCommon: { chain: 1 },
    shardeumGetTime: mockShardeumGetTime
  }
})

// Mock the Block.fromBlockData method
jest.mock('@ethereumjs/block', () => {
  const actualBlock = jest.requireActual('@ethereumjs/block')
  const mockFromBlockData = jest.fn()
  
  // Store the mock function in a way we can access it later
  ;(global as any).__mockFromBlockData = mockFromBlockData
  
  return {
    ...actualBlock,
    Block: {
      ...actualBlock.Block,
      fromBlockData: mockFromBlockData
    }
  }
})

describe('ShardeumBlock', () => {
  let shardeumBlock: ShardeumBlock
  let mockShardeumGetTime: jest.Mock
  let mockBlocks: any
  let mockEvmCommon: any
  let mockFromBlockData: jest.Mock

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Get mocked dependencies
    const mocks = jest.requireMock('../../../../src')
    mockBlocks = mocks.blocks
    mockEvmCommon = mocks.evmCommon
    mockShardeumGetTime = mocks.shardeumGetTime
    
    // Get the mock function from global
    mockFromBlockData = (global as any).__mockFromBlockData
    
    // Reset mock implementations
    mockShardeumGetTime.mockReturnValue(1234567890)
    mockFromBlockData.mockImplementation((blockData, options) => ({
      header: blockData.header,
      transactions: blockData.transactions,
      uncleHeaders: blockData.uncleHeaders,
      _common: options?.common
    }))
    
    // Clear and set up cached blocks
    Object.keys(mockBlocks).forEach(key => delete mockBlocks[key])
    mockBlocks['100'] = {
      header: { number: BigInt(100) },
      transactions: [],
      uncleHeaders: []
    }
    mockBlocks['200'] = {
      header: { number: BigInt(200) },
      transactions: [],
      uncleHeaders: []
    }

    // Create a new instance for each test
    shardeumBlock = new ShardeumBlock()
  })

  describe('constructor', () => {
    it('should create an instance without options', () => {
      const instance = new ShardeumBlock()
      expect(instance).toBeInstanceOf(ShardeumBlock)
      expect(instance).toBeInstanceOf(Blockchain)
    })

    it('should create an instance with options', () => {
      const options = { 
        validateBlocks: false,
        validateConsensus: false 
      }
      const instance = new ShardeumBlock(options)
      expect(instance).toBeInstanceOf(ShardeumBlock)
      expect(instance).toBeInstanceOf(Blockchain)
    })
  })

  describe('getBlock', () => {
    describe('with number input', () => {
      it('should return cached block when block exists in blocks map', async () => {
        const blockNumber = 100
        const result = await shardeumBlock.getBlock(blockNumber)
        
        expect(result).toBe(mockBlocks['100'])
        expect(mockFromBlockData).not.toHaveBeenCalled()
      })

      it('should create new block when block does not exist in blocks map', async () => {
        const blockNumber = 999
        const result = await shardeumBlock.getBlock(blockNumber)
        
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: blockNumber, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
        expect(result).toEqual({
          header: { number: blockNumber, timestamp: 1234567890 },
          transactions: [],
          uncleHeaders: [],
          _common: mockEvmCommon
        })
      })
    })

    describe('with bigint input', () => {
      it('should return cached block when block exists', async () => {
        const blockNumber = BigInt(200)
        const result = await shardeumBlock.getBlock(blockNumber)
        
        expect(result).toBe(mockBlocks['200'])
        expect(mockFromBlockData).not.toHaveBeenCalled()
      })

      it('should create new block when block does not exist', async () => {
        const blockNumber = BigInt(999)
        const result = await shardeumBlock.getBlock(blockNumber)
        
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: blockNumber, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
      })
    })

    describe('with Uint8Array input', () => {
      it('should handle Uint8Array input and create block', async () => {
        const blockId = new Uint8Array([1, 2, 3])
        const result = await shardeumBlock.getBlock(blockId)
        
        // Uint8Array [1, 2, 3] converts to string "1,2,3" then parseInt gives 1
        // But createBlock receives the original Uint8Array
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: blockId, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
        expect(result).toEqual({
          header: { number: blockId, timestamp: 1234567890 },
          transactions: [],
          uncleHeaders: [],
          _common: mockEvmCommon
        })
      })

      it('should handle empty Uint8Array', async () => {
        const blockId = new Uint8Array([])
        const result = await shardeumBlock.getBlock(blockId)
        
        // Empty Uint8Array converts to empty string, parseInt gives NaN
        // But createBlock receives the original Uint8Array
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: blockId, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
      })

      it('should handle single element Uint8Array', async () => {
        const blockId = new Uint8Array([255])
        const result = await shardeumBlock.getBlock(blockId)
        
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: blockId, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
      })
    })

    describe('edge cases', () => {
      it('should handle zero block number', async () => {
        const blockNumber = 0
        const result = await shardeumBlock.getBlock(blockNumber)
        
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: 0, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
      })

      it('should handle negative numbers', async () => {
        const blockNumber = -1
        const result = await shardeumBlock.getBlock(blockNumber)
        
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: -1, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
      })

      it('should handle very large numbers', async () => {
        const blockNumber = Number.MAX_SAFE_INTEGER
        const result = await shardeumBlock.getBlock(blockNumber)
        
        expect(mockFromBlockData).toHaveBeenCalledWith(
          {
            header: { number: Number.MAX_SAFE_INTEGER, timestamp: 1234567890 },
            transactions: [],
            uncleHeaders: []
          },
          { common: mockEvmCommon }
        )
      })

      it('should handle string that parseInt cannot parse', async () => {
        // When getBlock is called, it passes blockId directly to createBlock
        // But the actual blockId passed to getBlock is converted using parseInt
        // This test verifies behavior when a cached block with key 'NaN' exists
        mockBlocks['NaN'] = {
          header: { number: 'NaN' },
          transactions: [],
          uncleHeaders: []
        }
        
        // This will convert to "NaN" string via toString(), parseInt("NaN") = NaN
        // Then blocks[`${NaN}`] = blocks["NaN"] which exists
        const result = await shardeumBlock.getBlock('not-a-number' as any)
        
        expect(result).toBe(mockBlocks['NaN'])
        expect(mockFromBlockData).not.toHaveBeenCalled()
      })
    })
  })

  describe('createBlock', () => {
    it('should create block with correct structure', () => {
      const blockId = 123
      const result = shardeumBlock.createBlock(blockId)
      
      expect(mockFromBlockData).toHaveBeenCalledWith(
        {
          header: { number: 123, timestamp: 1234567890 },
          transactions: [],
          uncleHeaders: []
        },
        { common: mockEvmCommon }
      )
      expect(result).toEqual({
        header: { number: 123, timestamp: 1234567890 },
        transactions: [],
        uncleHeaders: [],
        _common: mockEvmCommon
      })
    })

    it('should use shardeumGetTime for timestamp', () => {
      shardeumBlock.createBlock(456)
      
      expect(mockShardeumGetTime).toHaveBeenCalled()
      expect(mockFromBlockData).toHaveBeenCalledWith(
        expect.objectContaining({
          header: expect.objectContaining({ timestamp: 1234567890 })
        }),
        expect.anything()
      )
    })

    it('should always create empty transactions and uncleHeaders arrays', () => {
      const result = shardeumBlock.createBlock(789)
      
      expect(mockFromBlockData).toHaveBeenCalledWith(
        expect.objectContaining({
          transactions: [],
          uncleHeaders: []
        }),
        expect.anything()
      )
    })

    it('should use evmCommon from imports', () => {
      shardeumBlock.createBlock(111)
      
      expect(mockFromBlockData).toHaveBeenCalledWith(
        expect.anything(),
        { common: mockEvmCommon }
      )
    })

    it('should handle different timestamp values', () => {
      mockShardeumGetTime.mockReturnValueOnce(9999999999)
      
      shardeumBlock.createBlock(222)
      
      expect(mockFromBlockData).toHaveBeenCalledWith(
        expect.objectContaining({
          header: expect.objectContaining({ timestamp: 9999999999 })
        }),
        expect.anything()
      )
    })

    it('should create multiple blocks with different timestamps', () => {
      mockShardeumGetTime
        .mockReturnValueOnce(1111111111)
        .mockReturnValueOnce(2222222222)
      
      shardeumBlock.createBlock(1)
      shardeumBlock.createBlock(2)
      
      expect(mockFromBlockData).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          header: expect.objectContaining({ timestamp: 1111111111 })
        }),
        expect.anything()
      )
      expect(mockFromBlockData).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          header: expect.objectContaining({ timestamp: 2222222222 })
        }),
        expect.anything()
      )
    })

    it('should pass blockId as-is to header.number', () => {
      const blockId = 'special-id'
      shardeumBlock.createBlock(blockId)
      
      expect(mockFromBlockData).toHaveBeenCalledWith(
        expect.objectContaining({
          header: expect.objectContaining({ number: 'special-id' })
        }),
        expect.anything()
      )
    })
  })

  describe('integration tests', () => {
    it('should properly integrate getBlock with createBlock for non-cached blocks', async () => {
      const blockNumber = 555
      await shardeumBlock.getBlock(blockNumber)
      
      // Should call createBlock internally, which calls Block.fromBlockData
      expect(mockFromBlockData).toHaveBeenCalledTimes(1)
      expect(mockShardeumGetTime).toHaveBeenCalledTimes(1)
    })

    it('should not call createBlock for cached blocks', async () => {
      const blockNumber = 100
      await shardeumBlock.getBlock(blockNumber)
      
      // Should not call createBlock or any of its dependencies
      expect(mockFromBlockData).not.toHaveBeenCalled()
      expect(mockShardeumGetTime).not.toHaveBeenCalled()
    })

    it('should handle multiple concurrent getBlock calls', async () => {
      const promises = [
        shardeumBlock.getBlock(1),
        shardeumBlock.getBlock(2),
        shardeumBlock.getBlock(100), // cached
        shardeumBlock.getBlock(3)
      ]
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(4)
      expect(results[2]).toBe(mockBlocks['100'])
      expect(mockFromBlockData).toHaveBeenCalledTimes(3) // Only for non-cached blocks
    })

    it('should handle getBlock with various input types correctly', async () => {
      // Clear previous calls
      jest.clearAllMocks()
      
      // Test that createBlock receives the original blockId
      const testCases = [
        { input: 42 },
        { input: BigInt(123) },
        { input: new Uint8Array([50]) },
        { input: '999' },
      ]
      
      for (const { input } of testCases) {
        jest.clearAllMocks()
        await shardeumBlock.getBlock(input as any)
        
        expect(mockFromBlockData).toHaveBeenCalledWith(
          expect.objectContaining({
            header: expect.objectContaining({ number: input })
          }),
          expect.anything()
        )
      }
    })
  })
})