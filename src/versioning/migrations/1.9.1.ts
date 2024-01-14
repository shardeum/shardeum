import { nestedCountersInstance } from '@shardus/core'
//import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

export const migrate: Migration = async () => {
  console.log('migrate 1.9.1')
  nestedCountersInstance.countEvent('migrate', 'calling migrate 1.9.1')

  //we want to disable this
  //shardusConfig.p2p.continueOnException = false //already baked into settings so this is a no-op
}
