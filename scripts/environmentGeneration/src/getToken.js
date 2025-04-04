import { google } from 'googleapis'
import readline from 'readline'

// OAuth2 credentials from Google Cloud Console
const CLIENT_ID = '1081759689364-pqegojd7co7cfbk5mbgcdlsc3bib4ds2.apps.googleusercontent.com'
const CLIENT_SECRET = ''
const REDIRECT_URI = 'http://localhost:3000'

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Force consent screen to get refresh token
})

console.log('Authorize this app by visiting this url:', authUrl)
console.log('After authorizing, you will be redirected to a localhost URL')
console.log('Copy the code parameter from the URL and paste it below')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Enter the code from that page here: ', async (code) => {
  rl.close()

  try {
    const { tokens } = await oauth2Client.getToken(code)
    console.log('Access Token:', tokens.access_token)
    console.log('Refresh Token:', tokens.refresh_token)
    console.log('Token Type:', tokens.token_type)
    console.log('Expiry Date:', tokens.expiry_date)

    // Save tokens to file
    const fs = await import('fs')
    fs.writeFileSync('token.json', JSON.stringify(tokens, null, 2))
    console.log('Tokens saved to token.json')
  } catch (err) {
    console.error('Error retrieving access token:', err.message)
    if (err.response) {
      console.error('Error details:', err.response.data)
    }
  }
})