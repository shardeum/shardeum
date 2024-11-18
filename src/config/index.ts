import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { DevSecurityLevel } from '@shardus/core'
import { FilePaths } from '../shardeum/shardeumFlags'
import { Utils } from '@shardus/types'

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
    sharding?: {
      nodesPerConsensusGroup: number
    }
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
  const fileConfig = Utils.safeJsonParse(
    fs.readFileSync(path.join(process.cwd(), FilePaths.CONFIG)).toString()
  )
  config = merge(config, fileConfig, { arrayMerge: overwriteMerge })
}

if (process.env.BASE_DIR) {
  const baseDir = process.env.BASE_DIR || '.'
  let baseDirFileConfig = {}

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (fs.existsSync(path.join(baseDir, FilePaths.CONFIG))) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    baseDirFileConfig = Utils.safeJsonParse(fs.readFileSync(path.join(baseDir, FilePaths.CONFIG)).toString())
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
  const existingArchivers = Utils.safeJsonParse(process.env.EXISTING_ARCHIVERS)
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
      baselineNodes: process.env.baselineNodes ? parseInt(process.env.baselineNodes) : 640, // config used for baseline for entering recovery, restore, and safety. Should be equivalient to minNodes on network startup
      minNodes: process.env.minNodes ? parseInt(process.env.minNodes) : 640,
      maxNodes: process.env.maxNodes ? parseInt(process.env.maxNodes) : 1100,
      maxJoinedPerCycle: 10,
      maxSyncingPerCycle: 10,
      maxRotatedPerCycle: process.env.maxRotatedPerCycle ? parseInt(process.env.maxRotatedPerCycle) : 1,
      firstCycleJoin: 0,
      maxSyncTimeFloor: 10000, //Using 6000 for a restore from archiver, then set config at runtime back to 1200
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
      rotationCountMultiply: 3,
      // 1.10.0
      standbyListCyclesTTL: 1440, //nodes only need to refresh once every 24 hours (which is 1440 60s cycles!)

      // 1.10.1
      extraNodesToAddInRestart: 5, //how many extra nodes to we add in restart phase so we dont get stuck in restore phase
      // 1.10.1
      cyclesToWaitForSyncStarted: 5, //raising this to 5 to reduce the chance of nodes getting booted out too soon

      forcedMode: '', //change to 'safety` to force network into safety mode (other modes not implemented and will not force network mode)
      // 1.10.x ? dev test   needs migration to release
      // 1.10 x ? dev test   needs migration to release
      removeLostSyncingNodeFromList: true,

      //1.11.0
      rotationEdgeToAvoid: 0, //we are moving away from this feature in current testing.  There seem to be errors related to it
      allowActivePerCycle: 1,

      maxStandbyCount: 30000, //max allowed standby nodes count
      enableMaxStandbyCount: true,

      formingNodesPerCycle: 16, //how many nodes can be add in a cycle while in forming mode

      downNodeFilteringEnabled: false, //turning down node filtering off for diagnostics purposes
    },
    features: {
      //This feature will restrict transactions to only coin transfers
      dappFeature1enabled: true, //enabled for betanext 1.11.0
    },
  },
})

// rateLimiting and loadDetection settings
config = merge(config, {
  server: {
    rateLimiting: {
      limitRate: true,
      //check out isOverloaded and getWinningLoad to see how these work
      //what ever value is the highest is used to reject TXs at a sliding rate
      //i.e. if the limit is 0.6  and the load is 0.7 then we will reject 25% of TXs randomly (because that is 25% of the way to 1.0 from 0.6)
      //     when they get to 1.0 load (the max) they will reject 100% of TXs
      loadLimit: {
        //these are multipliers for internal and external factors
        internal: 0.6,
        external: 0.6,
        //these are multipliers three external load factors that can influence network scale up/down votes
        //however these multipler are used for rate limiting and it is highThreshold / lowThreshold that are used for voting
        //having a super fast computer will not impact this, it is about the collaborative health of the network based on
        //what is in our queue.  even though our queue may be different than other node it is similar because of overalp in
        //dynamic sharding ranges
        txTimeInQueue: 0.6,
        queueLength: 0.6,
        executeQueueLength: 0.6,
      },
    },
    loadDetection: {
      queueLimit: 320, // EXSS does the main limiting now queue limit is a secondary limit.  It should be higher that the exeutute queue limit
      executeQueueLimit: 160, // This limit how many items can be in the queue that will execute (apply) on our node
      // Example: if you a have a limit of 160 and we expect TXs to take 4 sec in consensus after a 6 second wait
      // then we look at 160 / 10 to see that 10tps sustained or more will give us a 1.0 load.
      // note that executeQueueLength value of 0.6 means we start rejecting TXs at 60% of the limit
      desiredTxTime: 10000000, // this is the average age of a TX in the queue.  we will only detect this if there are at least 20 txes in the queue
      highThreshold: 0.5, // This is mainly used to detect if any of our three parameters above are getting too high
      // if any of the three external load factors are above highload we will raise a high load
      // event and vote to the network if we are in the voter set for that cycle
      // if enough nodes vote or up, then desired node count will go up (although there is a limit based on current active nodes)
      lowThreshold: 0.2, // similar to highThreshold but for low values.
      // load below this will trigger a network scale down vote.
    },
  },
})

// Sharding and state manager settings
config = merge(config, {
  server: {
    sharding: {
      nodesPerConsensusGroup: process.env.nodesPerConsensusGroup
        ? parseInt(process.env.nodesPerConsensusGroup)
        : 128, //128 is the final goal
      nodesPerEdge: process.env.nodesPerEdge ? parseInt(process.env.nodesPerEdge) : 5,
      executeInOneShard: true,
    },
    stateManager: {
      accountBucketSize: 500, // todo: we need to re-test with higher numbers after some recent improvements
      includeBeforeStatesInReceipts: true, // 1.5.3 migration
      useNewPOQ: false, // 1.10.0 enabled required by archive server updates

      forwardToLuckyNodes: false, // 1.11.0 we seem to have more issues with this on.  can turn off for local testing

      removeStuckTxsFromQueue: true,
      removeStuckTxsFromQueue3: true,

      removeStuckChallengedTXs: false,

      stuckTxMoveTime: 3600000,

      stuckTxRemoveTime: 600000, // 10 min
      stuckTxRemoveTime3: 300000, // 5 min

      awaitingDataCanBailOnReceipt: true,
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
        startInFatalsLogMode: true, // true setting good for big aws test with nodes joining under stress.
        startInErrorLogMode: false,
        verboseNestedCounters: false,
        robustQueryDebug: false,
        fakeNetworkDelay: 0,
        disableSnapshots: true, // do not check in if set to false
        countEndpointStart: -1,
        hashedDevAuth: '',
        devPublicKeys: {
          // '': DevSecurityLevel.Unauthorized,
          // These are production keys.  Use 'git apply use_test_key.patch' for unsafe local test keys
          // Never merge a commit with changes to these lines without approval.
          // always prefix with prettier ignore
          /* prettier-ignore */ 'cd38e866813e063423adf2b1bb7608eef7f62c306c3b8007db925a6aafb3c0f5': DevSecurityLevel.High,
          /* prettier-ignore */ '1bc657b085acb240d8315857a1a1c532571e47d409c1bddd8d071b2af530c2be': DevSecurityLevel.High,
          /* prettier-ignore */ '79fadced0d463a88d837485228004a0671c9baa2ff24ec6251b569a5bc0abc3e': DevSecurityLevel.High,
          /* prettier-ignore */ '3cf4dbef2221dc855921886ab60b6d44fccbb3a6a767eac4919e2c84d43e1c28': DevSecurityLevel.High,
          /* prettier-ignore */ 'e7849fa46ebe9e2091599d12e5c11c8fcf9051633065348b05ab7adf0962f192': DevSecurityLevel.High,
          /* prettier-ignore */ '3b974180cbbf1d680a6ef5a6a21b3eb62ae45b15bf5debb9d9f8b6edf0dd5da6': DevSecurityLevel.High,
          /* prettier-ignore */ '3cbc079e9b44ba215256444433314262a8e1d342d37b4e8c0c9ab27e78dad167': DevSecurityLevel.High,
          /* prettier-ignore */ '23526214a0325ef9a3fd53b7067c7a138d7bc3c6e78b907a15af793f971028ec': DevSecurityLevel.High,
          /* prettier-ignore */ 'fe60d9a1d0ead0132a0dceb82bd6faf9b1b509a08769e83e500a12ae0ae8d1d5': DevSecurityLevel.High,
          /* prettier-ignore */ '230b6172aba54d592171bd3f2a599f5688b1447fb636eedbc39298ab7d9c05c2': DevSecurityLevel.High,
          /* prettier-ignore */ '971ebbe78cce7bfa0ada5a7a0810c53ff72287e91b2f43bea3703409005590cf': DevSecurityLevel.High,
          /* prettier-ignore */ '4ce16834c272a5db61ca34a93d1dfa86ae9355fabef9f1af7b6e0d8e4a5aa0ab': DevSecurityLevel.High,
          /* prettier-ignore */ '02c8a6d5360bdb886dbd9dfa0ec73e23c32be98fb9745a0ba9d63b54af04859d': DevSecurityLevel.High,
          /* prettier-ignore */ '343fcbcc4191b312120e45d2f190d44ca8696f2777dfcc8b6c2ac6756abc2671': DevSecurityLevel.High,
          /* prettier-ignore */ 'caf005faf809f70533356218539c9041f2f8ac8a3e0c86507727fda035b5b5bf': DevSecurityLevel.High,
          /* prettier-ignore */ '13e2c5b6990b92d769239bc289a57246d4c000bf1f2c3f426c24b8eaac78f21c': DevSecurityLevel.High,
          /* prettier-ignore */ '8999bd238993c42921528b333774c54410d2d48606e54e58d798241f6942aabf': DevSecurityLevel.High,
          /* prettier-ignore */ 'd5b9be544b7f6d119ea52ce7f82870d4249ad663f0a75e68096df44c7843a9f8': DevSecurityLevel.High,
          /* prettier-ignore */ '1337e51d288a6ae240c5e91ecffba812d6baff3d643de559604a8f13d63f03d9': DevSecurityLevel.High,
          /* prettier-ignore */ '5988415bc8675f94e0059099ddf1c414ca737562f33e6f1091e8fee307d3352c': DevSecurityLevel.High,
          /* prettier-ignore */ '000aa90686097de101bb5fad9cc4af6ccf568b4612d8dd032497a8ac9ccba91f': DevSecurityLevel.High,
          /* prettier-ignore */ '4347a51c55921f7ffdf00ebc84d0849598a59fc9eb244bcbf5a4e26abad0a005': DevSecurityLevel.High,
          /* prettier-ignore */ '3dfb1794a88ad3c19b63b9ef2006d45f7c01acedd7795908457f1470f8d10d2f': DevSecurityLevel.High,
          /* prettier-ignore */ 'b17be71f65ec9804404de1333a93132b83a1d614a3d14a78db5c7e3219e49524': DevSecurityLevel.High,
          /* prettier-ignore */ '26c333f353c06766cf811ba97572409848c90fb66291d8ef91e25c4d1bf439c7': DevSecurityLevel.High,
          /* prettier-ignore */ 'abb118e65bbd834d3f9c3135f72a3ed883b5c3b85c9e4a647b142f2824663e20': DevSecurityLevel.High,
          /* prettier-ignore */ '154cca8f6394fe43a08b579a4fd5fc666cf69b2b1f54364790f35bf4d612cf66': DevSecurityLevel.High,
          // always prefix with prettier ignore
        },
        multisigKeys: {
          // always prefix with prettier ignore
          /* prettier-ignore */ '0x002D3a2BfE09E3E29b6d38d58CaaD16EEe4C9BC5': DevSecurityLevel.High,
          /* prettier-ignore */ '0x0a0844DA5e01E391d12999ca859Da8a897D5979A': DevSecurityLevel.High,
          /* prettier-ignore */ '0x390878B18DeBe2A9f0d5c0252a109c84243D3beb': DevSecurityLevel.High,
          /* prettier-ignore */ '0x32B6f2C027D4c9D99Ca07d047D17987390a5EB39': DevSecurityLevel.High,
          /* prettier-ignore */ '0x80aF8E195B56aCC3b4ec8e2C99EC38957258635a': DevSecurityLevel.High,
          /* prettier-ignore */ '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6': DevSecurityLevel.High,
          /* prettier-ignore */ '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00': DevSecurityLevel.High,
          /* prettier-ignore */ '0x4ed5C053BF2dA5F694b322EA93dce949F3276B85': DevSecurityLevel.High,
          /* prettier-ignore */ '0xd31aBC7497aD8bC9fe8555C9eDe45DFd7FB3Bf6F': DevSecurityLevel.High,
          /* prettier-ignore */ '0xe7e4cc292b424C6D50d16F1Bb5BAB2032c486980': DevSecurityLevel.High,
          /* prettier-ignore */ '0xD815DA50966c19261B34Ffa3bE50A30A67D97456': DevSecurityLevel.High,
          /* prettier-ignore */ '0xE856B2365641eba73Bc430AAC1E8F930dA513D9D': DevSecurityLevel.High,
          /* prettier-ignore */ '0x8282F755e784414697421D4b59232E5d194e2262': DevSecurityLevel.High,
          /* prettier-ignore */ '0x353Ad64Df4fAe5EffF717A1c41BE6dEBee543129': DevSecurityLevel.High,
          /* prettier-ignore */ '0x9Ce1C3c114538c625aA2488b97fEb3723fdBB07B': DevSecurityLevel.High,
          /* prettier-ignore */ '0x6A83e4e4eB0A2c8f562db6BB64b02a9A6237B314': DevSecurityLevel.High,
          /* prettier-ignore */ '0x92E375E0c76CaE76D9DfBab17EE7B3B4EE407715': DevSecurityLevel.High,
          /* prettier-ignore */ '0xBD79B430CA932e2D89bb77ACaE7367a07471c2eA': DevSecurityLevel.High,
          /* prettier-ignore */ '0xEbe173a837Bc30BFEF6E13C9988a4771a4D83275': DevSecurityLevel.High,
          /* prettier-ignore */ '0xfF2b584A947182c55BBc039BEAB78BC201D3AdDe': DevSecurityLevel.High,
          /* prettier-ignore */ '0xCeA068d8DCB4B4020D30a9950C00cF8408611F67': DevSecurityLevel.High,
          /* prettier-ignore */ '0x52F8d3DaA7b5FF25ca2bF7417E059aFe0bD5fB0E': DevSecurityLevel.High,
          /* prettier-ignore */ '0x0341996A92193d8B7d80C4774fA2eff889e4b427': DevSecurityLevel.High,
          /* prettier-ignore */ '0xF82BDA6Ef512e4219C6DCEea896E50e8180a5bff': DevSecurityLevel.High,
          /* prettier-ignore */ '0xA04A1B214a2537139fE59488820D4dA06516933f': DevSecurityLevel.High,
          /* prettier-ignore */ '0x550817e7B91244BBeFE2AD621ccD555A16B00405': DevSecurityLevel.High,
          /* prettier-ignore */ '0x84C55a4bFfff1ADadb9C46e2B60979F519dAf874': DevSecurityLevel.High,
          /* prettier-ignore */ '0x4563303BCE96D3f8d9C7fB94b36dfFC9d831871d': DevSecurityLevel.High,
          /* prettier-ignore */ '0xdA058F9c7Ce86C1D21DD5DBDeBad5ab5c785520a': DevSecurityLevel.High,
          // always prefix with prettier ignore
        },
        checkAddressFormat: true, //enabled for 1.10.0
        enableCycleRecordDebugTool: false, // only enable if you want to debug variant cycle records
        enableScopedProfiling: false,
        minMultiSigRequiredForEndpoints: 1,
        minMultiSigRequiredForGlobalTxs: 1,
      },
    },
  },
  { arrayMerge: overwriteMerge }
)

export default config
