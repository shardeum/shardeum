import { Block } from '@ethereumjs/block'
import Blockchain from '@ethereumjs/blockchain'
import VM from './index'

/**
 * @ignore
 */
export default async function runBlockchain(
  this: VM,
  blockchain?: Blockchain,
  maxBlocks?: number
): Promise<void | number> {
  let headBlock: Block
  let parentState: Buffer

  blockchain = blockchain ?? this.blockchain

  return await blockchain.iterator(
    'vm',
    async (block: Block, reorg: boolean) => {
      // determine starting state for block run
      // if we are just starting or if a chain re-org has happened
      if (!headBlock || reorg) {
        const parentBlock = await blockchain!.getBlock(block.header.parentHash)
        parentState = parentBlock.header.stateRoot
        // generate genesis state if we are at the genesis block
        // we don't have the genesis state
        if (!headBlock) {
          await this.stateManager.generateCanonicalGenesis()
        } else {
          parentState = headBlock.header.stateRoot
        }
      }

      // run block, update head if valid
      try {
        await this.runBlock({ block, root: parentState })
        // set as new head block
        headBlock = block
      } catch (error: any) {
        // remove invalid block
        await blockchain!.delBlock(block.header.hash())
        throw error
      }
    },
    maxBlocks
  )
}
