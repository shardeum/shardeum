import { nestedCountersInstance } from '@shardus/core'
import { Migration } from '../types'
import { shardusConfig } from '../..'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'

export const migrate: Migration = async () => {
  console.log('migrate 1.5.5')
  nestedCountersInstance.countEvent('migrate-1.5.5', 'calling migrate 1.5.5')

  //todo this flag needs to be implemented:
  //it should activate nodes writing the new hashes to the cycle record , but the
  //full logic will be enabled in 1.5.6
  shardusConfig.p2p.writeSyncProtocolV2 = true
  ShardeumFlags.looseNonceCheck = true
}
