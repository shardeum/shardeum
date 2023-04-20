import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.1.8')

  //This enables a feature that will have the set cert time tx override the duration in the apply function with the global setting
  ShardeumFlags.setCertTimeDurationOverride = true
  nestedCountersInstance.countEvent('migrate-1.1.8', 'calling migrate 1.1.8')
}
