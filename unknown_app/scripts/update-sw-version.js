#!/usr/bin/env node

/**
 * Updates the service worker cache version to force PWA updates on deployment
 * This script is run after the build process to update the dist/sw.js file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service worker file in dist folder
const swPath = path.join(__dirname, '../dist/sw.js');

// Generate a unique cache version based on timestamp and git commit (if available)
function generateCacheVersion() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  
  let gitHash = '';
  try {
    gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.log('Git not available, using timestamp only');
  }
  
  return gitHash ? `unknown-${gitHash}-${timestamp}` : `unknown-${timestamp}`;
}

// Check if dist folder exists
if (!fs.existsSync(swPath)) {
  console.error('❌ Error: dist/sw.js not found. Run "npm run build" first.');
  process.exit(1);
}

// Read the service worker file from dist
let swContent = fs.readFileSync(swPath, 'utf8');

// Generate new cache version
const newCacheVersion = generateCacheVersion();

// Replace the cache version
swContent = swContent.replace(
  /const CACHE_NAME = ['"]unknown-[^'"]*['"]/,
  `const CACHE_NAME = '${newCacheVersion}'`
);

// Write the updated service worker back to dist
fs.writeFileSync(swPath, swContent, 'utf8');

console.log(`✅ Service worker cache version updated to: ${newCacheVersion}`);
