import { Account, Address } from '@ethereumjs/util'
import TransactionState, { RunType } from '../../../../src/state/transactionState'
import { ShardeumFlags } from '../../../../src/shardeum/shardeumFlags'
import { keccak256 } from 'ethereum-cryptography/keccak.js'

// Mock shardeumGetTime and isArchiverMode
jest.mock('../../../../src/index', () => ({
  shardeumGetTime: jest.fn(() => Date.now()),
  isArchiverMode: jest.fn(() => false)
}))

// Mock storage
jest.mock('../../../../src/storage/accountStorage')

/**
 * Critical test for SHARD-2680: Checkpoint/Revert State Corruption Fix
 * 
 * This test verifies that the fix for the checkpoint/revert vulnerability
 * properly maintains state isolation between nested checkpoints.
 * 
 * The vulnerability allowed a revert in an inner scope to erase ALL
 * storage and bytecode changes, including those from parent scopes,
 * potentially leading to theft of funds and state corruption.
 */
describe('TransactionState - Checkpoint/Revert State Corruption Fix', () => {
  let transactionState: TransactionState
  let mockCallbacks: any
  let mockShardeumState: any

  const address1 = Address.fromString('0x0000000000000000000000000000000000000001')
  const address2 = Address.fromString('0x0000000000000000000000000000000000000002')
  const contractAddress = Address.fromString('0x1234567890123456789012345678901234567890')
  
  const storageKey1 = new Uint8Array([1, 2, 3, 4])
  const storageKey2 = new Uint8Array([5, 6, 7, 8])
  const storageValue1 = new Uint8Array([10, 20, 30])
  const storageValue2 = new Uint8Array([40, 50, 60])
  
  const contractCode1 = new Uint8Array([0x60, 0x80, 0x60, 0x40])
  const contractCode2 = new Uint8Array([0x60, 0x60, 0x60, 0x60])

  beforeEach(() => {
    ShardeumFlags.CheckpointRevertSupport = true
    
    mockCallbacks = {
      storageMiss: jest.fn().mockResolvedValue(false),
      contractStorageMiss: jest.fn().mockResolvedValue(false),
      accountInvolved: jest.fn().mockReturnValue(true),
      contractStorageInvolved: jest.fn().mockReturnValue(true),
      tryGetRemoteAccountCB: jest.fn().mockResolvedValue(undefined),
      monitorEventCB: jest.fn()
    }

    mockShardeumState = {
      accountWrites: new Map(),
      contractStorageWrites: new Map()
    }

    transactionState = new TransactionState()
    transactionState.initData(mockShardeumState, mockCallbacks, 'tx123', null, null, RunType.Apply)
  })

  describe('Critical Fix: Storage State Isolation', () => {
    test('should maintain parent storage state after inner checkpoint revert', async () => {
      // Start with an initial checkpoint to enable stack-based storage
      transactionState.checkpoint()
      
      // Parent scope: Write storage value 1
      await transactionState.putContractStorage(contractAddress, storageKey1, storageValue1)
      
      // Create inner checkpoint
      transactionState.checkpoint()
      
      // Inner scope: Write storage value 2
      await transactionState.putContractStorage(contractAddress, storageKey2, storageValue2)
      
      // Verify both values are accessible
      const value1Before = await transactionState.getContractStorage(null, contractAddress, storageKey1, false, false)
      const value2Before = await transactionState.getContractStorage(null, contractAddress, storageKey2, false, false)
      expect(value1Before).toEqual(storageValue1)
      expect(value2Before).toEqual(storageValue2)
      
      // CRITICAL: Revert inner checkpoint
      transactionState.revert('inner scope failure')
      
      // CRITICAL VERIFICATION: Parent storage value should still exist
      const value1After = await transactionState.getContractStorage(null, contractAddress, storageKey1, false, false)
      expect(value1After).toEqual(storageValue1)
      
      // Inner storage value should be gone
      const value2After = await transactionState.getContractStorage(null, contractAddress, storageKey2, false, false)
      expect(value2After).toEqual(new Uint8Array(0))
    })

    test('should handle nested checkpoints with multiple storage writes', async () => {
      // Start with an initial checkpoint to enable stack-based storage
      transactionState.checkpoint()
      
      // Outer scope
      await transactionState.putContractStorage(contractAddress, storageKey1, storageValue1)
      
      // First checkpoint
      transactionState.checkpoint()
      await transactionState.putContractStorage(contractAddress, storageKey2, storageValue2)
      
      // Second checkpoint
      transactionState.checkpoint()
      const modifiedValue1 = new Uint8Array([11, 22, 33])
      await transactionState.putContractStorage(contractAddress, storageKey1, modifiedValue1)
      
      // Revert second checkpoint
      transactionState.revert('revert second')
      
      // Original key1 value should be restored, key2 should still exist
      const value1 = await transactionState.getContractStorage(null, contractAddress, storageKey1, false, false)
      const value2 = await transactionState.getContractStorage(null, contractAddress, storageKey2, false, false)
      expect(value1).toEqual(storageValue1)
      expect(value2).toEqual(storageValue2)
      
      // Commit first checkpoint
      transactionState.commit()
      
      // Both values should still be accessible after commit
      const value1Final = await transactionState.getContractStorage(null, contractAddress, storageKey1, false, false)
      const value2Final = await transactionState.getContractStorage(null, contractAddress, storageKey2, false, false)
      expect(value1Final).toEqual(storageValue1)
      expect(value2Final).toEqual(storageValue2)
    })
  })

  describe('Critical Fix: Bytecode State Isolation', () => {
    test('should maintain parent bytecode state after inner checkpoint revert', async () => {
      // Start with an initial checkpoint to enable stack-based storage
      transactionState.checkpoint()
      
      // Parent scope: Deploy contract 1
      await transactionState.putContractCode(address1, contractCode1)
      
      // Create inner checkpoint
      transactionState.checkpoint()
      
      // Inner scope: Deploy contract 2
      await transactionState.putContractCode(address2, contractCode2)
      
      // Mock the account to return proper code hash
      const account1 = Account.fromAccountData({ codeHash: keccak256(contractCode1) })
      const account2 = Account.fromAccountData({ codeHash: keccak256(contractCode2) })
      
      jest.spyOn(transactionState, 'getAccount')
        .mockImplementation(async (_, address) => {
          if (address.toString() === address1.toString()) return account1
          if (address.toString() === address2.toString()) return account2
          return new Account()
        })
      
      // Verify both codes are accessible
      const code1Before = await transactionState.getContractCode(null, address1, false, false)
      const code2Before = await transactionState.getContractCode(null, address2, false, false)
      expect(code1Before).toEqual(contractCode1)
      expect(code2Before).toEqual(contractCode2)
      
      // CRITICAL: Revert inner checkpoint
      transactionState.revert('inner scope failure')
      
      // CRITICAL VERIFICATION: Parent contract code should still exist
      const code1After = await transactionState.getContractCode(null, address1, false, false)
      expect(code1After).toEqual(contractCode1)
      
      // Inner contract code should be gone
      const code2After = await transactionState.getContractCode(null, address2, false, false)
      expect(code2After).toEqual(new Uint8Array(0))
    })
  })

  describe('Attack Scenario Prevention', () => {
    test('should prevent the try/catch storage erasure attack', async () => {
      // Start with an initial checkpoint to enable stack-based storage
      transactionState.checkpoint()
      
      // Simulate a DEX or lending protocol scenario
      const victimContract = Address.fromString('0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF')
      const depositKey = new Uint8Array([0x01]) // Deposit record key
      const depositAmount = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]) // Large deposit
      
      // Victim contract records a deposit
      await transactionState.putContractStorage(victimContract, depositKey, depositAmount)
      
      // Attacker initiates nested call
      transactionState.checkpoint()
      
      // Attacker performs some operation that will fail
      const attackerKey = new Uint8Array([0x02])
      const attackerValue = new Uint8Array([0x00])
      await transactionState.putContractStorage(victimContract, attackerKey, attackerValue)
      
      // Attacker triggers revert (simulating a failed require/assert)
      transactionState.revert('attacker triggered revert')
      
      // CRITICAL: Verify victim's deposit record is NOT erased
      const depositAfterAttack = await transactionState.getContractStorage(null, victimContract, depositKey, false, false)
      expect(depositAfterAttack).toEqual(depositAmount)
      
      // The attack is prevented! The deposit record remains intact.
    })

    test('should handle complex DeFi interaction with multiple checkpoints', async () => {
      // Start with an initial checkpoint to enable stack-based storage
      transactionState.checkpoint()
      
      // Simulate: User -> Router -> Pool -> Token contract calls
      const pool = Address.fromString('0x2222222222222222222222222222222222222222')
      const token = Address.fromString('0x3333333333333333333333333333333333333333')
      
      const balanceKey = new Uint8Array([0x00])
      const liquidityKey = new Uint8Array([0x01])
      const approvalKey = new Uint8Array([0x02])
      
      // Initial state
      const userBalance = new Uint8Array([0x10, 0x00])
      const poolLiquidity = new Uint8Array([0x50, 0x00])
      
      // Router updates user balance
      await transactionState.putContractStorage(token, balanceKey, userBalance)
      
      // Router calls pool (checkpoint 1)
      transactionState.checkpoint()
      
      // Pool updates liquidity
      await transactionState.putContractStorage(pool, liquidityKey, poolLiquidity)
      
      // Pool calls token for approval check (checkpoint 2)
      transactionState.checkpoint()
      
      // Token contract has an issue and reverts
      await transactionState.putContractStorage(token, approvalKey, new Uint8Array([0x00]))
      transactionState.revert('approval check failed')
      
      // After inner revert, pool liquidity should still be updated
      const liquidityAfterInnerRevert = await transactionState.getContractStorage(null, pool, liquidityKey, false, false)
      expect(liquidityAfterInnerRevert).toEqual(poolLiquidity)
      
      // Router's balance update should also still exist
      const balanceAfterInnerRevert = await transactionState.getContractStorage(null, token, balanceKey, false, false)
      expect(balanceAfterInnerRevert).toEqual(userBalance)
      
      // Pool decides to commit its changes
      transactionState.commit()
      
      // All non-reverted changes should persist
      const finalBalance = await transactionState.getContractStorage(null, token, balanceKey, false, false)
      const finalLiquidity = await transactionState.getContractStorage(null, pool, liquidityKey, false, false)
      expect(finalBalance).toEqual(userBalance)
      expect(finalLiquidity).toEqual(poolLiquidity)
    })
  })
})