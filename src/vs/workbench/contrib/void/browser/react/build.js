/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { execSync } from 'child_process';
import { spawn } from 'cross-spawn';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function doesPathExist(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.isFile();
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}

/*
 * This function finds `globalDesiredPath` given `localDesiredPath` and `currentPath`
 *
 * Diagram:
 *
 * ...basePath/
 * └── void/
 *     ├── ...currentPath/ (defined globally)
 *     └── ...localDesiredPath/ (defined locally)
 */
function findDesiredPathFromLocalPath(localDesiredPath, currentPath) {
    while (!doesPathExist(path.join(currentPath, localDesiredPath))) {
        const parentDir = path.dirname(currentPath);

        if (parentDir === currentPath) {
            return undefined;
        }

        currentPath = parentDir;
    }

    const globalDesiredPath = path.join(currentPath, localDesiredPath);
    return globalDesiredPath;
}

// Hack to refresh styles automatically
function saveStylesFile() {
    setTimeout(() => {
        try {
            const pathToCssFile = findDesiredPathFromLocalPath(
                './src/vs/workbench/contrib/void/browser/react/src2/styles.css',
                __dirname
            );

            if (pathToCssFile === undefined) {
                console.error('[scope-tailwind] Error finding styles.css');
                return;
            }

            const content = fs.readFileSync(pathToCssFile, 'utf8');
            fs.writeFileSync(pathToCssFile, content, 'utf8');
            console.log('[scope-tailwind] Force-saved styles.css');
        } catch (err) {
            console.error('[scope-tailwind] Error saving styles.css:', err);
        }
    }, 6000);
}

const SCOPE_TAILWIND_CMD = 'npx scope-tailwind ./src -o src2/ -s loophole-scope -c styles.css -p "loophole-"';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');

if (isWatch) {
    // Do an initial build if src2/ doesn't exist yet, instead of waiting for watcher to trigger
    if (!fs.existsSync('src2')) {
        try {
            console.log('🔨 Running initial scope-tailwind build to create src2 folder...');
            execSync(SCOPE_TAILWIND_CMD, { stdio: 'inherit' });
            console.log('✅ src2/ created successfully.');
        } catch (err) {
            console.error('❌ Error running initial scope-tailwind build:', err);
            process.exit(1);
        }
    }

    // Start scope-tailwind watcher via nodemon
    const scopeTailwindWatcher = spawn('npx', [
        'nodemon',
        '--watch', 'src',
        '--ext', 'ts,tsx,css',
        '--exec', SCOPE_TAILWIND_CMD,
    ]);

    // Start tsup watcher
    const tsupWatcher = spawn('npx', ['tsup', '--watch']);

    scopeTailwindWatcher.stdout.on('data', (data) => {
        console.log(`[scope-tailwind] ${data}`);
        if (data.toString().includes('styles.css')) {
            saveStylesFile();
        }
    });

    scopeTailwindWatcher.stderr.on('data', (data) => {
        console.error(`[scope-tailwind] ${data}`);
    });

    tsupWatcher.stdout.on('data', (data) => {
        console.log(`[tsup] ${data}`);
    });

    tsupWatcher.stderr.on('data', (data) => {
        console.error(`[tsup] ${data}`);
    });

    process.on('SIGINT', () => {
        scopeTailwindWatcher.kill();
        tsupWatcher.kill();
        process.exit();
    });

    console.log('🔄 Watchers started! Press Ctrl+C to stop.');

} else {
    console.log('📦 Building...');

    execSync(SCOPE_TAILWIND_CMD, { stdio: 'inherit' });
    execSync('npx tsup', { stdio: 'inherit' });

    console.log('✅ Build complete!');
}
