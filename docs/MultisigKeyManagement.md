# Multisig Key Management Security

## Overview

This document describes the special case validation for multisig key management operations implemented as part of TICKET-001. It provides enhanced security for operations that modify the list of multisig keys, ensuring that only authorized key managers can make such changes.

## Background

In the Shardeum network, multisig keys are used to authorize important operations like configuration changes. However, the original implementation allowed any multisig key holder with a high enough security level to modify the multisig key list itself, creating a potential security vulnerability where a subset of key holders could remove other keys without proper authorization.

## Implementation Details

### Key Components

1. **Configuration Settings**:
   - `keyManagerAddresses`: A subset of trusted addresses that can modify the multisig key list
   - `keyManagementMinSignatures`: A higher threshold for key management operations (default: 3)

2. **Detection Logic**:
   - `isMultisigKeyChange()`: Detects if a config change is modifying the multisig key list

3. **Special Validation**:
   - `verifyMultiSigsForKeyManagement()`: Verifies that all signers are in the keyManagerAddresses list and that there are enough signatures

4. **Integration**:
   - `validateConfigChange()`: Applies the special validation only for multisig key changes

### File Structure

- `src/config/multisigKeyManagerConfig.ts`: Configuration defaults and helpers
- `src/setup/multisigKeyValidator.ts`: Core validation functions and integration with transaction validation
- `test/multisigValidation.test.ts`: Unit and integration tests

## How It Works

1. When a config change transaction is received, the system first checks if it's modifying the multisig key list.
2. If it is, special validation is applied:
   - Only signatures from addresses in `keyManagerAddresses` are considered valid
   - The number of valid signatures must meet the `keyManagementMinSignatures` threshold
3. If not, regular multisig validation is applied.

## Configuration

The default configuration sets:
- `keyManagerAddresses`: A list of 5 trusted addresses
- `keyManagementMinSignatures`: 3 (requires 3 signatures from authorized key managers)

These values can be modified through a config change transaction, but such a change would itself require the enhanced validation.

## Recovery Procedures

In case of key loss:

1. **Standard Key Loss (minority)**: If less than the majority of key managers lose their keys, the remaining key managers can still approve changes.

2. **Catastrophic Key Loss (majority)**: If a majority of key managers lose their keys, network operators would need to implement emergency recovery procedures, which may involve a network reset with new keys.

## Security Considerations

- The selection of key managers should follow a strict vetting process
- Key management operations should be monitored and logged
- Regular testing of key rotation procedures is recommended
- Multiple independent backups of key manager keys should be maintained 