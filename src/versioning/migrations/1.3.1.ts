import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.3.1')
  nestedCountersInstance.countEvent('migrate-1.3.1', 'calling migrate 1.3.1')
  
  ShardeumFlags.chargeConstantTxFee = false

  // To be unique ids in the apoped and removed nodes
  shardusConfig.p2p.uniqueRemovedIds = true
}
