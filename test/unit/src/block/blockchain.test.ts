import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Block } from '@ethereumjs/block'

// Prepare a shared mock blocks map that will be supplied to the mocked index module
const mockBlocks: { [key: string]: Block } = {}

jest.mock('../../../../src/index', () => ({
  blocks: mockBlocks,
  evmCommon: {},
  shardeumGetTime: jest.fn(() => 0),
}))

describe('ShardeumBlock.getBlock', () => {
  let ShardeumBlock: typeof import('../../../../src/block/blockchain').ShardeumBlock
  let blockchain: InstanceType<typeof ShardeumBlock>
  const dummyBlock = {} as unknown as Block

  beforeEach(() => {
    for (const key of Object.keys(mockBlocks)) {
      delete mockBlocks[key]
    }
    mockBlocks['1'] = dummyBlock
    ;({ ShardeumBlock } = require('../../../../src/block/blockchain'))
    blockchain = new ShardeumBlock()
  })

  afterEach(() => {
    for (const key of Object.keys(mockBlocks)) {
      delete mockBlocks[key]
    }
  })

  it('retrieves a block when provided a hash buffer', async () => {
    const result = await blockchain.getBlock(new Uint8Array([0x01]))
    expect(result).toBe(dummyBlock)
  })

  it('retrieves a block when provided a hex string', async () => {
    const result = await blockchain.getBlock('0x01')
    expect(result).toBe(dummyBlock)
  })
})


