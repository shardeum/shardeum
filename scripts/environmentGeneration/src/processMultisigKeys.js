import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { readFile, utils } = pkg;

const ENVIRONMENTS = ['local', 'devnet', 'stagenet', 'testnet', 'mainnet'];

// Define the permission types and their corresponding JSON property names
const PERMISSIONS = {
  'multisig Keys': 'multisigKeys',
  'changeDevKey': 'changeDevKey',
  'changeMultiSigKeyList': 'changeMultiSigKeyList',
  'initiateSecureAccountTransfer': 'initiateSecureAccountTransfer',
  'changeNonKeyConfigs': 'changeNonKeyConfigs'
};

function generateMultisigKeysFile(permissions) {
  const content = {};
  
  // Add each permission type with its array of keys
  Object.entries(permissions).forEach(([permission, keys]) => {
    if (keys && keys.length > 0) {
      content[permission] = keys;
    }
  });

  return JSON.stringify(content, null, 2);
}

async function processMultisigKeys() {
  try {
    // Read the Excel file
    const excelPath = path.join(__dirname, '..', 'devkeys.xlsx');
    console.log(`Reading Excel file: ${excelPath}`);
    
    if (!await fs.pathExists(excelPath)) {
      throw new Error(`Excel file not found at: ${excelPath}`);
    }
    
    const workbook = readFile(excelPath);
    console.log('Available sheets:', workbook.SheetNames);
    
    // Get the multisig keys sheet
    const sheetName = 'MS Key Permission Groups';
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Sheet "${sheetName}" not found in Excel file. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = utils.sheet_to_json(worksheet);
    console.log(`Found ${data.length} rows in sheet`);
    
    // Create output directory
    const outputDir = path.join(__dirname, '..', 'multisigkeys');
    await fs.ensureDir(outputDir);
    console.log(`Created output directory: ${outputDir}`);

    // Get the header row
    const headerRow = data[0]; // First row contains both property names and environments

    // Initialize environment data structures
    const envData = {
      local: {},
      devnet: {},
      stagenet: {},
      testnet: {},
      mainnet: {}
    };

    // Process each column
    let currentProperty = null;
    let currentEnv = null;
    
    Object.entries(headerRow).forEach(([col, value]) => {
      // Skip the first two columns (keys and Owner)
      if (col === '__EMPTY' || col === '__EMPTY_1') return;

      // If this is a property name (not an __EMPTY column)
      if (!col.startsWith('__EMPTY')) {
        currentProperty = value; // This is the JSON property name
        currentEnv = 'local';    // Start with local environment
        console.log(`Starting new property section: ${currentProperty}`);
      } else {
        // This is an environment column
        currentEnv = value;
      }

      // Skip if we don't have a valid environment
      if (!currentEnv || !envData[currentEnv]) {
        console.warn(`Skipping column ${col}: Invalid environment ${currentEnv}`);
        return;
      }

      // Process the data rows (starting from index 1)
      const keys = data.slice(1)
        .map(row => {
          const key = row['__EMPTY'];
          if (!key) return null;
          
          const isChecked = row[col] === true || row[col] === 'x' || row[col] === 'X';
          return isChecked ? key : null;
        })
        .filter(key => key);

      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys for ${currentEnv}.${currentProperty}`);
        envData[currentEnv][currentProperty] = keys;
      }
    });

    // Generate files for each environment
    for (const [env, permissions] of Object.entries(envData)) {
      const outputContent = JSON.stringify(permissions, null, 2);
      const outputPath = path.join(outputDir, `${env}.json`);
      await fs.writeFile(outputPath, outputContent, 'utf-8');
      console.log(`Generated ${env}.json with permissions: ${Object.keys(permissions).join(', ')}`);
    }

    console.log('Successfully processed all environments');
  } catch (error) {
    console.error('Error processing multisig keys:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the processor
processMultisigKeys(); 