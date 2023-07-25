import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.5.3')
  nestedCountersInstance.countEvent('migrate-1.5.3', 'calling migrate 1.5.3')

  // shardusConfig.stateManager.includeBeforeStatesInReceipts = true
}
