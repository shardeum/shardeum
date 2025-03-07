# Playbook: Removing Multisig Keys When a Developer Leaves

This playbook outlines the process for removing multisig keys when an employee or developer leaves the organization. Promptly removing access is a critical security measure to maintain the integrity of the Shardeum network.

## Prerequisites

1. Access to the Shardeum multi-sig app
2. Permission to propose multisig transactions (must be in the `changeMultiSigKeyList` in `multisig-permissions.json`)
3. Approval from other multisig key holders
4. Knowledge of which Ethereum address(es) need to be removed
5. Access to the key ownership spreadsheet (or contact with someone who has access)

## Process Overview

1. Identify all multisig keys associated with the departing employee
2. Update the key ownership spreadsheet to mark keys for removal
3. Create a configuration change transaction using the multi-sig app
4. Get the required number of signatures from authorized multisig key holders
5. Submit the signed transaction to the network
6. Verify the keys have been removed
7. Update the key ownership spreadsheet to mark keys as removed
8. Update any related permission groups

## Detailed Steps

### 1. Identify All Associated Keys

1. Review the current multisig key list in the configuration:
   - Check `config.server.debug.multisigKeys`
   - Consult with the departing employee to confirm all their keys
   - **Check the key ownership spreadsheet** for all keys associated with the employee's email

2. Identify which permission groups the keys belong to in `multisig-permissions.json`:
   - `changeDevKeyList`
   - `changeMultiSigKeyList`
   - `initiateSecureAccountTransfer`
   - `changeNonKeyConfigs`

### 2. Update the Key Ownership Spreadsheet (Pre-Removal)

1. Access the key ownership spreadsheet or contact the spreadsheet administrator
2. For each key to be removed:
   - Mark the key as "Pending Removal"
   - Add the planned removal date
   - Document the reason for removal (e.g., "Employee departure")
   - Note who authorized the removal (by email or key identifier only)

> **IMPORTANT**: This step creates an audit trail and ensures all stakeholders are aware of the planned key removal. To protect privacy, use only email addresses or key identifiers rather than full names or personal details.

### 3. Create a Configuration Change Transaction

1. Access the Shardeum multi-sig app
2. Select "Propose New Transaction"
3. Choose "Change Configuration" as the transaction type
4. Prepare the configuration change JSON to remove the keys:

```json
{
  "debug": {
    "multisigKeys": {
      // Include all existing keys EXCEPT those being removed
      "0xEXISTING_KEY_1": 2,
      "0xEXISTING_KEY_2": 2,
      // ... other keys to keep
    }
  }
}
```

> **IMPORTANT**: You must include ALL keys that should remain in the system. Any key not included in this configuration will be removed.

5. Submit the proposal in the multi-sig app
6. Include a reference to the spreadsheet entries in the transaction description to help signers verify the keys have been properly documented for removal

### 4. Get Required Signatures

1. Share the transaction ID with authorized signers (those in the `changeMultiSigKeyList` in `multisig-permissions.json`)
2. Clearly communicate the purpose of the transaction (removing keys of departing employee)
3. Each signer needs to:
   - Access the multi-sig app
   - Find the pending transaction
   - Review the changes carefully to ensure only the intended keys are being removed
   - **Verify the keys are properly marked for removal in the ownership spreadsheet**
   - Sign the transaction with their private key

The minimum number of required signatures is defined in the configuration (`minMultiSigRequiredForGlobalTxs`), which is typically at least 3.

### 5. Submit the Transaction

Once the required number of signatures has been collected:

1. The transaction will be automatically submitted to the network
2. The network will validate the transaction:
   - Verify that all signatures are from authorized keys
   - Verify that the minimum number of signatures is met
   - Verify that all signers have the required security level
3. If valid, the specified keys will be removed from the configuration

### 6. Verify Key Removal

To verify that the keys have been successfully removed:

1. Check the network logs for confirmation of the configuration change
2. Verify that the removed keys no longer appear in the multisig key list in the configuration
3. Attempt to use one of the removed keys to sign a transaction (should fail)

### 7. Update the Key Ownership Spreadsheet (Post-Removal)

1. Access the key ownership spreadsheet again
2. For each removed key:
   - Update the status from "Pending Removal" to "Removed"
   - Add the actual removal date
   - Document the transaction ID that removed the key
   - Note who verified the removal (by email or key identifier only)

> **IMPORTANT**: This final update completes the audit trail and confirms the keys have been properly removed from the system. Continue to maintain privacy by using only minimal identifying information.

### 8. Update Permission Groups

After removing the multisig keys, you need to update any permission groups that included these keys:

1. Create another configuration change transaction to update `multisig-permissions.json`
2. Remove the departed employee's keys from all permission groups
3. Follow the same process of collecting signatures and submitting the transaction
4. Update the spreadsheet to reflect the permission changes

## Timing Considerations

- **Immediate Action**: Key removal should be initiated as soon as an employee's departure is known
- **Scheduled Removal**: For planned departures, schedule the key removal to coincide with the employee's last day
- **Emergency Removal**: For security incidents or immediate terminations, expedite the process with high priority
- **Spreadsheet Updates**: The spreadsheet should be updated before and after the actual key removal to maintain accurate records

## Quorum Considerations

Before removing keys, ensure that:

1. There will still be enough active keys to meet the minimum signature requirements
2. Critical permission groups will still have enough members
3. No single point of failure is created by the removal
4. The spreadsheet is reviewed to identify any potential issues with removing specific keys

## Security Considerations

- Never delay removing keys of departed employees
- Consider rotating other sensitive credentials that the employee had access to
- Document the key removal in your security records and the key ownership spreadsheet
- If the departure is contentious, consider additional security measures
- Ensure the departing employee returns any hardware or credentials related to multisig operations
- Perform regular audits comparing the key ownership spreadsheet with the actual configuration
- Minimize personal information in the key ownership spreadsheet to protect privacy
- Consider using key identifiers or aliases rather than personal information when possible

## Contingency Planning

If the departing employee was a critical signer:

1. Identify replacement signers before removing their keys
2. Consider temporarily lowering signature requirements if necessary (requires separate configuration change)
3. Have a backup plan if signature requirements cannot be met after removal
4. Update the key ownership spreadsheet to reflect any contingency measures implemented 