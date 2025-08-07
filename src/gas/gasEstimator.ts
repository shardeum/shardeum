import { Address, bytesToHex, hexToBytes } from '@ethereumjs/util'
import { TypedTransaction } from '@ethereumjs/tx'
import { keccak256 } from 'ethereum-cryptography/keccak.js'
import TransactionState from '../state/transactionState'
import { ShardeumFlags } from '../shardeum/shardeumFlags'
import { AccountType, WrappedEVMAccount } from '../shardeum/shardeumTypes'
import { getAccount } from '../storage/accountStorage'
import { toShardusAddressWithKey } from '../shardeum/evmAddress'
import { KECCAK256_NULL_S } from '@ethereumjs/util'

export interface GasEstimationResult {
  baseGas: bigint
  additionalGas: bigint
  bufferPercentage: number
  totalGas: bigint
}

export interface StorageSlotInfo {
  slot: string
  value: Buffer
}

/**
 * Analyzes transaction data to detect batch operations
 */
export function detectBatchOperations(data: Uint8Array | null): {
  isBatch: boolean
  estimatedOperations: number
  dataLength: number
} {
  if (!data || data.length < 100) {
    return { isBatch: false, estimatedOperations: 0, dataLength: 0 }
  }

  const dataLength = data.length
  // Estimate operations based on average bytes per operation
  // This is a heuristic that works for many batch operations
  const estimatedOperations = Math.floor(dataLength / 100)
  
  return {
    isBatch: estimatedOperations > 1,
    estimatedOperations,
    dataLength
  }
}

/**
 * Calculates additional gas for batch operations
 */
export function calculateBatchOperationGas(estimatedOperations: number, dataLength: number): {
  arrayOperationGas: bigint
  eventGas: bigint
  secondaryStorageGas: bigint
  memoryGas: bigint
  total: bigint
} {
  // Array operations involving storage updates
  const arrayOperationGas = BigInt(estimatedOperations) * BigInt(10000)
  
  // Event emissions (LOG operations)
  const eventGas = BigInt(estimatedOperations) * BigInt(1500)
  
  // Secondary storage updates (counters, mappings)
  const secondaryStorageGas = BigInt(estimatedOperations) * BigInt(7600)
  
  // Memory expansion costs
  const memoryGas = BigInt(Math.floor(dataLength / 32)) * BigInt(3)
  
  const total = arrayOperationGas + eventGas + secondaryStorageGas + memoryGas
  
  return {
    arrayOperationGas,
    eventGas,
    secondaryStorageGas,
    memoryGas,
    total
  }
}

/**
 * Calculates dynamic buffer percentage based on operation complexity
 */
export function calculateBufferPercentage(
  estimatedOperations: number,
  storageWrites: number,
  hasLogs: boolean
): number {
  let bufferPercentage = 10 // Base buffer
  
  // Increase buffer for batch operations
  if (estimatedOperations > 1) {
    bufferPercentage = Math.min(25, 10 + Math.floor(estimatedOperations / 10))
  }
  
  // Increase buffer for many storage writes
  if (storageWrites > 10) {
    bufferPercentage = Math.max(bufferPercentage, 15)
  }
  
  // Increase buffer if events are present
  if (hasLogs) {
    bufferPercentage = Math.max(bufferPercentage, 12)
  }
  
  return bufferPercentage
}

/**
 * Preloads storage slots for accurate gas estimation
 */
export async function preloadStorageSlots(
  transaction: TypedTransaction,
  contractAccount: WrappedEVMAccount | null,
  transactionState: TransactionState
): Promise<void> {
  if (!transaction.to || !contractAccount) return

  const contractAddress = transaction.to
  const calldata = transaction.data

  if (!calldata || calldata.length < 4) return

  // Extract function selector
  const selector = bytesToHex(calldata.slice(0, 4))
  
  if (ShardeumFlags.VerboseLogs) {
    console.log(`GasEstimator: Preloading storage for contract ${contractAddress.toString()}, selector: ${selector}`)
  }

  // Strategy 1: Analyze calldata for potential storage keys
  const storageKeys = extractStorageKeysFromCalldata(calldata)
  
  // Strategy 2: Common storage slot patterns
  const commonSlots = getCommonStorageSlots(contractAddress)
  
  // Strategy 3: Function-specific patterns
  const functionSlots = getFunctionSpecificSlots(selector, calldata)
  
  // Combine all strategies
  const allSlots = new Set([...storageKeys, ...commonSlots, ...functionSlots])
  
  // Load storage values
  let loadedCount = 0
  for (const slotHex of allSlots) {
    try {
      const storageKey = toShardusAddressWithKey(
        contractAddress.toString(),
        slotHex,
        AccountType.ContractStorage
      )
      
      const storageAccount = await getAccount(storageKey)
      if (storageAccount && storageAccount.value) {
        const key = hexToBytes(slotHex)
        transactionState.insertFirstContractStorageReads(
          contractAddress,
          slotHex,
          storageAccount.value
        )
        loadedCount++
        
        if (ShardeumFlags.VerboseLogs) {
          console.log(`GasEstimator: Preloaded storage slot ${slotHex}`)
        }
      }
    } catch (error) {
      if (ShardeumFlags.VerboseLogs) {
        console.log(`GasEstimator: Failed to preload slot ${slotHex}:`, error)
      }
    }
  }
  
  if (ShardeumFlags.VerboseLogs) {
    console.log(`GasEstimator: Preloaded ${loadedCount} storage slots`)
  }
}

/**
 * Extracts potential storage keys from calldata
 */
function extractStorageKeysFromCalldata(calldata: Uint8Array): string[] {
  const keys: string[] = []
  
  // Skip function selector
  const data = calldata.slice(4)
  
  // Look for 32-byte aligned values that could be storage keys
  for (let i = 0; i < data.length - 31; i += 32) {
    const potentialKey = data.slice(i, i + 32)
    const keyHex = bytesToHex(potentialKey)
    
    // Basic heuristic: non-zero values that look like storage keys
    if (!isZeroBytes(potentialKey) && looksLikeStorageKey(keyHex)) {
      keys.push(keyHex)
    }
  }
  
  return keys
}

/**
 * Gets common storage slots that are frequently accessed
 */
function getCommonStorageSlots(contractAddress: Address): string[] {
  const slots: string[] = []
  
  // Common storage slots (first few slots often contain important state variables)
  slots.push('0x0000000000000000000000000000000000000000000000000000000000000000') // Slot 0
  slots.push('0x0000000000000000000000000000000000000000000000000000000000000001') // Slot 1
  slots.push('0x0000000000000000000000000000000000000000000000000000000000000002') // Slot 2
  
  // Array length slots
  for (let i = 3; i <= 10; i++) {
    slots.push(i.toString(16).padStart(64, '0'))
  }
  
  return slots
}

/**
 * Gets function-specific storage slots based on selector
 */
function getFunctionSpecificSlots(selector: string, calldata: Uint8Array): string[] {
  const slots: string[] = []
  
  // Batch operation detection
  if (calldata.length > 500) {
    // For batch operations, preload array-related slots
    const arraySlots = generateArrayStorageSlots(5, 10) // Arrays at slots 5-10
    slots.push(...arraySlots)
  }
  
  // Mapping operations often access computed slots
  if (calldata.length >= 68) { // selector + address + value
    const address = calldata.slice(16, 36)
    if (!isZeroBytes(address)) {
      // Compute mapping slot for common patterns
      for (let mappingSlot = 0; mappingSlot <= 5; mappingSlot++) {
        const slot = computeMappingSlot(address, mappingSlot)
        slots.push(bytesToHex(slot))
      }
    }
  }
  
  return slots
}

/**
 * Generates storage slots for array operations
 */
function generateArrayStorageSlots(startSlot: number, endSlot: number): string[] {
  const slots: string[] = []
  
  for (let i = startSlot; i <= endSlot; i++) {
    // Array length slot
    const lengthSlot = i.toString(16).padStart(64, '0')
    slots.push(lengthSlot)
    
    // First few array elements
    const arrayBase = keccak256(hexToBytes(lengthSlot))
    for (let j = 0; j < 5; j++) {
      const elementSlot = (BigInt('0x' + bytesToHex(arrayBase)) + BigInt(j)).toString(16).padStart(64, '0')
      slots.push(elementSlot)
    }
  }
  
  return slots
}

/**
 * Computes storage slot for mapping access
 */
function computeMappingSlot(key: Uint8Array, mappingPosition: number): Uint8Array {
  const position = Buffer.alloc(32)
  position.writeUInt32BE(mappingPosition, 28)
  
  const data = Buffer.concat([
    Buffer.from(key),
    position
  ])
  
  return keccak256(data)
}

/**
 * Checks if bytes are all zeros
 */
function isZeroBytes(bytes: Uint8Array): boolean {
  return bytes.every(b => b === 0)
}

/**
 * Heuristic to check if a hex string looks like a storage key
 */
function looksLikeStorageKey(hex: string): boolean {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  
  // Storage keys are often small numbers or computed hashes
  // Small numbers have many leading zeros
  const leadingZeros = cleanHex.match(/^0+/)?.[0].length || 0
  
  // Likely a small number (storage slot index)
  if (leadingZeros > 56) return true
  
  // Likely a computed hash (no obvious patterns)
  if (leadingZeros < 8 && !cleanHex.match(/(.)\1{8,}/)) return true
  
  return false
}

/**
 * Analyzes storage access patterns from transaction execution
 */
export function analyzeStorageAccess(
  readAccounts: { contractStorages: Map<string, Map<string, any>> },
  writtenAccounts: { contractStorages: Map<string, Map<string, any>> }
): {
  storageReads: number
  storageWrites: number
  contractsRead: number
  contractsWritten: number
} {
  let storageReads = 0
  let storageWrites = 0
  
  for (const [, storageMap] of readAccounts.contractStorages) {
    storageReads += storageMap.size
  }
  
  for (const [, storageMap] of writtenAccounts.contractStorages) {
    storageWrites += storageMap.size
  }
  
  return {
    storageReads,
    storageWrites,
    contractsRead: readAccounts.contractStorages.size,
    contractsWritten: writtenAccounts.contractStorages.size
  }
}

/**
 * Main gas estimation enhancement function
 */
export async function enhanceGasEstimate(
  baseEstimate: bigint,
  transaction: TypedTransaction,
  runTxResult: any,
  transactionState: TransactionState
): Promise<GasEstimationResult> {
  let additionalGas = BigInt(0)
  let bufferPercentage = 10
  
  // Detect batch operations
  const batchInfo = detectBatchOperations(transaction.data)
  
  if (batchInfo.isBatch) {
    const batchGas = calculateBatchOperationGas(
      batchInfo.estimatedOperations,
      batchInfo.dataLength
    )
    additionalGas = batchGas.total
    
    if (ShardeumFlags.VerboseLogs) {
      console.log('GasEstimator: Batch operation detected:', {
        estimatedOperations: batchInfo.estimatedOperations,
        arrayOperationGas: batchGas.arrayOperationGas.toString(),
        eventGas: batchGas.eventGas.toString(),
        secondaryStorageGas: batchGas.secondaryStorageGas.toString(),
        memoryGas: batchGas.memoryGas.toString(),
        totalAdditional: additionalGas.toString(),
      })
    }
  }
  
  // Analyze logs
  const hasLogs = runTxResult.execResult.logs && runTxResult.execResult.logs.length > 0
  if (hasLogs && additionalGas === BigInt(0)) {
    // Add gas for events if not already accounted for
    const logCount = runTxResult.execResult.logs.length
    additionalGas += BigInt(logCount) * BigInt(1000)
  }
  
  // Analyze storage patterns
  const readAccounts = transactionState.getReadAccounts()
  const writtenAccounts = transactionState.getWrittenAccounts()
  const storageAnalysis = analyzeStorageAccess(readAccounts, writtenAccounts)
  
  if (storageAnalysis.storageWrites > 10) {
    // Complex storage operation detected
    additionalGas += BigInt(storageAnalysis.storageWrites) * BigInt(1000)
  }
  
  // Calculate dynamic buffer
  bufferPercentage = calculateBufferPercentage(
    batchInfo.estimatedOperations,
    storageAnalysis.storageWrites,
    hasLogs
  )
  
  // Calculate total with buffer
  const totalBeforeBuffer = baseEstimate + additionalGas
  const bufferAmount = (totalBeforeBuffer * BigInt(bufferPercentage)) / BigInt(100)
  const totalGas = totalBeforeBuffer + bufferAmount
  
  if (ShardeumFlags.VerboseLogs) {
    console.log('GasEstimator: Enhancement summary:', {
      baseEstimate: baseEstimate.toString(),
      additionalGas: additionalGas.toString(),
      bufferPercentage,
      totalGas: totalGas.toString(),
      storageAnalysis
    })
  }
  
  return {
    baseGas: baseEstimate,
    additionalGas,
    bufferPercentage,
    totalGas
  }
}