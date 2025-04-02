import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { readFile, utils } = pkg;

const ENVIRONMENTS = ['local', 'devnet', 'stagenet', 'testnet', 'mainnet'];

const DevSecurityLevel = {
  High: 3
};

function generateDevKeysFile(keys) {
  const content = {
    devPublicKeys: keys.reduce((acc, key) => {
      acc[key] = DevSecurityLevel.High;
      return acc;
    }, {})
  };

  return JSON.stringify(content, null, 2);
}

async function processDevKeys() {
  try {
    // Read the Excel file
    const excelPath = path.join(__dirname, '..', 'devkeys.xlsx');
    console.log(`Reading Excel file: ${excelPath}`);
    
    if (!await fs.pathExists(excelPath)) {
      throw new Error(`Excel file not found at: ${excelPath}`);
    }
    
    const workbook = readFile(excelPath);
    console.log('Available sheets:', workbook.SheetNames);
    
    // Get the Dev keys sheet
    const sheetName = 'Dev keys';
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Sheet "${sheetName}" not found in Excel file. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = utils.sheet_to_json(worksheet);
    console.log(`Found ${data.length} rows in sheet`);
    
    // Validate environment columns exist
    const firstRow = data[0];
    if (!firstRow) {
      throw new Error('Excel sheet is empty');
    }
    
    const missingEnvironments = ENVIRONMENTS.filter(env => !(env in firstRow));
    if (missingEnvironments.length > 0) {
      throw new Error(`Missing environment columns: ${missingEnvironments.join(', ')}`);
    }
    
    // Create output directory
    const outputDir = path.join(__dirname, '..', 'devkeys');
    await fs.ensureDir(outputDir);
    console.log(`Created output directory: ${outputDir}`);

    // Process each environment
    for (const environment of ENVIRONMENTS) {
      // Extract keys that are checked for this environment
      const keys = data
        .map(row => {
          const key = row.keys || row.key || row.publicKey || row.Key || row.PublicKey;
          const isChecked = row[environment] === true || row[environment] === 'x' || row[environment] === 'X';
          
          if (!key) {
            console.warn('Warning: Found row without a key:', row);
            return null;
          }
          
          return isChecked ? key : null;
        })
        .filter(key => key); // Remove any null/undefined keys

      // Generate file for this environment
      const outputContent = generateDevKeysFile(keys);
      const outputPath = path.join(outputDir, `${environment}.json`);
      await fs.writeFile(outputPath, outputContent, 'utf-8');
      console.log(`Generated ${environment}.json with ${keys.length} keys`);
    }

    console.log('Successfully processed all environments');
  } catch (error) {
    console.error('Error processing dev keys:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the processor
processDevKeys(); 