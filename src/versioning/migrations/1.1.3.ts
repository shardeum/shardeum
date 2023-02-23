import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'

export const migrate: Migration = async () => {
  nestedCountersInstance.countEvent('migrate-1.1.3', 'calling migrate 1.1.3')
}
