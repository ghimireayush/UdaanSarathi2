#!/usr/bin/env node

/**
 * Sync Translations Script
 * Copies translations from src/ to public/ directories
 * Maintains the same structure in both locations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, '..');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.log(`${COLORS.red}✗ ${msg}${COLORS.reset}`),
  success: (msg) => console.log(`${COLORS.green}✓ ${msg}${COLORS.reset}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠ ${msg}${COLORS.reset}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ ${msg}${COLORS.reset}`),
  header: (msg) => console.log(`\n${COLORS.cyan}${msg}${COLORS.reset}`),
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function syncTranslations() {
  log.header('🔄 Syncing Translations');

  const srcDir = path.join(baseDir, 'src/translations');
  const publicDir = path.join(baseDir, 'public/translations');

  const locales = ['en', 'ne'];
  let totalFiles = 0;
  let syncedFiles = 0;

  locales.forEach((locale) => {
    const srcLocaleDir = path.join(srcDir, locale);
    const publicLocaleDir = path.join(publicDir, locale);

    if (!fs.existsSync(srcLocaleDir)) {
      log.warn(`Source locale directory not found: ${srcLocaleDir}`);
      return;
    }

    log.info(`Syncing ${locale.toUpperCase()} translations...`);

    // Read all JSON files from src
    const files = fs.readdirSync(srcLocaleDir).filter((f) => f.endsWith('.json'));

    files.forEach((file) => {
      totalFiles++;
      const srcFile = path.join(srcLocaleDir, file);
      const publicFile = path.join(publicLocaleDir, 'common', file);

      try {
        copyFile(srcFile, publicFile);
        log.success(`  ${locale}/${file}`);
        syncedFiles++;
      } catch (err) {
        log.error(`  Failed to sync ${locale}/${file}: ${err.message}`);
      }
    });
  });

  log.header('📊 Summary');
  log.info(`Total files: ${totalFiles}`);
  log.info(`Synced files: ${syncedFiles}`);

  if (syncedFiles === totalFiles) {
    log.success('All translations synced successfully!');
    return 0;
  } else {
    log.error(`Failed to sync ${totalFiles - syncedFiles} files`);
    return 1;
  }
}

const exitCode = syncTranslations();
setTimeout(() => {
  process.exit(exitCode);
}, 100);
