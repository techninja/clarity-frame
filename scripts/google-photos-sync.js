#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { config, loadConfig } from '../src/config.js';

class GooglePhotosSync {
    constructor() {
        this.oauth2Client = null;
        this.photos = null;
    }

    async init() {
        await loadConfig();
        
        if (!config.googlePhotos.enabled) {
            console.log('Google Photos sync is disabled');
            return false;
        }

        this.oauth2Client = new google.auth.OAuth2(
            config.googlePhotos.clientId,
            config.googlePhotos.clientSecret,
            'urn:ietf:wg:oauth:2.0:oob'
        );

        this.photos = google.photoslibrary({ version: 'v1', auth: this.oauth2Client });
        return true;
    }

    async authenticate() {
        const tokenPath = path.join(process.cwd(), '.google-photos-token.json');
        
        try {
            const token = JSON.parse(await fs.readFile(tokenPath, 'utf8'));
            this.oauth2Client.setCredentials(token);
            return true;
        } catch (err) {
            console.log('No existing token found. Starting OAuth flow...');
            return await this.getNewToken(tokenPath);
        }
    }

    async getNewToken(tokenPath) {
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/photoslibrary.readonly']
        });

        console.log('Authorize this app by visiting this url:', authUrl);
        console.log('Enter the code from that page here:');
        
        // In a real implementation, you'd prompt for input
        // For now, just return false to indicate manual setup needed
        return false;
    }

    async downloadImage(url, filepath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filepath);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', reject);
        });
    }

    async syncAlbum(albumId) {
        try {
            // Get album info
            const albumResponse = await this.photos.albums.get({ albumId });
            const albumTitle = albumResponse.data.title;
            
            console.log(`Syncing album: ${albumTitle}`);
            
            // Create album directory
            const albumDir = path.join(config.photosDir, albumTitle);
            await fs.mkdir(albumDir, { recursive: true });

            // Get media items from album
            const mediaResponse = await this.photos.mediaItems.search({
                requestBody: {
                    albumId: albumId,
                    pageSize: 100
                }
            });

            const mediaItems = mediaResponse.data.mediaItems || [];
            
            for (const item of mediaItems) {
                const filename = `${item.id}.${item.filename.split('.').pop()}`;
                const filepath = path.join(albumDir, filename);
                
                // Check if file already exists
                try {
                    await fs.access(filepath);
                    continue; // Skip if exists
                } catch {
                    // File doesn't exist, download it
                }

                const downloadUrl = `${item.baseUrl}=w1920-h1080`;
                console.log(`Downloading: ${item.filename}`);
                await this.downloadImage(downloadUrl, filepath);
            }
            
            console.log(`Synced ${mediaItems.length} photos from ${albumTitle}`);
        } catch (err) {
            console.error(`Error syncing album ${albumId}:`, err.message);
        }
    }

    async syncAll() {
        if (!await this.init()) return;
        if (!await this.authenticate()) {
            console.log('Authentication required. Run with --auth flag first.');
            return;
        }

        console.log('Starting Google Photos sync...');
        
        for (const albumId of config.googlePhotos.albumIds) {
            await this.syncAlbum(albumId);
        }
        
        console.log('Sync complete!');
    }

    async listAlbums() {
        if (!await this.init()) return;
        if (!await this.authenticate()) return;

        const response = await this.photos.albums.list({ pageSize: 50 });
        const albums = response.data.albums || [];
        
        console.log('Available albums:');
        albums.forEach(album => {
            console.log(`ID: ${album.id}`);
            console.log(`Title: ${album.title}`);
            console.log(`Photos: ${album.mediaItemsCount}`);
            console.log('---');
        });
    }
}

const command = process.argv[2];
const sync = new GooglePhotosSync();

switch (command) {
    case 'sync':
        sync.syncAll();
        break;
    case 'list':
        sync.listAlbums();
        break;
    case 'auth':
        console.log('Manual OAuth setup required - see Google Photos API documentation');
        break;
    default:
        console.log('Usage: node google-photos-sync.js [sync|list|auth]');
}