import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

export const migrate: Migration = async () => {
  console.log('migrate 1.10.2')
  nestedCountersInstance.countEvent('migrate', 'calling migrate 1.10.2')

  //this enables the fix for expired transactions state
  ShardeumFlags.expiredTransactionStateFix = true


  //not really a 1.10.2 migration but a way to patch these to default values as they are new for new 1.10.3 nodes 
  //TODO later confirm if this is needed or if the changes in config/index.ts are enough
  // mostly sure this is not need.  but added for extra safetly.
  shardusConfig.p2p.minChecksForUp = 1000 
  shardusConfig.p2p.minChecksForDown = 3 


}

//WARNING if you add a new one of these migration files you must add it to the migrations list in
// src/versioning/index.ts
