import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { select, confirm } from '@inquirer/prompts';

// ==============================================================================
// Clarity Frame Kiosk Installer (Node.js)
// ==============================================================================
// This script installs and manages the Clarity Frame kiosk service.
// ==============================================================================

const APP_NAME = "clarity-frame-kiosk";
const APP_DIR = process.cwd();
const USER_NAME = os.userInfo().username;

const log = {
    info: (msg) => console.log(chalk.blue(msg)),
    success: (msg) => console.log(chalk.green(msg)),
    warn: (msg) => console.log(chalk.yellow(msg)),
    error: (msg) => console.log(chalk.red(msg)),
    step: (msg) => console.log(chalk.cyan.bold(msg)),
};

const runSudo = (command) => {
    try {
        execSync(`sudo ${command}`, { stdio: 'inherit' });
    } catch (e) {
        log.error(`Failed to execute command: sudo ${command}`);
        throw e;
    }
};

const getServiceFileContent = () => `[Unit]
Description=Clarity Frame Kiosk
After=graphical-session.target

[Service]
Type=simple
User=${USER_NAME}
Group=${USER_NAME}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node kiosk-manager.js start
ExecStop=/usr/bin/node kiosk-manager.js stop
Restart=always
RestartSec=10
Environment=DISPLAY=:0
Environment=NODE_ENV=production
Environment=PATH=${process.env.PATH}

[Install]
WantedBy=graphical-session.target`;

async function install() {
    log.step('\n--- Installing Clarity Frame Kiosk Service ---');

    // Make kiosk manager executable
    log.info('[1/3] Making kiosk manager executable...');
    await fs.chmod('scripts/kiosk-manager.js', 0o755);
    log.success('      ...Kiosk manager is now executable.');

    // Create and install systemd service
    log.info('[2/3] Creating systemd service...');
    const serviceFileContent = getServiceFileContent();
    const serviceFilePath = `/etc/systemd/system/${APP_NAME}.service`;

    await fs.writeFile('/tmp/clarity-frame-kiosk.service', serviceFileContent);
    runSudo(`mv /tmp/clarity-frame-kiosk.service ${serviceFilePath}`);
    log.success('      ...Service file created.');

    // Enable service
    log.info('[3/3] Enabling service...');
    runSudo('systemctl daemon-reload');
    runSudo(`systemctl enable ${APP_NAME}.service`);
    log.success('      ...Service enabled.');

    log.step('\n--- Installation Complete! ---');
    log.info('Usage:');
    log.info('  Start:  sudo systemctl start clarity-frame-kiosk');
    log.info('  Stop:   sudo systemctl stop clarity-frame-kiosk');
    log.info('  Status: sudo systemctl status clarity-frame-kiosk');
    log.info('  Logs:   sudo journalctl -u clarity-frame-kiosk -f');
    log.info('');
    log.info('Or use the manager directly:');
    log.info('  node scripts/kiosk-manager.js start');
    log.info('  node scripts/kiosk-manager.js stop');
    log.info('  node scripts/kiosk-manager.js status');
}

async function uninstall() {
    log.step('\n--- Uninstalling Clarity Frame Kiosk Service ---');

    log.info('[1/2] Stopping and disabling service...');
    try {
        runSudo(`systemctl stop ${APP_NAME}.service`);
        runSudo(`systemctl disable ${APP_NAME}.service`);
        log.success('      ...Service stopped and disabled.');
    } catch (e) {
        log.warn('      ...Service may not have been running.');
    }

    log.info('[2/2] Removing service file...');
    runSudo(`rm -f /etc/systemd/system/${APP_NAME}.service`);
    runSudo('systemctl daemon-reload');
    log.success('      ...Service file removed.');

    log.step('\n--- Uninstallation Complete! ---');
}

async function status() {
    log.step('\n--- Clarity Frame Kiosk Status ---');
    
    try {
        execSync(`systemctl is-active ${APP_NAME}.service`, { stdio: 'pipe' });
        log.success('✓ Service is active');
    } catch {
        log.error('✗ Service is not active');
    }

    try {
        execSync(`systemctl is-enabled ${APP_NAME}.service`, { stdio: 'pipe' });
        log.success('✓ Service is enabled');
    } catch {
        log.error('✗ Service is not enabled');
    }

    try {
        execSync('pgrep -f "node.*server.js"', { stdio: 'pipe' });
        log.success('✓ Server process is running');
    } catch {
        log.error('✗ Server process is not running');
    }

    try {
        execSync('pgrep -f "chromium.*localhost"', { stdio: 'pipe' });
        log.success('✓ Kiosk browser is running');
    } catch {
        log.error('✗ Kiosk browser is not running');
    }
}

async function main() {
    if (process.platform !== 'linux') {
        log.error('This script must be run on a Linux system.');
        process.exit(1);
    }

    const answer = await select({
        message: 'What would you like to do?',
        choices: [
            {
                name: 'Install Kiosk Service',
                value: 'install',
                description: 'Install the systemd service for kiosk management.',
            },
            {
                name: 'Uninstall Kiosk Service',
                value: 'uninstall',
                description: 'Remove the systemd service.',
            },
            {
                name: 'Check Status',
                value: 'status',
                description: 'Check if the kiosk service is running.',
            },
            {
                name: 'Exit',
                value: 'exit',
                description: 'Do nothing and exit.',
            },
        ],
    });

    switch (answer) {
        case 'install':
            const shouldInstall = await confirm({ message: 'This will require sudo privileges. Continue?' });
            if (shouldInstall) {
                await install();
            }
            break;
        case 'uninstall':
            const shouldUninstall = await confirm({ message: 'This will remove the kiosk service. Continue?' });
            if (shouldUninstall) {
                await uninstall();
            }
            break;
        case 'status':
            await status();
            break;
        case 'exit':
            log.info('Exiting.');
            break;
    }
}

main().catch(error => {
    log.error('\nAn unexpected error occurred:');
    console.error(error);
    process.exit(1);
});