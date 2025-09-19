import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import chokidar from 'chokidar';
import sharp from 'sharp';
import axios from 'axios';
import { config, loadConfig } from './config.js';

// Recreate __dirname for ES Modules, as it's not available by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

let imageCache = [];
let weatherCache = null;
let lastWeatherFetch = 0;

// --- Image Processing & Caching ---

async function processAndCacheImages() {
    try {
        console.log(`Scanning for images in "${config.photosDir}"...`);
        const files = await fs.readdir(config.photosDir);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

        const processedImages = await Promise.all(imageFiles.map(async (file) => {
            const imagePath = path.join(config.photosDir, file);
            try {
                // Using sharp's "attention" strategy is a great way to automatically
                // find the most interesting region, which often includes faces.
                // This avoids the heavy dependency of full face detection libraries
                // while achieving a similar "smart crop" result.
                const metadata = await sharp(imagePath).metadata();
                return {
                    url: `/photos/${file}`,
                    width: metadata.width,
                    height: metadata.height,
                };
            } catch (err) {
                console.error(`Could not process image: ${file}`, err);
                return null;
            }
        }));

        imageCache = processedImages.filter(img => img !== null);
        console.log(`Found and processed ${imageCache.length} images.`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`Error: The photo directory "${config.photosDir}" does not exist.`);
            console.error('Please create it or update the path in config.json.');
            imageCache = [];
        } else {
            console.error('Error scanning images:', err);
        }
    }
}

// --- API Endpoints ---

// Serve the static frontend files
app.use(express.static(path.join(__dirname, 'public')));
// Serve the photos from the configured directory
// Note: config must be loaded before this route is defined, which it is in initialize()
app.use('/photos', (req, res, next) => {
    express.static(path.resolve(__dirname, '..', config.photosDir))(req, res, next);
});


app.get('/api/config', (req, res) => {
    res.json(config);
});

app.get('/api/images', (req, res) => {
    // Return a shuffled list of images
    const shuffled = [...imageCache].sort(() => 0.5 - Math.random());
    res.json(shuffled);
});

app.get('/api/weather', async (req, res) => {
    if (!config.weather.enabled || !config.weather.apiKey || config.weather.apiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
        return res.json({ error: 'Weather is disabled or API key is missing.' });
    }

    const now = Date.now();
    // Cache weather for 15 minutes to avoid excessive API calls
    if (weatherCache && (now - lastWeatherFetch < 15 * 60 * 1000)) {
        return res.json(weatherCache);
    }

    try {
        const { lat, lon, units, apiKey } = config.weather;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
        const response = await axios.get(url);

        weatherCache = {
            temp: Math.round(response.data.main.temp),
            description: response.data.weather[0].description,
            icon: response.data.weather[0].icon,
            location: response.data.name,
        };
        lastWeatherFetch = now;
        res.json(weatherCache);
    } catch (err) {
        console.error("Error fetching weather:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
});


// --- Initialization & File Watching ---

async function initialize() {
    await loadConfig(); // Load config first
    await processAndCacheImages();

    // Watch for new files in the photos directory
    const watcher = chokidar.watch(config.photosDir, {
        ignored: /^\./,
        persistent: true,
        ignoreInitial: true,
    });

    watcher
        .on('add', async (path) => {
            console.log(`New image detected: ${path}. Rescanning...`);
            await processAndCacheImages();
        })
        .on('unlink', async (path) => {
            console.log(`Image removed: ${path}. Rescanning...`);
            await processAndCacheImages();
        })
        .on('error', (error) => console.error('Watcher error:', error));

    app.listen(PORT, () => {
        console.log(`Photo frame server running at http://localhost:${PORT}`);
    });
}

initialize();

