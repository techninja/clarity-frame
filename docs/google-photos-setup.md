# Google Photos Setup Guide

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Photos Library API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Photos Library API"
   - Click "Enable"

## 2. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Desktop application"
4. Name it (e.g., "Clarity Frame")
5. Download the JSON file

## 3. Configure Clarity Frame

1. Open `src/config.json`
2. Update the Google Photos section:
   ```json
   "googlePhotos": {
     "enabled": true,
     "clientId": "your-client-id-from-json",
     "clientSecret": "your-client-secret-from-json",
     "albumIds": [],
     "syncInterval": 3600000
   }
   ```

## 4. Find Album IDs

1. Run: `npm run photos:list`
2. Follow the OAuth flow (visit URL, enter code)
3. Copy the album IDs you want to sync
4. Add them to `config.json`:
   ```json
   "albumIds": ["album-id-1", "album-id-2"]
   ```

## 5. Test Sync

Run: `npm run photos:sync`

Photos will be downloaded to `photos/[Album Name]/` folders.

## Troubleshooting

- **"Authentication required"**: Complete OAuth flow first
- **"Album not found"**: Check album ID is correct
- **"Permission denied"**: Ensure Photos Library API is enabled
- **Token expired**: Delete `.google-photos-token.json` and re-authenticate