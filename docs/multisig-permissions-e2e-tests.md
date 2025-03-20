# Multi-Signature Permissions E2E Test Cases

## Testing Setup
- Use multisig-app for all proposal creation and signing operations
- Coordinate with co-testers for multi-signature collection
- Test against appropriate Shardeum network
- **Verification Method**: Check network account via archiver API: `http://{archiver-ip:port}/get-network-account?hash=false`

## 1. Basic Permission Validation

### Test Case 1.1: Valid Multi-Sig Key Access
1. Using a key in both `changeMultiSigKeyList` and `debug.multisigKeys`, create a proposal to modify the multi-sig key list
2. Collect required signatures from co-testers
3. Submit the proposal
4. Verify change in network account via archiver API

### Test Case 1.2: Unauthorized Key Access
1. Using a key in `debug.multisigKeys` but NOT in `changeMultiSigKeyList`, attempt to create a proposal to modify the multi-sig key list
2. Verify rejection with appropriate error
3. Confirm via archiver API that no change occurred in network account

## 2. Dual Verification System

### Test Case 2.1: Inactive Key Rejection
1. Create a proposal using a key present in `changeMultiSigKeyList` but removed from `debug.multisigKeys`
2. Attempt to sign and verify rejection
3. Check network account via archiver to confirm no changes

### Test Case 2.2: Permission List Filtering
1. Add a test key to `changeMultiSigKeyList` but not to `debug.multisigKeys`
2. Create a relevant proposal
3. Check network account before and after to verify filtering behavior

## 3. Multi-Signature Requirements

### Test Case 3.1: Minimum Signature Enforcement
1. Set `minMultiSigRequiredForGlobalTxs` to a value > 1
2. Create a config change proposal
3. Submit with fewer than required signatures
4. Verify via archiver API that network account remains unchanged

### Test Case 3.2: Multiple Valid Signatures
1. Create a non-key config change proposal
2. Collect exactly the minimum required signatures
3. Submit and verify change via archiver API
4. Create another proposal with more than minimum signatures
5. Verify successful change via archiver API

## 4. Permission Category Tests

### Test Case 4.1: Developer Key List Change
1. Create a proposal to modify the developer key list using key(s) from `changeDevKeyList`
2. Submit and verify via archiver API that the developer key list was updated
3. Attempt same with keys from other permission lists
4. Verify rejection and unchanged network account via archiver

### Test Case 4.2: Secure Account Transfer
1. Create a proposal to transfer from a secure account using key(s) from `initiateSecureAccountTransfer`
2. Submit and verify the transfer occurred by checking account balances
3. Attempt same with keys from other permission lists
4. Verify rejection and unchanged balances

### Test Case 4.3: Non-Key Configuration Changes
1. Create a proposal to modify non-key configuration using key(s) from `changeNonKeyConfigs`
2. Submit and verify via archiver API that configuration was updated
3. Attempt same with keys from other permission lists
4. Verify rejection and unchanged configuration via archiver

## 5. Security Level Tests

### Test Case 5.1: Security Level Requirement
1. Create a key change proposal
2. Attempt to use a key with insufficient security level
3. Verify rejection
4. Confirm via archiver API that no change occurred

## 6. Edge Cases

### Test Case 6.1: Permission List Consistency
1. Using a key present in multiple permission lists, create proposals for different operation types
2. Verify proper functioning across all authorized categories
3. Check network account via archiver after each operation

### Test Case 6.2: Empty Permission Lists
1. Create a test environment with an empty permission list for one category
2. Attempt operations in that category
3. Verify via archiver API that no changes occur

### Test Case 6.3: Invalid Signature Format
1. Create a valid proposal
2. Manually modify the signature data to be invalid
3. Submit and verify rejection
4. Check network account via archiver to confirm no changes

## 7. Recovery Scenarios

### Test Case 7.1: Multi-Sig Key Recovery
1. Create a proposal to replace potentially compromised multi-sig keys
2. Collect signatures excluding the compromised key
3. Submit and verify via archiver API that key list was updated
4. Attempt an operation with the old key and verify it fails

### Test Case 7.2: Transaction Rollback
1. Create a complex proposal designed to fail during execution
2. Submit and monitor via archiver API
3. Verify all state changes are properly rolled back

## 8. Integration Tests

### Test Case 8.1: Chain of Operations
1. Execute a sequence of governance operations:
   - Change developer keys
   - Use new keys to change multi-sig keys
   - Modify non-key configurations
   - Perform secure account transfer
2. Verify each step via archiver API

### Test Case 8.2: Concurrent Operations
1. Create multiple proposals of different types simultaneously
2. Have co-testers sign different proposals
3. Submit in various orders
4. Verify all are processed correctly via archiver API

## Reporting Requirements
- Transaction details and hashes
- Archiver API response data before and after operations
- Proposal parameters
- Signers and their permission categories
- Expected vs actual outcomes
- Error messages when applicable 