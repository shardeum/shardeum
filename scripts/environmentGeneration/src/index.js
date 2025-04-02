import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSheetData, SHEETS } from './googleSheets.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ENVIRONMENTS = ['local', 'devnet', 'stagenet', 'testnet', 'mainnet']
const OUTPUT_DIR = path.join(__dirname, '..', 'devkeys')

const DevSecurityLevel = {
  High: 3,
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
 * @returns {Promise<void>}
 */
async function processDevKeys() {
  console.log('Starting processDevKeys...')
  console.log('Output directory:', OUTPUT_DIR)

  try {
    console.log('Fetching dev keys data from Google Sheets...')
    const data = await getSheetData(SHEETS.DEV_KEYS)
    console.log('Received data:', data ? `Found ${data.length} rows` : 'No data')

    if (!data || data.length === 0) {
      console.error('No data found in sheet')
      return
    }

    // Get headers
    const headers = data[0]

    // Validate environment columns exist
    const missingEnvs = ENVIRONMENTS.filter((env) => !headers.includes(env))
    if (missingEnvs.length > 0) {
      console.error(`Missing environment columns: ${missingEnvs.join(', ')}`)
      return
    }

    // Ensure output directory exists
    await fs.ensureDir(OUTPUT_DIR)

    // Process each environment
    for (const env of ENVIRONMENTS) {
      console.log(`\nProcessing ${env} environment...`)
      const envIndex = headers.indexOf(env)

      const keys = data
        .slice(1) // Skip header row
        .filter((row, rowIndex) => {
          const isChecked = row[envIndex]?.toUpperCase() === 'TRUE'
          return isChecked
        })
        .map((row) => row[1]) // Use the 'keys' column (index 1)

      // Write keys to file directly in devkeys directory
      const outputFile = path.join(OUTPUT_DIR, `${env}DevKeys.json`)
      const content = generateDevKeysFile(keys)
      await fs.writeFile(outputFile, content, 'utf-8')
    }

    console.log('Dev keys processing completed successfully')
  } catch (error) {
    console.error('Error processing dev keys:', error)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    throw error
  }
}

// Execute the function
console.log('Script starting...')
processDevKeys().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
}) 