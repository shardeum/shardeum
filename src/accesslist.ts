import { ShardusTypes } from '@shardeum-foundation/core'
import { toShardusAddress, toShardusAddressWithKey } from './shardeum/evmAddress'
import { AccountType, WrappedEVMAccount } from './shardeum/shardeumTypes'
import { generateTxId, emptyCodeHash } from './utils'
import { ShardeumFlags } from './shardeum/shardeumFlags'
import { getTransactionObj, isServiceMode, shardus, shardeumGetTime, blocks, latestBlock, EVM, evmCommon, _internalHackPostWithResp, fetchAndCacheAccountData } from './index'
import { oneSHM } from './shardeum/shardeumConstants'
import { getTxSenderAddress } from './utils'
import { getPreRunTXState } from './index'
import * as AccountsStorage from './storage/accountStorage'
import { fixDeserializedWrappedEVMAccount } from './shardeum/wrappedEVMAccountFunctions'
import { Account } from '@ethereumjs/util'
import { logFlags } from './index'
import { nestedCountersInstance } from '@shardeum-foundation/core'
import { Utils } from '@shardeum-foundation/lib-types'
import { sleep } from './utils'
import { EVM as EthereumVirtualMachine } from './evm_v2'
import { bytesToHex } from '@ethereumjs/util'

type CodeHashObj = { codeHash: string; contractAddress: string }
type WarmupStats = {
  accReq: number
  accRcvd: number
  accRcvdNull: number
  accReqErr: number
  cacheHit: number
  cacheMiss: number
  cacheEmpty: number
  cacheEmptyReqMiss: number
}

export async function generateAccessList(
    injectedTx: ShardusTypes.OpaqueTransaction,
    warmupList: { accessList: any[]; codeHashes: CodeHashObj[] },
    caller: string
  ): Promise<{
    shardusMemoryPatterns: null
    failedAccessList?: boolean
    accessList: any[]
    codeHashes: CodeHashObj[]
  }> {
    try {
      const transaction = getTransactionObj(injectedTx)
      const caShardusAddress = transaction.to ? toShardusAddress(transaction.to.toString(), AccountType.Account) : null
  
      if (caShardusAddress != null) {
        /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log('Generating accessList to ', transaction.to.toString(), caShardusAddress)
  
        const address = caShardusAddress
        const accountIsRemote = isServiceMode() ? false : shardus.isAccountRemote(address)
        //ShardeumFlags.debugLocalAALG === false means that we will skip the remote attempt and run it locally
        if (accountIsRemote && ShardeumFlags.debugLocalAALG === false) {
          const consensusNode = shardus.getRandomConsensusNodeForAccount(address)
          /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: ${consensusNode?.externalIp}:${consensusNode?.externalPort}`)
          if (consensusNode != null) {
            /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: requesting`)
  
            const postResp = await _internalHackPostWithResp(
              `${consensusNode.externalIp}:${consensusNode.externalPort}/contract/accesslist-warmup`,
              { injectedTx, warmupList }
            )
            /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log('Accesslist response from node', consensusNode.externalPort, postResp.body)
            if (postResp != null && postResp.body != null && postResp.body != '' && postResp.body.accessList != null) {
              /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: gotResp:${Utils.safeStringify(postResp.body)}`)
              if (Array.isArray(postResp.body.accessList) && postResp.body.accessList.length > 0) {
                /* prettier-ignore */ nestedCountersInstance.countEvent('accesslist', `remote shard accessList: ${postResp.body.accessList.length} items, success: ${postResp.body.failedAccessList != true}`)
                let failed = postResp.body.failedAccessList
                if (postResp.body.codeHashes == null || postResp.body.codeHashes.length == 0) {
                  failed = true
                }
                return {
                  accessList: postResp.body.accessList,
                  shardusMemoryPatterns: postResp.body.shardusMemoryPatterns,
                  codeHashes: postResp.body.codeHashes,
                  failedAccessList: failed,
                }
              } else {
                nestedCountersInstance.countEvent('accesslist', `remote shard accessList: empty`)
                return { accessList: [], shardusMemoryPatterns: null, codeHashes: [], failedAccessList: true }
              }
            }
          } else {
            nestedCountersInstance.countEvent('accesslist', `remote shard found no consensus node`)
            /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: consensusNode = null`)
            return { accessList: [], shardusMemoryPatterns: null, codeHashes: [], failedAccessList: true }
          }
        } else {
          /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Node is in remote shard: false`)
        }
      }
  
      const txId = generateTxId(injectedTx)
      const senderAddress = getTxSenderAddress(transaction, txId).address
      const preRunTxState = getPreRunTXState(txId)
      const callerEVMAddress = senderAddress.toString()
      const callerShardusAddress = toShardusAddress(callerEVMAddress, AccountType.Account)
      let callerAccount = await AccountsStorage.getAccount(callerShardusAddress)
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
        /* prettier-ignore */ nestedCountersInstance.countEvent('accesslist', `Unable to find caller account while generating accessList. Using a fake account to estimate gas`)
        /* prettier-ignore */ if (logFlags.dapp_verbose || logFlags.aalg) console.log(`Unable to find caller account: ${callerShardusAddress} while generating accessList. Using a fake account to generate accessList`)
      }
      // temporarily set caller account's nonce same as tx's nonce
      if (ShardeumFlags.accesslistNonceFix && callerAccount && callerAccount.account) {
        callerAccount.account.nonce = BigInt(transaction.nonce.toString())
      }
  
      preRunTxState._transactionState.insertFirstAccountReads(
        senderAddress,
        callerAccount ? callerAccount.account : fakeAccount // todo: using fake account may not work in new ethereumJS
      )
  
      let warmupCache = null
  
      const warmupStats: WarmupStats = {
        accReq: 0,
        accRcvd: 0,
        accRcvdNull: 0,
        accReqErr: 0,
        cacheHit: 0,
        cacheMiss: 0,
        cacheEmpty: 0,
        cacheEmptyReqMiss: 0,
      }
      //const promises:Promise<ShardusTypes.WrappedDataFromQueue>[] = []
      //use warmupList to fetch data in parallel.  We will feed this in as cache inputs to the transaction
      //state
      if (warmupList != null && warmupList.codeHashes?.length > 0 && warmupList.accessList?.length > 0) {
        warmupCache = new Map<string, WrappedEVMAccount>()
  
        const startTime = Date.now()
        for (const codeHashObj of warmupList.codeHashes) {
          const shardusAddr = toShardusAddressWithKey(
            codeHashObj.contractAddress,
            codeHashObj.codeHash,
            AccountType.ContractCode
          )
          //TODO: tie into code bytes cache! should be a pre-fetch
  
          //promises.push(shardus.getLocalOrRemoteAccount(shardusAddr, {useRICache:true}))
          fetchAndCacheAccountData(shardusAddr, warmupCache, warmupStats, true, txId, AccountType.ContractCode)
        }
        for (const accesListTuple of warmupList.accessList) {
          const contractAddress = accesListTuple[0]
          const storageArray = accesListTuple[1]
  
          const shardusContractAddr = toShardusAddress(contractAddress, AccountType.Account)
          //promises.push(shardus.getLocalOrRemoteAccount(shardusContractAddr))
          fetchAndCacheAccountData(shardusContractAddr, warmupCache, warmupStats, false, txId, AccountType.Account)
          for (const storageAddr of storageArray) {
            const shardusStorageAddr = toShardusAddressWithKey(contractAddress, storageAddr, AccountType.ContractStorage)
            //promises.push(shardus.getLocalOrRemoteAccount(shardusStorageAddr))
            fetchAndCacheAccountData(
              shardusStorageAddr,
              warmupCache,
              warmupStats,
              false,
              txId,
              AccountType.ContractStorage
            )
          }
        }
  
        /* prettier-ignore */ if (logFlags.aalg) console.log(`aalg: sending fetch: ${Date.now() - startTime} ms and wait ${ShardeumFlags.aalgWarmupSleep} tx:${txId}`)
        await sleep(ShardeumFlags.aalgWarmupSleep)
      }
  
      //Await all the promises.  TODO more advanced wait that is fault tolerant
      // const warmupData = await Promise.all(promises)
  
      // // build a warmupcache from the results we got
      // const warmupCache = new Map<string, WrappedEVMAccount>()
      // for(const warmupAcc of warmupData){
      //   warmupCache.set(warmupAcc.accountId, warmupAcc.data as WrappedEVMAccount )
      // }
      preRunTxState._transactionState.warmupCache = warmupCache
      preRunTxState._transactionState.warmupStats = warmupStats
  
      if (warmupList != null) {
        /* prettier-ignore */ if (logFlags.aalg) console.log(`warmup results, before:`, caller, txId, JSON.stringify(warmupStats, null, 2))
      }
  
      const customEVM = new EthereumVirtualMachine({
        common: evmCommon,
        stateManager: preRunTxState,
      })
  
      EVM.stateManager = null
      EVM.stateManager = preRunTxState
  
      if (transaction == null) {
        nestedCountersInstance.countEvent('accesslist', 'transaction is null')
        return { accessList: [], shardusMemoryPatterns: null, codeHashes: [] }
      }
      const txStart = Date.now()
  
      let runTxResult
      try {
        runTxResult = await EVM.runTx(
          {
            block: blocks[latestBlock],
            tx: transaction,
            // skipNonce: !ShardeumFlags.CheckNonce,
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
  
      const elapsed = Date.now() - txStart
      nestedCountersInstance.countEvent('accesslist-times', `elapsed ${Math.round(elapsed / 1000)} sec`)
  
      if (warmupList != null) {
        /* prettier-ignore */ if (logFlags.aalg) console.log(`aalg: results, after: warmed:`, caller, txId, elapsed, JSON.stringify(warmupStats, null, 2))
        //todo compare warmupList to access list
      } else {
        /* prettier-ignore */ if (logFlags.aalg) console.log(`aalg: results, after:`, caller, txId, elapsed, JSON.stringify(warmupStats, null, 2))
      }
  
      const readAccounts = preRunTxState._transactionState.getReadAccounts()
      const writtenAccounts = preRunTxState._transactionState.getWrittenAccounts()
      const allInvolvedContracts = []
      const accessList = []
  
      //get a full picture of the read/write 'bits'
      const readSet = new Set()
      const writeSet = new Set()
      //let readOnlySet = new Set()
      const writeOnceSet = new Set()
      const readImmutableSet = new Set()
  
      //always make the sender rw.  This is because the sender will always spend gas and increment nonce
      if (senderAddress != null) {
        const shardusKey = callerShardusAddress
        writeSet.add(shardusKey)
        readSet.add(shardusKey)
      }
  
      for (const [key, storageMap] of writtenAccounts.contractStorages) {
        if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
  
        let shardusKey = toShardusAddress(key, AccountType.Account)
        //writeSet.add(shardusKey) //don't assume we write to this account!
        //let written accounts handle that!
        for (const storageAddress of storageMap.keys()) {
          shardusKey = toShardusAddressWithKey(key, storageAddress, AccountType.ContractStorage)
          writeSet.add(shardusKey)
        }
      }
      for (const [key, storageMap] of readAccounts.contractStorages) {
        if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
  
        let shardusKey = toShardusAddress(key, AccountType.Account)
        readSet.add(shardusKey) //putting this is just to be "nice"
        //later we can remove the assumption that a CA is always read
        for (const storageAddress of storageMap.keys()) {
          shardusKey = toShardusAddressWithKey(key, storageAddress, AccountType.ContractStorage)
          readSet.add(shardusKey)
        }
      }
  
      for (const [codeHash, contractByteWrite] of readAccounts.contractBytes) {
        const contractAddress = contractByteWrite.contractAddress.toString()
        if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
  
        const shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
        readSet.add(shardusKey)
        readImmutableSet.add(shardusKey)
      }
  
      if (ShardeumFlags.fixContractBytes) {
        for (const [contractAddress, contractByteWrite] of writtenAccounts.contractBytes) {
          // for (const [contractAddress, contractByteWrite] of writtenAccounts.contractBytes) {
          if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
          const codeHash = bytesToHex(contractByteWrite.codeHash)
          const shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
          writeSet.add(shardusKey)
          //special case shardeum behavoir.  contract bytes can only be written once
          writeOnceSet.add(shardusKey)
        }
      } else {
        for (const [codeHash, contractByteWrite] of writtenAccounts.contractBytes) {
          const contractAddress = contractByteWrite.contractAddress.toString()
          if (!allInvolvedContracts.includes(contractAddress)) allInvolvedContracts.push(contractAddress)
          const shardusKey = toShardusAddressWithKey(contractAddress, codeHash, AccountType.ContractCode)
          writeSet.add(shardusKey)
          //special case shardeum behavoir.  contract bytes can only be written once
          writeOnceSet.add(shardusKey)
        }
      }
      for (const [key] of writtenAccounts.accounts) {
        if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
        const shardusKey = toShardusAddress(key, AccountType.Account)
        writeSet.add(shardusKey)
      }
      for (const [key] of readAccounts.accounts) {
        if (!allInvolvedContracts.includes(key)) allInvolvedContracts.push(key)
        const shardusKey = toShardusAddress(key, AccountType.Account)
        readSet.add(shardusKey)
      }
  
      //process our keys into one of four sets (writeOnceSet defined above)
      const readOnlySet = new Set()
      const writeOnlySet = new Set()
      const readWriteSet = new Set()
      for (const key of writeSet.values()) {
        if (readSet.has(key)) {
          readWriteSet.add(key)
        } else {
          writeOnlySet.add(key)
        }
      }
      for (const key of readSet.values()) {
        if (writeSet.has(key) === false) {
          readOnlySet.add(key)
        }
      }
      let shardusMemoryPatterns = null
  
      if (ShardeumFlags.generateMemoryPatternData) {
        shardusMemoryPatterns = {
          ro: Array.from(readOnlySet),
          rw: Array.from(readWriteSet),
          wo: Array.from(writeOnlySet),
          on: Array.from(writeOnceSet),
          ri: Array.from(readImmutableSet),
        }
      }
  
      if (ShardeumFlags.VerboseLogs || logFlags.aalg) {
        console.log('allInvolvedContracts', allInvolvedContracts)
        console.log('Read accounts', readAccounts)
        console.log('Written accounts', writtenAccounts)
        console.log('Immutable read accounts', readImmutableSet)
      }
  
      const allCodeHash = new Map<string, CodeHashObj>()
  
      for (const address of allInvolvedContracts) {
        const allKeys = new Set<string>()
        const readKeysMap = readAccounts.contractStorages.get(address)
        const writeKeyMap = writtenAccounts.contractStorages.get(address)
        if (readKeysMap) {
          for (const [key] of readKeysMap) {
            if (!allKeys.has(key)) allKeys.add(key)
          }
        }
  
        if (writeKeyMap) {
          for (const [key] of writeKeyMap) {
            if (!allKeys.has(key)) allKeys.add(key)
          }
        }
  
        //this is moved before we process contract bytes so that only storage accounts are added to the access list
        const accessListItem = [address, Array.from(allKeys)]
        accessList.push(accessListItem)
  
        for (const [codeHash, byteReads] of readAccounts.contractBytes) {
          const contractAddress = byteReads.contractAddress.toString()
          if (contractAddress !== address) continue
          //if (!allKeys.has(codeHash)) allKeys.add(codeHash)
          if (!allCodeHash.has(contractAddress)) allCodeHash.set(contractAddress, { codeHash, contractAddress })
        }
        for (const [, byteReads] of writtenAccounts.contractBytes) {
          const codeHash = bytesToHex(byteReads.codeHash)
          const contractAddress = byteReads.contractAddress.toString()
          if (contractAddress !== address) continue
          //if (!allKeys.has(codeHash)) allKeys.add(codeHash)
          if (!allCodeHash.has(contractAddress)) allCodeHash.set(contractAddress, { codeHash, contractAddress })
        }
  
        // const accessListItem = [address, Array.from(allKeys).map((key) => key)]
        // accessList.push(accessListItem)
      }
  
      if (ShardeumFlags.VerboseLogs || logFlags.aalg) console.log('Predicted accessList', accessList)
  
      if (runTxResult.execResult.exceptionError) {
        if (ShardeumFlags.VerboseLogs || logFlags.aalg)
          console.log('Execution Error:', runTxResult.execResult.exceptionError)
        /* prettier-ignore */ nestedCountersInstance.countEvent('accesslist', `Local Fail with evm error: CA ${transaction.to && ShardeumFlags.VerboseLogs ? transaction.to.toString() : ''}`)
        return { accessList: [], shardusMemoryPatterns: null, codeHashes: [], failedAccessList: true }
      }
      const isEmptyCodeHash = allCodeHash.size === 0
      if (isEmptyCodeHash) {
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs || logFlags.aalg) console.log(`aalg: empty codehash ${txId}
        allInvolvedContracts:  ${JSON.stringify(allInvolvedContracts, null, 2)}
  
        readAccounts.contractBytes: ${JSON.stringify(readAccounts.contractBytes, null, 2)}`)
        nestedCountersInstance.countEvent('accesslist', `Local Fail: empty codeHash`)
      } else nestedCountersInstance.countEvent('accesslist', `Local Success: true`)
      return {
        accessList,
        shardusMemoryPatterns,
        codeHashes: Array.from(allCodeHash.values()),
        failedAccessList: isEmptyCodeHash,
      }
    } catch (e) {
      console.log(`Error: generateAccessList`, e)
      nestedCountersInstance.countEvent('accesslist', `Local Fail: unknown`)
      return { accessList: [], shardusMemoryPatterns: null, codeHashes: [] }
    }
  }