import { nestedCountersInstance } from '@shardus/core'
// import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { shardusConfig } from '../..'
import { Migration } from '../types'

// This has been baked into settings and is not needed, but the goal is to keep one migration as
// an example for when we need to migrate again.

const migrationNote = 'migrate 1.10.3'

export const migrate: Migration = async () => {
  console.log(migrationNote)
  nestedCountersInstance.countEvent('migrate', `calling ${migrationNote}`)

  // this just means we need 2 out of 4 check to show that a node is down
  // note that an up result does not count against a down check so this is not a true majority consensus 
  // that is ok, if we have a node appear lost to two nodes that is enough to strike it.
  // we will likely tune these as they are run time tuneable
  shardusConfig.p2p.minChecksForUp = 2 
  shardusConfig.p2p.minChecksForDown = 4 

}

//WARNING if you add a new one of these migration files you must add it to the migrations list in
// src/versioning/index.ts
