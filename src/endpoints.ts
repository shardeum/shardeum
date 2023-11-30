import { exec } from 'child_process'
import { arch, cpus, freemem, totalmem, platform } from 'os'
import { stringify } from './utils/stringify'
import {
  Account,
  Address,
  bytesToHex,
  toBytes,
} from '@ethereumjs/util'
import { ShardeumFlags, updateServicePoints, updateShardeumFlag } from './shardeum/shardeumFlags'
import { EVM as EthereumVirtualMachine } from './evm_v2'
import { EVMResult } from './evm_v2/types'
import 'dotenv/config'
import { nestedCountersInstance, ShardusTypes, Shardus } from '@shardus/core'
import {
  AccountType,
  WrappedEVMAccount,
} from './shardeum/shardeumTypes'
import { toShardusAddress, toShardusAddressWithKey } from './shardeum/evmAddress'
import {
  fixDeserializedWrappedEVMAccount,
} from './shardeum/wrappedEVMAccountFunctions'
import {
  replacer,
  SerializeToJsonString,
  _readableSHM,
  scaleByStabilityFactor,
  debug_map_replacer,
  formatErrorMessage,
  calculateGasPrice,
  isStakingEVMTx,
} from './utils'
import * as AccountsStorage from './storage/accountStorage'
import { Response } from 'express'
import {
  CertSignaturesResult,
  queryCertificateHandler,
  ValidatorError,
} from './handlers/queryCertificate'
import {
  isInternalTx,
} from './setup/helpers'
import { unsafeGetClientIp } from './utils/requests'
import { oneSHM } from './shardeum/shardeumConstants'
import { PutAdminCertResult, putAdminCertificateHandler } from './handlers/adminCertificate'
import { Request } from 'express-serve-static-core'
import { accountInvolvedNoOp, accountMissNoOp, blocks, blocksByHash, contractStorageInvolvedNoOp, contractStorageMissNoOp, debugAppdata, ERC20TokenBalanceMap, ERC20_BALANCEOF_CODE, estimateGas, evmCommon, generateAccessList, genesisAccounts, getIsReadyToJoinLatestValue, getLatestBlock, getShardeumStateTXMap, getShardusAddressToEVMAccountInfo, getTransactionObj, logFlags, monitorEventCBNoOp, readableBlocks, setAdminCert, setStakeCert, shardeumGetTime, tryGetRemoteAccountCB, _internalHackPostWithResp } from '.'
import { ShardeumState, TransactionState } from './state'

/***
 *    ######## ##    ## ########  ########   #######  #### ##    ## ########  ######
 *    ##       ###   ## ##     ## ##     ## ##     ##  ##  ###   ##    ##    ##    ##
 *    ##       ####  ## ##     ## ##     ## ##     ##  ##  ####  ##    ##    ##
 *    ######   ## ## ## ##     ## ########  ##     ##  ##  ## ## ##    ##     ######
 *    ##       ##  #### ##     ## ##        ##     ##  ##  ##  ####    ##          ##
 *    ##       ##   ### ##     ## ##        ##     ##  ##  ##   ###    ##    ##    ##
 *    ######## ##    ## ########  ##         #######  #### ##    ##    ##     ######
 */
//
// grab this
const pointsAverageInterval = 2 // seconds

const servicePointSpendHistory: { points: number; ts: number }[] = []
let debugLastTotalServicePoints = 0

//debug map of map. The outer key is the service point type, the inner key is the request ip, the value is the number of points spent
const debugServicePointSpendersByType: Map<string, Map<string, number>> = new Map()
//debug map of service point types and the number of points spent
const debugServicePointsByType: Map<string, number> = new Map()
//total number of service points spent, since we last cleared or started the capturing data
let debugTotalServicePointRequests = 0

const ERC20TokenCacheSize = 1000

export const configShardusEndpoints = (shardus: Shardus): Shardus => {
  const debugMiddleware = shardus.getDebugModeMiddleware()

  //TODO request needs a signature and a timestamp.  or make it a real TX from a faucet account..
  //?id=<accountID>
  // shardus.registerExternalGet('faucet-all', debugMiddleware, async (req, res) => {
  //   let id = req.query.id as string
  //   if (!id) return res.json({ success: false, result: 'id is not defined!' })
  //   if (!isValidAddress(id)) return res.json({ success: false, result: 'Address format is wrong!' })
  //   setupTester(id)
  //   try {
  //     let activeNodes = shardus.p2p.state.getNodes()
  //     if (activeNodes) {
  //       for (let node of activeNodes.values()) {
  //         _internalHackGet(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}`)
  //         res.write(`${node.externalIp}:${node.externalPort}/faucet-one?id=${id}\n`)
  //       }
  //     }
  //     res.write(`sending faucet request to all nodes\n`)
  //   } catch (e) {
  //     res.write(`${e}\n`)
  //   }
  //   res.end()
  // })
  //
  // //TODO request needs a signature and a timestamp
  // shardus.registerExternalGet('faucet-one', debugMiddleware, async (req, res) => {
  //   let id = req.query.id as string
  //   if (!id) return res.json({ success: false, result: 'id is not defined!' })
  //   if (!isValidAddress(id)) return res.json({ success: false, result: 'Address format is wrong!' })
  //   setupTester(id)
  //   return res.json({ success: true })
  // })

  let motdCount = 0
  shardus.registerExternalGet('motd', async (_req, res) => {
    motdCount++
    // let localCount = 0
    // await sleep(1000)
    // localCount++
    // await sleep(1000)
    // localCount++
    // await sleep(1000)
    // localCount++
    // await sleep(1000)
    // localCount++
    // await sleep(1000)
    // localCount++
    // await sleep(1000)
    // localCount++

    //unofficial version number, may not be maintained always.  used for debug
    return res.json({ version: '1.4.2.0', date: '20230623', note: '', motd: `${motdCount}` })
  })

  shardus.registerExternalGet('debug-points', debugMiddleware, async (req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }

    const points = Number(req.query.points ?? ShardeumFlags.ServicePoints['debug-points'])
    if (trySpendServicePoints(points, null, 'debug-points') === false) {
      return res.json({ error: 'node busy', points, servicePointSpendHistory, debugLastTotalServicePoints })
    }

    return res.json(
      `spent points: ${points} total:${debugLastTotalServicePoints}  ${stringify(servicePointSpendHistory)} `
    )
  })

  shardus.registerExternalGet('debug-point-spenders', debugMiddleware, async (_req, res) => {
    const debugObj = {
      debugTotalPointRequests: debugTotalServicePointRequests,
      debugServiePointByType: debugServicePointsByType,
      debugServiePointSpendersByType: debugServicePointSpendersByType,
    }
    res.write(JSON.stringify(debugObj, debug_map_replacer, 2))
    res.end()
    return
  })

  shardus.registerExternalGet('debug-point-spenders-clear', debugMiddleware, async (_req, res) => {
    const totalSpends = debugTotalServicePointRequests
    debugTotalServicePointRequests = 0
    debugServicePointSpendersByType.clear()
    debugServicePointsByType.clear()
    return res.json(`point spenders cleared. totalSpendActions: ${totalSpends} `)
  })

  shardus.registerExternalPost('inject', async (req, res) => {
    const tx = req.body
    if (ShardeumFlags.VerboseLogs) console.log('Transaction injected:', new Date(), tx)

    let numActiveNodes = 0
    try {
      // Reject transaction if network is paused
      const networkAccount = AccountsStorage.cachedNetworkAccount
      if (networkAccount == null || networkAccount.current == null) {
        return res.json({
          success: false,
          reason: `Node not ready for inject, waiting for network account data.`,
          status: 500,
        })
      }

      if (networkAccount.current.txPause && !isInternalTx(tx)) {
        return res.json({
          success: false,
          reason: `Network will not accept EVM tx until it has at least ${ShardeumFlags.minNodesEVMtx} active node in the network. numActiveNodes: ${numActiveNodes}`,
          status: 500,
        })
      }

      numActiveNodes = shardus.getNumActiveNodes()
      let belowEVMtxMinNodes = numActiveNodes < ShardeumFlags.minNodesEVMtx
      let txRequiresMinNodes = false

      if (ShardeumFlags.checkNodesEVMtx === false) {
        //if this feature is not enabled, then we will short circuit the below checks
        belowEVMtxMinNodes = false
      }

      //only run these checks if we are below the limit
      if (belowEVMtxMinNodes) {
        const isInternal = isInternalTx(tx)
        let isStaking = false
        let isAllowedInternal = false
        if (isInternal) {
          //todo possibly later limit what internal TXs are allowed
          isAllowedInternal = true
        } else {
          const transaction = getTransactionObj(tx)
          if (transaction != null) {
            isStaking = isStakingEVMTx(transaction)
          }
        }
        txRequiresMinNodes = (isStaking || isAllowedInternal) === false
      }

      if (belowEVMtxMinNodes && txRequiresMinNodes) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Transaction reject due to min active requirement does not meet , numActiveNodes ${numActiveNodes} < ${ShardeumFlags.minNodesEVMtx} `)
        /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum', `txRejectedDueToMinActiveNodes :${numActiveNodes}`)
        res.json({
          success: false,
          reason: `Network will not accept EVM tx until it has at least ${ShardeumFlags.minNodesEVMtx} active node in the network. numActiveNodes: ${numActiveNodes}`,
          status: 500,
        })
      } else {
        //normal case, we will put this transaction into the shardus queue
        const response = await shardus.put(tx)
        res.json(response)
      }
    } catch (err) {
      if (ShardeumFlags.VerboseLogs) console.log('Failed to inject tx: ', err)
      try {
        res.json({
          success: false,
          reason: `Failed to inject tx:  ${formatErrorMessage(err)}`,
          status: 500,
        })
      } catch (e) {
        /* prettier-ignore */ if (logFlags.error) console.log('Failed to respond to inject tx: ', e)
      }
    }
  })

  shardus.registerExternalGet('eth_blockNumber', async (_req, res) => {
    const latestBlock = getLatestBlock()
    if (ShardeumFlags.VerboseLogs) console.log('Req: eth_blockNumber')
    return res.json({ blockNumber: latestBlock ? '0x' + latestBlock.toString(16) : '0x0' })
  })

  shardus.registerExternalGet('eth_getBlockHashes', async (req, res) => {
    const latestBlock = getLatestBlock()

    let fromBlock: string | number = req.query.fromBlock as string
    let toBlock: string | number = req.query.toBlock as string

    if (fromBlock == null) return res.json({ error: 'Missing fromBlock' })
    if (typeof fromBlock === 'string') fromBlock = parseInt(fromBlock)
    if (fromBlock < latestBlock - ShardeumFlags.maxNumberOfOldBlocks) {
      // return max 100 blocks
      fromBlock = latestBlock - ShardeumFlags.maxNumberOfOldBlocks + 1 // 1 is added for safety
    }
    if (toBlock == null) toBlock = latestBlock
    if (typeof toBlock === 'string') fromBlock = parseInt(toBlock)
    if (toBlock > latestBlock) toBlock = latestBlock

    const blockHashes = []
    for (let i = fromBlock; i <= toBlock; i++) {
      const block = readableBlocks[i]
      if (block) blockHashes.push(block.hash)
    }
    return res.json({ blockHashes, fromBlock, toBlock })
  })

  shardus.registerExternalGet('eth_getBlockByNumber', async (req, res) => {
    const latestBlock = getLatestBlock()

    let blockNumber: number | string
    if (typeof req.query.blockNumber === 'string' || typeof req.query.blockNumber === 'number') {
      blockNumber = req.query.blockNumber
    }
    if (blockNumber === 'latest') blockNumber = latestBlock
    if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByNumber', blockNumber)
    if (blockNumber == null) {
      return res.json({ error: 'Invalid block number' })
    }
    return res.json({ block: readableBlocks[blockNumber] }) // eslint-disable-line security/detect-object-injection
  })

  shardus.registerExternalGet('eth_getBlockByHash', async (req, res) => {
    const latestBlock = getLatestBlock()

    /* eslint-disable security/detect-object-injection */
    let blockHash = req.query.blockHash
    if (blockHash === 'latest') blockHash = readableBlocks[latestBlock].hash
    if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByHash', blockHash)
    let blockNumber: number
    if (typeof blockHash === 'string') blockNumber = blocksByHash[blockHash]
    return res.json({ block: readableBlocks[blockNumber] })
    /* eslint-enable security/detect-object-injection */
  })

  shardus.registerExternalGet('stake', async (_req, res) => {
    try {
      const stakeRequiredUsd = AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
      const stakeRequired = scaleByStabilityFactor(stakeRequiredUsd, AccountsStorage.cachedNetworkAccount)
      if (ShardeumFlags.VerboseLogs) console.log('Req: stake requirement', _readableSHM(stakeRequired))
      return res.json(JSON.parse(stringify({ stakeRequired, stakeRequiredUsd })))
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log(`Error /stake`, e)
      return res.status(500).send(e.message)
    }
  })

  shardus.registerExternalGet('dumpStorage', debugMiddleware, async (req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }

    let id: string
    try {
      id = req.query.id as string
      const addr = Address.fromString(id)
      if (addr == null) {
        return res.json(`dumpStorage: ${id} addr == null`)
      }

      //no longer storing tries in shardeumState, and there is more than one shardeum state now

      const storage = {} //await shardeumStateManager.dumpStorage(addr)
      return res.json(storage)
    } catch (err) {
      //if(ShardeumFlags.VerboseLogs) console.log( `dumpStorage: ${id} `, err)

      return res.json(`dumpStorage: ${id} ${err}`)
    }
  })

  shardus.registerExternalGet('dumpAddressMap', debugMiddleware, async (_req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }

    try {
      //use a replacer so we get the map:
      const shardusAddressToEVMAccountInfo = getShardusAddressToEVMAccountInfo();
      const output = JSON.stringify(shardusAddressToEVMAccountInfo, replacer, 4)
      res.write(output)
      res.end()
      return
      //return res.json(transactionStateMap)
    } catch (err) {
      return res.json(`dumpAddressMap: ${err}`)
    }
  })

  shardus.registerExternalGet('dumpShardeumStateMap', debugMiddleware, async (_req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }
    try {
      //use a replacer so we get the map:
      //let output = stringify(shardeumStateTXMap, replacer, 4)
      const shardeumStateTXMap = getShardeumStateTXMap()
      const output = `tx shardeumState count:${shardeumStateTXMap.size}`
      res.write(output)
      res.end()
      return
      //return res.json(transactionStateMap)
    } catch (err) {
      return res.json(`dumpShardeumStateMap: ${err}`)
    }
  })

  shardus.registerExternalGet('debug-shardeum-flags', debugMiddleware, async (_req, res) => {
    try {
      return res.json({ ShardeumFlags })
    } catch (e) {
      /* prettier-ignore */ if (logFlags.error) console.log(e)
      return { error: e.message }
    }
  })

  shardus.registerExternalGet('debug-set-shardeum-flag', debugMiddleware, async (req, res) => {
    let value: string
    let key: string
    try {
      key = req.query.key as string
      value = req.query.value as string
      if (value == null) {
        return res.json(`debug-set-shardeum-flag: ${value} == null`)
      }

      let typedValue: boolean | number | string

      if (value === 'true') typedValue = true
      else if (value === 'false') typedValue = false
      else if (!Number.isNaN(Number(value))) typedValue = Number(value)

      // hack to make txFee works with bn.js
      if (key === 'constantTxFee') value = String(value)

      updateShardeumFlag(key, typedValue)

      return res.json({ [key]: ShardeumFlags[key] }) // eslint-disable-line security/detect-object-injection
    } catch (err) {
      return res.json(`debug-set-shardeum-flag: ${key} ${err.message} `)
    }
  })
  shardus.registerExternalGet('debug-set-service-point', debugMiddleware, async (req, res) => {
    let value: string
    let key1: string
    let key2: string
    try {
      key1 = req.query.key1 as string
      key2 = req.query.key2 as string
      value = req.query.value as string
      if (value == null) {
        return res.json(`debug-set-service-point: ${value} == null`)
      }
      if (Number.isNaN(Number(value))) {
        /* prettier-ignore */ if (logFlags.error) console.log(`Invalid service point`, value)
        return res.json({ error: `Invalid service point` })
      }

      const typedValue = Number(value)

      updateServicePoints(key1, key2, typedValue)

      return res.json({ ServicePoints: ShardeumFlags['ServicePoints'] })
    } catch (err) {
      return res.json(`debug-set-service-point: ${value} ${err}`)
    }
  })

  shardus.registerExternalGet('account/:address', async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['account/:address'], req, 'account') === false) {
      return res.json({ error: 'node busy' })
    }

    try {
      if (!req.query.type) {
        const id = req.params['address']
        const shardusAddress = toShardusAddress(id, AccountType.Account)
        const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
        if (!account) {
          return res.json({ account: null })
        }
        const data = account.data as WrappedEVMAccount
        fixDeserializedWrappedEVMAccount(data)
        const readableAccount = await getReadableAccountInfo(data)
        if (readableAccount) return res.json({ account: readableAccount })
        else res.json({ account: JSON.parse(stringify(data)) })
      } else {
        let accountType: number
        if (typeof req.query.type === 'string') accountType = parseInt(req.query.type)
        const id = req.params['address']
        const shardusAddress = toShardusAddressWithKey(id, '', accountType)
        const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
        const readableAccount = JSON.parse(stringify(account))
        return res.json({ account: readableAccount })
      }
    } catch (error) {
      res.json({ error })
    }
  })

  shardus.registerExternalGet('eth_getCode', async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['eth_getCode'], req, 'account') === false) {
      return res.json({ error: 'node busy' })
    }

    try {
      const address = req.query.address as string
      const shardusAddress = toShardusAddress(address, AccountType.Account)
      const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
      if (!account || !account.data) {
        return res.json({ contractCode: '0x' })
      }
      const wrappedEVMAccount = account.data as WrappedEVMAccount

      fixDeserializedWrappedEVMAccount(wrappedEVMAccount)

      const codeHashHex = bytesToHex(wrappedEVMAccount.account.codeHash)
      const codeAddress = toShardusAddressWithKey(address, codeHashHex, AccountType.ContractCode)
      const codeAccount = await shardus.getLocalOrRemoteAccount(codeAddress)

      const wrappedCodeAccount = codeAccount.data as WrappedEVMAccount
      fixDeserializedWrappedEVMAccount(wrappedCodeAccount)
      const contractCode = wrappedCodeAccount ? bytesToHex(wrappedCodeAccount.codeByte) : '0x'
      return res.json({ contractCode })
    } catch (error) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('eth_getCode: ' + formatErrorMessage(error))
      res.json({ error })
    }
  })

  shardus.registerExternalGet('eth_gasPrice', async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['eth_gasPrice'], req, 'account') === false) {
      return res.json({ error: 'node busy' })
    }

    try {
      const result = calculateGasPrice(
        ShardeumFlags.baselineTxFee,
        ShardeumFlags.baselineTxGasUsage,
        AccountsStorage.cachedNetworkAccount
      )
      return res.json({ result: `0x${result.toString(16)}` })
    } catch (error) {
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('eth_gasPrice: ' + formatErrorMessage(error))
      res.json({ error })
    }
  })

  // shardus.registerExternalPost('eth_estimateGas', async (req, res) => {
  //   try {
  //     const transaction = req.body
  //     let address = toShardusAddress(transaction.to, AccountType.Account)
  //     let ourNodeShardData = shardus.stateManager.currentCycleShardData.nodeShardData
  //     let minP = ourNodeShardData.consensusStartPartition
  //     let maxP = ourNodeShardData.consensusEndPartition
  //     let { homePartition } = __ShardFunctions.addressToPartition(shardus.stateManager.currentCycleShardData.shardGlobals, address)
  //     let accountIsRemote = __ShardFunctions.partitionInWrappingRange(homePartition, minP, maxP) === false
  //     if (accountIsRemote) {
  //       let homeNode = __ShardFunctions.findHomeNode(
  //         shardus.stateManager.currentCycleShardData.shardGlobals,
  //         address,
  //         shardus.stateManager.currentCycleShardData.parititionShardDataMap
  //       )
  //       if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${homeNode?.node.externalIp}:${homeNode?.node.externalPort}`)
  //       if (homeNode != null && homeNode.node != null) {
  //         if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)
  //         let node = homeNode.node
  //
  //         let postResp = await _internalHackPostWithResp(`${node.externalIp}:${node.externalPort}/eth_estimateGas`, transaction)
  //         if (postResp.body != null && postResp.body != '') {
  //           if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${stringify(postResp.body)}`)
  //           return res.json({ result: postResp.body.result })
  //         }
  //       } else {
  //         if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: homenode = null`)
  //         return res.json({ result: null })
  //       }
  //     } else {
  //       if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
  //     }
  //     let debugTXState = getDebugTXState()
  //     let debugEVM = EVM.copy()
  //     let debugStateManager = debugEVM.stateManager as ShardeumState
  //
  //     await debugStateManager.checkpoint()
  //     debugStateManager.setTransactionState(debugTXState)
  //     const txData = { ...transaction, gasLimit: 3000000 }
  //     const tx = Transaction.fromTxData(txData, { common: debugEVM._common, freeze: false })
  //
  //     // set from address
  //     const from = transaction.from ? Address.fromString(transaction.from) : Address.zero()
  //     tx.getSenderAddress = () => {
  //       return from
  //     }
  //
  //     const runResult: RunTxResult = await debugEVM.runTx({
  //       tx,
  //       skipNonce: !ShardeumFlags.CheckNonceGreaterThan,
  //       skipBalance: true,
  //       skipBlockGasLimitValidation: true,
  //     })
  //
  //     await debugStateManager.revert()
  //
  //     let gasUsed = runResult.gasUsed.toString()
  //     if (ShardeumFlags.VerboseLogs) console.log('Gas estimated:', gasUsed)
  //
  //     if (runResult.execResult.exceptionError) {
  //       if (ShardeumFlags.VerboseLogs) console.log('Gas Estimation Error:', runResult.execResult.exceptionError)
  //       return res.json({ result: '2DC6C0' })
  //     }
  //     return res.json({ result: gasUsed })
  //   } catch (e) {
  //     if (ShardeumFlags.VerboseLogs) console.log('Error', e)
  //     return res.json({ result: null })
  //   }
  // })

  shardus.registerExternalPost('contract/call', async (req, res) => {
    const latestBlock = getLatestBlock()

    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }
    if (
      trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].endpoint, req, 'call-endpoint') ===
      false
    ) {
      return res.json({ result: null, error: 'node busy' })
    }

    try {
      const callObj = req.body
      if (ShardeumFlags.VerboseLogs) console.log('callObj', callObj)
      const opt = {
        to: Address.fromString(callObj.to),
        caller: Address.fromString(callObj.from),
        origin: Address.fromString(callObj.from), // The tx.origin is also the caller here
        data: toBytes(callObj.data),
      }

      if (callObj.gas) {
        opt['gasLimit'] = BigInt(Number(callObj.gas))
      }

      if (callObj.gasPrice) {
        opt['gasPrice'] = callObj.gasPrice
      }

      let caShardusAddress: string
      const methodCode = callObj.data.substr(0, 10)
      let caAccount: WrappedEVMAccount
      if (opt['to']) {
        caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
        if (!ShardeumFlags.removeTokenBalanceCache && methodCode === ERC20_BALANCEOF_CODE) {
          // ERC20 Token balance query
          //to do convert to timestamp query getAccountTimestamp!!
          caAccount = await AccountsStorage.getAccount(caShardusAddress)
          if (caAccount) {
            const index = ERC20TokenBalanceMap.findIndex(
              (x) => x.to === callObj.to && x.data === callObj.data
            )
            if (index > -1) {
              const tokenBalanceResult = ERC20TokenBalanceMap[index] // eslint-disable-line security/detect-object-injection
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Found in the ERC20TokenBalanceMap; index:', index, callObj.to)
              ERC20TokenBalanceMap.splice(index, 1)
              if (tokenBalanceResult.timestamp === caAccount.timestamp) {
                // The contract account is not updated yet.
                ERC20TokenBalanceMap.push(tokenBalanceResult)
                /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`eth call for ERC20TokenBalanceMap`, callObj.to, callObj.data)
                return res.json({ result: tokenBalanceResult.result })
              }
            }
          }
        }
      }

      if (opt['to']) {
        if (ShardeumFlags.VerboseLogs) console.log('Calling to ', callObj.to, caShardusAddress)
        //let callerShardusAddress = toShardusAddress(callObj.caller, AccountType.Account)

        //Overly techincal, should be ported back into SGS as a utility
        const address = caShardusAddress
        const accountIsRemote = shardus.isAccountRemote(address)

        if (accountIsRemote) {
          const consensusNode = shardus.getRandomConsensusNodeForAccount(address)
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
          if (consensusNode != null) {
            if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)

            const postResp = await _internalHackPostWithResp(
              `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/call`,
              callObj
            )
            if (postResp.body != null && postResp.body != '') {
              //getResp.body

              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${stringify(postResp.body)}`)
              //res.json({ result: callResult.execResult.returnValue.toString() })
              //return res.json({ result: '0x' + postResp.body })   //I think the 0x is worse?
              return res.json({ result: postResp.body.result })
            }
          } else {
            if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: consensusNode = null`)
            return res.json({ result: null })
          }
        } else {
          if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
        }
      }

      // if we are going to handle the call directly charge 20 points.
      if (
        trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].direct, req, 'call-direct') ===
        false
      ) {
        return res.json({ result: null, error: 'node busy' })
      }

      const callTxState = getCallTXState() //this isn't so great..

      const callerAddress = toShardusAddress(callObj.from, AccountType.Account)
      const callerAccount = await AccountsStorage.getAccount(callerAddress)
      if (callerAccount) {
        if (ShardeumFlags.VerboseLogs) console.log('callerAddress', callerAccount)
        callTxState._transactionState.insertFirstAccountReads(opt.caller, callerAccount.account)
        //shardeumStateManager.setTransactionState(callTxState)
      } else {
        const acctData = {
          nonce: 0,
          balance: oneSHM * BigInt(100), // 100 SHM.  This is a temporary account that will never exist.
        }
        const fakeAccount = Account.fromAccountData(acctData)
        callTxState._transactionState.insertFirstAccountReads(opt.caller, fakeAccount)

        //shardeumStateManager.setTransactionState(callTxState)
      }

      opt['block'] = blocks[latestBlock] // eslint-disable-line security/detect-object-injection

      const customEVM = new EthereumVirtualMachine({
        common: evmCommon,
        stateManager: callTxState,
      })

      const callResult: EVMResult = await customEVM.runCall(opt)
      let returnedValue = bytesToHex(callResult.execResult.returnValue)
      if (returnedValue && returnedValue.indexOf('0x') === 0) {
        returnedValue = returnedValue.slice(2)
      }

      //shardeumStateManager.unsetTransactionState(callTxState.linkedTX)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Call Result', returnedValue)

      if (!ShardeumFlags.removeTokenBalanceCache && methodCode === ERC20_BALANCEOF_CODE) {
        //TODO would be way faster to have timestamp in db as field
        //let caAccount = await AccountsStorage.getAccount(caShardusAddress)

        ERC20TokenBalanceMap.push({
          to: callObj.to,
          data: callObj.data,
          timestamp: caAccount && caAccount.timestamp, //this will invalidate for any user..
          result: callResult.execResult.exceptionError ? null : returnedValue,
        })
        if (ERC20TokenBalanceMap.length > ERC20TokenCacheSize + 10) {
          const extra = ERC20TokenBalanceMap.length - ERC20TokenCacheSize
          ERC20TokenBalanceMap.splice(0, extra)
        }
      }

      if (callResult.execResult.exceptionError) {
        if (ShardeumFlags.VerboseLogs) console.log('Execution Error:', callResult.execResult.exceptionError)
        return res.json({ result: null })
      }

      res.json({ result: returnedValue })
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Error eth_call', e)
      return res.json({ result: null })
    }
  })

  shardus.registerExternalPost('contract/accesslist', async (req, res) => {
    if (
      trySpendServicePoints(
        ShardeumFlags.ServicePoints['contract/accesslist'].endpoint,
        req,
        'accesslist'
      ) === false
    ) {
      return res.json({ result: null, error: 'node busy' })
    }

    try {
      const injectedTx = req.body
      if (ShardeumFlags.VerboseLogs) console.log('AccessList endpoint injectedTx', injectedTx)

      const result = await generateAccessList(injectedTx)

      res.json(result)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Error predict accessList', e)
      return res.json([])
    }
  })

  shardus.registerExternalPost('contract/estimateGas', async (req, res) => {
    if (
      trySpendServicePoints(
        ShardeumFlags.ServicePoints['contract/estimateGas'].endpoint,
        req,
        'estimateGas'
      ) === false
    ) {
      return res.json({ result: null, error: 'node busy' })
    }

    if (ShardeumFlags.supportEstimateGas === false) {
      return res.json({ result: null, error: 'estimateGas not supported' })
    }

    try {
      const injectedTx = req.body
      if (ShardeumFlags.VerboseLogs) console.log('EstimateGas endpoint injectedTx', injectedTx)

      const result = await estimateGas(injectedTx)

      res.json(result)
    } catch (e) {
      if (ShardeumFlags.VerboseLogs) console.log('Error estimate gas', e)
      return res.json({
        result: {
          error: {
            code: -32000,
            message: 'gas required exceeds allowance or always failing transaction',
          },
        },
      })
    }
  })

  shardus.registerExternalGet('tx/:hash', async (req, res) => {
    if (trySpendServicePoints(ShardeumFlags.ServicePoints['tx/:hash'], req, 'tx') === false) {
      return res.json({ error: 'node busy' })
    }

    const txHash = req.params['hash']
    if (!ShardeumFlags.EVMReceiptsAsAccounts) {
      try {
        const dataId = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
        const cachedAppData = await shardus.getLocalOrRemoteCachedAppData('receipt', dataId)
        if (ShardeumFlags.VerboseLogs) console.log(`cachedAppData for tx hash ${txHash}`, cachedAppData)
        if (cachedAppData && cachedAppData.appData) {
          const receipt = cachedAppData.appData as ShardusTypes.WrappedData
          return res.json({ account: JSON.parse(stringify(receipt.data)) })
        } else {
          //may tune this down soon
          /* prettier-ignore */ if (logFlags.error) console.log(`Unable to find tx receipt for ${txHash}`)
        }
        return res.json({ account: null })
      } catch (error) {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('Unable to get tx receipt: ' + formatErrorMessage(error))
        return res.json({ account: null })
      }
    } else {
      try {
        //const shardusAddress = toShardusAddressWithKey(txHash.slice(0, 42), txHash, AccountType.Receipt)
        const shardusAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
        const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
        if (!account || !account.data) {
          // if (transactionFailHashMap[txHash]) {
          //   /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Tx Hash ${txHash} is found in the failed transactions list`, transactionFailHashMap[txHash])
          //   return res.json({ account: transactionFailHashMap[txHash] })
          // }
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`No tx found for ${shardusAddress}`) //, accounts[shardusAddress])
          return res.json({ account: null })
        }
        const data = account.data
        fixDeserializedWrappedEVMAccount(data as WrappedEVMAccount)
        res.json({ account: data })
      } catch (error) {
        /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('tx/:hash: ' + formatErrorMessage(error))
        res.json({ error })
      }
    }
  })

  shardus.registerExternalGet('debug-appdata/:hash', debugMiddleware, async (req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }
    const txHash = req.params['hash']
    // const shardusAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)

    // let shardeumState = shardeumStateTXMap.get(txHash)
    // if(shardeumState == null){
    //   return res.json(stringify({result:`shardeumState not found`}))
    // }

    // let appData = shardeumState._transactionState?.appData

    const appData = debugAppdata.get(txHash)

    if (appData == null) {
      return res.json(stringify({ result: `no appData` }))
    }

    //return res.json(`${stringify(appData)}`)

    res.write(`${stringify(appData, null)}`)

    res.end()
  })

  // shardus.registerExternalGet('tx/:hash', async (req, res) => {
  //   const txHash = req.params['hash']
  //
  //   if (!appliedTxs[txHash]) {
  //     return res.json({ tx: 'Not found' })
  //   }
  //   let appliedTx = appliedTxs[txHash]
  //
  //   if (!appliedTx) return res.json({ tx: 'Not found' })
  //   let detail = getReadableTransaction(appliedTx.injected)
  //   let logs = []
  //
  //   let runState: RunStateWithLogs = appliedTx.receipt.execResult.runState
  //   if (!runState) {
  //     if (ShardeumFlags.VerboseLogs) console.log(`No runState found in the receipt for ${txHash}`)
  //   }
  //
  //   if (runState && runState.logs)
  //     logs = runState.logs.map((l) => {
  //       return {
  //         logIndex: '0x1', // 1
  //         blockNumber: '0xb', // 436
  //         blockHash: '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
  //         transactionHash: appliedTx.txId,
  //         transactionIndex: '0x1',
  //         address: bufferToHex(l[0]),
  //         topics: l[1].map(i => bufferToHex(i)),
  //         data: bufferToHex(l[2]),
  //       }
  //     })
  //
  //   console.log('Transformed log for tx', appliedTx.txId, logs, logs[0])
  //
  //   let result = {
  //     transactionHash: appliedTx.txId,
  //     transactionIndex: '0x1',
  //     blockNumber: '0xb',
  //     nonce: appliedTx.receipt.nonce,
  //     blockHash: '0xc6ef2fc5426d6ad6fd9e2a26abeab0aa2411b7ab17f30a99d3cb96aed1d1055b',
  //     cumulativeGasUsed: bufferToHex(appliedTx.receipt.gasUsed),
  //     gasUsed: bufferToHex(appliedTx.receipt.gasUsed),
  //     logs: logs,
  //     contractAddress: appliedTx.receipt.createdAddress ? appliedTx.receipt.createdAddress.toString() : null,
  //     status: '0x1',
  //     ...detail,
  //   }
  //   res.json({ tx: result })
  // })

  shardus.registerExternalGet('accounts', debugMiddleware, async (_req, res) => {
    // if(isDebugMode()){
    //   return res.json(`endpoint not available`)
    // }
    if (ShardeumFlags.VerboseLogs) console.log('/accounts')
    //res.json({accounts})

    // stable sort on accounts order..  todo, may turn this off later for perf reasons.

    //let sorted = JSON.parse(stringify(accounts))
    const accounts = await AccountsStorage.debugGetAllAccounts()
    const sorted = JSON.parse(SerializeToJsonString(accounts))

    res.json({ accounts: sorted })
  })

  shardus.registerExternalGet('genesis_accounts', async (req, res) => {
    const { start } = req.query
    if (!start) {
      return res.json({ success: false, reason: 'start value is not defined!' })
    }
    let skip: number
    if (typeof start === 'string') {
      skip = parseInt(start)
    }
    const limit = skip + 1000
    let accounts = []
    if (genesisAccounts.length > 0) {
      accounts = genesisAccounts.slice(skip, limit)
    }
    res.json({ success: true, accounts })
  })

  // Returns the hardware-spec of the server running the validator
  shardus.registerExternalGet('system-info', async (_req, res) => {
    let result = {
      platform: platform(),
      arch: arch(),
      cpu: {
        total_cores: cpus().length,
        cores: cpus(),
      },
      free_memory: `${freemem() / Math.pow(1024, 3)} GB`,
      total_memory: `${totalmem() / Math.pow(1024, 3)} GB`,
      disk: null,
    }
    exec('df -h --total|grep ^total', (err, diskData) => {
      if (!err) {
        const [, total, used, available, percent_used] = diskData.split(' ').filter((s) => s)
        result = { ...result, disk: { total, used, available, percent_used } }
      }
      res.json(result)
    })
  })

  shardus.registerExternalPut('query-certificate', async (req: Request, res: Response) => {
    nestedCountersInstance.countEvent('shardeum-staking', 'called query-certificate')

    const queryCertRes = await queryCertificateHandler(req, shardus)
    if (ShardeumFlags.VerboseLogs) console.log('queryCertRes', queryCertRes)
    if (queryCertRes.success) {
      const successRes = queryCertRes as CertSignaturesResult
      setStakeCert(successRes.signedStakeCert)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler success`)
    } else {
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler failed with reason: ${(queryCertRes as ValidatorError).reason}`)
    }

    return res.json(JSON.parse(stringify(queryCertRes)))
  })

  // Returns the latest value from isReadyToJoin call
  shardus.registerExternalGet('debug-is-ready-to-join', async (_req, res) => {
    const publicKey = shardus.crypto.getPublicKey()

    return res.json({ isReady: getIsReadyToJoinLatestValue(), nodePubKey: publicKey })
  })

  // Changes the threshold for the blocked-At function
  shardus.registerExternalGet('debug-set-event-block-threshold', debugMiddleware, async (req, res) => {
    try {
      const threshold = Number(req.query.threshold)

      if (isNaN(threshold) || threshold <= 0) {
        return res.json({ error: `Invalid threshold: ${req.query.threshold}` })
      }

      //startBlockedCheck(threshold)
      return res.json({ success: `Threshold set to ${threshold}ms` })
    } catch (err) {
      return res.json({ error: `Error setting threshold: ${err.toString()}` })
    }
  })

  // endpoint on joining nodes side to receive admin certificate
  shardus.registerExternalPut('admin-certificate', async (req, res) => {
    nestedCountersInstance.countEvent('shardeum-admin-certificate', 'called PUT admin-certificate')

    const certRes = await putAdminCertificateHandler(req, shardus)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('certRes', certRes)
    if (certRes.success) {
      const successRes = certRes as PutAdminCertResult
      setAdminCert(successRes.signedAdminCert)
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-admin-certificate', `putAdminCertificateHandler success`)
    } else {
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-admin-certificate', `putAdminCertificateHandler failed with reason: ${(certRes as ValidatorError).reason}`)
    }

    return res.json(certRes)
  })

  return shardus
}

/**
 * Allows us to attempt to spend points.  We have ShardeumFlags.ServicePointsPerSecond
 * that can be spent as a total bucket
 * @param points
 * @returns
 */
function trySpendServicePoints(points: number, req: Request, key: string): boolean {
  const nowTs = shardeumGetTime()
  const maxAge = 1000 * pointsAverageInterval
  const maxAllowedPoints = ShardeumFlags.ServicePointsPerSecond * pointsAverageInterval
  let totalPoints = 0
  //remove old entries, count points
  for (let i = servicePointSpendHistory.length - 1; i >= 0; i--) {
    const entry = servicePointSpendHistory[i] // eslint-disable-line security/detect-object-injection
    const age = nowTs - entry.ts
    //if the element is too old remove it
    if (age > maxAge) {
      servicePointSpendHistory.pop()
    } else {
      totalPoints += entry.points
    }
  }

  debugLastTotalServicePoints = totalPoints

  if (ShardeumFlags.logServicePointSenders) {
    let requestIP = 'null-req'
    if (req != null) {
      requestIP = unsafeGetClientIp(req) || 'cant-get-ip'
    }

    let serviePointSpenders: Map<string, number> = debugServicePointSpendersByType.get(key)
    if (!serviePointSpenders) {
      serviePointSpenders = new Map()
      debugServicePointSpendersByType.set(key, serviePointSpenders)
    }
    if (serviePointSpenders.has(requestIP) === false) {
      serviePointSpenders.set(requestIP, points)
    } else {
      const currentPoints = serviePointSpenders.get(requestIP)
      serviePointSpenders.set(requestIP, currentPoints + points)
    }
    debugTotalServicePointRequests += points

    //upate debugServiePointByType
    if (debugServicePointsByType.has(key) === false) {
      debugServicePointsByType.set(key, points)
    } else {
      const currentPoints = debugServicePointsByType.get(key)
      debugServicePointsByType.set(key, currentPoints + points)
    }
  }

  //is the new operation too expensive?
  if (totalPoints + points > maxAllowedPoints) {
    nestedCountersInstance.countEvent('shardeum-service-points', 'fail: not enough points available to spend')
    return false
  }

  //Add new entry to array
  const newEntry = { points, ts: nowTs }
  servicePointSpendHistory.unshift(newEntry)

  nestedCountersInstance.countEvent('shardeum-service-points', 'pass: points available to spend')
  return true
}

async function getReadableAccountInfo(account: WrappedEVMAccount): Promise<{
  nonce: string
  balance: string
  storageRoot: string
  codeHash: string
  operatorAccountInfo: unknown
}> {
  try {
    //todo this code needs additional support for account type contract storage or contract code
    return {
      nonce: account.account.nonce.toString(),
      balance: account.account.balance.toString(),
      storageRoot: bytesToHex(account.account.storageRoot),
      codeHash: bytesToHex(account.account.codeHash),
      operatorAccountInfo: account.operatorAccountInfo
        ? JSON.parse(stringify(account.operatorAccountInfo))
        : null,
    }
  } catch (e) {
    if (ShardeumFlags.VerboseLogs) console.log('Unable to get readable account', e)
  }
  return null
}

/**
 * only use for the duration of a call and then give up on it
 * ?? will this work
 * @returns
 */
function getCallTXState(): ShardeumState {
  const txId = '9'.repeat(64) // use different txId than debug txs
  if (ShardeumFlags.VerboseLogs) console.log('Creating a call tx ShardeumState for ', txId)

  const shardeumState = new ShardeumState({ common: evmCommon })
  const transactionState = new TransactionState()
  transactionState.initData(
    shardeumState,
    {
      storageMiss: accountMissNoOp,
      contractStorageMiss: contractStorageMissNoOp,
      accountInvolved: accountInvolvedNoOp,
      contractStorageInvolved: contractStorageInvolvedNoOp,
      tryGetRemoteAccountCB: tryGetRemoteAccountCB,
      monitorEventCB: monitorEventCBNoOp,
    },
    txId,
    undefined,
    undefined
  )
  shardeumState.setTransactionState(transactionState)
  return shardeumState
}
