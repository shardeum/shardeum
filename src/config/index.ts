import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import { ShardeumFlags } from '../shardeum/shardeumFlags'

const overwriteMerge = (target: any[], source: any[]): any[] => source // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Config {
  storage?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  server: {
    globalAccount: string
    p2p?: {
      cycleDuration: number
      existingArchivers: Array<{
        ip: string
        port: number
        publicKey: string
      }>
    }
    baseDir: string
    mode?: 'debug' | 'release'
  }
}

//TODO: improve typing here
let config: Config = {
  server: {
    globalAccount: '0'.repeat(64), //dev-relaunch required to change this: '1' + '0'.repeat(63),
    baseDir: './',
  },
}

if (fs.existsSync(path.join(process.cwd(), 'config.json'))) {
  const fileConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')).toString())
  config = merge(config, fileConfig, { arrayMerge: overwriteMerge })
}

if (process.env.BASE_DIR) {
  const baseDir = process.env.BASE_DIR || '.'
  let baseDirFileConfig = {}

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (fs.existsSync(path.join(baseDir, 'config.json'))) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    baseDirFileConfig = JSON.parse(fs.readFileSync(path.join(baseDir, 'config.json')).toString())
  }
  config = merge(config, baseDirFileConfig, { arrayMerge: overwriteMerge })
  config.server.baseDir = process.env.BASE_DIR
}

if (process.env.APP_SEEDLIST) {
  config = merge(
    config,
    {
      server: {
        p2p: {
          existingArchivers: [
            {
              ip: process.env.APP_SEEDLIST,
              port: process.env.APP_SEEDLIST_PORT || 4000,
              publicKey:
                process.env.APP_SEEDLIST_PUBLIC_KEY ||
                '758b1c119412298802cd28dbfa394cdfeecc4074492d60844cc192d632d84de3',
            },
          ],
        },
      },
    },
    { arrayMerge: overwriteMerge }
  )
}

// EXISTING_ARCHIVERS env has to be passed in string format!
if (process.env.EXISTING_ARCHIVERS) {
  const existingArchivers = JSON.parse(process.env.EXISTING_ARCHIVERS)
  if (existingArchivers.length > 0) {
    config = merge(
      config,
      {
        server: {
          p2p: {
            existingArchivers,
          },
        },
      },
      { arrayMerge: overwriteMerge }
    )
  }
}

if (process.env.APP_MONITOR) {
  config = merge(
    config,
    {
      server: {
        reporting: {
          recipient: `http://${process.env.APP_MONITOR}:3000/api`,
        },
      },
    },
    { arrayMerge: overwriteMerge }
  )
}

if (process.env.APP_IP) {
  config = merge(
    config,
    {
      server: {
        ip: {
          externalIp: process.env.APP_IP,
          internalIp: process.env.APP_IP,
        },
      },
    },
    { arrayMerge: overwriteMerge }
  )
}

config = merge(config, {
  server: {
    p2p: {
      cycleDuration: 60,
      minNodesToAllowTxs: 1, // to allow single node networks
      minNodes: process.env.minNodes ? parseInt(process.env.minNodes) : 300,
      maxNodes: process.env.maxNodes ? parseInt(process.env.maxNodes) : 1100,
      maxJoinedPerCycle: 10,
      maxSyncingPerCycle: 10,
      maxRotatedPerCycle: process.env.maxRotatedPerCycle ? parseInt(process.env.maxRotatedPerCycle) : 1,
      firstCycleJoin: 0,
      maxSyncTimeFloor: 1200, // 20 minutes.  If the network lives a long time we may have to bump this up
      syncBoostEnabled: false,
      amountToGrow: 30,
      amountToShrink: 5,
      maxDesiredMultiplier: 1.2,
      maxScaleReqs: 250, // todo: this will become a variable config but this should work for a 500 node demo
      forceBogonFilteringOn: true,
      //these are new feature in 1.3.0, we can make them default:true in shardus-core later

      // 1.2.3 migration starts
      validateActiveRequests: true, //new logic to prevent already active nodes from submitting active requests
      // set back to false in 1.6.0
      //continueOnException: true, //Allow nodes to contineue on unhandled exceptions if the network is low on nodes
      useSignaturesForAuth: true, //This is a major performance upgrade for p2p tell
      // 1.2.3 migration ends

      uniqueRemovedIds: true, //1.3.1 migration. enabled by default in 1.4.0
      useLruCacheForSocketMgmt: true,
      lruCacheSizeForSocketMgmt: 500,
      uniqueRemovedIdsUpdate: true, // To enable on 1.4.1
      instantForwardReceipts: true, // To enable on 1.5.3
      validateArchiverAppData: false, // To enable this on new reset network

      // 1.5.5 migration
      //Notes:
      // todo this flag needs to be implemented:
      // it should activate nodes writing the new hashes to the cycle record , but the
      // full logic will be enabled in 1.5.6
      writeSyncProtocolV2: true,

      // 1.5.6 migration
      useSyncProtocolV2: true,

      //1.6.0 migration
      continueOnException: false,
    },
  },
})

// rateLimiting and loadDetection settings
config = merge(config, {
  server: {
    rateLimiting: {
      limitRate: true,
      loadLimit: {
        internal: 0.8,
        external: 0.8,
        txTimeInQueue: 0.7,
        queueLength: 0.8,
        executeQueueLength: 0.8,
      },
    },
    loadDetection: {
      queueLimit: 400, // EXSS does the main limiting now queue limit is a secondary limit
      executeQueueLimit: 250,
      desiredTxTime: 30, // 15
      highThreshold: 0.5,
      lowThreshold: 0.2,
    },
  },
})

// Sharding and state manager settings
config = merge(config, {
  server: {
    sharding: {
      nodesPerConsensusGroup: process.env.nodesPerConsensusGroup
        ? parseInt(process.env.nodesPerConsensusGroup)
        : 128,
      nodesPerEdge: process.env.nodesPerEdge ? parseInt(process.env.nodesPerEdge) : 5,
      executeInOneShard: true,
    },
    stateManager: {
      accountBucketSize: 200, // todo: we need to re-test with higher numbers after some recent improvements
      includeBeforeStatesInReceipts: true, // 1.5.3 migration
    },
  },
})

// features
config = merge(config, {
  server: {
    features: {
      //1.1.3
      fixHomeNodeCheckForTXGroupChanges: true,
      //1.1.4
      archiverDataSubscriptionsUpdate: true,
      startInServiceMode: ShardeumFlags.startInServiceMode,
    },
  },
})

// Debug settings
config = merge(
  config,
  {
    server: {
      mode: 'release', // todo: must set this to "release" for public networks or get security on endpoints. use "debug"
      // for easier debugging
      debug: {
        startInFatalsLogMode: false, // true setting good for big aws test with nodes joining under stress.
        startInErrorLogMode: true,
        robustQueryDebug: false,
        fakeNetworkDelay: 0,
        disableSnapshots: true, // do not check in if set to false
        countEndpointStart: -1,
        hashedDevAuth: '',
        devPublicKey: '5aab34ddc09a479a835d26d5791dd8f54360cd09c58cd70cd7d818c1af9f8dad', //for production
        //devPublicKey: 'fe73383a971bd52be51c660cc9758c13763a7d804ee2062b6f7426698148240c', //old production
        //devPublicKey: '774491f80f47fedb119bb861601490f42bc3ea3b57fc63906c0d08e6d777a592', //for local test
        checkAddressFormat: false,
      },
    },
  },
  { arrayMerge: overwriteMerge }
)

export default config
