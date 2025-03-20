# Multi-Signature Permissions E2E Test Cases

This document provides detailed end-to-end test cases for the Shardeum multi-signature permissions system, specifically using the `lt2` tool and its `change_global_config` script.

## Prerequisites

- Access to a Shardeum test environment
- `lt2` tool installed and configured
- Access to private keys for addresses in various permission categories
- Basic understanding of the Shardeum multi-signature permissions system

## Testing Using `lt2`

The `lt2` tool's `change_global_config` script is specifically designed to prepare, sign, and send multi-signature transactions for configuration changes in Shardeum. Use this tool for all test cases below.

## Test Suite 1: Basic Permission Validation

### Test Case 1.1: Valid Multi-Sig Key Access

**Objective:** Verify that a key in both `changeMultiSigKeyList` and `debug.multisigKeys` can participate in multi-sig key changes.

**Steps:**
1. Identify an address in both `changeMultiSigKeyList` and active `debug.multisigKeys`
2. Use `lt2` to prepare a transaction that modifies a non-critical configuration:
   ```bash
   lt2 change_global_config prepare --name="testChange" --value="testValue" --output="tx.json"
   ```
3. Sign the transaction with this key:
   ```bash
   lt2 change_global_config sign --tx="tx.json" --key="path/to/private_key.json" --output="signed_tx.json"
   ```
4. Send the transaction:
   ```bash
   lt2 change_global_config send --tx="signed_tx.json"
   ```
5. Verify transaction is accepted by checking the node logs or using the API

**Expected Result:** Transaction is accepted and configuration is changed.

### Test Case 1.2: Unauthorized Key Access

**Objective:** Verify that keys not in permission lists cannot execute restricted operations.

**Steps:**
1. Identify an address that is in `debug.multisigKeys` but NOT in `changeMultiSigKeyList`
2. Use `lt2` to prepare a transaction that modifies the multi-sig key list:
   ```bash
   lt2 change_global_config prepare --config-field="debug.multisigKeys" --add-key="0xNEWADDRESS" --output="tx.json"
   ```
3. Sign with this unauthorized key:
   ```bash
   lt2 change_global_config sign --tx="tx.json" --key="path/to/unauthorized_key.json" --output="signed_tx.json"
   ```
4. Send the transaction:
   ```bash
   lt2 change_global_config send --tx="signed_tx.json"
   ```

**Expected Result:** Transaction is rejected with "Invalid signatures" error.

## Test Suite 2: Multi-Signature Requirements

### Test Case 2.1: Minimum Signature Enforcement

**Objective:** Verify that the minimum signature requirement is enforced.

**Steps:**
1. Check the current value of `minMultiSigRequiredForGlobalTxs` in the configuration
2. Use `lt2` to prepare a configuration change:
   ```bash
   lt2 change_global_config prepare --name="testParam" --value="testValue" --output="tx.json"
   ```
3. Sign with fewer than the required number of authorized keys:
   ```bash
   lt2 change_global_config sign --tx="tx.json" --key="path/to/key1.json" --output="signed_tx.json"
   ```
4. Send the transaction:
   ```bash
   lt2 change_global_config send --tx="signed_tx.json"
   ```

**Expected Result:** Transaction is rejected with error about insufficient signatures.

### Test Case 2.2: Multiple Valid Signatures

**Objective:** Verify that multiple valid signatures are accepted.

**Steps:**
1. Use `lt2` to prepare a non-key configuration change:
   ```bash
   lt2 change_global_config prepare --name="testParam" --value="newValue" --output="tx.json"
   ```
2. Sign with the minimum required number of keys from `changeNonKeyConfigs`:
   ```bash
   lt2 change_global_config sign --tx="tx.json" --key="path/to/key1.json" --output="signed_tx_1.json"
   lt2 change_global_config sign --tx="signed_tx_1.json" --key="path/to/key2.json" --output="signed_tx_final.json"
   ```
3. Send the transaction:
   ```bash
   lt2 change_global_config send --tx="signed_tx_final.json"
   ```

**Expected Result:** Transaction is accepted and configuration is changed.

## Test Suite 3: Permission Category Tests

### Test Case 3.1: Developer Key List Change

**Objective:** Verify only authorized addresses can change developer keys.

**Steps:**
1. Use `lt2` to prepare a transaction to modify the developer key list:
   ```bash
   lt2 change_global_config prepare --config-field="debug.devKeys" --add-key="0xNEWDEVKEY" --output="tx.json"
   ```
2. Sign with key(s) from `changeDevKeyList`:
   ```bash
   lt2 change_global_config sign --tx="tx.json" --key="path/to/dev_key.json" --output="signed_tx.json"
   ```
3. Send the transaction:
   ```bash
   lt2 change_global_config send --tx="signed_tx.json"
   ```
4. Now try with keys from other permission lists (e.g., `changeNonKeyConfigs`):
   ```bash
   lt2 change_global_config prepare --config-field="debug.devKeys" --add-key="0xANOTHERDEVKEY" --output="tx2.json"
   lt2 change_global_config sign --tx="tx2.json" --key="path/to/nonkey_changer_key.json" --output="signed_tx2.json"
   lt2 change_global_config send --tx="signed_tx2.json"
   ```

**Expected Results:** 
- First transaction is accepted
- Second transaction is rejected due to invalid permissions

### Test Case 3.2: Secure Account Transfer

**Objective:** Verify secure account transfer permissions.

**Steps:**
1. Identify a secure account in the system
2. Use `lt2` to prepare a transfer transaction from this account:
   ```bash
   lt2 transfer_from_secure_account prepare --account="SecureAccountName" --amount="1000000000000000000" --output="tx.json"
   ```
3. Sign with key(s) from `initiateSecureAccountTransfer`:
   ```bash
   lt2 transfer_from_secure_account sign --tx="tx.json" --key="path/to/secure_account_key.json" --output="signed_tx.json"
   ```
4. Send the transaction:
   ```bash
   lt2 transfer_from_secure_account send --tx="signed_tx.json"
   ```
5. Try again with keys from other permission lists:
   ```bash
   lt2 transfer_from_secure_account prepare --account="SecureAccountName" --amount="1000000000000000000" --output="tx2.json"
   lt2 transfer_from_secure_account sign --tx="tx2.json" --key="path/to/nonkey_changer_key.json" --output="signed_tx2.json"
   lt2 transfer_from_secure_account send --tx="signed_tx2.json"
   ```

**Expected Results:**
- First transaction is accepted
- Second transaction is rejected

## Test Suite 4: Advanced Scenarios

### Test Case 4.1: Multi-Sig Key Recovery

**Objective:** Verify the process to recover if multi-sig keys are compromised.

**Steps:**
1. Use `lt2` to prepare a transaction that replaces a key in the multi-sig list:
   ```bash
   lt2 change_global_config prepare --config-field="debug.multisigKeys" --remove-key="0xOLDKEY" --add-key="0xNEWKEY" --output="tx.json"
   ```
2. Sign with authorized key(s) from `changeMultiSigKeyList`:
   ```bash
   lt2 change_global_config sign --tx="tx.json" --key="path/to/multisig_key.json" --output="signed_tx.json"
   ```
3. Send the transaction:
   ```bash
   lt2 change_global_config send --tx="signed_tx.json"
   ```
4. Verify the old key no longer works and the new key does by attempting transactions with each

**Expected Results:**
- Transaction is accepted
- Old key is no longer authorized
- New key is authorized

### Test Case 4.2: Chain of Operations

**Objective:** Verify a complete chain of permission-related operations.

**Steps:**
1. Change developer keys:
   ```bash
   lt2 change_global_config prepare --config-field="debug.devKeys" --add-key="0xNEWDEVKEY" --output="tx1.json"
   lt2 change_global_config sign --tx="tx1.json" --key="path/to/dev_key_changer.json" --output="signed_tx1.json"
   lt2 change_global_config send --tx="signed_tx1.json"
   ```

2. Change multi-sig keys using newly authorized keys:
   ```bash
   lt2 change_global_config prepare --config-field="debug.multisigKeys" --add-key="0xNEWMULTISIGKEY" --output="tx2.json"
   lt2 change_global_config sign --tx="tx2.json" --key="path/to/multisig_key_changer.json" --output="signed_tx2.json"
   lt2 change_global_config send --tx="signed_tx2.json"
   ```

3. Modify non-key configurations using new multi-sig keys:
   ```bash
   lt2 change_global_config prepare --name="networkParam" --value="newValue" --output="tx3.json"
   lt2 change_global_config sign --tx="tx3.json" --key="path/to/new_multisig_key.json" --output="signed_tx3.json"
   lt2 change_global_config send --tx="signed_tx3.json"
   ```

**Expected Results:** Each step in the chain works properly with the appropriate permissions.

## Reporting

For each test case, document:

1. **Test Environment**
   - Network details (testnet, devnet, etc.)
   - Node versions
   - `lt2` version

2. **Test Data**
   - Keys/addresses used (public addresses only, never share private keys)
   - Transaction hashes
   - Command outputs

3. **Results**
   - Expected vs. actual outcome
   - Error messages if any
   - Screenshots or logs where applicable

4. **Issues Found**
   - Description of any discrepancies
   - Severity assessment
   - Potential impact

Submit the completed test report to the development team for review. 