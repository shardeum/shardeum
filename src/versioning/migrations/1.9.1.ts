import { nestedCountersInstance } from '@shardus/core'
//import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

export const migrate: Migration = async () => {
  console.log('migrate 1.9.1')
  nestedCountersInstance.countEvent('migrate', 'calling migrate 1.9.1')

  //this enables the standby list to use a new form of calculation
  shardusConfig.p2p.standbyListFastHash = true

}

//WARNING if you add a new one of these migration files you must add it to the migrations list in
// src/versioning/index.ts
