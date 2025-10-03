# YouTube MCP Server Setup Guide

**Complete setup instructions for first-time users of the YouTube MCP server.**

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- YouTube Data API v3 access
- VS Code with Kilo-Code extension

## 🔑 Step 1: YouTube API Authentication

### Option A: API Key Only (Read-Only Access)
1. **Get YouTube API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project
   - Enable YouTube Data API v3
   - Create credentials → API Key
   - Restrict the key to YouTube Data API v3

2. **Set Environment Variable:**
   ```bash
   YOUTUBE_API_KEY=your_api_key_here
   ```

   **Available Tools with API Key:**
   - ✅ `videos_list` - Get video details
   - ✅ `channels_list` - Get channel info
   - ✅ `search_list` - Search YouTube
   - ✅ `commentThreads_list` - Read comments
   - ✅ `comments_list` - Read comment replies
   - ✅ `captions_list` & `captions_download` - Get transcripts
   - ❌ Write operations (posting comments, etc.)

### Option B: OAuth 2.0 (Full Read + Write Access)
1. **Create OAuth Credentials:**
   - In Google Cloud Console → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Set application type: "Desktop application"
   - Download the JSON file

2. **Get OAuth Tokens:**
   - Use the `get-oauth-tokens.js` script in the server folder
   - Run: `node get-oauth-tokens.js`
   - Follow the browser authentication flow
   - Save the refresh token

3. **Set Environment Variables:**
   ```bash
   YOUTUBE_CLIENT_ID=your_client_id
   YOUTUBE_CLIENT_SECRET=your_client_secret
   YOUTUBE_REFRESH_TOKEN=your_refresh_token
   ```

   **Available Tools with OAuth:**
   - ✅ All read operations (above)
   - ✅ `commentThreads_insert` - Post new comments
   - ✅ `comments_insert` - Reply to comments
   - ✅ `videos_update` - Update video metadata
   - ✅ `playlists_insert/update/delete` - Manage playlists
   - ✅ And more write operations

## 🛠️ Step 2: Install and Build the MCP Server

1. **Clone/Download the Server:**
   ```bash
   cd C:\Users\your_username\AppData\Roaming\Kilo-Code\MCP\
   # Place youtube-server folder here
   ```

2. **Install Dependencies:**
   ```bash
   cd youtube-server
   npm install
   ```

3. **Build the Server:**
   ```bash
   npm run build
   ```
   This compiles TypeScript and creates the executable in `build/index.js`

## ⚙️ Step 3: Configure VS Code MCP Settings

1. **Open MCP Settings:**
   - VS Code → Settings → Extensions → Kilo-Code
   - Find the MCP settings file path
   - Usually: `C:\Users\username\AppData\Roaming\Code\User\globalStorage\kilocode.kilo-code\settings\mcp_settings.json`

2. **Add YouTube Server Configuration:**
   ```json
   {
     "mcpServers": {
       "youtube": {
         "type": "stdio",
         "command": "node",
         "args": [
           "C:/Users/your_username/AppData/Roaming/Kilo-Code/MCP/youtube-server/build/index.js"
         ],
         "env": {
           "YOUTUBE_API_KEY": "your_api_key_here"
           // OR for OAuth:
           // "YOUTUBE_CLIENT_ID": "your_client_id",
           // "YOUTUBE_CLIENT_SECRET": "your_client_secret",
           // "YOUTUBE_REFRESH_TOKEN": "your_refresh_token"
         },
         "disabled": false,
         "alwaysAllow": [
           "videos_list",
           "channels_list",
           "search_list",
           "commentThreads_list",
           "comments_list",
           "captions_list",
           "captions_download"
         ],
         "timeout": 120
       }
     }
   }
   ```

3. **Restart VS Code** to load the new configuration

## 🔧 Step 4: Troubleshooting Common Issues

### "Connection closed" Error
- **Cause:** Server not built or wrong path
- **Fix:** Run `npm run build` and verify the path in settings

### "require is not defined" Error
- **Cause:** Module system conflict
- **Fix:** Server uses ES modules - ensure proper build

### "API Key Invalid" Error
- **Cause:** Wrong API key or not enabled
- **Fix:** Check Google Cloud Console, enable YouTube Data API v3

### "OAuth Token Expired" Error
- **Cause:** Refresh token invalid
- **Fix:** Re-run OAuth flow to get new tokens

### Captions Not Available
- **Cause:** Video has no auto-generated captions
- **Fix:** Not all videos have captions - check with `captions_list` first

## 📚 Step 5: Using the MCP Tools

### Basic Video Information
```javascript
// Get video details
videos_list({
  part: "snippet",
  id: "VIDEO_ID"
})
```

### Comment Management
```javascript
// Get comments
commentThreads_list({
  part: "snippet",
  videoId: "VIDEO_ID",
  maxResults: 50
})

// Reply to a comment
comments_insert({
  part: "snippet",
  body: {
    snippet: {
      parentId: "COMMENT_ID",
      textOriginal: "Your reply"
    }
  }
})
```

### Caption/Transcript Access
```javascript
// Check available captions
captions_list({
  part: "snippet",
  videoId: "VIDEO_ID"
})

// Download transcript
captions_download({
  id: "CAPTION_ID",
  tfmt: "srt"
})
```

## 🔒 Step 6: Security Best Practices

- **API Key Restrictions:** Always restrict API keys to specific APIs
- **Environment Variables:** Never commit API keys to code
- **OAuth Scopes:** Only request necessary permissions
- **Token Storage:** Keep refresh tokens secure
- **Rate Limits:** Respect YouTube API quotas

## 📞 Step 7: Getting Help

- **Check Logs:** VS Code developer console for MCP errors
- **Test Tools:** Use individual tools to verify functionality
- **API Documentation:** Refer to YouTube Data API v3 docs
- **Community:** Check GitHub issues for common problems

## ✅ Step 8: Verification

Test your setup with these commands:

1. **Test Video Info:**
   ```javascript
   videos_list({part: "snippet", id: "dQw4w9WgXcQ"})
   ```

2. **Test Comments:**
   ```javascript
   commentThreads_list({part: "snippet", videoId: "dQw4w9WgXcQ", maxResults: 5})
   ```

3. **Test Captions:**
   ```javascript
   captions_list({part: "snippet", videoId: "dQw4w9WgXcQ"})
   ```

If all tests pass, your YouTube MCP server is ready to use!

---

**Remember:** Start with API key authentication for read-only access, then upgrade to OAuth when you need write capabilities like posting comments.