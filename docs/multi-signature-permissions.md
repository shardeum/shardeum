# Shardeum Multi-Signature Permissions System

## Overview

The Shardeum network employs a multi-signature (multi-sig) governance system to secure critical administrative operations. This document explains how the permission system works, the different permission categories, and their implementation in the codebase.

## Permission Configuration

Permissions are defined in the `src/config/multisig-permissions.json` file, which contains lists of Ethereum addresses authorized to perform specific administrative actions:

```json
{
    "changeDevKeyList": [
        "0x002D3a2BfE09E3E29b6d38d58CaaD16EEe4C9BC5"
    ],
    "changeMultiSigKeyList": [
        "0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6",
        "0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00"
    ],
    "initiateSecureAccountTransfer": [
        "0x002D3a2BfE09E3E29b6d38d58CaaD16EEe4C9BC5"
    ],
    "changeNonKeyConfigs": [
        /* 29 addresses with permission to change non-key configurations */
    ]
}
```

## Permission Categories

1. **changeDevKeyList**: Addresses that can change the developer key list
2. **changeMultiSigKeyList**: Addresses that can change the multi-signature key list
3. **initiateSecureAccountTransfer**: Addresses that can transfer funds from secure accounts
4. **changeNonKeyConfigs**: Addresses that can change non-security-critical configuration parameters

## Security Levels

The system uses a security level hierarchy defined by the `DevSecurityLevel` enum:

- **High**: Required for key changes and sensitive operations
- **Medium**: For intermediate security operations
- **Low**: For less sensitive operations
- **Unauthorized**: No permissions

## How Permissions Are Enforced

1. **Permission Validation**:
   - When a transaction is submitted for a sensitive operation, the system identifies its type
   - It retrieves the list of permitted addresses from `multisig-permissions.json`
   - It validates that the transaction has signatures from addresses in this list

2. **Dual Verification System**:
   - An address must be in BOTH the permission list AND the active configuration to be considered valid
   - The `cleanMultiSigPermissions()` function filters out addresses from permission lists that aren't in `currentConfig.debug.multisigKeys`

3. **Multi-Signature Requirement**:
   - Even with proper permissions, multiple signatures are required for sensitive operations
   - The minimum number of required signatures is configured in `shardusConfig.debug.minMultiSigRequiredForGlobalTxs`

4. **Security Level Assignment**:
   - The `keyListAsLeveledKeys()` function assigns security levels to each permitted address
   - For most critical operations, the security level is set to `DevSecurityLevel.High`

## Transaction Verification Process

When a transaction requires permission validation:

1. The system determines the operation type (key change, non-key config change, secure account transfer)
2. It retrieves and cleans the list of permitted addresses
3. It assigns security levels to each address
4. It verifies that:
   - The transaction has the required number of signatures
   - Signatures are cryptographically valid
   - Signers have the appropriate security level
   - Signers are in both the permission list and active configuration

## Key Requirements

For a key to be able to participate in governance:

1. It must be in the appropriate permission list in `multisig-permissions.json`
2. It must also be in the active `currentConfig.debug.multisigKeys` configuration
3. It must have a sufficient security level for the operation
4. It must coordinate with other key holders as multiple signatures are required

## Implementation Details

The key components that implement this system:

- **multisig.ts**: Contains functions to determine transaction types and clean permission lists
- **keyUtils.ts**: Provides functions to assign security levels to keys
- **secureAccounts.ts**: Implements secure account transfers with permission checks
- **validateTxnFields.ts**: Validates transaction fields including signatures and permissions

## Example: Changing Multi-Sig Keys

To change the multi-signature key list:

1. A key must be in `changeMultiSigKeyList` in the permissions file
2. The key must also be an active key in `currentConfig.debug.multisigKeys`
3. The transaction must be signed by the minimum required number of valid keys
4. All signers must have `DevSecurityLevel.High` security clearance

## Governance Structure

This permission system creates a hierarchical governance structure:

- A single address controls developer key changes and secure account transfers
- Two addresses can change the multi-signature key list
- 29 addresses can change non-key configurations

This creates separation of duties and distributed authority appropriate to the sensitivity of each operation.

## Security Considerations

The multi-signature system provides several security benefits:

- No single entity can unilaterally change critical parameters
- Separation of duties prevents concentration of power
- Multiple levels of verification ensure operational integrity
- Active filtering ensures only current authorized keys can execute operations 