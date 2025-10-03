#!/usr/bin/env node
import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import open from 'open';

// YouTube Data API OAuth 2.0 configuration
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing environment variables:');
  console.error('   YOUTUBE_CLIENT_ID - Get from Google Cloud Console');
  console.error('   YOUTUBE_CLIENT_SECRET - Get from Google Cloud Console');
  console.error('');
  console.error('📋 Setup Instructions:');
  console.error('1. Go to https://console.cloud.google.com/');
  console.error('2. Create/select a project');
  console.error('3. Enable YouTube Data API v3');
  console.error('4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"');
  console.error('5. Set application type to "Desktop application"');
  console.error('6. Copy Client ID and Client Secret');
  console.error('');
  console.error('🚀 Run with:');
  console.error('   set YOUTUBE_CLIENT_ID=your_client_id');
  console.error('   set YOUTUBE_CLIENT_SECRET=your_client_secret');
  console.error('   node get-oauth-tokens.js');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
  prompt: 'consent' // Force refresh token
});

console.log('🔗 Opening browser for YouTube authentication...');
console.log('📋 Please sign in with your YouTube account and grant permissions.');
console.log('');

// Create a local server to handle the OAuth callback
const server = http.createServer(async (req, res) => {
  try {
    const query = url.parse(req.url, true).query;

    if (query.code) {
      console.log('✅ Authorization code received!');

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(query.code);
      oauth2Client.setCredentials(tokens);

      console.log('');
      console.log('🎉 Authentication successful!');
      console.log('');
      console.log('📝 Add these to your MCP settings:');
      console.log('');
      console.log(`"YOUTUBE_CLIENT_ID": "${CLIENT_ID}",`);
      console.log(`"YOUTUBE_CLIENT_SECRET": "${CLIENT_SECRET}",`);
      console.log(`"YOUTUBE_REFRESH_TOKEN": "${tokens.refresh_token}",`);
      console.log('');

      if (tokens.access_token) {
        console.log('🔑 Access Token (temporary):', tokens.access_token);
        console.log('⏰ Expires:', new Date(tokens.expiry_date).toLocaleString());
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #28a745;">✅ Success!</h1>
            <p>YouTube authentication completed.</p>
            <p>Check your terminal for the tokens to add to your MCP settings.</p>
            <p>You can close this window now.</p>
          </body>
        </html>
      `);

      server.close();
      process.exit(0);
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">❌ Error</h1>
            <p>No authorization code received.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('❌ OAuth error:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #dc3545;">❌ Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Start the server
server.listen(3000, () => {
  console.log('🌐 Local server started on http://localhost:3000');
  console.log('🔗 Opening:', authUrl);
  console.log('');

  // Open browser automatically
  open(authUrl).catch(() => {
    console.log('📱 Please manually open this URL in your browser:');
    console.log(authUrl);
  });
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  server.close();
  process.exit(0);
});