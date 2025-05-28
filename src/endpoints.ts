export const endpoints = {
  async function estimateGas(
    injectedTx: { from: string; maxFeePerGas: string; gas: number } & LegacyTxData
  ): Promise<{ estimateGas: string }> {
    const originalInjectedTx = { ...injectedTx }
    const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1)
    if (ShardeumFlags.VerboseLogs) console.log('injectedTx to estimateGas', injectedTx)
    const blockForTx = blocks[latestBlock]
    const MAX_GASLIMIT = BigInt(30_000_000)
  
    try {
      if (injectedTx.gas == null) {
        // If no gas limit is specified use the last block gas limit as an upper bound.
        // injectedTx.gas = blockForTx.header.gasLimit.div(new BN(10).pow(new BN(8))) as any
        // injectedTx.gasLimit = blockForTx.header.gasLimit.div(new BN(10).pow(new BN(8))) as any
        injectedTx.gasLimit = blockForTx.header.gasLimit
      } else {
        injectedTx.gasLimit = BigInt(injectedTx.gas)
      }
    } catch (error) {
      if (ShardeumFlags.VerboseLogs) console.log('Injected tx without gasLimit', error)
      injectedTx.gasLimit = BigInt('0x1C9C380') // 30 M Gas
    }
  
    // we set this max gasLimit to prevent DDOS attacks with high gasLimits
    if (injectedTx.gasLimit > MAX_GASLIMIT) {
      injectedTx.gasLimit = MAX_GASLIMIT
    }
  
    // we set this max gasLimit to prevent DDOS attacks with high gasLimits
    if (injectedTx.gasLimit > MAX_GASLIMIT) {
      injectedTx.gasLimit = MAX_GASLIMIT
    }
  
    const txData = {
      ...injectedTx,
      gasLimit: injectedTx.gasLimit ? injectedTx.gasLimit : blockForTx.header.gasLimit,
    }
  
    const transaction: LegacyTransaction | AccessListEIP2930Transaction =
      TransactionFactory.fromTxData<TransactionType.Legacy>(txData)
    if (ShardeumFlags.VerboseLogs) console.log(`parsed tx`, transaction)
  
    const from = injectedTx.from !== undefined ? Address.fromString(injectedTx.from) : Address.zero()
  
    const caShardusAddress = transaction.to ? toShardusAddress(transaction.to.toString(), AccountType.Account) : null
  
    if (isStakingEVMTx(transaction)) {
      const baseFee = transaction.getBaseFee()
      return { estimateGas: bigIntToHex(baseFee) }
    }
  
    if (caShardusAddress != null) {
      const accountIsRemote = isServiceMode() ? false : shardus.isAccountRemote(caShardusAddress)
  
      if (accountIsRemote) {
        const consensusNode = shardus.getRandomConsensusNodeForAccount(caShardusAddress)
        /* prettier-ignore */
        if (consensusNode != null) {
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting estimateGas ${consensusNode?.externalIp}:${consensusNode?.externalPort}`, injectedTx, originalInjectedTx)
  
          const postResp = await _internalHackPostWithResp(
            `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/estimateGas`,
            originalInjectedTx
          )
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('EstimateGas response from node', consensusNode.externalPort, postResp.body)
          if (postResp != null && postResp.body != null && postResp.body != '' && postResp.body.estimateGas != null) {
            const estimateResultFromNode = postResp.body.estimateGas
  
            /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:`, estimateResultFromNode)
            if (isHexPrefixed(estimateResultFromNode) && estimateResultFromNode !== '0x' && estimateResultFromNode !== '0x0') {
              return postResp.body.estimateGas;
            } else {
              return { estimateGas: bigIntToHex(maxUint256) }
            }
          }
        } else {
          return { estimateGas: bigIntToHex(maxUint256) }
        }
      } else {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
      }
    }
  
    const txId = crypto.hashObj(transaction)
    const { address: senderAddress, isValid } = getTxSenderAddress(transaction, txId)
    const preRunTxState = getPreRunTXState(txId)
    const callerEVMAddress = isValid ? senderAddress : getTxSenderAddress(transaction, txId, from).address
    const callerShardusAddress = toShardusAddress(callerEVMAddress.toString(), AccountType.Account)
    let callerAccount = await AccountsStorage.getAccount(callerShardusAddress)
    // callerAccount.account.balance = oneSHM.mul(new BN(100)) // 100 SHM. In case someone estimates gas with 0 balance
    if (ShardeumFlags.VerboseLogs) {
      console.log('BALANCE: ', callerAccount?.account?.balance)
      console.log('CALLER: ', Utils.safeStringify(callerAccount))
    }
  
    const fakeAccountData = {
      nonce: 0,
      balance: oneSHM * BigInt(100), // 100 SHM.  This is a temporary account that will never exist.
    }
    const fakeAccount = Account.fromAccountData(fakeAccountData)
    if (callerAccount == null) {
      const remoteCallerAccount = await shardus.getLocalOrRemoteAccount(callerShardusAddress)
      if (remoteCallerAccount) {
        callerAccount = remoteCallerAccount.data as WrappedEVMAccount
        fixDeserializedWrappedEVMAccount(callerAccount)
      }
    }
    if (callerAccount == null) {
      /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-endpoints', `Unable to find caller account while estimating gas. Using a fake account to estimate gas`)
      /* prettier-ignore */ if (logFlags.dapp_verbose) console.log(`Unable to find caller account: ${callerShardusAddress} while estimating gas. Using a fake account to estimate gas`)
    }
  
    preRunTxState._transactionState.insertFirstAccountReads(
      callerEVMAddress,
      callerAccount ? callerAccount.account : fakeAccount
    )
  
    const customEVM = new EthereumVirtualMachine({
      common: evmCommon,
      stateManager: preRunTxState,
    })
  
    EVM.stateManager = null
    // EVM.evm.stateManager = null
    // EVM.evm.journal.stateManager = null
  
    EVM.stateManager = preRunTxState
    // EVM.evm.stateManager = preRunTxState
    // EVM.evm.journal.stateManager = preRunTxState
  
    if (!isInSenderCache(txId)) {
      nestedCountersInstance.countEvent('shardeum-endpoints', `tx in senderTxCache evicted before EVM processing`)
    }
  
    let runTxResult
    try {
      runTxResult = await EVM.runTx(
        {
          block: blocks[latestBlock],
          tx: transaction,
          skipNonce: true,
          skipBalance: true,
          networkAccount: await AccountsStorage.getCachedNetworkAccount(),
        },
        customEVM,
        txId
      )
    } finally {
      customEVM.cleanUp()
    }
  
    if (ShardeumFlags.VerboseLogs) console.log('Predicted gasUsed', runTxResult.totalGasSpent)
  
    if (runTxResult.execResult.exceptionError) {
      if (ShardeumFlags.VerboseLogs) console.log('Execution Error:', runTxResult.execResult.exceptionError)
      throw new Error(runTxResult.execResult.exceptionError)
    }
  
    if (!isValid) {
      removeTxFromSenderCache(txId)
    }
    // For the estimate, we add the gasRefund to the gasUsed because gasRefund is subtracted after execution.
    // That can lead to higher gasUsed during execution than the actual gasUsed
    const estimate = runTxResult.totalGasSpent + (runTxResult.execResult.gasRefund ?? BigInt(0))
    return { estimateGas: bigIntToHex(estimate) }
  }
  
  /**
   * Allows us to attempt to spend points.  We have ShardeumFlags.ServicePointsPerSecond
   * that can be spent as a total bucket
   * @param points
   * @returns
   */
  function trySpendServicePoints(points: number, req, key: string): boolean {
    if (isServiceMode()) return true
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

    const configShardusEndpoints = (): void => {
      const debugMiddleware = shardus.getDebugModeMiddleware()
      const debugMiddlewareLow = shardus.getDebugModeMiddlewareLow()
      const debugMiddlewareMedium = shardus.getDebugModeMiddlewareMedium()
      //const debugMiddlewareHigh = shardus.getDebugModeMiddlewareHigh()
      const externalApiMiddleware = getExternalApiMiddleware()
    
      shardus.registerExternalGet('debug-points', debugMiddleware, async (req, res) => {
        try {
          // if(isDebugMode()){
          //   return res.json(`endpoint not available`)
          // }
          if (Number.isNaN(Number(req.query.points as string))) {
            /* prettier-ignore */ if (logFlags.error) console.log(`Invalid input debug-points number`)
            res.json({ error: `Invalid input debug-points number` })
            return
          }
          const points = Number(req.query.points ?? ShardeumFlags.ServicePoints['debug-points'])
          if (trySpendServicePoints(points, null, 'debug-points') === false) {
            res.json({ error: 'node busy', points, servicePointSpendHistory, debugLastTotalServicePoints })
            return
          }
    
          res.json(
            `spent points: ${points} total:${debugLastTotalServicePoints}  ${Utils.safeStringify(
              servicePointSpendHistory
            )} `
          )
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in debug-points endpoint:', error)
          res.json({ error: error.message })
        }
      })
    
      shardus.registerExternalGet('debug-point-spenders', debugMiddleware, async (req, res) => {
        try {
          const debugObj = {
            debugTotalPointRequests: debugTotalServicePointRequests,
            debugServiePointByType: debugServicePointsByType,
            debugServiePointSpendersByType: debugServicePointSpendersByType,
          }
          res.write(JSON.stringify(debugObj, debug_map_replacer, 2))
          res.end()
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in debug-point-spenders endpoint:', error)
          res.json({ error: error.message })
        }
      })
    
      shardus.registerExternalGet('debug-point-spenders-clear', debugMiddleware, async (req, res) => {
        try {
          const totalSpends = debugTotalServicePointRequests
          debugTotalServicePointRequests = 0
          debugServicePointSpendersByType.clear()
          debugServicePointsByType.clear()
          res.json(`point spenders cleared. totalSpendActions: ${totalSpends} `)
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in debug-point-spenders-clear endpoint:', error)
          res.json({ error: error.message })
        }
      })
    
      shardus.registerExternalGet('debug-shardus-dependencies', debugMiddlewareLow, async (req, res) => {
        res.json(getShardusDependenciesVersions())
      })
    
      shardus.registerExternalPost('inject', externalApiMiddleware, async (req, res) => {
        try {
          const tx = req.body
          const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, tx)
          if (errors !== null) {
            nestedCountersInstance.countEvent('external', 'ajv-failed-query-certificate')
            res.json({
              success: false,
              reason: 'Invalid request body',
              details: isDebugMode() ? errors : null,
              status: 400,
            })
            return
          }
          // if timestamp is a float, round it down to nearest millisecond
          tx.timestamp = Math.floor(tx.timestamp)
          const appData = null
          const id = shardus.getNodeId()
          const isInRotationBonds = shardus.isNodeInRotationBounds(id)
          if (isInRotationBonds) {
            res.json({
              success: false,
              reason: `Node is too close to rotation edges. Inject to another node`,
              status: 500,
            })
            return
          }
    
          // Find IP of request sender
          const ipAddress: string | undefined = req.ip || req.socket.remoteAddress
    
          await handleInject(tx, appData, res, ipAddress)
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in inject endpoint:', error)
          res.json({ error: 'Internal Server Error' })
        }
      })
    
      async function handleInject(tx, appData, res, ipAddress?: string): Promise<void> {
        if (ShardeumFlags.VerboseLogs) console.log('Transaction injected:', new Date(), tx)
    
        const nodeId = shardus.getNodeId()
        const node = shardus.getNode(nodeId)
    
        if (!node) {
          nestedCountersInstance.countEvent('shardeum', `txRejectedDueToNodeNotFound`)
          res.json({
            success: false,
            reason: `Node not found. Rejecting inject`,
            status: 500,
          })
          return
        }
        if (node.status !== P2P.P2PTypes.NodeStatus.ACTIVE) {
          res.json({
            success: false,
            reason: `Node not active. Rejecting inject.`,
            status: 500,
          })
          return
        }
    
        let numActiveNodes = 0
        try {
          // Reject transaction if network is paused
          const networkAccount = AccountsStorage.cachedNetworkAccount
          if (networkAccount == null || networkAccount.current == null) {
            res.json({
              success: false,
              reason: `Node not ready for inject, waiting for network account data.`,
              status: 500,
            })
            return
          }
    
          if (networkAccount.current.txPause && !isInternalTx(tx)) {
            res.json({
              success: false,
              reason: `Network will not accept EVM tx until it has at least ${ShardeumFlags.minNodesEVMtx} active node in the network. numActiveNodes: ${numActiveNodes}`,
              status: 500,
            })
            return
          }
    
          // Incremeant counter for this IP
          if (shardusConfig.debug.verboseNestedCounters && ipAddress) {
            nestedCountersInstance.countEvent('shardeum', `txInjected from ${ipAddress}`)
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
            const response = await shardus.put(tx, false, false, appData)
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
      }
    
      shardus.registerExternalPost('inject-with-warmup', externalApiMiddleware, async (req, res) => {
        if (ShardeumFlags.disableSmartContractEndpoints) {
          res.json({ result: null, error: 'Smart contract endpoints are disabled' })
          return
        }
    
        try {
          const id = shardus.getNodeId()
          const isInRotationBonds = shardus.isNodeInRotationBounds(id)
          if (isInRotationBonds) {
            res.json({
              success: false,
              reason: `Node is too close to rotation edges. Inject to another node`,
              status: 500,
            })
            return
          }
          const { tx, warmupList } = req.body
          let appData = null
          if (warmupList != null) {
            appData = { warmupList }
          }
    
          // Find IP of request sender
          const ipAddress: string | undefined = req.ip || req.socket.remoteAddress
          await handleInject(tx, appData, res, ipAddress)
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
    
      shardus.registerExternalGet('eth_blockNumber', externalApiMiddleware, async (req, res) => {
        try {
          if (ShardeumFlags.VerboseLogs) console.log('Req: eth_blockNumber')
          res.json({ blockNumber: latestBlock ? '0x' + latestBlock.toString(16) : '0x0' })
        } catch (err) {
          if (ShardeumFlags.VerboseLogs) console.log('Failed to retrieve eth_blockNumber: ', err)
          res.status(500).json({ error: 'Failed to retrieve eth_blockNumber' })
        }
      })
    
      shardus.registerExternalGet('eth_getBlockHashes', externalApiMiddleware, async (req: Request, res: Response) => {
        try {
          // Helper function to parse and validate block numbers
          const parseBlockNumber = (block: string | null, defaultValue?: number): number => {
            if (block === null) {
              if (defaultValue !== undefined) {
                return defaultValue
              }
              throw new Error('missing')
            }
            const num = parseInt(block, 10)
            if (isNaN(num) || num < 0) {
              throw new Error('invalid')
            }
            return num
          }
    
          // Safely assign fromBlock using an IIFE to handle the throw within an expression context
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          let fromBlock: number = req.query.fromBlock
            ? parseBlockNumber(req.query.fromBlock as string)
            : ((): any => {
                throw new Error('Missing fromBlock')
              })()
          let toBlock: number = req.query.toBlock ? parseBlockNumber(req.query.toBlock as string, latestBlock) : latestBlock
    
          // Ensure fromBlock is not set to a negative value
          // Adjust fromBlock to within the allowed range if it's too old
          if (fromBlock < latestBlock - ShardeumFlags.maxNumberOfOldBlocks) {
            // Calculate the minimum allowable fromBlock based on configuration
            const minAllowedBlock = latestBlock - ShardeumFlags.maxNumberOfOldBlocks + 1
    
            // Ensure fromBlock is not set to a negative value if minAllowedBlock calculation is negative
            fromBlock = Math.max(minAllowedBlock, 0)
            toBlock = latestBlock
          }
    
          // Cap toBlock at latestBlock
          if (toBlock > latestBlock) {
            toBlock = latestBlock
          }
    
          // Validate block range
          if (fromBlock > toBlock) {
            res.status(400).json({ error: 'fromBlock cannot be greater than toBlock' })
            return
          }
    
          // Assuming readableBlocks is an array of objects with a 'hash' property
          const blockHashes = []
          for (let i = fromBlock; i <= toBlock; i++) {
            const block = readableBlocks[i]
            if (block !== null && block !== undefined) {
              blockHashes.push(block.hash)
            }
          }
    
          res.json({ blockHashes, fromBlock, toBlock })
        } catch (error) {
          console.error('Failed to process eth_getBlockHashes:', error.message)
    
          const errorMessages: { [key: string]: string } = {
            missing: 'Missing required parameter',
            invalid: 'Parameter must be a non-negative integer',
          }
    
          res.status(500).json({
            success: false,
            error: errorMessages[error.message] || 'Internal server error while processing block hashes',
          })
        }
      })
    
      shardus.registerExternalGet('eth_getBlockByNumber', externalApiMiddleware, async (req, res) => {
        try {
          const blockNumberParam = req.query.blockNumber as string
          let blockNumber: number | string
    
          const id = shardus.getNodeId()
          const isInRotationBonds = shardus.isNodeInRotationBounds(id)
          if (isInRotationBonds) {
            res.json({ error: 'node close to rotation edges' })
            return
          }
          if (blockNumberParam === 'latest' || blockNumberParam === 'earliest') {
            blockNumber = blockNumberParam
          } else {
            blockNumber = parseInt(blockNumberParam)
            if (Number.isNaN(blockNumber) || blockNumber < 0) {
              res.json({ error: 'Invalid block number' })
              return
            }
          }
          if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByNumber', blockNumber, latestBlock)
          if (blockNumber === 'latest') blockNumber = latestBlock
          if (blockNumber === 'earliest') {
            res.json({ block: readableBlocks[Object.keys(readableBlocks)[0]] }) // eslint-disable-line security/detect-object-injection
            return
          }
          res.json({ block: readableBlocks[blockNumber] }) // eslint-disable-line security/detect-object-injection
        } catch (err) {
          if (ShardeumFlags.VerboseLogs) console.log('Failed to retrieve eth_getBlockByNumber: ', err)
          res.status(500).json({ error: 'Failed to retrieve eth_getBlockByNumber' })
        }
      })
    
      shardus.registerExternalGet('eth_getBlockByHash', externalApiMiddleware, async (req, res) => {
        try {
          /* eslint-disable security/detect-object-injection */
          let blockHash = req.query.blockHash as string
          if (blockHash === 'latest') blockHash = readableBlocks[latestBlock].hash
          else if (blockHash.length !== 66 || !isHexString(blockHash)) {
            res.json({ error: 'Invalid block hash' })
            return
          }
          if (ShardeumFlags.VerboseLogs) console.log('Req: eth_getBlockByHash', blockHash)
          const blockNumber = blocksByHash[blockHash]
          res.json({ block: readableBlocks[blockNumber] })
          /* eslint-enable security/detect-object-injection */
        } catch (err) {
          if (ShardeumFlags.VerboseLogs) console.log('Failed to retrieve eth_getBlockByHash: ', err)
          res.status(500).json({ error: 'Failed to retrieve eth_getBlockByHash' })
        }
      })
    
      shardus.registerExternalGet('stake', async (req, res) => {
        try {
          const stakeRequiredUsd = AccountsStorage.cachedNetworkAccount.current.stakeRequiredUsd
          const stakeRequired = scaleByStabilityFactor(stakeRequiredUsd, AccountsStorage.cachedNetworkAccount)
          if (ShardeumFlags.VerboseLogs) console.log('Req: stake requirement', _readableSHM(stakeRequired))
    
          const response = {
            stakeRequired: {
              dataType: 'bi',
              value: stakeRequired.toString(16).padStart(16, '0'),
            },
            stakeRequiredUsd: {
              dataType: 'bi',
              value: stakeRequiredUsd.toString(16).padStart(16, '0'),
            },
          }
    
          const errors = verifyPayload(AJVSchemaEnum.StakeResp, response)
    
          if (errors) {
            nestedCountersInstance.countEvent('external', 'ajv-failed-stake-response')
            res.status(500).json({ error: 'Internal server error' })
            return
          }
          res.json(response)
        } catch (e) {
          if (ShardeumFlags.VerboseLogs) console.log(`Error /stake`, e)
          res.status(500).send(e.message)
        }
      })
    
      shardus.registerExternalGet('canUnstake/:nominee/:nominator', externalApiMiddleware, async (req, res) => {
        if (
          trySpendServicePoints(ShardeumFlags.ServicePoints['canUnstake/:nominee/:nominator'], req, 'canUnstake') === false
        ) {
          res.json({ error: 'node busy' })
          return
        }
    
        try {
          const nominator = await getAccountData(shardus, req.params['nominator'], { query: {} })
          const nominatee = await getAccountData(shardus, req.params['nominee'], { query: { type: 9 } })
          if (
            nominatee == null ||
            nominator == null ||
            nominator.account == null ||
            nominatee.account == null ||
            nominatee.account.data == null
          ) {
            res.json({ error: 'account not found' })
            return
          }
          const stakeUnlocked = isStakeUnlocked(
            nominator.account,
            nominatee.account.data,
            shardus,
            AccountsStorage.cachedNetworkAccount,
            false // Explicitly check node states in the canUnstake endpoint
          )
    
          res.json({ stakeUnlocked })
        } catch (e) {
          if (ShardeumFlags.VerboseLogs) console.log(`Error /canUnstake`, e)
          res.status(500).send(e.message)
        }
      })
    
      shardus.registerExternalGet('canStake/:nominee', externalApiMiddleware, async (req, res) => {
        if (trySpendServicePoints(ShardeumFlags.ServicePoints['canStake/:nominee'], req, 'canStake') === false) {
          res.json({ error: 'node busy' })
          return
        }
    
        try {
          const nominee = await getAccountData(shardus, req.params['nominee'], { query: { type: 9 } })
          if (nominee?.account?.data == null) {
            res.json({ error: 'account not found' })
            return
          }
          const stakeAllowed = isRestakingAllowed(nominee.account.data, AccountsStorage.cachedNetworkAccount)
    
          res.json({ stakeAllowed })
        } catch (e) {
          if (ShardeumFlags.VerboseLogs) console.log(`Error /canStake`, e)
          res.status(500).send(e.message)
        }
      })
    
      shardus.registerExternalGet('dumpStorage', debugMiddleware, async (req, res) => {
        // if(isDebugMode()){
        //   return res.json(`endpoint not available`)
        // }
    
        let id
        try {
          id = req.query.id as string
          const addr = Address.fromString(id)
          if (addr == null) {
            res.json(`dumpStorage: ${id} addr == null`)
            return
          }
    
          //no longer storing tries in shardeumState, and there is more than one shardeum state now
    
          const storage = {} //await shardeumStateManager.dumpStorage(addr)
          res.json(storage)
        } catch (err) {
          //if(ShardeumFlags.VerboseLogs) console.log( `dumpStorage: ${id} `, err)
    
          res.json(`dumpStorage: ${id} ${err}`)
        }
      })
    
      shardus.registerExternalGet('dumpAddressMap', debugMiddleware, async (req, res) => {
        // if(isDebugMode()){
        //   return res.json(`endpoint not available`)
        // }
    
        let id
        try {
          //use a replacer so we get the map:
          // const output = Utils.safeStringify(shardusAddressToEVMAccountInfo, replacer, 4)
          const output = JSON.stringify(shardusAddressToEVMAccountInfo, replacer, 4)
          res.write(output)
          res.end()
          return
          //return res.json(transactionStateMap)
        } catch (err) {
          res.json(`dumpAddressMap: ${id} ${err}`)
        }
      })
    
      shardus.registerExternalGet('dumpShardeumStateMap', debugMiddleware, async (req, res) => {
        // if(isDebugMode()){
        //   return res.json(`endpoint not available`)
        // }
        try {
          //use a replacer so we get the map:
          //let output = stringify(shardeumStateTXMap, replacer, 4)
          const output = `tx shardeumState count:${shardeumStateTXMap.size}`
          res.write(output)
          res.end()
          return
          //return res.json(transactionStateMap)
        } catch (err) {
          res.json(`dumpShardeumStateMap: ${err}`)
        }
      })
    
      shardus.registerExternalGet('debug-shardeum-flags', debugMiddleware, async (req, res) => {
        try {
          res.json({ ShardeumFlags })
        } catch (e) {
          /* prettier-ignore */ if (logFlags.error) console.log(e)
          res.json({ error: e.message })
        }
      })
    
      shardus.registerExternalGet('debug-set-shardeum-flag', debugMiddleware, async (req, res) => {
        if (!shardusConfig.debug.enableDebugFlags) {
          res.json({ error: 'debug flags are not enabled' })
          return
        }
        let value
        let key
        try {
          key = req.query.key as string
          value = req.query.value as string
          if (value == null) {
            res.json(`debug-set-shardeum-flag: ${value} == null`)
            return
          }
    
          let typedValue: boolean | number | string
    
          if (value === 'true') typedValue = true
          else if (value === 'false') typedValue = false
          else if (!Number.isNaN(Number(value))) typedValue = Number(value)
    
          // hack to make txFee works with bn.js
          if (key === 'constantTxFee') value = String(value)
    
          updateShardeumFlag(key, typedValue)
    
          res.json({ [key]: ShardeumFlags[key] }) // eslint-disable-line security/detect-object-injection
        } catch (err) {
          res.json(`debug-set-shardeum-flag: ${key} ${err.message} `)
        }
      })
      shardus.registerExternalGet('debug-set-service-point', debugMiddleware, async (req, res) => {
        let value
        let key1
        let key2
        try {
          key1 = req.query.key1 as string
          key2 = req.query.key2 as string
          value = req.query.value as string
          if (value == null) {
            res.json(`debug-set-service-point: ${value} == null`)
            return
          }
          if (Number.isNaN(Number(value))) {
            /* prettier-ignore */ if (logFlags.error) console.log(`Invalid service point`, value)
            res.json({ error: `Invalid service point` })
            return
          }
    
          const typedValue = Number(value)
    
          updateServicePoints(key1, key2, typedValue)
    
          res.json({ ServicePoints: ShardeumFlags['ServicePoints'] })
        } catch (err) {
          res.json(`debug-set-service-point: ${value} ${err}`)
        }
      })
    
      shardus.registerExternalGet('account/:address', externalApiMiddleware, async (req, res) => {
        if (trySpendServicePoints(ShardeumFlags.ServicePoints['account/:address'], req, 'account') === false) {
          res.json({ error: 'node busy' })
          return
        }
    
        const address = req.params['address']
        try {
          const accountData = await getAccountData(shardus, address, req)
          res.json(accountData)
        } catch (error) {
          res.json({ error: error.message || 'An error occurred' })
        }
      })
    
      shardus.registerExternalGet('eth_getCode', externalApiMiddleware as any, async (req, res) => {
        if (ShardeumFlags.disableSmartContractEndpoints) {
          res.json({ contractCode: '0x' })
          return
        }
    
        if (trySpendServicePoints(ShardeumFlags.ServicePoints['eth_getCode'], req, 'account') === false) {
          res.json({ error: 'node busy' })
          return
        }
    
        try {
          const address = req.query.address as string
          const shardusAddress = toShardusAddress(address, AccountType.Account)
    
          const hexBlockNumber = req.query.blockNumber as string
          const hexBlockNumberStr = isHexString(hexBlockNumber) ? hexBlockNumber : null
    
          let wrappedEVMAccount: WrappedEVMAccount
          if (isArchiverMode() && hexBlockNumberStr) {
            wrappedEVMAccount = await AccountsStorage.fetchAccountDataFromCollector(shardusAddress, hexBlockNumberStr)
            if (!wrappedEVMAccount) {
              res.json({ contractCode: '0x' })
              return
            }
          } else {
            const account = await shardus.getLocalOrRemoteAccount(shardusAddress)
            if (!account || !account.data) {
              res.json({ contractCode: '0x' })
              return
            }
            wrappedEVMAccount = account.data as WrappedEVMAccount
          }
    
          fixDeserializedWrappedEVMAccount(wrappedEVMAccount)
    
          const codeHashHex = bytesToHex(wrappedEVMAccount.account.codeHash)
          const codeAddress = toShardusAddressWithKey(address, codeHashHex, AccountType.ContractCode)
          const codeAccount = await shardus.getLocalOrRemoteAccount(codeAddress, {
            useRICache: true,
          })
          if (!codeAccount || !codeAccount.data) {
            res.json({ contractCode: '0x' })
            return
          }
    
          const wrappedCodeAccount = codeAccount.data as WrappedEVMAccount
          fixDeserializedWrappedEVMAccount(wrappedCodeAccount)
          const contractCode = wrappedCodeAccount.codeByte ? bytesToHex(wrappedCodeAccount.codeByte) : '0x'
          res.json({ contractCode })
        } catch (error) {
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('eth_getCode: ' + formatErrorMessage(error))
          res.json({ error })
        }
      })
    
      shardus.registerExternalGet('eth_gasPrice', externalApiMiddleware, async (req, res) => {
        if (trySpendServicePoints(ShardeumFlags.ServicePoints['eth_gasPrice'], req, 'account') === false) {
          res.json({ error: 'node busy' })
          return
        }
    
        try {
          const result = calculateGasPrice(
            ShardeumFlags.baselineTxFee,
            ShardeumFlags.baselineTxGasUsage,
            await AccountsStorage.getCachedNetworkAccount()
          )
          res.json({ result: `0x${result.toString(16)}` })
        } catch (error) {
          /* prettier-ignore */ if (logFlags.dapp_verbose) console.log('eth_gasPrice: ' + formatErrorMessage(error))
          res.json({ error })
        }
      })
    
      shardus.registerExternalPost('contract/call', externalApiMiddleware, async (req, res) => {
        // if(isDebugMode()){
        //   return res.json(`endpoint not available`)
        // }
        if (ShardeumFlags.disableSmartContractEndpoints) {
          res.json({ result: null, error: 'Smart contract endpoints are disabled' })
          return
        }
        if (trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].endpoint, req, 'call-endpoint') === false) {
          res.json({ result: null, error: 'node busy' })
          return
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
    
          if (callObj.gasPrice && isHexString(callObj.gasPrice)) {
            opt['gasPrice'] = callObj.gasPrice
          }
    
          let caShardusAddress
          const methodCode = callObj.data.substr(0, 10)
          let caAccount
          if (opt['to']) {
            caShardusAddress = toShardusAddress(callObj.to, AccountType.Account)
            if (!ShardeumFlags.removeTokenBalanceCache && methodCode === ERC20_BALANCEOF_CODE) {
              // ERC20 Token balance query
              //to do convert to timestamp query getAccountTimestamp!!
              caAccount = await AccountsStorage.getAccount(caShardusAddress)
              if (caAccount) {
                const index = ERC20TokenBalanceMap.findIndex((x) => x.to === callObj.to && x.data === callObj.data)
                if (index > -1) {
                  const tokenBalanceResult = ERC20TokenBalanceMap[index] // eslint-disable-line security/detect-object-injection
                  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('Found in the ERC20TokenBalanceMap; index:', index, callObj.to)
                  ERC20TokenBalanceMap.splice(index, 1)
                  if (tokenBalanceResult.timestamp === caAccount.timestamp) {
                    // The contract account is not updated yet.
                    ERC20TokenBalanceMap.push(tokenBalanceResult)
                    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`eth call for ERC20TokenBalanceMap`, callObj.to, callObj.data)
                    res.json({ result: tokenBalanceResult.result })
                    return
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
            const accountIsRemote = isServiceMode() ? false : shardus.isAccountRemote(address)
    
            if (accountIsRemote) {
              const consensusNode = shardus.getRandomConsensusNodeForAccount(address)
              /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
              if (consensusNode != null) {
                if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: requesting`)
    
                const postResp = await _internalHackPostWithResp(
                  `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/call`,
                  callObj
                )
                if (postResp != null && postResp.body != null && postResp.body != '') {
                  //getResp.body
    
                  /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: gotResp:${Utils.safeStringify(postResp.body)}`)
                  //res.json({ result: callResult.execResult.returnValue.toString() })
                  //return res.json({ result: '0x' + postResp.body })   //I think the 0x is worse?
                  res.json({ result: postResp.body.result })
                  return
                }
              } else {
                if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: consensusNode = null`)
                res.json({ result: null })
                return
              }
            } else {
              if (ShardeumFlags.VerboseLogs) console.log(`Node is in remote shard: false`)
            }
          }
    
          // if we are going to handle the call directly charge 20 points.
          if (trySpendServicePoints(ShardeumFlags.ServicePoints['contract/call'].direct, req, 'call-direct') === false) {
            res.json({ result: null, error: 'node busy' })
            return
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
    
          let useLatestState = true
          if (callObj.block && callObj.block.number && callObj.block.timestamp) {
            const block = {
              number: parseInt(callObj.block.number, 16),
              timestamp: parseInt(callObj.block.timestamp, 16),
            }
            if (callObj.block.useLatestState === false) useLatestState = false
            opt['block'] = createBlock(block.timestamp, block.number)
            if (ShardeumFlags.VerboseLogs) console.log(`Got block context from callObj`, block)
          } else {
            opt['block'] = blocks[latestBlock] // eslint-disable-line security/detect-object-injection
          }
    
          const customEVM = new EthereumVirtualMachine({
            common: evmCommon,
            stateManager: callTxState,
          })
    
          const requestContext = {
            block: opt['block'],
          }
          let callResult: EVMResult
          try {
            if (isArchiverMode() && useLatestState === false) {
              await runWithContextAsync(async () => {
                callResult = await customEVM.runCall(opt)
              }, requestContext)
            } else {
              callResult = await customEVM.runCall(opt)
            }
          } finally {
            customEVM.cleanUp()
          }
    
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
            res.json({
              result: {
                error: {
                  code: -32000,
                  message:
                    `execution reverted: ${callResult.execResult.exceptionError.errorType} ` +
                    `${callResult.execResult.exceptionError.error}`,
                  data: bytesToHex(callResult.execResult.returnValue),
                },
              },
            })
            return
          }
    
          res.json({ result: returnedValue })
        } catch (e) {
          if (ShardeumFlags.VerboseLogs) console.log('Error eth_call', e)
          res.json({ result: null })
          return
        }
      })
    
      shardus.registerExternalPost('contract/accesslist', externalApiMiddleware, async (req, res) => {
        if (ShardeumFlags.disableSmartContractEndpoints) {
          res.json({ result: null, error: 'Smart contract endpoints are disabled' })
          return
        }
        if (
          trySpendServicePoints(ShardeumFlags.ServicePoints['contract/accesslist'].endpoint, req, 'accesslist') === false
        ) {
          res.json({ result: null, error: 'node busy' })
          return
        }
    
        try {
          const injectedTx = req.body
          if (ShardeumFlags.VerboseLogs) console.log('AccessList endpoint injectedTx', injectedTx)
    
          const result = await generateAccessList(injectedTx, { accessList: [], codeHashes: [] }, '/accesslist')
    
          res.json(result)
        } catch (e) {
          if (ShardeumFlags.VerboseLogs) console.log('Error predict accessList', e)
          res.json([])
        }
      })
    
      shardus.registerExternalPost('contract/accesslist-warmup', externalApiMiddleware, async (req, res) => {
        if (ShardeumFlags.disableSmartContractEndpoints) {
          res.json({ result: null, error: 'Smart contract endpoints are disabled' })
          return
        }
        if (
          trySpendServicePoints(ShardeumFlags.ServicePoints['contract/accesslist'].endpoint, req, 'accesslist') === false
        ) {
          res.json({ result: null, error: 'node busy' })
          return
        }
    
        try {
          const { injectedTx, warmupList } = req.body
          if (ShardeumFlags.VerboseLogs) console.log('accesslist-warmup endpoint injectedTx', injectedTx)
    
          const result = await generateAccessList(injectedTx, warmupList, '/accesslist-warmup')
    
          res.json(result)
        } catch (e) {
          if (ShardeumFlags.VerboseLogs) console.log('Error predict accessList warmup', e)
          res.json([])
        }
      })
    
      shardus.registerExternalPost('contract/estimateGas', externalApiMiddleware, async (req, res) => {
        if (ShardeumFlags.supportEstimateGas === false) {
          res.json({ result: null, error: 'estimateGas not supported' })
          return
        }
        if (!isServiceMode()) {
          const response = { success: false, reason: '', status: 500 }
          if (AccountsStorage.cachedNetworkAccount === undefined) {
            res.json({ ...response, reason: `Network account not available yet` })
            return
          }
          if (AccountsStorage.cachedNetworkAccount.current.enableRPCEndpoints === false) {
            if (ShardeumFlags.controlledRPCEndpoints.includes('contract/estimateGas')) {
              res.json({
                ...response,
                reason: `The current RPC endpoint is disabled in the production network`,
              })
              return
            }
          }
        }
        if (
          trySpendServicePoints(ShardeumFlags.ServicePoints['contract/estimateGas'].endpoint, req, 'estimateGas') === false
        ) {
          res.json({ result: null, error: 'node busy' })
          return
        }
    
        try {
          const injectedTx = req.body
          if (ShardeumFlags.VerboseLogs) console.log('EstimateGas endpoint injectedTx', injectedTx)
    
          const result = await estimateGas(injectedTx)
    
          res.json(result)
        } catch (e) {
          if (ShardeumFlags.VerboseLogs) console.log('Error estimate gas', e)
          res.json({
            result: {
              error: {
                code: -32000,
                message: 'gas required exceeds allowance or always failing transaction',
              },
            },
          })
        }
      })
    
      shardus.registerExternalGet('tx/:hash', externalApiMiddleware, async (req, res) => {
        if (trySpendServicePoints(ShardeumFlags.ServicePoints['tx/:hash'], req, 'tx') === false) {
          res.json({ error: 'node busy' })
          return
        }
    
        const txHash = req.params['hash']
        if (!ShardeumFlags.EVMReceiptsAsAccounts) {
          try {
            const dataId = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
            const cachedAppData = await shardus.getLocalOrRemoteCachedAppData('receipt', dataId)
            if (ShardeumFlags.VerboseLogs) console.log(`cachedAppData for tx hash ${txHash}`, cachedAppData)
            if (cachedAppData && cachedAppData.appData) {
              /* prettier-ignore */ if (logFlags.shardedCache) console.log(`cachedAppData: Found tx receipt for ${txHash} ${Date.now()}`)
              const receipt = cachedAppData.appData as ShardusTypes.WrappedData
              res.json({ account: convertBigIntsToHex(receipt.data) })
              return
            } else {
              // tools will ask for a tx receipt before it exists!
              // we could register a "waiting" placeholer cache item
              /* prettier-ignore */ if (logFlags.shardedCache) console.log(`cachedAppData: Unable to find tx receipt for ${txHash} ${Date.now()}`)
            }
            res.json({ account: null })
            return
          } catch (error) {
            /* prettier-ignore */ if (logFlags.shardedCache) console.log('cachedAppData: Unable to get tx receipt: ' + formatErrorMessage(error))
            res.json({ account: null })
            return
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
              res.json({ account: null })
              return
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
        try {
          // if(isDebugMode()){
          //   return res.json(`endpoint not available`)
          // }
          const txHash = req.params['hash']
          // const shardusAddress = toShardusAddressWithKey(txHash, '', AccountType.Receipt)
    
          // let shardeumState = shardeumStateTXMap.get(txHash)
          // if(shardeumState == null){
          //   return res.json(Utils.safeStringify({result:`shardeumState not found`}))
          // }
    
          // let appData = shardeumState._transactionState?.appData
    
          const appData = debugAppdata.get(txHash)
    
          if (appData == null) {
            res.json(Utils.safeStringify({ result: `no appData` }))
            return
          }
    
          //return res.json(`${Utils.safeStringify(appData)}`)
    
          res.write(`${Utils.safeStringify(appData, null)}`)
    
          res.end()
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in debug-appdata endpoint:', error)
          res.status(500).json({ error: error.message })
        }
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
      //     logs = runState.logs.map((l: any[]) => {
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
    
      shardus.registerExternalGet('accounts', debugMiddlewareMedium, async (req, res) => {
        try {
          // if(isDebugMode()){
          //   return res.json(`endpoint not available`)
          // }
          if (ShardeumFlags.VerboseLogs) console.log('/accounts')
          //res.json({accounts})
    
          // stable sort on accounts order..  todo, may turn this off later for perf reasons.
    
          //let sorted = Utils.safeJsonParse(Utils.safeStringify(accounts))
          const accounts = await AccountsStorage.debugGetAllAccounts()
          const sorted = Utils.safeJsonParse(Utils.safeStringify(accounts))
    
          res.json({ accounts: sorted })
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in processing accounts request:', error)
          res.status(500).json({ error: error.message })
        }
      })
    
      shardus.registerExternalGet('genesis_accounts', externalApiMiddleware, async (req, res) => {
        try {
          const { start } = req.query
          if (!start) {
            res.json({ success: false, reason: 'start value is not defined!' })
            return
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
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in processing genesis_accounts request:', error)
          res.status(500).json({ error: 'Internal Server Error' })
        }
      })
    
      shardus.registerExternalGet('secure_accounts', externalApiMiddleware, async (req, res) => {
        try {
          const secureAccounts = []
          for (const secureAccountConfig of secureAccountDataMap.values()) {
            const [secureAccount, sourceAccount, recipientAccount] = await Promise.all([
              AccountsStorage.getAccount(secureAccountConfig.SecureAccountAddress),
              AccountsStorage.getAccount(secureAccountConfig.SourceFundsAddress),
              AccountsStorage.getAccount(secureAccountConfig.RecipientFundsAddress),
            ])
            secureAccounts.push({ secureAccount, sourceAccount, recipientAccount, secureAccountConfig })
          }
          res.json({ success: true, accounts: secureAccounts })
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in processing secure_accounts request:', error)
          res.status(500).json({ success: false, reason: 'Internal Server Error' })
        }
      })
    
      // Returns the hardware-spec of the server running the validator
      shardus.registerExternalGet('system-info', debugMiddlewareLow, async (req, res) => {
        try {
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
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in processing system-info request:', error)
          res.status(500).json({ error: error.message })
        }
      })
    
      shardus.registerExternalPut('query-certificate', externalApiMiddleware, async (req: Request, res: Response) => {
        try {
          nestedCountersInstance.countEvent('shardeum-penalty', 'called query-certificate')
          const queryCertRes = await queryCertificateHandler(req, shardus)
          if (ShardeumFlags.VerboseLogs) console.log('queryCertRes', queryCertRes)
          if (queryCertRes.success) {
            const successRes = queryCertRes as CertSignaturesResult
            stakeCert = successRes.signedStakeCert
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler success`)
          } else {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-staking', `queryCertificateHandler failed with reason: ${(queryCertRes as ValidatorError).reason}`)
          }
    
          res.json(Utils.safeJsonParse(Utils.safeStringify(queryCertRes)))
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in processing query-certificate request:', error)
          res.status(500).json({ error: 'Internal Server Error' })
        }
      })
    
      // Returns the latest value from isReadyToJoin call
      // TODO verify if this is used by the node operator
      shardus.registerExternalGet('debug-is-ready-to-join', async (req, res) => {
        try {
          const publicKey = shardus.crypto.getPublicKey()
    
          res.json({ isReady: isReadyToJoinLatestValue, nodePubKey: publicKey })
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in processing debug-is-ready-to-join request:', error)
          res.status(500).json({ error: 'Internal Server Error' })
        }
      })
    
      // Changes the threshold for the blocked-At function
      shardus.registerExternalGet('debug-set-event-block-threshold', debugMiddleware, async (req, res) => {
        try {
          const threshold = Number(req.query.threshold)
    
          if (isNaN(threshold) || threshold <= 0) {
            res.json({ error: `Invalid threshold: ${req.query.threshold}` })
            return
          }
    
          //startBlockedCheck(threshold)
          res.json({ success: `Threshold set to ${threshold}ms` })
        } catch (err) {
          res.json({ error: `Error setting threshold: ${err.toString()}` })
        }
      })
    
      // endpoint on joining nodes side to receive admin certificate
      shardus.registerExternalPut('admin-certificate', externalApiMiddleware, async (req, res) => {
        try {
          nestedCountersInstance.countEvent('shardeum-admin-certificate', 'called PUT admin-certificate')
    
          const certRes = await putAdminCertificateHandler(req, shardus)
          /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log('certRes', certRes)
          if (certRes.success) {
            const successRes = certRes as PutAdminCertResult
            adminCert = successRes.signedAdminCert
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-admin-certificate', `putAdminCertificateHandler success`)
          } else {
            /* prettier-ignore */ nestedCountersInstance.countEvent('shardeum-admin-certificate', `putAdminCertificateHandler failed with reason: ${(certRes as ValidatorError).reason}`)
          }
    
          res.json(certRes)
        } catch (error) {
          /* prettier-ignore */ if (logFlags.error) console.error('Error in processing admin-certificate request:', error)
          res.status(500).json({ error: 'Internal Server Error' })
        }
      })
    
      shardus.registerExternalGet('is-alive', async (req, res) => {
        nestedCountersInstance.countEvent('endpoint', 'is-alive')
        res.sendStatus(200)
      })
    
      shardus.registerExternalGet('is-healthy', async (req, res) => {
        const dbHealthy = await AccountsStorage.checkDatabaseHealth()
        const result = {
          status: dbHealthy ? 'healthy' : 'degraded',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          database: dbHealthy ? 'healthy' : 'unreachable',
        }
        nestedCountersInstance.countEvent('endpoint', 'health-check')
    
        // fastify automatically converts 500 body if not explicitly set like this
        res.header('Content-Type', 'application/json')
        res.status(dbHealthy ? 200 : 500).send(result)
      })
    
      shardus.registerExternalGet('is-genesis-node/:nominator', async (req, res) => {
        const isTicketTypesEnabled = ShardeumFlags.ticketTypesEnabled
        /* prettier-ignore */ if (logFlags.debug) console.log(`[is-genesis-node] isTicketsEnabled: ${isTicketTypesEnabled}`)
        if (!isTicketTypesEnabled) {
          return res.json({ success: true, reason: 'Ticket types are not enabled' })
        }
        let senderAddress: Address
        try {
          senderAddress = Address.fromString(req.params['nominator'])
        } catch (error) {
          return res.json({ success: false, reason: 'Invalid address' })
        }
        const doesNominatorHaveTicketTypeResponse: { success: boolean; reason: string; enabled: boolean } =
          doesTransactionSenderHaveTicketType({ ticketType: TicketTypes.SILVER, senderAddress })
        /* prettier-ignore */ if (logFlags.debug) console.log(
          `[is-genesis-node] doesNominatorHaveTicketTypeResponse: ${doesNominatorHaveTicketTypeResponse}`
        )
        if (doesNominatorHaveTicketTypeResponse.enabled && !doesNominatorHaveTicketTypeResponse.success) {
          return res.json({
            success: doesNominatorHaveTicketTypeResponse.success,
            reason: doesNominatorHaveTicketTypeResponse.reason,
          })
        } else {
          return res.json({ success: true, reason: 'Genesis Node detected' })
        }
      })
    }
}
