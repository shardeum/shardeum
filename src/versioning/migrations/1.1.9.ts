import { nestedCountersInstance } from '@shardus/core'
//import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.1.9')
  //no migration feature in 1.1.9 so far
  nestedCountersInstance.countEvent('migrate-1.1.9', 'calling migrate 1.1.9')
}
