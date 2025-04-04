import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSheetData, SHEETS } from './googleSheets.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ENVIRONMENTS = ['local', 'devnet', 'testnet', 'stagenet', 'mainnet']

// Define the permission types and their corresponding JSON property names
const PERMISSIONS = {
  changeDevKey: 'changeDevKey',
  changeMultiSigKeyList: 'changeMultiSigKeyList',
  initiateSecureAccountTransfer: 'initiateSecureAccountTransfer',
  changeNonKeyConfigs: 'changeNonKeyConfigs',
}

const DevSecurityLevel = {
  High: 3,
}

/**
 * @param {number} shm - Amount in SHM
 * @returns {string} - Amount in wei as a string
 */
function shmToWei(shm) {
  return (BigInt(Math.floor(shm)) * BigInt(1e18)).toString()
}

/**
 * @param {string[]} keys - Array of public keys
 * @returns {string} - JSON string of dev keys file content
 */
function generateDevKeysFile(keys) {
  const content = {
    devPublicKeys: keys.reduce((acc, key) => {
      acc[key] = DevSecurityLevel.High
      return acc
    }, {}),
  }
  return JSON.stringify(content, null, 2)
}

/**
 * @param {string[]} keys - Array of public keys
 * @returns {string} - JSON string of multisig keys file content
 */
function generateMultisigKeysFile(keys) {
  const content = {
    multisigKeys: keys.reduce((acc, key) => {
      acc[key] = 3
      return acc
    }, {}),
  }
  return JSON.stringify(content, null, 2)
}

// IMPORT FUNCTIONS FOR EACH TAB

/**
 * Import data from the AirdropGenesisAccounts tab
 * @returns {Promise<Object>} - Object with environment data
 */
async function importAirdropData() {
  console.log("\nImporting airdrop data...");
  
  const result = {
    local: {},
    devnet: {},
    testnet: {},
    stagenet: {},
    mainnet: {}
  };
  
  const airdropData = await getSheetData(SHEETS.AIRDROP_GENESIS_ACCOUNTS);
  if (!airdropData || airdropData.length < 2) {
    console.log("No data found in airdrop sheet");
    return result;
  }

  // Get the header row to determine which environments are included
  const headers = airdropData[0];
  const walletAddressIndex = 0;  // First column is always wallet address
  const shmAmountIndex = 1;      // Second column is always SHM amount

  // Process each row
  for (let i = 1; i < airdropData.length; i++) {
    const row = airdropData[i];
    const address = row[walletAddressIndex];
    const shmAmount = parseFloat(row[shmAmountIndex]);

    if (!address || isNaN(shmAmount)) {
      continue;
    }

    result["stagenet"][address] = shmAmount;
    result["mainnet"][address] = shmAmount;
  }

  console.log("Airdrop data import completed");
  return result;
}

/**
 * Import data from the DevGenesisAccounts tab
 * @returns {Promise<Object>} - Object with environment data
 */
async function importDevGenesisData() {
  console.log("\nImporting dev genesis accounts data...");
  
  const result = {
    local: {},
    devnet: {},
    testnet: {},
    stagenet: {},
    mainnet: {}
  };
  
  const devGenesisData = await getSheetData(SHEETS.DEV_GENESIS_ACCOUNTS);
  if (!devGenesisData || devGenesisData.length < 2) {
    console.log("No dev genesis accounts data found");
    return result;
  }

  // Get the header row
  const headers = devGenesisData[0];
  
  // Find column indices
  const walletAddressIndex = headers.indexOf("Wallet Address");
  const amountIndex = headers.indexOf("Amount");
  const environmentIndices = {};
  
  ENVIRONMENTS.forEach(env => {
    const index = headers.indexOf(env);
    if (index !== -1) {
      environmentIndices[env] = index;
    }
  });

  // Process each row
  for (let i = 1; i < devGenesisData.length; i++) {
    const row = devGenesisData[i];
    const address = row[walletAddressIndex];
    const amount = parseFloat(row[amountIndex]) || 0;

    if (!address) {
      continue;
    }

    // Add to each environment where this account is included
    Object.entries(environmentIndices).forEach(([env, colIndex]) => {
      if (row[colIndex] === "TRUE") {
        result[env][address] = amount;
      }
    });
  }

  console.log("Dev genesis accounts data import completed");
  return result;
}

/**
 * Import data from the SecureAccounts tab
 * @returns {Promise<Object>} - Object with environment data
 */
async function importSecureAccountsData() {
  console.log("\nImporting secure accounts data...");
  
  const result = {
    local: {},
    devnet: {},
    testnet: {},
    stagenet: {},
    mainnet: {}
  };
  
  const secureAccountsData = await getSheetData(SHEETS.SECURE_ACCOUNTS);
  if (!secureAccountsData || secureAccountsData.length < 2) {
    console.log("No secure accounts data found");
    return result;
  }

  // Get the header row
  const headers = secureAccountsData[0];
  
  // Find column indices
  const nameIndex = headers.indexOf("Name");
  const networkIndex = headers.indexOf("Network");
  const initialBalanceIndex = headers.indexOf("InitialBalance");
  const sourceFundsAddressIndex = headers.indexOf("SourceFundsAddress");
  const secureAccountAddressIndex = headers.indexOf("SecureAccountAddress");
  const recipientFundsAddressIndex = headers.indexOf("RecipientFundsAddress");

  // Process each row
  for (let i = 1; i < secureAccountsData.length; i++) {
    const row = secureAccountsData[i];
    if (!row[nameIndex] || !row[networkIndex]) continue;

    const network = row[networkIndex];
    if (!ENVIRONMENTS.includes(network)) continue;

    const name = row[nameIndex];
    const initialBalance = parseFloat(row[initialBalanceIndex]) || 0;
    const sourceFundsAddress = row[sourceFundsAddressIndex];
    const secureAccountAddress = row[secureAccountAddressIndex];
    const recipientFundsAddress = row[recipientFundsAddressIndex];

    if (!result[network][name]) {
      result[network][name] = {
        initialBalance,
        sourceFundsAddress,
        secureAccountAddress,
        recipientFundsAddress
      };
    }
  }

  console.log("Secure accounts data import completed");
  return result;
}

/**
 * Import data from the Dev keys tab
 * @returns {Promise<Object>} - Object with environment data containing arrays of keys
 */
async function importDevKeysData() {
  console.log("\nImporting dev keys data...");
  
  const result = {
    local: [],
    devnet: [],
    testnet: [],
    stagenet: [],
    mainnet: []
  };
  
  const devKeysData = await getSheetData(SHEETS.DEV_PUBLIC_KEYS);
  if (!devKeysData || devKeysData.length < 2) {
    console.log("No dev keys data found");
    return result;
  }

  // Get the header row
  const headers = devKeysData[0];
  const keyIndex = headers.indexOf("keys");
  
  // Find environment column indices
  const environmentIndices = {};
  ENVIRONMENTS.forEach(env => {
    const index = headers.indexOf(env);
    if (index !== -1) {
      environmentIndices[env] = index;
    }
  });

  // Process each row
  for (let i = 1; i < devKeysData.length; i++) {
    const row = devKeysData[i];
    const key = row[keyIndex];
    
    if (!key) continue;

    // Add key to each environment where it's included
    Object.entries(environmentIndices).forEach(([env, colIndex]) => {
      if (row[colIndex]?.toUpperCase() === "TRUE") {
        result[env].push(key);
      }
    });
  }

  console.log("Dev keys data import completed");
  return result;
}

/**
 * Import data from the MS Key Permission Groups tab
 * @returns {Promise<Object>} - Object with environment data
 */
async function importMultisigKeysData() {
  console.log("\nImporting multisig keys data...");
  
  const result = {
    local: {
      changeDevKey: [],
      changeMultiSigKeyList: [],
      initiateSecureAccountTransfer: [],
      changeNonKeyConfigs: []
    },
    devnet: {
      changeDevKey: [],
      changeMultiSigKeyList: [],
      initiateSecureAccountTransfer: [],
      changeNonKeyConfigs: []
    },
    testnet: {
      changeDevKey: [],
      changeMultiSigKeyList: [],
      initiateSecureAccountTransfer: [],
      changeNonKeyConfigs: []
    },
    stagenet: {
      changeDevKey: [],
      changeMultiSigKeyList: [],
      initiateSecureAccountTransfer: [],
      changeNonKeyConfigs: []
    },
    mainnet: {
      changeDevKey: [],
      changeMultiSigKeyList: [],
      initiateSecureAccountTransfer: [],
      changeNonKeyConfigs: []
    }
  };
  
  const multisigData = await getSheetData(SHEETS.MULTISIG_KEYS);
  if (!multisigData || multisigData.length < 3) {
    console.log("No multisig keys data found");
    return result;
  }

  const propertyRow = multisigData[0];
  const envRow = multisigData[1];
  const keyColumnIndex = 0; // First column has the key

  let currentProperty = null;
  let currentEnv = null;

  // Process each column
  for (let colIndex = 2; colIndex < envRow.length; colIndex++) {
    const property = propertyRow[colIndex];
    const environment = envRow[colIndex];

    if (PERMISSIONS[property]) {
      currentProperty = PERMISSIONS[property];
      currentEnv = environment;
    } else if (environment && ENVIRONMENTS.includes(environment)) {
      currentEnv = environment;
    }

    if (!currentEnv || !currentProperty) {
      continue;
    }

    // Process keys for this column
    for (let rowIndex = 2; rowIndex < multisigData.length; rowIndex++) {
      const row = multisigData[rowIndex];
      const key = row[keyColumnIndex];
      const value = row[colIndex];
      
      if (key && value?.toUpperCase() === "TRUE") {
        if (!result[currentEnv][currentProperty].includes(key)) {
          result[currentEnv][currentProperty].push(key);
        }
      }
    }
  }

  console.log("Multisig keys data import completed");
  return result;
}

// PROCESSING FUNCTIONS THAT USE THE IMPORTED DATA

/**
 * Calculate totals for each environment
 * @param {Object} airdropData - Imported airdrop data
 * @param {Object} devGenesisData - Imported dev genesis data
 * @returns {Object} - Environment totals
 */
function calculateEnvironmentTotals(airdropData, devGenesisData) {
  console.log("\nCalculating environment totals...");
  
  const totals = {
    local: { airdrop: 0, dev: 0 },
    devnet: { airdrop: 0, dev: 0 },
    testnet: { airdrop: 0, dev: 0 },
    stagenet: { airdrop: 0, dev: 0 },
    mainnet: { airdrop: 0, dev: 0 }
  };

  // Calculate airdrop totals
  ENVIRONMENTS.forEach(env => {
    Object.values(airdropData[env]).forEach(amount => {
      totals[env].airdrop += amount;
    });
  });

  // Calculate dev genesis totals
  ENVIRONMENTS.forEach(env => {
    Object.values(devGenesisData[env]).forEach(amount => {
      totals[env].dev += amount;
    });
  });

  return totals;
}

/**
 * Generate secure accounts files for each environment
 * @param {Object} secureAccountsData - Secure accounts data
 * @param {Object} environmentTotals - Environment totals
 */
function generateSecureAccountsFiles(secureAccountsData, environmentTotals) {
  console.log("\nGenerating secure accounts files...");
  
  // Create secure-accounts directory if it doesn't exist
  const secureAccountsDir = path.join(process.cwd(), ".", "secure-accounts");
  fs.ensureDirSync(secureAccountsDir);

  // Generate files for each environment
  for (const environment of ENVIRONMENTS) {
    const secureAccounts = [];
    let totalAllocation = 0;
    
    // Process accounts for this environment
    Object.entries(secureAccountsData[environment]).forEach(([name, account]) => {
      let adjustedAllocation = account.initialBalance;

      // Adjust Ecosystem account balance
      if (name === "Ecosystem") {
        adjustedAllocation -= environmentTotals[environment].airdrop;
      }
      // Adjust Foundation account balance
      else if (name === "Foundation") {
        adjustedAllocation -= environmentTotals[environment].dev;
      }

      totalAllocation += adjustedAllocation;

      secureAccounts.push({
        Name: name,
        SourceFundsAddress: account.sourceFundsAddress,
        RecipientFundsAddress: account.recipientFundsAddress,
        SecureAccountAddress: account.secureAccountAddress,
        SourceFundsBalance: shmToWei(adjustedAllocation).toString()
      });
    });

    // Validate total allocation
    const expectedTotal = 249000000;
    const actualTotal = totalAllocation + environmentTotals[environment].airdrop + environmentTotals[environment].dev;
    
    if (Math.abs(actualTotal - expectedTotal) > 0.01) { // Allow for small floating point differences
      console.error(
        `WARNING: Total allocation for ${environment} (${actualTotal}) does not equal ${expectedTotal}. ` +
        `Breakdown: Secure Accounts=${totalAllocation}, Airdrop=${environmentTotals[environment].airdrop}, ` +
        `Dev Genesis=${environmentTotals[environment].dev}`
      );
    }

    // Write the file
    const outputPath = path.join(secureAccountsDir, `${environment}.genesis-secure-accounts.json`);
    fs.writeJsonSync(outputPath, secureAccounts, { spaces: 2 });
    console.log(`Generated ${environment}.genesis-secure-accounts.json`);
  }
}

/**
 * Generate genesis files with airdrop and dev genesis accounts
 * @param {Object} airdropData - Airdrop data
 * @param {Object} devGenesisData - Dev genesis data
 */
function generateGenesisFiles(airdropData, devGenesisData) {
  console.log("\nGenerating genesis files...");
  
  const genesisDir = path.join(process.cwd(), ".", "genesis");
  fs.ensureDirSync(genesisDir);

  for (const environment of ENVIRONMENTS) {
    const combinedData = {};
    
    // Add dev genesis accounts first
    Object.entries(devGenesisData[environment]).forEach(([address, amount]) => {
      combinedData[address] = {
        wei: shmToWei(amount)
      };
    });
    
    // Add airdrop accounts
    Object.entries(airdropData[environment]).forEach(([address, amount]) => {
      combinedData[address] = {
        wei: shmToWei(amount)
      };
    });
    
    // Write combined genesis file
    const outputPath = path.join(genesisDir, `${environment}.genesis.json`);
    fs.writeJsonSync(outputPath, combinedData, { spaces: 2 });
    console.log(`Generated combined ${environment}.genesis.json`);
  }
}

/**
 * Generate dev keys files
 * @param {Object} devKeysData - Dev keys data
 */
function generateDevKeysFiles(devKeysData) {
  console.log("\nGenerating dev keys files...");
  
  const devKeysDir = path.join(process.cwd(), ".", "devkeys");
  fs.ensureDirSync(devKeysDir);

  for (const env of ENVIRONMENTS) {
    const keys = devKeysData[env];
    
    fs.writeFileSync(
      path.join(devKeysDir, `${env}.devKeys.json`),
      generateDevKeysFile(keys),
      "utf-8"
    );
    console.log(`Generated ${env}.devKeys.json with ${keys.length} keys`);
  }
}

/**
 * Generate multisig keys files
 * @param {Object} multisigKeysData - Multisig keys data
 */
function generateMultisigKeysFiles(multisigKeysData) {
  console.log("\nGenerating multisig keys files...");
  
  const multisigKeysDir = path.join(process.cwd(), ".", "multisigKeys");
  fs.ensureDirSync(multisigKeysDir);

  for (const env of ENVIRONMENTS) {
    // Extract all keys from all permission types for this environment
    const keys = new Set();
    
    // Collect all keys from various permission types
    Object.keys(multisigKeysData[env]).forEach(permissionType => {
      multisigKeysData[env][permissionType].forEach(key => keys.add(key));
    });
    
    // Convert to array and generate file
    const keyArray = Array.from(keys);
    
    fs.writeFileSync(
      path.join(multisigKeysDir, `${env}.MultisigKeys.json`),
      generateMultisigKeysFile(keyArray),
      "utf-8"
    );
    console.log(`Generated ${env}.MultisigKeys.json with ${keyArray.length} keys`);
  }
}

/**
 * Generate multisig permissions files
 * @param {Object} multisigKeysData - Multisig keys data
 */
function generateMultisigPermissionsFiles(multisigKeysData) {
  console.log("\nGenerating multisig permissions files...");
  
  const multisigDir = path.join(process.cwd(), ".", "multisig-permissions");
  fs.ensureDirSync(multisigDir);

  // Write multisig permissions files for each environment
  for (const [env, permissions] of Object.entries(multisigKeysData)) {
    fs.writeFileSync(
      path.join(multisigDir, `${env}.multisig-permissions.json`),
      JSON.stringify(permissions, null, 2),
      "utf-8"
    );
    console.log(`Generated ${env}.multisig-permissions.json for multisig keys`);
  }
}

/**
 * Auto-inject multisig keys into devGenesisData if they don't already exist there
 * @param {Object} multisigKeysData - Multisig keys data
 * @param {Object} devGenesisData - Dev genesis data
 * @returns {Object} - Updated dev genesis data
 */
function autoInjectMultisigDevGenesisAccounts(multisigKeysData, devGenesisData) {
  console.log("\nAuto-injecting multisig keys into dev genesis accounts...");
  
  // Create a new object to avoid modifying the original
  const updatedDevGenesisData = JSON.parse(JSON.stringify(devGenesisData));
  
  // Process each environment
  for (const environment of ENVIRONMENTS) {
    console.log(`Processing ${environment} environment...`);
    
    // Get all unique multisig keys with any permission for this environment
    const uniqueMultisigKeys = new Set();
    
    // Collect keys from all permission types
    Object.keys(multisigKeysData[environment]).forEach(permissionType => {
      multisigKeysData[environment][permissionType].forEach(key => {
        uniqueMultisigKeys.add(key);
      });
    });
    
    // Check each multisig key and add to devGenesisData if missing
    let addedCount = 0;
    uniqueMultisigKeys.forEach(key => {
      if (!updatedDevGenesisData[environment][key]) {
        updatedDevGenesisData[environment][key] = 0;
        addedCount++;
      }
    });
    
    console.log(`Added ${addedCount} multisig keys to ${environment} dev genesis accounts`);
  }
  
  return updatedDevGenesisData;
}

/**
 * Verify there are no duplicate addresses between airdrop and devGenesis data
 * @param {Object} airdropData - Airdrop data
 * @param {Object} devGenesisData - Dev genesis data
 * @returns {boolean} - True if verification passes (no duplicates)
 */
function verifyNoDuplicates(airdropData, devGenesisData) {
  console.log("\nVerifying no duplicate addresses between airdrop and devGenesis data...");
  
  let verificationsPass = true;
  
  for (const environment of ENVIRONMENTS) {
    const airdropAddresses = Object.keys(airdropData[environment]);
    const devGenesisAddresses = Object.keys(devGenesisData[environment]);
    
    // Find duplicates (addresses in both airdrop and devGenesis)
    const duplicates = airdropAddresses.filter(address => devGenesisAddresses.includes(address));
    
    if (duplicates.length > 0) {
      console.error(`WARNING: Found ${duplicates.length} addresses in both airdrop and devGenesis data for ${environment}:`);
      duplicates.forEach(address => {
        console.error(`  - ${address} (Airdrop: ${airdropData[environment][address]} SHM, DevGenesis: ${devGenesisData[environment][address]} SHM)`);
      });
      verificationsPass = false;
    } else {
      console.log(`✓ No duplicate addresses found between airdrop and devGenesis data for ${environment}`);
    }
  }
  
  if (verificationsPass) {
    console.log("✓ All verifications passed - no duplicates found!");
  } else {
    console.error("WARNING: Duplicate addresses found! This may result in unexpected token distribution.");
  }
  
  return verificationsPass;
}

/**
 * Generate a summary of the environment generation
 * @param {Object} environmentTotals - Environment totals
 * @param {Object} airdropData - Airdrop data
 * @param {Object} devGenesisData - Dev genesis data
 * @param {Object} secureAccountsData - Secure accounts data
 */
function generateSummary(environmentTotals, airdropData, devGenesisData, secureAccountsData) {
  console.log("\n=== Environment Generation Summary ===\n");

  for (const environment of ENVIRONMENTS) {
    console.log(`\n${environment.toUpperCase()} Environment:`);
    console.log("----------------------------------------");

    // Secure Accounts Summary
    console.log("\nSecure Accounts:");
    let totalSecureBalance = 0;
    Object.entries(secureAccountsData[environment]).forEach(([name, account]) => {
      let adjustedBalance = account.initialBalance;
      
      // Adjust Ecosystem account balance
      if (name === "Ecosystem") {
        adjustedBalance -= environmentTotals[environment].airdrop;
      }
      // Adjust Foundation account balance
      else if (name === "Foundation") {
        adjustedBalance -= environmentTotals[environment].dev;
      }
      
      console.log(`  - ${name.padEnd(20)}: ${adjustedBalance.toLocaleString()} SHM`);
      totalSecureBalance += adjustedBalance;
    });
    console.log(`  Total: ${totalSecureBalance.toLocaleString()} SHM (${Object.keys(secureAccountsData[environment]).length} accounts)`);

    // Dev Genesis Accounts Summary
    const devGenesisTotal = environmentTotals[environment].dev;
    const devGenesisCount = Object.keys(devGenesisData[environment]).length;
    
    // Count how many keys have 0 balance (likely auto-injected multisig keys)
    const zeroBalanceCount = Object.entries(devGenesisData[environment])
      .filter(([key, value]) => value === 0)
      .length;
    
    if (devGenesisCount > 0) {
      console.log("\nDev Genesis Accounts:");
      console.log(`  Total: ${devGenesisTotal.toLocaleString()} SHM (${devGenesisCount} accounts)`);
      console.log(`  Auto-injected multisig keys with 0 balance: ${zeroBalanceCount} keys`);
    } else {
      console.log("\nDev Genesis Accounts: None");
    }

    // Airdrop Accounts Summary
    const airdropTotal = environmentTotals[environment].airdrop;
    const airdropCount = Object.keys(airdropData[environment]).length;
    if (airdropCount > 0) {
      console.log("\nAirdrop Accounts:");
      console.log(`  Total: ${airdropTotal.toLocaleString()} SHM (${airdropCount} accounts)`);
    } else {
      console.log("\nAirdrop Accounts: None");
    }

    // Show total SHM distribution
    const totalSHM = totalSecureBalance + devGenesisTotal + airdropTotal;
    console.log("\nTotal SHM Distribution:");
    console.log(`  Secure Accounts:     ${totalSecureBalance.toLocaleString()} SHM`);
    console.log(`  Dev Genesis:         ${devGenesisTotal.toLocaleString()} SHM`);
    console.log(`  Airdrop:             ${airdropTotal.toLocaleString()} SHM`);
    console.log(`  Total:               ${totalSHM.toLocaleString()} SHM`);
    console.log(`  Target (249M):       249,000,000 SHM`);
    console.log(`  Difference:          ${(totalSHM - 249000000).toLocaleString()} SHM`);
  }
  
  console.log("\n=== End of Summary ===\n");
}

/**
 * Copy all mainnet JSON files to their non-environment specific versions
 */
function copyMainnetFilesToGeneric() {
  console.log("\nCopying mainnet files to generic versions...");
  
  // Define all the directories we create files in
  const directories = [
    path.join(process.cwd(), ".", "secure-accounts"),
    path.join(process.cwd(), ".", "genesis"),
    path.join(process.cwd(), ".", "devkeys"),
    path.join(process.cwd(), ".", "multisigKeys"),
    path.join(process.cwd(), ".", "multisig-permissions")
  ];
  
  // Process each directory
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} does not exist, skipping`);
      return;
    }
    
    // Get all files in the directory
    const files = fs.readdirSync(dir);
    
    // Find mainnet files and create generic versions
    files.forEach(file => {
      if (file.startsWith('mainnet.')) {
        const genericFileName = file.replace('mainnet.', '');
        const sourcePath = path.join(dir, file);
        const targetPath = path.join(dir, genericFileName);
        
        // Copy the file
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${file} to ${genericFileName} in ${path.basename(dir)}`);
      }
    });
  });
  
  console.log("Finished copying mainnet files to generic versions");
}

/**
 * Main function to generate the environment
 */
async function generateEnvironment() {
  try {
    console.log("Starting environment generation...\n");
    
    // Phase 1: Import data from all tabs
    const airdropData = await importAirdropData();
    const devGenesisData = await importDevGenesisData();
    const secureAccountsData = await importSecureAccountsData();
    const devKeysData = await importDevKeysData();
    const multisigKeysData = await importMultisigKeysData();
    
    // Phase 1.5: Verify data integrity
    verifyNoDuplicates(airdropData, devGenesisData);
    
    // New Phase between 1 and 2: Auto-inject multisig keys into dev genesis accounts
    const updatedDevGenesisData = autoInjectMultisigDevGenesisAccounts(multisigKeysData, devGenesisData);
    
    // Re-verify after auto-injection to ensure we didn't create new duplicates
    verifyNoDuplicates(airdropData, updatedDevGenesisData);
    
    // Phase 2: Calculate totals
    const environmentTotals = calculateEnvironmentTotals(airdropData, updatedDevGenesisData);
    
    // Phase 3: Generate output files
    generateSecureAccountsFiles(secureAccountsData, environmentTotals);
    generateGenesisFiles(airdropData, updatedDevGenesisData);
    generateDevKeysFiles(devKeysData);
    generateMultisigKeysFiles(multisigKeysData);
    generateMultisigPermissionsFiles(multisigKeysData);
    
    // Phase 4: Copy all mainnet files to generic versions
    copyMainnetFilesToGeneric();
    
    // Phase 5: Generate summary
    generateSummary(environmentTotals, airdropData, updatedDevGenesisData, secureAccountsData);
    
    console.log("\nEnvironment generation completed successfully!");
  } catch (error) {
    console.error("Error generating environment:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the generator
generateEnvironment() 