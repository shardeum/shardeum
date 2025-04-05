import { google } from 'googleapis'

// Replace with your actual spreadsheet ID from the URL
const SPREADSHEET_ID = '1bHZancKDeu9BxG8bE_VsIDjVgyxewm7h_j1ordwVZiU'

// OAuth2 credentials
const CLIENT_ID = '1081759689364-pqegojd7co7cfbk5mbgcdlsc3bib4ds2.apps.googleusercontent.com'
const CLIENT_SECRET = ''
const REDIRECT_URI = 'http://localhost:3000'

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

// Set the credentials
oauth2Client.setCredentials({
  access_token: '',
  refresh_token: '',
})

// Create the sheets client
const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

/**
 * @param {string} sheetName - The name of the sheet to fetch
 * @returns {Promise<string[][]>} - The sheet data as a 2D array
 */
export async function getSheetData(sheetName) {
  try {
    console.log('Fetching data from spreadsheet:', SPREADSHEET_ID)
    console.log('Using sheet name:', sheetName)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    })

    if (!response.data.values) {
      console.log('No data found in sheet')
      return []
    }

    console.log(`Found ${response.data.values.length} rows of data`)
    console.log('First row:', response.data.values[0])
    return response.data.values
  } catch (error) {
    console.error('Error fetching sheet data:', error.message)
    console.error('Full error:', error)
    throw error
  }
}

export const SHEETS = {
  AIRDROP_GENESIS_ACCOUNTS: 'airdropGenesisAccounts',
  MULTISIG_KEYS: 'multisigKeys',
  DEV_PUBLIC_KEYS: 'devPublicKeys',
  SECURE_ACCOUNTS: 'secureAccounts',
  DEV_GENESIS_ACCOUNTS: 'devGenesisAccounts'
}
