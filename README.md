# YouTube MCP Server

A Model Context Protocol (MCP) server designed to empower AI assistants with extensive capabilities to interact with the YouTube Data API v3. This server allows seamless integration with various MCP-compatible clients like Claude Desktop, Cursor, and VS Code with the Kilo-Code extension, enabling AI to manage videos, channels, comments, captions, and more directly through natural language commands.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](package.json)

## ✨ Features & Use Cases

The YouTube MCP Server unlocks a wide range of possibilities for AI-driven YouTube management and interaction:

- **Video Information Retrieval**:
    - **Use Case**: Quickly fetch video titles, descriptions, statistics (views, likes, comments), and other metadata for content analysis or summarization.
    - **Tools**: `videos_list`
- **Channel Insights**:
    - **Use Case**: Get details about channels, including subscriber counts, descriptions, and featured content, useful for competitive analysis or audience understanding.
    - **Tools**: `channels_list`
- **YouTube Search**:
    - **Use Case**: Perform targeted searches for videos, channels, or playlists based on keywords, categories, or other filters, enabling AI to find relevant content efficiently.
    - **Tools**: `search_list`
- **Comment Management & Interaction**:
    - **Use Case**: Read existing comments and replies, post new top-level comments, or reply to specific comments. This is invaluable for automated community engagement, moderation, and support.
    - **Tools**: `commentThreads_list`, `comments_list`, `commentThreads_insert`, `comments_insert`
- **Caption and Transcript Access**:
    - **Use Case**: Download video captions or transcripts in various formats (SRT, VTT, etc.). Essential for content analysis, summarization, translation, or creating accessible content.
    - **Tools**: `captions_list`, `captions_download`
- **Playlist Creation & Management**:
    - **Use Case**: Create new playlists, add/remove videos, update playlist metadata. Useful for content organization, curation, and automated content delivery.
    - **Tools**: `playlists_list`, `playlists_insert`, `playlists_update`, `playlists_delete`, `playlistItems_list`, `playlistItems_insert`, `playlistItems_update`, `playlistItems_delete`
- **Video Metadata Updates**:
    - **Use Case**: Programmatically update video titles, descriptions, tags, and privacy settings. Ideal for automated SEO optimization or content scheduling.
    - **Tools**: `videos_update`

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v16 or higher) installed on your system.
- **npm** or **yarn** (comes with Node.js).
- **YouTube Data API v3** access configured in the Google Cloud Console.
- An **MCP-compatible client** such as Claude Desktop, Cursor, or VS Code with the Kilo-Code extension.

## 🚀 Installation

Follow these steps to set up the YouTube MCP Server:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/softreviewed/youtube-mcp-server.git
    cd youtube-mcp-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the server:**
    ```bash
    npm run build
    ```
    This command compiles the TypeScript source code and generates the executable JavaScript file at `build/index.js`.

## 🔑 YouTube API Authentication

The YouTube MCP Server supports two authentication methods: API Key (read-only) and OAuth 2.0 (full read/write access).

### Option A: API Key Only (Read-Only Access)

This method is simpler to set up and is suitable if your AI assistant only needs to read data from YouTube (e.g., fetching video details, searching, reading comments, downloading captions).

1.  **Get Your YouTube API Key:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   Navigate to "APIs & Services" > "Library" and search for "YouTube Data API v3". Enable it.
    *   Go to "APIs & Services" > "Credentials". Click "Create Credentials" > "API Key".
    *   **Important**: Restrict your API key to only the "YouTube Data API v3" to enhance security.

2.  **Set the Environment Variable:**
    Before running the MCP server, set the `YOUTUBE_API_KEY` environment variable with your newly generated key.
    *   **Windows (Command Prompt):**
        ```bash
        set YOUTUBE_API_KEY=your_api_key_here
        ```
    *   **Windows (PowerShell):**
        ```powershell
        $env:YOUTUBE_API_KEY="your_api_key_here"
        ```
    *   **Linux/macOS:**
        ```bash
        export YOUTUBE_API_KEY=your_api_key_here
        ```
    *(Replace `your_api_key_here` with your actual API key.)*

### Option B: OAuth 2.0 (Full Read + Write Access)

This method is required if your AI assistant needs to perform write operations, such as posting comments, replying to comments, updating video metadata, or managing playlists.

1.  **Create OAuth 2.0 Client ID:**
    *   In the Google Cloud Console, go to "APIs & Services" > "Credentials".
    *   Click "Create Credentials" > "OAuth client ID".
    *   Select "Desktop application" as the application type.
    *   Give it a name (e.g., "YouTube MCP Desktop Client") and click "Create".
    *   Download the JSON file containing your client ID and client secret. Save this file securely.

2.  **Get OAuth Tokens (including Refresh Token):**
    The server includes a helper script to obtain the necessary OAuth tokens.
    *   Navigate to the `scripts` directory within your cloned `youtube-mcp-server` folder.
    *   Run the script:
        ```bash
        node scripts/get-oauth-tokens.js
        ```
    *   This script will open a browser window, prompting you to authenticate with your Google account and grant permissions to your application.
    *   After successful authentication, the script will display your `access_token` and, crucially, your `refresh_token`. **Copy and save your `refresh_token` securely.** This token allows the server to obtain new access tokens without requiring re-authentication.

3.  **Set Environment Variables:**
    Set the following environment variables with the values from your downloaded JSON file and the `get-oauth-tokens.js` script:
    *   **Windows (Command Prompt):**
        ```bash
        set YOUTUBE_CLIENT_ID=your_client_id
        set YOUTUBE_CLIENT_SECRET=your_client_secret
        set YOUTUBE_REFRESH_TOKEN=your_refresh_token
        ```
    *   **Windows (PowerShell):**
        ```powershell
        $env:YOUTUBE_CLIENT_ID="your_client_id"
        $env:YOUTUBE_CLIENT_SECRET="your_client_secret"
        $env:YOUTUBE_REFRESH_TOKEN="your_refresh_token"
        ```
    *   **Linux/macOS:**
        ```bash
        export YOUTUBE_CLIENT_ID=your_client_id
        export YOUTUBE_CLIENT_SECRET=your_client_secret
        export YOUTUBE_REFRESH_TOKEN=your_refresh_token
        ```
    *(Replace placeholders with your actual client ID, client secret, and refresh token.)*

## ⚙️ MCP Client Configuration

To use the YouTube MCP Server with your AI assistant, you need to configure your MCP-compatible client to connect to it. The configuration typically involves specifying the server's command and arguments, along with any required environment variables.

**Important:** Replace `/path/to/youtube-mcp-server/build/index.js` with the actual absolute path to your `build/index.js` file.

### Claude Desktop

For Claude Desktop, you'll typically edit a configuration file. The exact path may vary by OS.

**Example `claude_desktop_config.json` entry:**

```json
{
  "mcpServers": {
    "youtube": {
      "command": "node",
      "args": ["/path/to/youtube-mcp-server/build/index.js"],
      "env": {
        "YOUTUBE_API_KEY": "your_api_key_here"
        // OR for OAuth:
        // "YOUTUBE_CLIENT_ID": "your_client_id",
        // "YOUTUBE_CLIENT_SECRET": "your_client_secret",
        // "YOUTUBE_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

### Cursor

In Cursor, you can usually configure MCP servers directly through the settings UI or a configuration file.

**Example Cursor MCP configuration:**

```json
{
  "mcpServers": {
    "youtube": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/youtube-mcp-server/build/index.js"],
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
        // Add other tools if using OAuth
      ],
      "timeout": 120
    }
  }
}
```

### VS Code (with Kilo-Code Extension)

The Kilo-Code extension for VS Code uses a `mcp_settings.json` file. You can find its path in VS Code Settings under "Extensions" > "Kilo-Code".

**Example `mcp_settings.json` entry:**

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
        // Add other tools if using OAuth
      ],
      "timeout": 120
    }
  }
}
```
*(Remember to replace `C:/Users/your_username/AppData/Roaming/Kilo-Code/MCP/youtube-server/build/index.js` with the actual path to your server's executable.)*

**After configuring, restart your MCP client (Claude Desktop, Cursor, VS Code) to load the new server.**

## 📖 Usage Examples

Once configured, your AI assistant can use the YouTube MCP tools. Here are some common examples:

### Get Basic Video Information
```javascript
// Get video details (e.g., for "Never Gonna Give You Up")
use_mcp_tool("youtube", "videos_list", {
  part: "snippet,statistics",
  id: "dQw4w9WgXcQ"
})
```

### Search for Videos
```javascript
// Search for videos about "AI development tutorial"
use_mcp_tool("youtube", "search_list", {
  part: "snippet",
  q: "AI development tutorial",
  maxResults: 5,
  type: "video"
})
```

### Read Comments from a Video
```javascript
// Get top-level comments for a video
use_mcp_tool("youtube", "commentThreads_list", {
  part: "snippet",
  videoId: "dQw4w9WgXcQ",
  maxResults: 10
})
```

### Post a New Comment (Requires OAuth)
```javascript
// Post a new top-level comment on a video
use_mcp_tool("youtube", "commentThreads_insert", {
  part: "snippet",
  body: {
    snippet: {
      videoId: "dQw4w9WgXcQ",
      topLevelComment: {
        snippet: {
          textOriginal: "This is an automated comment from my AI assistant!"
        }
      }
    }
  }
})
```

### Reply to an Existing Comment (Requires OAuth)
```javascript
// Reply to a specific comment
use_mcp_tool("youtube", "comments_insert", {
  part: "snippet",
  body: {
    snippet: {
      parentId: "COMMENT_ID_TO_REPLY_TO", // Replace with the actual comment ID
      textOriginal: "Thanks for your question! Here's a detailed answer."
    }
  }
})
```

### Download Video Transcript
```javascript
// 1. First, list available captions for the video
use_mcp_tool("youtube", "captions_list", {
  part: "snippet",
  videoId: "dQw4w9WgXcQ"
})

// 2. Then, download the desired caption track (e.g., English SRT)
//    (Replace CAPTION_ID with an ID obtained from captions_list)
use_mcp_tool("youtube", "captions_download", {
  id: "CAPTION_ID",
  tfmt: "srt"
})
```

## 🛠️ Available Tools

### Read Operations (API Key or OAuth Required)
- `videos_list`: Returns a list of videos that match the API request parameters.
- `channels_list`: Returns a collection of zero or more channel resources that match the request criteria.
- `search_list`: Returns a collection of search results that match the query parameters specified in the API request.
- `commentThreads_list`: Returns a list of comment threads that match the API request parameters.
- `comments_list`: Returns a list of comments that match the API request parameters.
- `captions_list`: Returns a list of caption tracks that are associated with a specified video.
- `captions_download`: Downloads a caption track.
- `activities_list`: Returns a list of channel activity events.
- `guideCategories_list`: Returns a list of categories that can be associated with YouTube channels.
- `i18nLanguages_list`: Returns a list of application languages that the YouTube website supports.
- `i18nRegions_list`: Returns a list of content regions that the YouTube website supports.
- `videoAbuseReportReasons_list`: Retrieve a list of reasons that can be used to report abusive videos.
- `videoCategories_list`: Returns a list of categories that can be associated with YouTube videos.
- `playlists_list`: Returns a collection of playlists that match the API request parameters.
- `playlistItems_list`: Returns a collection of playlist items that match the API request parameters.
- `subscriptions_list`: Returns subscription resources that match the API request criteria.
- `members_list`: Lists members (formerly known as 'sponsors') for a channel.
- `membershipsLevels_list`: Returns a collection of zero or more membershipsLevel resources.

### Write Operations (OAuth 2.0 Required)
- `commentThreads_insert`: Creates a new top-level comment on a video or channel.
- `comments_insert`: Creates a reply to an existing comment.
- `videos_insert`: Uploads a video to YouTube and optionally sets the video's metadata.
- `videos_update`: Updates a video's metadata.
- `videos_delete`: Deletes a YouTube video.
- `videos_rate`: Add a like or dislike rating to a video or remove a rating from a video.
- `videos_reportAbuse`: Report a video for containing abusive content.
- `playlists_insert`: Creates a playlist.
- `playlists_update`: Modifies a playlist.
- `playlists_delete`: Deletes a playlist.
- `playlistItems_insert`: Adds a resource to a playlist.
- `playlistItems_update`: Modifies a playlist item.
- `playlistItems_delete`: Deletes a playlist item.
- `channels_update`: Updates a channel's metadata (brandingSettings and invideoPromotion).
- `channelBanners_insert`: Uploads a channel banner image to YouTube.
- `channelSections_list`: Returns a list of channelSection resources.
- `channelSections_insert`: Adds a channel section to the authenticated user's channel.
- `channelSections_update`: Updates a channel section.
- `channelSections_delete`: Deletes a channel section.
- `subscriptions_insert`: Adds a subscription for the authenticated user's channel.
- `subscriptions_delete`: Deletes a subscription.
- `comments_update`: Modifies a comment.
- `comments_delete`: Deletes a comment.
- `comments_setModerationStatus`: Sets the moderation status of one or more comments.
- `comments_markAsSpam`: Marks a comment as spam.

## 🔒 Security Best Practices

-   **API Key Restrictions:** Always restrict your API keys to specific APIs (e.g., YouTube Data API v3) and, if possible, to specific IP addresses or HTTP referrers.
-   **Environment Variables:** Never hardcode API keys, client IDs, client secrets, or refresh tokens directly into your code or commit them to version control. Use environment variables for sensitive information.
-   **OAuth Scopes:** When setting up OAuth, request only the necessary permissions (scopes) that your application requires. Avoid requesting broad access if not needed.
-   **Token Storage:** Store your OAuth refresh tokens securely. They grant long-term access to your YouTube account.
-   **Rate Limits:** Be mindful of YouTube Data API v3 quotas and implement proper error handling and exponential backoff for API requests to avoid hitting rate limits.

## 🔧 Troubleshooting Common Issues

-   **"Connection closed" Error:**
    -   **Cause:** The MCP server executable path in your client configuration is incorrect, or the server was not built successfully.
    -   **Fix:** Verify the absolute path to `build/index.js` in your client's MCP settings. Run `npm run build` in the `youtube-mcp-server` directory to ensure the server is compiled.
-   **"require is not defined" Error:**
    -   **Cause:** This server uses ES modules. If you encounter this, ensure your Node.js environment and build process are correctly handling ES modules.
    -   **Fix:** Ensure you are running Node.js v16 or higher. The `npm run build` command should handle the compilation correctly.
-   **"API Key Invalid" Error:**
    -   **Cause:** Your `YOUTUBE_API_KEY` is incorrect, expired, or the YouTube Data API v3 is not enabled for your Google Cloud project.
    -   **Fix:** Double-check your API key in the Google Cloud Console. Ensure the YouTube Data API v3 is enabled for the project associated with your API key.
-   **"OAuth Token Expired" Error:**
    -   **Cause:** While refresh tokens are long-lived, they can become invalid if revoked or if the associated Google account changes.
    -   **Fix:** Re-run the OAuth flow using `node scripts/get-oauth-tokens.js` to obtain a new refresh token and update your environment variables.
-   **"Captions Not Available" Error:**
    -   **Cause:** Not all YouTube videos have captions or auto-generated transcripts available.
    -   **Fix:** Always use the `captions_list` tool first to check for available caption tracks before attempting to download them with `captions_download`.

### Debugging the Server
If you encounter issues, you can run the server with debug logging enabled to get more detailed output:
```bash
DEBUG=* node /path/to/youtube-mcp-server/build/index.js
```
This will print verbose logs to the console, which can help diagnose problems.

## 🤝 Contributing

We welcome contributions to the YouTube MCP Server! If you have ideas for new features, improvements, or bug fixes, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and ensure they adhere to the project's coding standards.
4.  Add appropriate tests for your changes.
5.  Commit your changes (`git commit -m 'feat: Add new feature'`).
6.  Push to your branch (`git push origin feature/your-feature-name`).
7.  Open a Pull Request to the `main` branch of this repository.

## 📞 Support

For additional support, please visit [https://softreviewed.com/](https://softreviewed.com/).

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## 🙏 Acknowledgments

-   Built using the [Model Context Protocol](https://modelcontextprotocol.io/)
-   Powered by [YouTube Data API v3](https://developers.google.com/youtube/v3)