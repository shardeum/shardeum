import { google } from 'googleapis'
import readline from 'readline'

const CLIENT_ID = '1081759689364-pqegojd7co7cfbk5mbgcdlsc3bib4ds2.apps.googleusercontent.com'
const CLIENT_SECRET = ''
const REDIRECT_URI = 'http://localhost:3010'

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
})

console.log('Authorize this app by visiting this url:', authUrl)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Enter the code from that page here: ', (code) => {
  rl.close()

  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('Error retrieving access token', err)
      return
    }
    console.log('Access Token:', token.access_token)
    console.log('Refresh Token:', token.refresh_token)
  })
})
