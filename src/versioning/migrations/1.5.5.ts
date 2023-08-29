import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.5.5')
  nestedCountersInstance.countEvent('migrate-1.5.5', 'calling migrate 1.5.5')

  shardusConfig.p2p.useSyncProtocolV2 = true
}
