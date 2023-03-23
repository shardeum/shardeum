import { nestedCountersInstance } from '@shardus/core'
//import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

// This is a rollback migration for v1.1.4
export const migrate: Migration = async () => {
  console.log('migrate 1.1.5')
  nestedCountersInstance.countEvent('migrate-1.1.5', 'calling migrate 1.1.5')

  // this is redundant as we do not gate this varible on the active version
  //ShardeumFlags.shardeumTimeout = 50000
}
