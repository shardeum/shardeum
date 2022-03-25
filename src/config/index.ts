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
  let baseDirFileConfig

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
          cycleDuration: 30,
          maxJoinedPerCycle: 5,
          maxRotatedPerCycle: 0,
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
      minNodes: 50,
      maxNodes: 50,
      maxJoinedPerCycle: 6,
      maxSyncingPerCycle: 12,
      maxRotatedPerCycle: 1,
      firstCycleJoin: 10
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
    loadDetection : {
      queueLimit: 100, //200 would be ideal at 25 tps but lowering it for now as we find the right network size
      desiredTxTime: 15,
      highThreshold: 0.5,
      lowThreshold: 0.2
    }
  }
})

config = merge(config, {
  server: {
    sharding: {
      nodesPerConsensusGroup: 30
    }
  }
})

// some debug settings
config = merge(
  config,
  {
    server: {
      mode: 'debug',
      debug: {
        startInFatalsLogMode: false, // true setting good for big aws test with nodes joining under stress.
        startInErrorLogMode: true,
        fakeNetworkDelay: 0,
        disableSnapshots: false,
        countEndpointStart: -1
      }
    }
  },
  { arrayMerge: overwriteMerge }
)

export default config
