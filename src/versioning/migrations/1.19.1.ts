import { nestedCountersInstance } from '@shardeum-foundation/core'
// import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

export const migrate: Migration = async () => {
  console.log('migrate 1.19.1')
  nestedCountersInstance.countEvent('migrate', 'calling migrate 1.19.1')

  shardusConfig.p2p.fixApplyReceiptType = true
}

//WARNING if you add a new one of these migration files you must add it to the migrations list in
// src/versioning/index.ts
