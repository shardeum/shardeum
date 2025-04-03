import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSheetData, SHEETS } from './googleSheets.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * @param {number} shm - Amount in SHM
 * @returns {string} - Amount in wei as a string
 */
function shmToWei(shm) {
  return (BigInt(Math.floor(shm)) * BigInt(1e18)).toString()
}

/**
 * @returns {Promise<void>}
 */
async function generateGenesis() {
  try {
    // Get airdrop data from Google Sheets
    console.log('Fetching airdrop data from Google Sheets...')
    const data = await getSheetData(SHEETS.AIRDROP)

    if (!data || data.length < 2) {
      throw new Error('No data found in airdrop sheet')
    }

    // Create genesis data structure
    const genesisData = {}

    // Process each row (skip header)
    data.slice(1).forEach((row) => {
      const address = row[0] // Wallet Address
      const shmAmount = parseFloat(row[1]) // SHM Allocated

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
