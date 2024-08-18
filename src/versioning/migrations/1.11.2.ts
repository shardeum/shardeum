import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

export const migrate: Migration = async () => {
  console.log('migrate 1.11.2')
  nestedCountersInstance.countEvent('migrate', 'calling migrate 1.11.2')

  //this enables the fix for stale state if we try to re-use a shardeum state object
  ShardeumFlags.cleanStaleShardeumStateMap = true

  //this allows the auto clear of TXs that are stuck in the queue for too long
  //it is based on being in consensus phase for too long with no receipt.
  shardusConfig.stateManager.removeStuckTxsFromQueue2 = false //set to false again for 1.12.0
}

//WARNING if you add a new one of these migration files you must add it to the migrations list in
// src/versioning/index.ts
