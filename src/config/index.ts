import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'

const overwriteMerge = (target, source, options) => source

let config = { server: { baseDir: './' } }

if (fs.existsSync(path.join(process.cwd(), 'config.json'))) {
  const fileConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json')).toString())
  config = merge(config, fileConfig, { arrayMerge: overwriteMerge })
}

if (process.env.BASE_DIR) {
  let baseDir = process.env.BASE_DIR || '.'
  let baseDirFileConfig = {}

  if (fs.existsSync(path.join(baseDir, 'config.json'))) {
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
              port: 4000,
              publicKey: '758b1c119412298802cd28dbfa394cdfeecc4074492d60844cc192d632d84de3'
            }
          ]
        },
      }
    },
    { arrayMerge: overwriteMerge }
  )
}

if (process.env.APP_MONITOR) {
  config = merge(
    config,
    {
      server: {
        reporting: {
          recipient: `http://${process.env.APP_MONITOR}:3000/api`
        }
      }
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
          internalIp: process.env.APP_IP
        }
      }
    },
    { arrayMerge: overwriteMerge }
  )
}

// Setting minNodesToAllowTxs to 1 allow single node networks
config = merge(config, {
  server: {
    p2p: {
      cycleDuration: 60,
      minNodesToAllowTxs: 1,
      minNodes: process.env.minNodes ? parseInt(process.env.minNodes) : 30,
      maxNodes: 40,
      maxJoinedPerCycle: 2,
      maxSyncingPerCycle: 2, 
      maxRotatedPerCycle: process.env.maxRotatedPerCycle ? parseInt(process.env.maxRotatedPerCycle) : 1,
      firstCycleJoin: 1,
      maxSyncTimeFloor: 18000,
      syncBoostEnabled: false
    }
  }
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
        queueLength: 0.8
      }
    },
    loadDetection: {
      queueLimit: 100, //200 would be ideal at 25 tps but lowering it for now as we find the right network size
      desiredTxTime: 15,
      highThreshold: 0.5,
      lowThreshold: 0.2
    }
  }
})

// some sharding and state manager settings
config = merge(config, {
  server: {
    sharding: {
      nodesPerConsensusGroup: process.env.nodesPerConsensusGroup ? parseInt(process.env.nodesPerConsensusGroup) : 50,
      executeInOneShard: false
    },
    stateManager: {
      accountBucketSize: 200 //25
    }
  }
})

// // some storage settings. 
// config = merge(config, {
//   storage: {
//     saveOldDBFiles: false,
//     walMode: true,
//     exclusiveLockMode: true
//   }
// })

// some debug settings
config = merge(
  config,
  {
    server: {
      mode: 'debug', //TODO must set this to release for public networks or get security on endpoints
      debug: {
        startInFatalsLogMode: false, // true setting good for big aws test with nodes joining under stress.
        startInErrorLogMode: true,
        robustQueryDebug: true,
        fakeNetworkDelay: 0,
        disableSnapshots: true,// //dont check in if set to true
        countEndpointStart: -1,
        hashedDevAuth: '117151a0d719f329a4a570b4ccde4bbb1ec12fa6a7a870a1471ed170e7f08d70', //todo remove this after alpha 1.0
        devPublicKey:'774491f80f47fedb119bb861601490f42bc3ea3b57fc63906c0d08e6d777a592'
      }
    }
  },
  { arrayMerge: overwriteMerge }
)

export default config
