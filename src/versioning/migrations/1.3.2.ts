import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.3.2')
  nestedCountersInstance.countEvent('migrate-1.3.2', 'calling migrate 1.3.2')

  ShardeumFlags.enableNodeSlashing = true
}
