import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { select, confirm } from '@inquirer/prompts';

// ==============================================================================
// Raspberry Pi Kiosk Setup Script (Node.js)
// ==============================================================================
// This script configures the Raspberry Pi for kiosk mode.
// It uses inquirer for an interactive prompt and chalk for colored output.
// ==============================================================================

// --- Configuration ---
const APP_NAME = "photo-frame";
const APP_DIR = process.cwd();
const USER_NAME = os.userInfo().username;

// Use 'npm' directly; systemd will resolve it from the user's PATH.
const NPM_COMMAND = 'npm';

// --- Templates ---

const getServiceFileContent = () => `[Unit]
Description=Node.js Photo Frame Application
After=network.target

[Service]
ExecStart=${NPM_COMMAND} start
WorkingDirectory=${APP_DIR}
Restart=always
RestartSec=10
User=${USER_NAME}
Environment=PATH=${process.env.PATH}
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;

const LXDE_AUTOSTART_DIR = path.join(os.homedir(), '.config', 'lxsession', 'LXDE-pi');
const AUTOSTART_FILE = path.join(LXDE_AUTOSTART_DIR, 'autostart');
const AUTOSTART_ADDITIONS = `# Disable screensaver and power management for the display
@xset s noblank
@xset s off
@xset -dpms

# Launch Chromium in kiosk mode pointing to the local photo frame server
@chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000`;

// --- Helper Functions ---
const log = {
    info: (msg) => console.log(chalk.blue(msg)),
    success: (msg) => console.log(chalk.green(msg)),
    warn: (msg) => console.log(chalk.yellow(msg)),
    error: (msg) => console.log(chalk.red(msg)),
    step: (msg) => console.log(chalk.cyan.bold(msg)),
};

/**
 * Executes a shell command with sudo. Throws an error if it fails.
 * @param {string} command The command to execute.
 */
const runSudo = (command) => {
    try {
        execSync(`sudo ${command}`, { stdio: 'inherit' });
    } catch (e) {
        log.error(`Failed to execute command: sudo ${command}`);
        throw e;
    }
};

/**
 * Removes lines from a file that match a start and end pattern.
 * @param {string} filePath
 * @param {string} startPattern
 */
async function removeBlockFromFile(filePath, startPattern) {
    try {
        let content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const startIndex = lines.findIndex(line => line.includes(startPattern));

        if (startIndex !== -1) {
            // Remove the block of 5 lines (comment + 4 commands)
            lines.splice(startIndex, 5);
            // Remove potential leading/trailing empty lines
            const newContent = lines.join('\n').replace(/^\s*\n|\s*\n$/g, '');
            await fs.writeFile(filePath, newContent, 'utf-8');
        }
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
            throw error;
        }
    }
}


// --- Main Functions ---

async function setup() {
    log.step('\n--- Starting Raspberry Pi Kiosk Setup ---');

    // 1. Create and install systemd service
    log.info('[1/2] Creating systemd service...');
    const serviceFileContent = getServiceFileContent();
    const serviceFilePath = `/etc/systemd/system/${APP_NAME}.service`;

    await fs.writeFile('/tmp/photo-frame.service', serviceFileContent);
    runSudo(`mv /tmp/photo-frame.service ${serviceFilePath}`);

    runSudo('systemctl daemon-reload');
    runSudo(`systemctl enable ${APP_NAME}.service`);
    runSudo(`systemctl start ${APP_NAME}.service`);
    log.success('      ...Systemd service created and enabled.');

    // 2. Configure autostart for Chromium kiosk
    log.info('[2/2] Configuring desktop autostart...');
    await fs.mkdir(LXDE_AUTOSTART_DIR, { recursive: true });

    // Clean up old entries before adding new ones
    await removeBlockFromFile(AUTOSTART_FILE, '# Disable screensaver');

    // Add the new kiosk mode entries
    await fs.appendFile(AUTOSTART_FILE, `\n${AUTOSTART_ADDITIONS}\n`);
    log.success('      ...Desktop autostart configured for kiosk mode.');

    log.step('\n--- Setup Complete! ---');
    log.info('The Node.js server is now running as a background service.');
    log.warn('To apply all changes and start in kiosk mode, please reboot.');

    const shouldReboot = await confirm({ message: 'Reboot now?' });
    if (shouldReboot) {
        log.info('Rebooting...');
        runSudo('reboot');
    }
}

async function undo() {
    log.step('\n--- Reverting Raspberry Pi Kiosk Setup ---');

    // 1. Remove systemd service
    log.info('[1/2] Removing systemd service...');
    runSudo(`systemctl stop ${APP_NAME}.service`);
    runSudo(`systemctl disable ${APP_NAME}.service`);
    runSudo(`rm /etc/systemd/system/${APP_NAME}.service`);
    runSudo('systemctl daemon-reload');
    log.success(`      ...Systemd service '${APP_NAME}' removed.`);

    // 2. Revert autostart configuration
    log.info('[2/2] Reverting desktop autostart configuration...');
    await removeBlockFromFile(AUTOSTART_FILE, '# Disable screensaver');
    log.success('      ...Kiosk mode entries removed from autostart file.');

    log.step('\n--- Undo Complete! ---');
    log.warn('To fully revert the changes, a reboot is recommended.');

    const shouldReboot = await confirm({ message: 'Reboot now?' });
    if (shouldReboot) {
        log.info('Rebooting...');
        runSudo('reboot');
    }
}


// --- Script Entry Point ---
async function main() {
    if (process.platform !== 'linux' || os.userInfo().uid !== 0) {
        log.error('This script must be run as root (using sudo) on a Linux system (like a Raspberry Pi).');
        log.warn('Please run it like this: sudo npm run pi-configure');
        process.exit(1);
    }

    const answer = await select({
        message: 'What would you like to do?',
        choices: [
            {
                name: 'Setup Kiosk Mode',
                value: 'setup',
                description: 'Configure the Pi to run the photo frame on boot.',
            },
            {
                name: 'Undo Kiosk Mode',
                value: 'undo',
                description: 'Remove the photo frame service and kiosk settings.',
            },
            {
                name: 'Exit',
                value: 'exit',
                description: 'Do nothing and exit the script.',
            },
        ],
    });

    switch (answer) {
        case 'setup':
            await setup();
            break;
        case 'undo':
            await undo();
            break;
        case 'exit':
            log.info('Exiting script.');
            break;
    }
}

main().catch(error => {
    log.error('\nAn unexpected error occurred:');
    console.error(error);
    process.exit(1);
});
