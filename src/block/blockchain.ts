import Blockchain from '@ethereumjs/blockchain'
import { BlockchainInterface, BlockchainOptions } from '@ethereumjs/blockchain/src/index'
import { Block, BlockData, BlockHeader } from '@ethereumjs/block'
import { Address, BN, rlp } from 'ethereumjs-util'
import { blocks } from '..'

// export class ShardeumBlockchain implements BlockchainInterface {
//   /**
//    * Adds a block to the blockchain.
//    *
//    * If the block is valid and has a higher total difficulty than the current
//    * max total difficulty, the canonical chain is rebuilt and any stale
//    * heads/hashes are overwritten.
//    * @param block - The block to be added to the blockchain
//    */
//   async putBlock(block: Block) {
//     await this.initPromise
//     await this._putBlockOrHeader(block)
//   }

//   /**
//    * Completely deletes a block from the blockchain including any references to
//    * this block. If this block was in the canonical chain, then also each child
//    * block of this block is deleted Also, if this was a canonical block, each
//    * head header which is part of this now stale chain will be set to the
//    * parentHeader of this block An example reason to execute is when running the
//    * block in the VM invalidates this block: this will then reset the canonical
//    * head to the past block (which has been validated in the past by the VM, so
//    * we can be sure it is correct).
//    * @param blockHash - The hash of the block to be deleted
//    */
//   async delBlock(blockHash: Buffer) {
//     // Q: is it safe to make this not wait for a lock? this is called from
//     // `runBlockchain` in case `runBlock` throws (i.e. the block is invalid).
//     // But is this the way to go? If we know this is called from the
//     // iterator/runBlockchain we are safe, but if this is called from anywhere
//     // else then this might lead to a concurrency problem?
//     await this.initPromise
//     await this._delBlock(blockHash)
//   }

//   /**
//    * Gets a block by its hash.
//    *
//    * @param blockId - The block's hash or number. If a hash is provided, then
//    * this will be immediately looked up, otherwise it will wait until we have
//    * unlocked the DB
//    */
//   async getBlock(blockId: Buffer | number | BN): Promise<Block> {
//     // cannot wait for a lock here: it is used both in `validate` of `Block`
//     // (calls `getBlock` to get `parentHash`) it is also called from `runBlock`
//     // in the `VM` if we encounter a `BLOCKHASH` opcode: then a BN is used we
//     // need to then read the block from the canonical chain Q: is this safe? We
//     // know it is OK if we call it from the iterator... (runBlock)
//     await this.initPromise
//     return await this._getBlock(blockId)
//   }

//   /**
//    * Iterates through blocks starting at the specified iterator head and calls
//    * the onBlock function on each block. The current location of an iterator
//    * head can be retrieved using {@link Blockchain.getIteratorHead}.
//    *
//    * @param name - Name of the state root head
//    * @param onBlock - Function called on each block with params (block, reorg)
//    * @param maxBlocks - How many blocks to run. By default, run all unprocessed blocks in the canonical chain.
//    * @returns number of blocks actually iterated
//    */
//   async iterator(name: string, onBlock: OnBlock, maxBlocks?: number): Promise<number> {
//     return this._iterator(name, onBlock, maxBlocks)
//   }
// }

export class ShardeumBlock extends Blockchain {
  //   /**
  //    * Adds a block to the blockchain.
  //    *
  //    * If the block is valid and has a higher total difficulty than the current
  //    * max total difficulty, the canonical chain is rebuilt and any stale
  //    * heads/hashes are overwritten.
  //    * @param block - The block to be added to the blockchain
  //    */
  async putBlock(block: Block) {
    await this.initPromise
    // await this._putBlockOrHeader(block)
  }

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
      console.log('Found Block')
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
