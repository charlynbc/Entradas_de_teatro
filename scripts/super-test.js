const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(WORKSPACE_ROOT, 'teatro-tickets-backend');
const FRONTEND_DIR = path.join(WORKSPACE_ROOT, 'baco-teatro-app');
const REPORT_FILE = path.join(WORKSPACE_ROOT, 'SUPER_TESTING_REPORT.md');

let reportContent = `# Super Testing Report
Date: ${new Date().toISOString()}

## Summary
`;

const results = {
    backend: { status: 'PENDING', details: [] },
    frontend: { status: 'PENDING', details: [] },
    codeQuality: { status: 'PENDING', details: [] }
};

function log(section, message, success = true) {
    const icon = success ? '✅' : '❌';
    const line = `${icon} [${section}] ${message}`;
    console.log(line);
    results[section].details.push(line);
    if (!success) results[section].status = 'FAILED';
}

async function checkBackend() {
    console.log('\n--- Testing Backend ---');
    try {
        // 1. Check dependencies
        if (!fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) {
            log('backend', 'node_modules not found. Installing...', true);
            execSync('npm install', { cwd: BACKEND_DIR, stdio: 'ignore' });
        }
        log('backend', 'Dependencies check passed');

        // 2. Start server
        const serverProcess = spawn('npm', ['start'], { 
            cwd: BACKEND_DIR,
            detached: false,
            stdio: 'pipe' // Capture output to detect when it's ready
        });

        let serverReady = false;
        
        // Wait for server to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                serverProcess.kill();
                reject(new Error('Server start timeout'));
            }, 15000);

            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                // console.log('[Server Output]', output); 
                if (output.includes('escuchando en')) {
                    clearTimeout(timeout);
                    serverReady = true;
                    resolve();
                }
            });

            serverProcess.stderr.on('data', (data) => {
                // console.error('[Server Error]', data.toString());
            });
        });

        log('backend', 'Server started successfully');

        // 3. Test Endpoints
        await testEndpoint('http://localhost:3000/health');
        await testEndpoint('http://localhost:3000/api');

        // Cleanup
        serverProcess.kill();
        log('backend', 'Server stopped');
        if (results.backend.status === 'PENDING') results.backend.status = 'PASSED';

    } catch (error) {
        log('backend', `Backend testing failed: ${error.message}`, false);
        results.backend.status = 'FAILED';
    }
}

function testEndpoint(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            if (res.statusCode === 200) {
                log('backend', `Endpoint ${url} returned 200 OK`);
                resolve();
            } else {
                log('backend', `Endpoint ${url} returned ${res.statusCode}`, false);
                reject(new Error(`Status ${res.statusCode}`));
            }
        }).on('error', (e) => {
            log('backend', `Endpoint ${url} error: ${e.message}`, false);
            reject(e);
        });
    });
}

function checkFrontend() {
    console.log('\n--- Testing Frontend ---');
    try {
        // 1. Check critical files
        const criticalFiles = ['App.js', 'app.json', 'package.json'];
        let allFilesExist = true;
        criticalFiles.forEach(file => {
            if (fs.existsSync(path.join(FRONTEND_DIR, file))) {
                log('frontend', `File ${file} exists`);
            } else {
                log('frontend', `File ${file} MISSING`, false);
                allFilesExist = false;
            }
        });

        // 2. Check dependencies (light check)
        if (fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) {
            log('frontend', 'node_modules exists');
        } else {
            log('frontend', 'node_modules missing (skipping install to save time/bandwidth)', false);
            // Not failing the whole test for this in this environment
        }

        if (allFilesExist && results.frontend.status === 'PENDING') results.frontend.status = 'PASSED';
    } catch (error) {
        log('frontend', `Frontend testing failed: ${error.message}`, false);
        results.frontend.status = 'FAILED';
    }
}

function scanCodeQuality() {
    console.log('\n--- Scanning Code Quality ---');
    
    function walkDir(dir, callback) {
        fs.readdirSync(dir).forEach(f => {
            let dirPath = path.join(dir, f);
            let isDirectory = fs.statSync(dirPath).isDirectory();
            if (isDirectory && !dirPath.includes('node_modules') && !dirPath.includes('.git')) {
                walkDir(dirPath, callback);
            } else {
                callback(path.join(dir, f));
            }
        });
    }

    let issuesFound = 0;
    const dirsToScan = [path.join(BACKEND_DIR), path.join(FRONTEND_DIR)];

    dirsToScan.forEach(rootDir => {
        if (!fs.existsSync(rootDir)) return;
        
        walkDir(rootDir, (filePath) => {
            if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
            
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(WORKSPACE_ROOT, filePath);

            // Check for conflict markers
            if (content.includes('<<<<<<< HEAD')) {
                log('codeQuality', `Merge conflict markers in ${relativePath}`, false);
                issuesFound++;
            }

            // Check for TODOs (info only)
            if (content.includes('TODO:')) {
                // log('codeQuality', `TODO found in ${relativePath}`, true); // Too noisy
            }
            
            // Check for console.log (warning)
            // if (content.includes('console.log')) {
            //     log('codeQuality', `console.log found in ${relativePath}`, true);
            // }
        });
    });

    if (issuesFound === 0) {
        log('codeQuality', 'No critical code issues found');
        results.codeQuality.status = 'PASSED';
    } else {
        results.codeQuality.status = 'WARNING';
    }
}

function generateReport() {
    reportContent += `
| Component | Status |
|-----------|--------|
| Backend   | ${results.backend.status} |
| Frontend  | ${results.frontend.status} |
| Code      | ${results.codeQuality.status} |

## Details

### Backend
${results.backend.details.join('\n')}

### Frontend
${results.frontend.details.join('\n')}

### Code Quality
${results.codeQuality.details.join('\n')}
`;

    fs.writeFileSync(REPORT_FILE, reportContent);
    console.log(`\nReport generated at ${REPORT_FILE}`);
}

async function run() {
    await checkBackend();
    checkFrontend();
    scanCodeQuality();
    generateReport();
}

run();
