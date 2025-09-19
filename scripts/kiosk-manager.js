#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { config, loadConfig } from '../src/config.js';

// Check if running as root for X server
if (process.getuid && process.getuid() !== 0) {
    console.log('Kiosk manager needs root privileges to start X server.');
    console.log('Restarting with sudo...');
    try {
        execSync(`sudo ${process.argv.join(' ')}`, { stdio: 'inherit' });
        process.exit(0);
    } catch (err) {
        console.error('Failed to restart with sudo');
        process.exit(1);
    }
}

class KioskManager {
    constructor() {
        this.serverProcess = null;
        this.kioskProcess = null;
        this.xProcess = null;
        this.isShuttingDown = false;
    }

    async start() {
        await loadConfig();
        
        console.log('Starting Clarity Frame Kiosk Manager...');
        
        // Start X server first
        this.startX();
        
        // Start server
        this.startServer();
        
        // Wait for X and server to start, then start kiosk
        setTimeout(() => {
            this.startKiosk();
        }, 3000);

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

    startX() {
        console.log('Starting X server...');
        
        this.xProcess = spawn('X', [':0', '-nolisten', 'tcp'], {
            stdio: 'pipe',
            detached: false
        });

        this.xProcess.on('error', (err) => {
            console.error(`X server error: ${err.message}`);
        });

        this.xProcess.on('exit', (code) => {
            if (!this.isShuttingDown) {
                console.log(`X server exited with code ${code}, restarting...`);
                setTimeout(() => this.startX(), 2000);
            }
        });

        console.log('X server started on :0');
    }

    startKiosk() {
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
                    env: { ...process.env, DISPLAY: ':0' }
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

        if (this.xProcess) {
            this.xProcess.kill('SIGTERM');
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