import Blockchain from '@ethereumjs/blockchain'
import { Block } from '@ethereumjs/block'
import { BN } from 'ethereumjs-util'
import { blocks } from '..'

export class ShardeumBlock extends Blockchain {
  /**
   * Gets a block by its hash.
   *
   * @param blockId - The block's hash or number. If a hash is provided, then
   * this will be immediately looked up, otherwise it will wait until we have
   * unlocked the DB
   */
  async getBlock(blockId: Buffer | number | BN): Promise<Block> {
    // cannot wait for a lock here: it is used both in `validate` of `Block`
    // (calls `getBlock` to get `parentHash`) it is also called from `runBlock`
    // in the `VM` if we encounter a `BLOCKHASH` opcode: then a BN is used we
    // need to then read the block from the canonical chain Q: is this safe? We
    // know it is OK if we call it from the iterator... (runBlock)
    await this.initPromise
    const blockNumber = parseInt(blockId.toString())
    console.log('getBlock', blockId, blockNumber)
    if (blocks[blockNumber]) {
      console.log('Found Block', blockNumber)
      return blocks[blockNumber]
    }
    return this.createBlock(blockId)
  }

  createBlock(blockId): Block {
    const blockData = {
      header: { number: blockId, timestamp: new BN(Date.now()) },
      transactions: [],
      uncleHeaders: [],
    }
    const block = Block.fromBlockData(blockData)
    return block
  }
}
