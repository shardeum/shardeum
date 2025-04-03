# Environment Generation Scripts

This directory contains scripts for generating environment-specific configuration files from Google Sheets data.

## Scripts

### 1. `processDevKeys.js`

Generates dev key configuration files for different environments.

**Input:**
- Google Sheet named "Dev keys"
- Columns: key, owner, local, devnet, stagenet, testnet, mainnet
- 'TRUE' in an environment column indicates the key belongs to that environment

**Output:**
- Creates files in `devkeys/` directory:
  - `localDevKeys.json`
  - `devnetDevKeys.json`
  - `stagenetDevKeys.json`
  - `testnetDevKeys.json`
  - `mainnetDevKeys.json`

**Format:**
```json
{
  "devPublicKeys": {
    "public_key_1": 3,
    "public_key_2": 3
  }
}
```

### 2. `processMultisigKeys.js`

Generates multisig key configuration files for different environments.

**Input:**
- Google Sheet named "MS Key Permission Groups"
- First row: Permission types (multisigKeys, changeDevKey, etc.)
- Second row: Environment names under each permission type
- Data rows: Keys with 'TRUE' indicating permission for that environment
- First column: Key
- Second column: Owner

**Output:**
- Creates files in `multisigkeys/` directory:
  - `local.json`
  - `devnet.json`
  - `stagenet.json`
  - `testnet.json`
  - `mainnet.json`

**Format:**
```json
{
  "multisigKeys": ["key1", "key2"],
  "changeDevKey": ["key3", "key4"],
  "changeMultiSigKeyList": ["key5"],
  "initiateSecureAccountTransfer": ["key6"],
  "changeNonKeyConfigs": ["key7"]
}
```

### 3. `generateGenesis.js`

Generates genesis configuration files for different environments.

**Input:**
- Google Sheet named "Airdrop data"
- Columns: address, amount (in SHM)
- 'TRUE' in an environment column indicates the address belongs to that environment

**Output:**
- Creates files in `genesis/` directory:
  - `local.json`
  - `devnet.json`
  - `stagenet.json`
  - `testnet.json`
  - `mainnet.json`

**Format:**
```json
{
  "alloc": {
    "address1": "amount_in_wei1",
    "address2": "amount_in_wei2"
  }
}
```

## Usage

1. Ensure you have the required dependencies installed:
   ```bash
   npm install
   ```

2. Set up Google Sheets authentication:
   ```bash
   # Install the googleapis package
   npm install googleapis
   
   # Run the token generation script
   node src/getToken.js
   ```
   - The script will output a URL to visit in your browser
   - Visit the URL and authorize the application
   - Copy the authorization code from the browser
   - Paste the code back into the terminal when prompted
   - The script will output your access token and refresh token
   - Copy these tokens and update them in `googleSheets.js`

3. Make sure you have access to the Google Sheet and the necessary OAuth2 credentials are set up in `googleSheets.js`

4. Run the scripts:
   ```bash
   npm run process:devkeys
   npm run process:multisig
   npm run generate:genesis
   ```

## Google Sheets Setup

1. Create a Google Sheet with the required structure
2. Share the sheet with the service account email
3. Update the `SPREADSHEET_ID` in `googleSheets.js` with your sheet's ID
4. Ensure the sheet names match exactly:
   - "Dev keys"
   - "MS Key Permission Groups"
   - "Airdrop data"

## Authentication Setup

1. Create a Google Cloud Project and enable the Google Sheets API
2. Create OAuth 2.0 credentials:
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Set application type as "Desktop app"
   - Download the credentials JSON file
3. Update the following in `getToken.js`:
   - `CLIENT_ID` with your client ID
   - `CLIENT_SECRET` with your client secret
   - `REDIRECT_URI` with your redirect URI (default is http://localhost:3010)
4. Run `node src/getToken.js` to generate the access token
5. Copy the access token and refresh token from the output
6. Update the tokens in `googleSheets.js`

## Notes

- All amounts in the airdrop sheet should be in SHM (will be converted to wei)
- Environment columns should use 'TRUE' to indicate inclusion
- Keys should be valid public keys
- The scripts will create the necessary output directories if they don't exist
- The OAuth2 token will expire after some time and need to be regenerated 