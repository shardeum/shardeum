# Environment Generation Scripts

This directory contains scripts for generating test environments and configuration data for Shardeum.

## Scripts

### `generateGenesis.js`

Generates a genesis.json file from an Excel spreadsheet containing airdrop data.

#### Usage
1. Place your airdrop data in `devkeys.xlsx` with the following columns:
   - `Wallet Address`: The Ethereum address to receive tokens
   - `SHM Allocated`: The amount of SHM tokens to allocate

2. Run the script:
```bash
npm run process:genesis
```

The script will:
- Read the Excel file
- Convert SHM amounts to wei
- Generate a `genesis.json` file in the `genesis` directory

### `processMultisigKeys.js`

Generates multisig key configuration files for different environments.

#### Usage
1. Place your multisig key data in `devkeys.xlsx` in the "MS Key Permission Groups" sheet
2. Run the script:
```bash
npm run process:multisig
```

The script will:
- Read the Excel file
- Process permission groups for each environment
- Generate environment-specific JSON files in the `multisigkeys` directory

### `index.js` (Dev Keys Processor)

Generates developer key configuration files for different environments.

#### Usage
1. Place your dev key data in `devkeys.xlsx` in the "Dev keys" sheet
2. Run the script:
```bash
npm run process:devkeys
```

The script will:
- Read the Excel file
- Process dev keys for each environment
- Generate environment-specific JSON files in the `devkeys` directory

## Excel File Structure

The `devkeys.xlsx` file should contain three sheets:
1. `Airdrop data` - For genesis file generation
2. `MS Key Permission Groups` - For multisig key configuration
3. `Dev keys` - For developer key configuration

## Ignored Files

The following files/directories are ignored by git:
- `devkeys*` - Excel files containing configuration data
- `genesis/` - Generated genesis files
- `multisigkeys/` - Generated multisig key configurations
- `node-mules*` - Node mule configurations

## Requirements

- Node.js
- Excel file with configuration data
- `xlsx` npm package

## Notes

- All amounts in the Excel file should be in SHM (will be converted to wei)
- Configuration files will be created in their respective directories
- Make sure to keep sensitive data out of version control 