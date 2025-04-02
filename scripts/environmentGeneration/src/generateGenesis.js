import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const { readFile, utils } = pkg

/**
 * @param {number} shm - Amount in SHM
 * @returns {string} - Amount in wei as a string
 */
function shmToWei(shm) {
  return BigInt(Math.floor(shm * 1e18)).toString()
}

/**
 * @returns {Promise<void>}
 */
async function generateGenesis() {
  try {
    // Read the Excel file
    const excelPath = path.join(__dirname, '..', 'devkeys.xlsx')
    console.log(`Reading Excel file: ${excelPath}`)

    if (!(await fs.pathExists(excelPath))) {
      throw new Error(`Excel file not found at: ${excelPath}`)
    }

    const workbook = readFile(excelPath)
    console.log('Available sheets:', workbook.SheetNames)

    // Get the Airdrop sheet
    const sheetName = 'Airdrop data'
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(
        `Sheet "${sheetName}" not found in Excel file. Available sheets: ${workbook.SheetNames.join(', ')}`
      )
    }
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data = utils.sheet_to_json(worksheet)
    console.log(`Found ${data.length} rows in sheet`)

    // Create genesis data structure
    const genesisData = {}

    // Process each row
    data.forEach((row, index) => {
      // Skip header row
      if (index === 0) return

      // Get the address and amount columns
      const address = row['Wallet Address']
      const shmAmount = parseFloat(row['SHM Allocated'])

      if (!address || isNaN(shmAmount)) {
        console.warn(`Skipping invalid row:`, row)
        return
      }

      // Convert SHM to wei and add to genesis data
      genesisData[address] = {
        wei: shmToWei(shmAmount),
      }
    })

    // Generate genesis.json
    const genesisDir = path.join(__dirname, '..', 'genesis')
    await fs.ensureDir(genesisDir)
    const outputPath = path.join(genesisDir, 'genesis.json')
    await fs.writeFile(outputPath, JSON.stringify(genesisData, null, 2), 'utf-8')
    console.log(`Generated genesis.json with ${Object.keys(genesisData).length} addresses in ${genesisDir}`)
  } catch (error) {
    console.error('Error generating genesis.json:', error.message)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the generator
generateGenesis()
