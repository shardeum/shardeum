import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { DevSecurityLevel } from '@shardus/core'
import { FilePaths } from '../shardeum/shardeumFlags';

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
      rotationEdgeToAvoid: number
      allowActivePerCycle: number
    }
    baseDir: string
    mode?: 'debug' | 'release'
  }
}

//TODO: improve typing here
let config: Config = {
  server: {
    globalAccount: '1000000000000000000000000000000000000000000000000000000000000001',
    baseDir: './',
  },
}

// eslint-disable-next-line security/detect-non-literal-fs-filename
if (fs.existsSync(path.join(process.cwd(), FilePaths.CONFIG))) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const fileConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), FilePaths.CONFIG)).toString())
  config = merge(config, fileConfig, { arrayMerge: overwriteMerge })
}

if (process.env.BASE_DIR) {
  const baseDir = process.env.BASE_DIR || '.'
  let baseDirFileConfig = {}

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (fs.existsSync(path.join(baseDir, FilePaths.CONFIG))) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    baseDirFileConfig = JSON.parse(fs.readFileSync(path.join(baseDir, FilePaths.CONFIG)).toString())
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
      baselineNodes: process.env.baselineNodes ? parseInt(process.env.baselineNodes) : 300, // config used for baseline for entering recovery, restore, and safety. Should be equivalient to minNodes on network startup
      minNodes: process.env.minNodes ? parseInt(process.env.minNodes) : 300,
      maxNodes: process.env.maxNodes ? parseInt(process.env.maxNodes) : 1100,
      maxJoinedPerCycle: 10,
      maxSyncingPerCycle: 10,
      maxRotatedPerCycle: process.env.maxRotatedPerCycle ? parseInt(process.env.maxRotatedPerCycle) : 1,
      firstCycleJoin: 0,
      maxSyncTimeFloor: 1200, //Using 6000 for a restore from archiver, then set config at runtime back to 1200
      //  1200=20 minutes.  If the network lives a long time we may have to bump this up
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

      // 1.9.1 migration
      standbyListFastHash: true,
      //1.9.4 avoid issues with lost archiver system:
      lostArchiversCyclesToWait: 1000000,

      // 1.10.0 restart
      networkBaselineEnabled: true, // when enabled, new p2p config `baselineNodes` is the threshold for going into restore, recovery, and safety mode

      // 1.10.0 todo podA smoke/functional test with these on:
      // numberOfNodesToInjectPenaltyTx: 5, //this may not need a change but we should probably go ahead and include it
      // enableLeftNetworkEarlySlashing: true,
      // enableSyncTimeoutSlashing: true,
      // enableNodeRefutedSlashing: true
      rotationCountMultiply: 3,
      // 1.10.0
      standbyListCyclesTTL: 1440, //nodes only need to refresh once every 24 hours (which is 1440 60s cycles!)

      // 1.10.1
      extraNodesToAddInRestart: 5, //how many extra nodes to we add in restart phase so we dont get stuck in restore phase
      // 1.10.1
      cyclesToWaitForSyncStarted: 5, //raising this to 5 to reduce the chance of nodes getting booted out too soon

      forcedMode: '', //change to 'safety` to force network into safety mode (other modes not implemented and will not force network mode)
      // 1.10.x ? dev test   needs migration to release
      useBinarySerializedEndpoints: true,
      // 1.10 x ? dev test   needs migration to release
      removeLostSyncingNodeFromList: true,

      //1.11.0
      rotationEdgeToAvoid: 2,
      allowActivePerCycle: 1,

      maxStandbyCount: 30000, //max allowed standby nodes count
      enableMaxStandbyCount: true,



    },
    features: {

      //This feature will restrict transactions to only coin transfers
      dappFeature1enabled : false,
    }
  },
})

// rateLimiting and loadDetection settings
config = merge(config, {
  server: {
      rateLimiting: {
        limitRate: true,
        loadLimit: {
          internal: 0.6,
          external: 0.6,
          txTimeInQueue: 0.6,
          queueLength: 0.6,
          executeQueueLength: 0.6,
        },
      },
      loadDetection: {
        queueLimit: 80, // EXSS does the main limiting now queue limit is a secondary limit
        executeQueueLimit: 80,
        desiredTxTime: 15, // 15
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
        : 10, //128 is the final goal
      nodesPerEdge: process.env.nodesPerEdge ? parseInt(process.env.nodesPerEdge) : 5,
      executeInOneShard: true,
    },
    stateManager: {
      accountBucketSize: 200, // todo: we need to re-test with higher numbers after some recent improvements
      includeBeforeStatesInReceipts: true, // 1.5.3 migration
      useNewPOQ: true, // 1.10.0 enabled required by archive server updates
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
        devPublicKeys: {
          // '': DevSecurityLevel.Unauthorized,
          // These are production keys.  Use 'git apply use_test_key.patch' for unsafe local test keys
          // Never merge a commit with changes to these lines without approval.
          'a45f9a87e10d6dbd88c141e4fb293f96ab30441cbb77a4b04c577ba18d393505': DevSecurityLevel.Low,
          'b51124e6d01e0684ff2b86eac9433d585a17319f15b393c8e4426af19117f704': DevSecurityLevel.Medium,
          //this last line needs command to ignore auto formatting or prettier will strip the quotes!!
          /* prettier-ignore */ 'c980f4dbdd40a9d334b3815b223e83d27e227892a109413e4bc114e8220bd281': DevSecurityLevel.High,
        },
        checkAddressFormat: true, //enabled for 1.10.0
        enableCycleRecordDebugTool: false, // only enable if you want to debug variant cycle records
      },
    },
  },
  { arrayMerge: overwriteMerge }
)

export default config
