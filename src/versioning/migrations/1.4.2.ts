import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
// import { shardusConfig } from '../..'
// import { ShardeumFlags } from '../../shardeum/shardeumFlags'

export const migrate: Migration = async () => {
  console.log('migrate 1.4.1')
  nestedCountersInstance.countEvent('migrate-1.4.2', 'calling migrate 1.4.2')

  //no upgrades for 1.4.2  just using it to correct dapp net
}
