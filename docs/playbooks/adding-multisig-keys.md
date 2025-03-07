# Playbook: Adding a New Dev Multisig Key

This playbook outlines the process for adding a new developer multisig key to the Shardeum network. Multisig keys are used for authorizing sensitive operations that require multiple approvals.

## Prerequisites

1. Access to the Shardeum multi-sig app
2. An Ethereum wallet with a private key (for the new multisig key)
3. Permission to propose multisig transactions (must be in the `changeMultiSigKeyList` in `multisig-permissions.json`)
4. Approval from other multisig key holders
5. Access to the key ownership spreadsheet (or contact with someone who has access)

## Security Levels

Shardeum uses the following security levels for multisig keys:

- `DevSecurityLevel.Low` (0)
- `DevSecurityLevel.Medium` (1)
- `DevSecurityLevel.High` (2)

Most multisig keys are set to `DevSecurityLevel.High` for maximum security.

## Process Overview

1. Generate or obtain the Ethereum address for the new multisig key
2. Update the key ownership spreadsheet with the new key information
3. Create a configuration change transaction using the multi-sig app
4. Get the required number of signatures from authorized multisig key holders
5. Submit the signed transaction to the network

## Detailed Steps

### 1. Generate or Obtain the Ethereum Address

If you need to generate a new Ethereum wallet:

```bash
# Using the provided script
node scripts/generateWallet.js
```

Alternatively, you can use MetaMask or another Ethereum wallet provider to create a new wallet. Make sure to securely store the private key.

### 2. Update the Key Ownership Spreadsheet

1. Access the key ownership spreadsheet or contact the spreadsheet administrator
2. Add a new entry with the following information:
   - Ethereum address of the new key
   - Owner's email address (company email only)
   - Date added
   - Security level assigned
   - Purpose/permissions for the key (general description)
   - Key identifier or alias (if applicable)

> **IMPORTANT**: This step must be completed before proceeding with the configuration change. The spreadsheet is the source of truth for key ownership and is essential for security audits and key management. To protect privacy, only include minimal identifying information (email) rather than full personal details.

### 3. Create a Configuration Change Transaction

1. Access the Shardeum multi-sig app
2. Select "Propose New Transaction"
3. Choose "Change Configuration" as the transaction type
4. Prepare the configuration change JSON:

```json
{
  "debug": {
    "multisigKeys": {
      "0xNEW_ETHEREUM_ADDRESS": 2  // DevSecurityLevel.High
    }
  }
}
```

5. Submit the proposal in the multi-sig app
6. Include a reference to the spreadsheet entry in the transaction description to help signers verify the key has been properly documented

### 4. Get Required Signatures

1. Share the transaction ID with authorized signers (those in the `changeMultiSigKeyList` in `multisig-permissions.json`)
2. Each signer needs to:
   - Access the multi-sig app
   - Find the pending transaction
   - Review the changes
   - **Verify the key is properly documented in the ownership spreadsheet**
   - Sign the transaction with their private key

The minimum number of required signatures is defined in the configuration (`minMultiSigRequiredForGlobalTxs`), which is typically at least 3.

### 5. Submit the Transaction

Once the required number of signatures has been collected:

1. The transaction will be automatically submitted to the network
2. The network will validate the transaction:
   - Verify that all signatures are from authorized keys
   - Verify that the minimum number of signatures is met
   - Verify that all signers have the required security level
   - Validate the Ethereum address format
3. If valid, the new multisig key will be added to the configuration

## Adding Keys to Development Environments

For development environments, a different process is used that involves submitting a pull request (PR) to update the default configuration files directly.

### Prerequisites for Development Keys

1. GitHub access to the Shardeum repository
2. An Ethereum wallet with a private key (for the new multisig key)
3. Basic knowledge of Git and pull request workflows
4. Access to the key ownership spreadsheet (or contact with someone who has access)

### Process for Adding Development Keys

1. **Generate or Obtain the Ethereum Address**
   - Use the same methods described in the main process above

2. **Update the Key Ownership Spreadsheet**
   - Follow the same process as above, but mark the key as "Development Environment" in the purpose field
   - Include which development environment(s) the key will be used in

3. **Create a Branch and Update Configuration Files**
   - Clone the repository (if you haven't already)
   - Create a new branch with a descriptive name (e.g., `add-dev-multisig-key-username`)
   - Locate the configuration file that contains the multisig keys for the development environment
     - Typically in `src/config/index.ts` or a similar location
   - Add your key to the appropriate section:

   ```typescript
   multisigKeys: {
     // existing keys...
     /* prettier-ignore */ '0xYOUR_NEW_ETHEREUM_ADDRESS': DevSecurityLevel.High,
   }
   ```

   - If needed, also update the `multisig-permissions.json` file to add your key to the appropriate permission groups

4. **Submit a Pull Request**
   - Commit your changes with a clear message
   - Push your branch to the repository
   - Create a pull request with the following information:
     - Title: "Add development multisig key for [purpose]"
     - Description: Include your email, the purpose of the key, and confirmation that you've updated the key ownership spreadsheet
     - Reference any relevant issues or tickets

5. **Code Review Process**
   - At least two team members should review the PR
   - Reviewers should verify that:
     - The key is properly documented in the spreadsheet
     - The key is only being added to development environments
     - The security level is appropriate
     - The formatting follows project conventions

6. **Merge and Verify**
   - Once approved, the PR can be merged
   - Verify that the key works in the development environment
   - Test the key by using it to sign a non-critical transaction

### Security Considerations for Development Keys

- Development keys should never be used in production environments
- Clearly label development keys in the spreadsheet to prevent confusion
- Consider using a lower security level (e.g., `DevSecurityLevel.Medium`) for development-only keys
- Regularly audit and clean up unused development keys
- Follow the same removal process when a developer leaves the team

## Verification

To verify that the key was added successfully:

1. Check the network logs for confirmation of the configuration change
2. Verify that the new key appears in the multisig key list in the configuration
3. Test the new key by using it to sign a non-critical transaction
4. Confirm that the key ownership spreadsheet is up-to-date with the new key information

## Permissions Management

After adding a new multisig key, consider whether it needs to be added to specific permission groups in `multisig-permissions.json`:

- `changeDevKeyList`: Can change developer keys
- `changeMultiSigKeyList`: Can change multisig keys
- `initiateSecureAccountTransfer`: Can initiate transfers from secure accounts
- `changeNonKeyConfigs`: Can change non-key configuration parameters

This requires a separate configuration change transaction.

## Troubleshooting

- **Transaction Rejected**: Ensure all signers have the required security level and are authorized
- **Invalid Address Format**: Verify the Ethereum address is correctly formatted (should start with '0x' followed by 40 hexadecimal characters)
- **Insufficient Signatures**: Make sure you have collected the minimum required number of signatures
- **Spreadsheet Access Issues**: Contact the security team or spreadsheet administrator if you cannot access the key ownership spreadsheet
- **PR Rejected**: Review the comments, make the requested changes, and resubmit

## Security Considerations

- Never share private keys
- Always verify the transaction details before signing
- Consider the security implications of adding new multisig keys
- Follow the principle of least privilege when assigning permissions
- Ensure the key ownership spreadsheet is kept up-to-date at all times
- Regularly audit the spreadsheet against the actual configuration to ensure consistency
- Minimize personal information in the key ownership spreadsheet to protect privacy
- Clearly distinguish between production and development keys in all documentation
