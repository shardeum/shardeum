import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'

export const migrate: Migration = async () => {
  console.log('migrate 1.5.7')
  nestedCountersInstance.countEvent('migrate-1.5.7', 'calling migrate 1.5.7')
  ShardeumFlags.supportEstimateGas = true
}
