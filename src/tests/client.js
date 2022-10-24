const vorpal = require('vorpal')()
const crypto = require('@shardus/crypto-utils')
const axios = require('axios')
crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

let HOST = process.argv[2] || 'localhost:9001'
console.log(`Using ${HOST} as node for queries and transactions.`)

let testConfig = {
  server: {
    transactionExpireTime: 5,
    p2p: {
      syncLimit: 180,
      cycleDuration: 30,
      maxRejoinTime: 20,
      difficulty: 2,
      queryDelay: 1,
      gossipRecipients: 8,
      gossipFactor: 4,
      gossipStartSeed: 15,
      gossipSeedFallof: 15,
      gossipTimeout: 180,
      maxSeedNodes: 10,
      minNodesToAllowTxs: 3,
      minNodes: 15,
      maxNodes: 30,
      seedNodeOffset: 4,
      nodeExpiryAge: 30,
      maxJoinedPerCycle: 1,
      maxSyncingPerCycle: 5,
      maxRotatedPerCycle: 1,
      maxPercentOfDelta: 40,
      minScaleReqsNeeded: 5,
      maxScaleReqs: 200,
      scaleConsensusRequired: 0.25,
      amountToGrow: 1,
      amountToShrink: 1,
      startInWitnessMode: false,
    },
    reporting: {
      report: true,
      recipient: 'http://127.0.0.1:3000/api',
      interval: 2,
      console: false,
    },
    loadDetection: {
      queueLimit: 1000,
      desiredTxTime: 15,
      highThreshold: 0.5,
      lowThreshold: 0.2,
    },
    rateLimiting: {
      limitRate: true,
      loadLimit: {
        internal: 0.5,
        external: 0.4,
        txTimeInQueue: 0.2,
        queueLength: 0.2,
      },
    },
  },
}
const devAccount = {
  address: '62055d06f99210dbcb581c94e527862e67ffa1b402f277de30afe7cf995b9c05',
  keys: {
    publicKey: '62055d06f99210dbcb581c94e527862e67ffa1b402f277de30afe7cf995b9c05',
    secretKey:
      '293d6590182ac0ea7c2eca4f2b7855c47bb6072af2d2199167aebf25c5e9389662055d06f99210dbcb581c94e527862e67ffa1b402f277de30afe7cf995b9c05',
  },
}

function createAccount(keys = crypto.generateKeypair()) {
  return {
    address: keys.publicKey,
    keys,
  }
}

async function _sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function injectTx(tx) {
  try {
    const res = await axios.post(`http://${HOST}/inject`, tx)
    return res.data
  } catch (err) {
    return err.message
  }
}

vorpal
  .command('change config', 'Send a stringified JSON config object to be updated by shardus')
  .action(async function(args, callback) {
    const answers = await this.prompt([
      {
        type: 'number',
        name: 'cycle',
        message: 'Enter the cycle on which the change should take place (or "-1" for 3 cycles from now): ',
        default: -1,
        filter: value => parseInt(value),
      },
      {
        type: 'input',
        name: 'config',
        message: 'Enter the stringified JSON config object: ',
        default: '{ "p2p": { "minNodes": 50, "maxNodes": 500 } }', //JSON.stringify(testConfig),
      },
    ])
    try {
      this.log(JSON.parse(answers.config))
      const tx = {
        isInternalTx: true,
        internalTXType: 3,
        from: devAccount.address,
        cycle: answers.cycle,
        config: answers.config,
        timestamp: Date.now(),
      }
      crypto.signObj(tx, devAccount.keys.secretKey, devAccount.keys.publicKey)
      injectTx(tx).then(res => {
        this.log(res)
        callback()
      })
    } catch (err) {
      this.log(err.message, 'Using backup Json config file instead of the input that was given')
    }
  })

vorpal.delimiter('>').show()
vorpal.exec('change config')
