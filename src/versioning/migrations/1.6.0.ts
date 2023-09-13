import { nestedCountersInstance } from '@shardus/core'
//import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.6.0')
  nestedCountersInstance.countEvent('migrate-1.6.0', 'calling migrate 1.6.0')

  //we want to disable this
  shardusConfig.p2p.continueOnException = false
}
