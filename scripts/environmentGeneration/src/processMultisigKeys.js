import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSheetData, SHEETS } from './googleSheets.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ENVIRONMENTS = ['local', 'devnet', 'testnet', 'stagenet', 'mainnet']
const OUTPUT_DIR = path.join(__dirname, '..', 'multisigkeys')

// Define the permission types and their corresponding JSON property names
const PERMISSIONS = {
  changeDevKey: 'changeDevKey',
  changeMultiSigKeyList: 'changeMultiSigKeyList',
  initiateSecureAccountTransfer: 'initiateSecureAccountTransfer',
  changeNonKeyConfigs: 'changeNonKeyConfigs',
}

/**1.
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

/**
 * @returns {Promise<void>}
 */
async function processMultisigKeys() {
  console.log('Starting processMultisigKeys...')
  console.log('Output directory:', OUTPUT_DIR)

  try {
    console.log('Fetching multisig keys data from Google Sheets...')
    const data = await getSheetData(SHEETS.MULTISIG)

    if (!data || data.length < 2) {
      console.error('No data found in sheet')
      return
    }

    // Get the header rows
    const propertyRow = data[0] // First row contains property names
    const envRow = data[1] // Second row contains environments

    console.log('Environment row:', envRow)

    // Initialize environment data structures
    const envData = {
      local: {},
      devnet: {},
      stagenet: {},
      testnet: {},
      mainnet: {},
    }

    // Process each column
    let currentProperty = null
    let currentEnv = null

    // Process all columns up to the last environment column
    for (let colIndex = 2; colIndex < envRow.length; colIndex++) {
      const property = propertyRow[colIndex]
      const environment = envRow[colIndex]

      console.log(`Column ${colIndex}: property=${property}, environment=${environment}`)

      // If this is a property name
      if (PERMISSIONS[property]) {
        currentProperty = PERMISSIONS[property]
        currentEnv = environment
        console.log(`Starting new property section: ${currentProperty} with environment: ${currentEnv}`)
      } else if (environment && envData[environment]) {
        // This is an environment column under the current property
        currentEnv = environment
        console.log(`Processing environment column ${colIndex}: ${currentEnv}`)
      }

      // Skip if we don't have a valid environment or property
      if (!currentEnv || !currentProperty || !envData[currentEnv]) {
        console.warn(`Skipping column ${colIndex}: Invalid environment ${currentEnv} or property ${currentProperty}`)
        continue
      }

      // Process the data rows (starting from index 2)
      const keys = data
        .slice(2)
        .filter((row, rowIndex) => {
          const isChecked = row[colIndex]?.toUpperCase() === 'TRUE'
          return isChecked
        })
        .map((row) => row[0]) // First column is the key

      if (keys.length > 0) {
        // Initialize the property array if it doesn't exist
        if (!envData[currentEnv][currentProperty]) {
          envData[currentEnv][currentProperty] = []
        }
        // Add the keys to the property array
        envData[currentEnv][currentProperty].push(...keys)
        console.log(`Found ${keys.length} keys for ${currentEnv}.${currentProperty}`)
      }
    }

    // Ensure output directory exists
    await fs.ensureDir(OUTPUT_DIR)

    // Generate files for each environment
    for (const [env, permissions] of Object.entries(envData)) {
      const outputFile = path.join(OUTPUT_DIR, `${env}.json`)
      const content = JSON.stringify(permissions, null, 2)
      await fs.writeFile(outputFile, content, 'utf-8')
      console.log(`Wrote keys to ${outputFile}`)
    }

    // Create allMultisigKeys.json
    const allKeys = new Set()
    Object.values(envData).forEach((permissions) => {
      Object.values(permissions).forEach((keys) => {
        keys.forEach((key) => allKeys.add(key))
      })
    })

    const allKeysArray = Array.from(allKeys)
    console.log(`Found ${allKeysArray.length} unique keys total`)
    const allKeysContent = generateMultisigKeysFile(allKeysArray)
    const allKeysFile = path.join(OUTPUT_DIR, 'allMultisigKeys.json')
    await fs.writeFile(allKeysFile, allKeysContent, 'utf-8')

    console.log('Multisig keys processing completed successfully')
  } catch (error) {
    console.error('Error processing multisig keys:', error)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    throw error
  }
}

// Execute the function
console.log('Script starting...')
processMultisigKeys().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
}) 