import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.1.6')
  ShardeumFlags.fixSetCertTimeTxApply = true
  nestedCountersInstance.countEvent('migrate-1.1.6', 'calling migrate 1.1.6')
}
