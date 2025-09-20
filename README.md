# Clarity Frame

A high-quality digital photo frame built with Node.js and PixiJS, designed for Raspberry Pi kiosk mode.

## Features

### 📸 Photo Display
- **Smart Cropping**: Uses Sharp's attention algorithm for optimal photo framing
- **Album Support**: Organize photos in folders, display album names
- **EXIF Date Display**: Shows when photos were taken
- **Smooth Transitions**: Configurable fade transitions between photos

### 🌤️ Weather Integration
- **OpenWeatherMap API**: Current weather display
- **Configurable Location**: Set your coordinates
- **Temperature & Conditions**: Shows current temp and weather description

### 🕐 Clock Display
- **Customizable Format**: 12/24 hour display options
- **Date Display**: Optional date with configurable format
- **Clean Typography**: Uses Inter font for readability

### 📱 Google Photos Sync
- **Automatic Sync**: Download photos from Google Photos albums
- **Album Organization**: Creates folders matching album names
- **Scheduled Updates**: Configurable sync intervals
- **High Quality Downloads**: 1920x1080 resolution

### 🖥️ Kiosk Mode
- **Managed Processes**: Handles X server, web server, and browser
- **Auto-restart**: Processes restart if they crash
- **SSH Management**: Control remotely via systemd service
- **Easy Installation**: One-command setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure settings:**
   Edit `src/config.json` with your preferences

3. **Add photos:**
   Place photos in `photos/` directory or subdirectories

4. **Start the server:**
   ```bash
   npm start
   ```

5. **View in browser:**
   Open `http://localhost:3000`

## Kiosk Setup (Raspberry Pi)

1. **Install kiosk service:**
   ```bash
   npm run kiosk:install
   ```

2. **Start kiosk mode:**
   ```bash
   npm run kiosk
   ```

3. **Manage via SSH:**
   ```bash
   sudo systemctl start clarity-frame-kiosk
   sudo systemctl status clarity-frame-kiosk
   ```

## Configuration

All settings are in `src/config.json`:

```json
{
  "port": 3000,
  "photosDir": "./photos",
  "transitionTime": 1500,
  "imageDisplayTime": 10000,
  "weather": {
    "enabled": true,
    "apiKey": "your-api-key",
    "lat": 38.7521,
    "lon": -121.2880
  },
  "albums": {
    "enabled": true,
    "showAlbumName": true,
    "showPhotoDate": true
  },
  "googlePhotos": {
    "enabled": false,
    "clientId": "your-client-id",
    "albumIds": ["album-id-1"]
  }
}
```

## Documentation

- [Google Photos Setup Guide](docs/google-photos-setup.md)
- [Kiosk Debug Commands](debug-kiosk.md)

## Commands

### Development
- `npm start` - Start web server
- `npm run pi-configure` - Configure Raspberry Pi

### Kiosk Management
- `npm run kiosk` - Start kiosk mode
- `npm run kiosk:stop` - Stop kiosk
- `npm run kiosk:status` - Check status
- `npm run kiosk:install` - Install systemd service

### Google Photos
- `npm run photos:list` - List available albums
- `npm run photos:sync` - Sync photos from Google

## Requirements

- Node.js 18+
- Sharp (for image processing)
- Chromium browser (for kiosk mode)
- X11 server (for display)

## License

MIT