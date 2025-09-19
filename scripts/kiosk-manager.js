#!/usr/bin/env node

import { spawn } from 'child_process';
import { config, loadConfig } from '../src/config.js';

class KioskManager {
    constructor() {
        this.serverProcess = null;
        this.kioskProcess = null;
        this.isShuttingDown = false;
    }

    async start() {
        await loadConfig();
        
        console.log('Starting Clarity Frame Kiosk Manager...');
        
        // Start server
        this.startServer();
        
        // Wait a moment for server to start, then start kiosk
        setTimeout(() => {
            this.startKiosk();
        }, 2000);

        // Handle shutdown gracefully
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    startServer() {
        console.log('Starting server...');
        this.serverProcess = spawn('node', ['src/server.js'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        this.serverProcess.on('exit', (code) => {
            if (!this.isShuttingDown) {
                console.log(`Server exited with code ${code}, restarting...`);
                setTimeout(() => this.startServer(), 1000);
            }
        });
    }

    startKiosk() {
        // Check if display is available
        if (!process.env.DISPLAY) {
            console.error('No DISPLAY environment variable set. Kiosk mode requires X11.');
            return;
        }

        console.log('Starting kiosk display...');
        
        const browsers = ['chromium-browser', 'google-chrome', 'firefox'];
        const url = `http://localhost:${config.port}`;
        const kioskArgs = [
            '--kiosk',
            '--no-first-run',
            '--disable-infobars',
            '--disable-session-crashed-bubble',
            '--disable-translate',
            '--disable-features=TranslateUI',
            '--autoplay-policy=no-user-gesture-required',
            '--no-sandbox',
            url
        ];

        for (const browser of browsers) {
            try {
                this.kioskProcess = spawn(browser, kioskArgs, {
                    stdio: ['ignore', 'pipe', 'pipe'],
                    env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' }
                });

                this.kioskProcess.stderr.on('data', (data) => {
                    console.error(`Kiosk stderr: ${data}`);
                });

                this.kioskProcess.on('error', (err) => {
                    if (err.code === 'ENOENT') {
                        console.log(`${browser} not found, trying next...`);
                        return;
                    }
                    console.error(`Kiosk error: ${err.message}`);
                });

                this.kioskProcess.on('exit', (code) => {
                    if (!this.isShuttingDown && code !== 0) {
                        console.log(`Kiosk exited with code ${code}, waiting before restart...`);
                        setTimeout(() => this.startKiosk(), 5000);
                    }
                });

                console.log(`Kiosk started with ${browser}`);
                return;
            } catch (err) {
                continue;
            }
        }

        console.error('No suitable browser found for kiosk mode');
    }

    shutdown() {
        if (this.isShuttingDown) return;
        
        console.log('\nShutting down Clarity Frame Kiosk Manager...');
        this.isShuttingDown = true;

        if (this.kioskProcess) {
            this.kioskProcess.kill('SIGTERM');
        }

        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
        }

        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
}

// CLI commands
const command = process.argv[2];

switch (command) {
    case 'start':
        new KioskManager().start();
        break;
    case 'stop':
        // Kill any existing processes
        spawn('pkill', ['-f', 'clarity-frame']);
        spawn('pkill', ['-f', 'chromium.*localhost']);
        console.log('Stopped kiosk processes');
        break;
    case 'status':
        // Check if processes are running
        const { execSync } = await import('child_process');
        try {
            execSync('pgrep -f "node.*server.js"', { stdio: 'pipe' });
            console.log('✓ Server is running');
        } catch {
            console.log('✗ Server is not running');
        }
        try {
            execSync('pgrep -f "chromium.*localhost"', { stdio: 'pipe' });
            console.log('✓ Kiosk is running');
        } catch {
            console.log('✗ Kiosk is not running');
        }
        break;
    default:
        console.log('Usage: node kiosk-manager.js [start|stop|status]');
        process.exit(1);
}