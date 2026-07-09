/**
 * Run this script ONCE locally to get the Gmail OAuth2 refresh token
 * for sarkari.karamchari.official@gmail.com
 * 
 * Steps:
 * 1. node get-gmail-token.js
 * 2. Open the URL it gives you in browser
 * 3. Login as sarkari.karamchari.official@gmail.com
 * 4. Copy the "code" from the redirect URL
 * 5. Paste it when prompted
 * 6. Copy the REFRESH TOKEN and add it to Render env variables
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// IMPORTANT: This redirect URI must be added in Google Cloud Console
// Go to: APIs & Services > Credentials > Your OAuth Client > Authorized redirect URIs
// Add: http://localhost:3001/oauth2callback
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// We need gmail.send scope to send emails
const SCOPES = ['https://mail.google.com/'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force consent to always get refresh_token
});

console.log('\n========================================');
console.log('STEP 1: Open this URL in your browser:');
console.log('========================================');
console.log('\n' + authUrl + '\n');
console.log('STEP 2: Login as sarkari.karamchari.official@gmail.com');
console.log('STEP 3: After login, you will be redirected to a localhost URL');
console.log('        Copy the "code" parameter from that URL');
console.log('        Example: http://localhost:3001/oauth2callback?code=4/XXXX...');
console.log('========================================\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the "code" from the URL here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\n========================================');
    console.log('✅ SUCCESS! Your Gmail Refresh Token:');
    console.log('========================================');
    console.log('\nGMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n========================================');
    console.log('ADD THIS TO RENDER ENVIRONMENT VARIABLES:');
    console.log('Key: GMAIL_REFRESH_TOKEN');
    console.log('Value:', tokens.refresh_token);
    console.log('========================================\n');
  } catch (err) {
    console.error('Error:', err.message);
  }
});
