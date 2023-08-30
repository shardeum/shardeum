import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.5.6')
  nestedCountersInstance.countEvent('migrate-1.5.6', 'calling migrate 1.5.6')

  shardusConfig.p2p.useSyncProtocolV2 = true
}
