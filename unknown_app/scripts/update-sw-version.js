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
const indexPath = path.join(__dirname, '../dist/index.html');

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

// Replace the cache version with a more robust regex
const cacheNameRegex = /const CACHE_NAME = ['"][^'"]*['"]/;
const updatedContent = swContent.replace(
  cacheNameRegex,
  `const CACHE_NAME = '${newCacheVersion}'`
);

// Verify the replacement was successful
if (updatedContent === swContent || !updatedContent.includes(newCacheVersion)) {
  console.error('❌ Error: Failed to update cache version. The CACHE_NAME constant may not exist in sw.js');
  process.exit(1);
}

// Write the updated service worker back to dist
fs.writeFileSync(swPath, updatedContent, 'utf8');

// Also update index.html to add cache-busting parameter to service worker registration
if (!fs.existsSync(indexPath)) {
  console.error('❌ Error: dist/index.html not found.');
  process.exit(1);
}

let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add cache-busting parameter to service worker registration
// Replace: navigator.serviceWorker.register('./sw.js' or navigator.serviceWorker.register('./sw.js?v=...'
// With: navigator.serviceWorker.register('./sw.js?v=VERSION'
// Preserves the original quote type (single or double) and ensures quotes match
const swRegisterRegex = /(navigator\.serviceWorker\.register\()(['"])\.\/sw\.js(?:\?v=[^'"]*)?(\2)/;
const updatedIndexContent = indexContent.replace(
  swRegisterRegex,
  (match, openParen, quote) => {
    // Use the same quote type as the original (captured in group 2)
    return `${openParen}${quote}./sw.js?v=${newCacheVersion}${quote}`;
  }
);

// Verify the replacement was successful using a precise regex check
// The verification pattern matches the actual output format and uses backreference for quote matching
const escapedVersion = newCacheVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const verifyRegex = new RegExp(`navigator\\.serviceWorker\\.register\\((['"])\\.\\/sw\\.js\\?v=${escapedVersion}\\1`);
if (!verifyRegex.test(updatedIndexContent)) {
  console.error('❌ Error: Failed to update service worker registration in index.html');
  console.error('Expected to find: navigator.serviceWorker.register(\'./sw.js?v=' + newCacheVersion + '\') or with double quotes');
  process.exit(1);
}

// Write the updated index.html back to dist
fs.writeFileSync(indexPath, updatedIndexContent, 'utf8');

console.log(`✅ Service worker cache version updated to: ${newCacheVersion}`);
console.log(`✅ Service worker registration updated with cache-busting parameter`);
