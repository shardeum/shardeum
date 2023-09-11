import { Blockchain, BlockchainOptions } from '@ethereumjs/blockchain'
import { Block, BlockData } from '@ethereumjs/block'
import { evmCommon } from '../evmSetup'
import { BlockMap } from '../../shardeum/shardeumTypes'

export const blocks: BlockMap = {}
let latestBlock = 0

function createNewBlock(blockNumber: number, timestamp: number): Block {
  /* eslint-disable security/detect-object-injection */
  if (blocks[blockNumber]) return blocks[blockNumber]
  if (!blocks[blockNumber]) {
    const timestampInSecond = timestamp ? Math.round(timestamp / 1000) : Math.round(Date.now() / 1000)
    const blockData = {
      header: { number: blockNumber, timestamp: timestampInSecond },
      transactions: [],
      uncleHeaders: [],
    }
    const block = Block.fromBlockData(blockData, { common: evmCommon })
    // eslint-disable-next-line security/detect-object-injection
    blocks[blockNumber] = block
    latestBlock = blockNumber
    return block
  }
}

export const getOrCreateBlockFromTimestamp = (timestamp: number): Block => {
  return createNewBlock(0, Date.now() / 1000)
}

export class ShardeumBlock extends Blockchain {
  constructor(opts: BlockchainOptions = {}) {
    super(opts)
  }

  /**
   * Gets a block by its hash.
   *
   * @param blockId - The block's hash or number. If a hash is provided, then
   * this will be immediately looked up, otherwise it will wait until we have
   * unlocked the DB
   */
  async getBlock(blockId: Uint8Array | number | bigint): Promise<Block> {
    // cannot wait for a lock here: it is used both in `validate` of `Block`
    // (calls `getBlock` to get `parentHash`) it is also called from `runBlock`
    // in the `VM` if we encounter a `BLOCKHASH` opcode: then a BN is used we
    // need to then read the block from the canonical chain Q: is this safe? We
    // know it is OK if we call it from the iterator... (runBlock)
    const blockNumber = parseInt(blockId.toString())
    if (blocks[`${blockNumber}`]) {
      return blocks[`${blockNumber}`]
    }
    return this.createBlock(blockId)
  }

  createBlock(blockId): Block {
    const blockData: BlockData = {
      header: { number: blockId, timestamp: Date.now() },
      transactions: [],
      uncleHeaders: [],
    }
    return Block.fromBlockData(blockData, { common: evmCommon })
  }
}
