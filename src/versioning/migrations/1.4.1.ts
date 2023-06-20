import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.4.1')
  nestedCountersInstance.countEvent('migrate-1.4.1', 'calling migrate 1.4.1')

  // To be unique ids in the apoped and removed nodes
  shardusConfig.p2p.uniqueRemovedIdsUpdate = true
}
