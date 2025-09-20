import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'config.json');

const defaultConfig = {
    port: parseInt(process.env.PORT) || 3000,
    photosDir: './photos',
    transitionTime: 1500,
    imageDisplayTime: 10000,
    croppingMode: 'attention', // 'attention', 'entropy', or 'none'
    weather: {
        enabled: true,
        apiKey: 'YOUR_OPENWEATHERMAP_API_KEY', // IMPORTANT: Get a free key from openweathermap.org
        lat: 38.7521, // Default to Sacramento area
        lon: -121.2880,
        units: 'imperial', // 'imperial' or 'metric'
    },
    clock: {
        enabled: true,
        format: 'h:mm A', // For formats, see date-fns documentation
        showDate: true,
        dateFormat: 'cccc, MMMM d', // e.g., "Monday, September 18"
    },
    albums: {
        enabled: true,
        showAlbumName: true,
        showPhotoDate: true,
        dateFormat: 'MMMM d, yyyy', // e.g., "September 18, 2023"
    },
    googlePhotos: {
        enabled: false,
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
        albumIds: [], // Array of album IDs to sync
        syncInterval: 3600000, // 1 hour in milliseconds
    },
};

// This single config object is exported. It will be mutated by loadConfig,
// and because imports are live bindings, all other modules will see the updates.
const config = {};

async function loadConfig() {
    try {
        await fs.access(CONFIG_PATH);
        const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
        const loadedConfig = JSON.parse(fileContent);

        // Deep merge defaults with the loaded config to ensure all keys exist
        const mergedConfig = {
             ...defaultConfig,
             ...loadedConfig,
             weather: { ...defaultConfig.weather, ...loadedConfig.weather },
             clock: { ...defaultConfig.clock, ...loadedConfig.clock },
             albums: { ...defaultConfig.albums, ...loadedConfig.albums },
             googlePhotos: { ...defaultConfig.googlePhotos, ...loadedConfig.googlePhotos },
        };

        // Mutate the exported config object
        Object.assign(config, mergedConfig);
        console.log('Configuration loaded from config.json');

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('config.json not found. Creating a new one with default values.');
            Object.assign(config, defaultConfig); // Use defaults if file doesn't exist
            try {
                await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 4));
                console.log('Successfully created config.json. Please edit it with your preferences.');
            } catch (writeError) {
                console.error('Failed to write default config file:', writeError);
            }
        } else {
            console.error('Failed to read config file:', error);
            Object.assign(config, defaultConfig); // Fallback to defaults on error
        }
    }
}

export { config, loadConfig };

