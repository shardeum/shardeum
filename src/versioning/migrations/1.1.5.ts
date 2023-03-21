import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
// import { shardusConfig } from '../..'

// This is a rollback migration for v1.1.4
export const migrate: Migration = async () => {
  console.log('migrate 1.1.5')
  nestedCountersInstance.countEvent('migrate-1.1.5', 'calling migrate 1.1.5')

  // this is from reverse migrate.  keeping the comments for local testing but will turn in to real migration code later
  //shardusConfig.features.archiverDataSubscriptionsUpdate = false
}
