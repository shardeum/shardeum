import { nestedCountersInstance } from '@shardus/core'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { Migration } from '../types'
import { shardusConfig } from '../..'

export const migrate: Migration = async () => {
  console.log('migrate 1.2.3')

  ShardeumFlags.fixContractBytes = true
  ShardeumFlags.fixCertExpTiming = true
  nestedCountersInstance.countEvent('migrate-1.2.3', 'calling migrate 1.2.3')

  //new logic to prevent already active nodes from submitting active requests
  shardusConfig.p2p.validateActiveRequests = true

  //Allow nodes to contineue on unhandled exceptions if the network is low on nodes
  shardusConfig.p2p.continueOnException = true

  //not sure yet if this is safe to set.
  //This is a major performance upgrade for p2p tell
  shardusConfig.p2p.useSignaturesForAuth = true
}
