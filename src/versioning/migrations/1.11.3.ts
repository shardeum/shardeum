import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

export const migrate: Migration = async () => {
  console.log('migrate 1.11.3')
  nestedCountersInstance.countEvent('migrate', 'calling migrate 1.11.3')

  // this will disable the one time beta flag for 1.11.2
  ShardeumFlags.beta1_11_2 = false
}

//WARNING if you add a new one of these migration files you must add it to the migrations list in
// src/versioning/index.ts
