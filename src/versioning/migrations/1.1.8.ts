import { nestedCountersInstance } from '@shardus/core'
//import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.1.7')
  //no migration feature in 1.1.7 so far
  nestedCountersInstance.countEvent('migrate-1.1.7', 'calling migrate 1.1.7')
}
