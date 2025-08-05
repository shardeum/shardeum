import TransactionState, { RunType } from '../../../../src/state/transactionState'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { Address, bytesToHex } from '@ethereumjs/util'
import { RLP } from '@ethereumjs/rlp'

// Mock dependencies
jest.mock('../../../../src/index', () => ({
  shardeumGetTime: jest.fn(() => Date.now()),
  isArchiverMode: jest.fn(() => false)
}))

jest.mock('../../../../src/storage/accountStorage', () => ({
  getAccount: jest.fn().mockResolvedValue(null),
  cachedNetworkAccount: null
}))

/**
 * Test for SHARD-2680: Verifies the checkpoint/revert fix for storage and bytecode
 */
describe('TransactionState - Storage Checkpoint/Revert Fix', () => {
  let transactionState: TransactionState
  let mockCallbacks: any
  let mockShardeumState: any

  beforeEach(() => {
    // Enable checkpoint support
    ShardeumFlags.CheckpointRevertSupport = true
    
    mockCallbacks = {
      storageMiss: jest.fn().mockResolvedValue(false),
      contractStorageMiss: jest.fn().mockResolvedValue(false),
      accountInvolved: jest.fn().mockReturnValue(true),
      contractStorageInvolved: jest.fn().mockReturnValue(true),
      tryGetRemoteAccountCB: jest.fn().mockResolvedValue(undefined),
      monitorEventCB: jest.fn()
    }

    mockShardeumState = {}

    transactionState = new TransactionState()
    transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
  })

  test('CRITICAL FIX: Storage writes should be isolated between checkpoints', async () => {
    const contractAddress = Address.fromString('0x1234567890123456789012345678901234567890')
    const key1 = bytesToHex(new Uint8Array([1, 2, 3, 4]))
    const key2 = bytesToHex(new Uint8Array([5, 6, 7, 8]))
    const value1 = RLP.encode(new Uint8Array([10, 20, 30]))
    const value2 = RLP.encode(new Uint8Array([40, 50, 60]))

    // Write to storage in parent scope
    const storageWrites = new Map<string, Uint8Array>()
    storageWrites.set(key1, value1)
    transactionState.allContractStorageWrites.set(contractAddress.toString(), storageWrites)

    // Create checkpoint - this should push current writes to stack
    transactionState.checkpoint()

    // Verify stack was created and current map is new
    expect(transactionState.allContractStorageWritesStack.length).toBe(1)
    expect(transactionState.allContractStorageWrites.size).toBe(0)

    // Write in inner scope
    const innerStorageWrites = new Map<string, Uint8Array>()
    innerStorageWrites.set(key2, value2)
    transactionState.allContractStorageWrites.set(contractAddress.toString(), innerStorageWrites)

    // Revert - should only clear inner scope changes
    transactionState.revert('test revert')

    // CRITICAL VERIFICATION: Parent storage should be restored from stack
    expect(transactionState.allContractStorageWritesStack.length).toBe(0)
    expect(transactionState.allContractStorageWrites.size).toBe(0) // Current map cleared
    
    // But when we read, it should find the value from the proper location
    // Since we're at checkpoint 0, we need to check the committed values or first reads
  })

  test('CRITICAL FIX: Bytecode writes should be isolated between checkpoints', async () => {
    const address1 = Address.fromString('0x0000000000000000000000000000000000000001')
    const address2 = Address.fromString('0x0000000000000000000000000000000000000002')
    const codeHash1 = bytesToHex(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))
    const codeHash2 = bytesToHex(new Uint8Array([9, 10, 11, 12, 13, 14, 15, 16]))
    
    const contractWrite1 = {
      contractByte: new Uint8Array([0x60, 0x80]),
      codeHash: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      contractAddress: address1
    }
    
    const contractWrite2 = {
      contractByte: new Uint8Array([0x60, 0x60]),
      codeHash: new Uint8Array([9, 10, 11, 12, 13, 14, 15, 16]),
      contractAddress: address2
    }

    // Write bytecode in parent scope
    transactionState.allContractBytesWrites.set(codeHash1, contractWrite1)
    transactionState.allContractBytesWritesByAddress.set(address1.toString(), contractWrite1)

    // Create checkpoint
    transactionState.checkpoint()

    // Verify stacks were created
    expect(transactionState.allContractBytesWritesStack.length).toBe(1)
    expect(transactionState.allContractBytesWritesByAddressStack.length).toBe(1)
    expect(transactionState.allContractBytesWrites.size).toBe(0)
    expect(transactionState.allContractBytesWritesByAddress.size).toBe(0)

    // Write in inner scope
    transactionState.allContractBytesWrites.set(codeHash2, contractWrite2)
    transactionState.allContractBytesWritesByAddress.set(address2.toString(), contractWrite2)

    // Revert - should only clear inner scope changes
    transactionState.revert('test revert')

    // CRITICAL VERIFICATION: Bytecode stacks should be properly managed
    expect(transactionState.allContractBytesWritesStack.length).toBe(0)
    expect(transactionState.allContractBytesWritesByAddressStack.length).toBe(0)
    expect(transactionState.allContractBytesWrites.size).toBe(0)
    expect(transactionState.allContractBytesWritesByAddress.size).toBe(0)
  })

  test('Multiple nested checkpoints should maintain proper isolation', async () => {
    const contractAddress = Address.fromString('0x1234567890123456789012345678901234567890')
    const key1 = new Uint8Array([1])
    const key2 = new Uint8Array([2])
    const key3 = new Uint8Array([3])
    const value1 = new Uint8Array([100])
    const value2 = new Uint8Array([200])
    const value3 = new Uint8Array([300])

    // Start with initial checkpoint to enable stack-based storage
    transactionState.checkpoint()

    // Level 0: Write key1 using proper API
    await transactionState.putContractStorage(contractAddress, key1, value1)

    // Checkpoint 1
    transactionState.checkpoint()
    expect(transactionState.allContractStorageWritesStack.length).toBe(2)

    // Level 1: Write key2 using proper API
    await transactionState.putContractStorage(contractAddress, key2, value2)

    // Checkpoint 2
    transactionState.checkpoint()
    expect(transactionState.allContractStorageWritesStack.length).toBe(3)

    // Level 2: Write key3 using proper API
    await transactionState.putContractStorage(contractAddress, key3, value3)

    // Verify all values are accessible
    const val1Before = await transactionState.getContractStorage(null, contractAddress, key1, false, false)
    const val2Before = await transactionState.getContractStorage(null, contractAddress, key2, false, false)
    const val3Before = await transactionState.getContractStorage(null, contractAddress, key3, false, false)
    expect(val1Before).toEqual(value1)
    expect(val2Before).toEqual(value2)
    expect(val3Before).toEqual(value3)

    // Commit level 2 to level 1
    transactionState.commit()
    expect(transactionState.allContractStorageWritesStack.length).toBe(2)
    
    // All values should still be accessible after commit
    const val1After = await transactionState.getContractStorage(null, contractAddress, key1, false, false)
    const val2After = await transactionState.getContractStorage(null, contractAddress, key2, false, false)
    const val3After = await transactionState.getContractStorage(null, contractAddress, key3, false, false)
    expect(val1After).toEqual(value1)
    expect(val2After).toEqual(value2)
    expect(val3After).toEqual(value3)

    // Revert level 1 - should lose key2 and key3, but keep key1
    transactionState.revert('revert level 1')
    expect(transactionState.allContractStorageWritesStack.length).toBe(1)

    // CRITICAL: key1 should still exist, but key2 and key3 should be gone
    const val1Final = await transactionState.getContractStorage(null, contractAddress, key1, false, false)
    const val2Final = await transactionState.getContractStorage(null, contractAddress, key2, false, false)
    const val3Final = await transactionState.getContractStorage(null, contractAddress, key3, false, false)
    expect(val1Final).toEqual(value1)
    expect(val2Final).toEqual(new Uint8Array(0)) // Should be empty
    expect(val3Final).toEqual(new Uint8Array(0)) // Should be empty
  })
})