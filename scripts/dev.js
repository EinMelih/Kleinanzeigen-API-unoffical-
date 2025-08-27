#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(color, prefix, message) {
    console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

function logServer(message) {
    log(colors.blue, 'SERVER', message);
}

function logWeb(message) {
    log(colors.green, 'WEB', message);
}

function logInfo(message) {
    log(colors.cyan, 'INFO', message);
}

function logError(message) {
    log(colors.red, 'ERROR', message);
}

// Start server
logInfo('Starting development environment...');

// Start TypeScript server
const serverProcess = spawn('npx', ['ts-node', 'src/server/server.ts'], {
    stdio: 'pipe',
    shell: true
});

serverProcess.stdout.on('data', (data) => {
    logServer(data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
    logServer(data.toString().trim());
});

// Start web development server
const webProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
    cwd: path.join(process.cwd(), 'web')
});

webProcess.stdout.on('data', (data) => {
    logWeb(data.toString().trim());
});

webProcess.stderr.on('data', (data) => {
    logWeb(data.toString().trim());
});

// Handle process termination
process.on('SIGINT', () => {
    logInfo('Shutting down development environment...');
    serverProcess.kill('SIGTERM');
    webProcess.kill('SIGTERM');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logInfo('Shutting down development environment...');
    serverProcess.kill('SIGTERM');
    webProcess.kill('SIGTERM');
    process.exit(0);
});

serverProcess.on('close', (code) => {
    if (code !== 0) {
        logError(`Server process exited with code ${code}`);
    }
});

webProcess.on('close', (code) => {
    if (code !== 0) {
        logError(`Web process exited with code ${code}`);
    }
});

logInfo('Press Ctrl+C to stop both servers');
