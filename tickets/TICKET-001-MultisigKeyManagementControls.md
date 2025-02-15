# TICKET-001: Special Case Validation for Multisig Key Management

## Problem Statement

Currently, any multisig key with a high enough security level can modify the multisig key list. This creates a security vulnerability where a subset of key holders could remove other keys from the multisig set without proper authorization. We need a special validation mechanism specifically for multisig key management operations.

## Proposed Solution

Implement a focused "quick and dirty" solution that adds special validation rules specifically for multisig key changes, without refactoring the permission system.

## Implementation Checklist

### 1. Config Changes (`src/config/index.ts`)

- [ ] Add a new `keyManagerAddresses` array to the config to store addresses that can modify the multisig key list
- [ ] Add a new `keyManagementMinSignatures` setting to define a higher threshold for key management operations
- [ ] Update the default config with appropriate initial values (recommended: use a subset of trusted multisig keys)
- [ ] Document the new config values in code comments

### 2. Validation Logic (`src/setup/validateTransaction.ts`)

- [ ] Create a new function `isMultisigKeyChange(oldConfig, newConfig)` that detects if a config change modifies multisig keys
- [ ] Create a specialized validation function `verifyMultiSigsForKeyManagement(rawPayload, sigs, keyManagerAddresses, minSigRequired)` that checks:
  - [ ] All signers are in the `keyManagerAddresses` list
  - [ ] Number of valid signatures meets the `keyManagementMinSignatures` threshold
- [ ] Modify the `validateChangeConfig` function to add special case handling for multisig key changes
- [ ] Update error messages to be more descriptive for key management validation failures

### 3. Initialization & Migration

- [ ] Initialize the `keyManagerAddresses` with a subset of trusted keys from the existing multisig key list
- [ ] Set the initial `keyManagementMinSignatures` threshold (recommended: at least 3)
- [ ] Create a migration plan for existing deployments to update their config

## Testing Plan

### Unit Tests (`test/multiSigKeyManagement.test.ts`)

- [ ] Create test for `isMultisigKeyChange` function
  - [ ] Test adding a new multisig key
  - [ ] Test removing an existing multisig key
  - [ ] Test changing a multisig key's security level
  - [ ] Test config changes that don't affect multisig keys

- [ ] Create tests for `verifyMultiSigsForKeyManagement` function
  - [ ] Test with enough valid signers from keyManagerAddresses (should pass)
  - [ ] Test with not enough valid signers (should fail)
  - [ ] Test with enough signers but some not in keyManagerAddresses (should fail)
  - [ ] Test with invalid signatures (should fail)

- [ ] Create integration tests for the modified `validateChangeConfig` function
  - [ ] Test multisig key changes with valid key manager signatures (should pass)
  - [ ] Test multisig key changes with non-key-manager signatures (should fail)
  - [ ] Test non-multisig config changes (should use regular validation)

## Deployment Considerations

- [ ] Update documentation to explain the new security model for key management
- [ ] Create a guide for node operators explaining the new fields in the config

## Security Implications

- [ ] Document the procedure for recovering from key loss scenarios
- [ ] Adding logging specifically for multisig key modification attempts (successful and failed)

## Resources

- Current multisig implementation: `src/setup/helpers.ts`
- Transaction validation: `src/setup/validateTransaction.ts`
- Config definition: `src/config/index.ts` 