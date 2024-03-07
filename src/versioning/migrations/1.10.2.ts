import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

export const migrate: Migration = async () => {
  console.log('migrate 1.10.2')
  nestedCountersInstance.countEvent('migrate', 'calling migrate 1.10.2')

  //this enables the fix for expired transactions state
  ShardeumFlags.expiredTransactionStateFix = true
}

//WARNING if you add a new one of these migration files you must add it to the migrations list in
// src/versioning/index.ts
