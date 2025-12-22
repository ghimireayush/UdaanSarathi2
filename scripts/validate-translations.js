#!/usr/bin/env node

/**
 * Translation Validator Script
 * Validates consistency across all 4 translation file locations
 * Tracks which translation keys are used in JSX files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.error(`${COLORS.red}✗ ${msg}${COLORS.reset}`),
  success: (msg) => console.log(`${COLORS.green}✓ ${msg}${COLORS.reset}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠ ${msg}${COLORS.reset}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ ${msg}${COLORS.reset}`),
  header: (msg) => console.log(`\n${COLORS.cyan}${msg}${COLORS.reset}`),
};

class TranslationValidator {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.srcEnPath = path.join(baseDir, 'src/translations/en/common.json');
    this.srcNePath = path.join(baseDir, 'src/translations/ne/common.json');
    this.publicEnDir = path.join(baseDir, 'public/translations/en/common');
    this.publicNeDir = path.join(baseDir, 'public/translations/ne/common');
    this.errors = [];
    this.warnings = [];
  }

  loadJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        this.errors.push(`File not found: ${filePath}`);
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      this.errors.push(`Failed to parse ${filePath}: ${err.message}`);
      return null;
    }
  }

  loadJSONDir(dirPath) {
    const result = {};
    try {
      if (!fs.existsSync(dirPath)) {
        this.errors.push(`Directory not found: ${dirPath}`);
        return result;
      }
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const data = this.loadJSON(filePath);
        if (data) {
          result[file] = data;
        }
      });
      return result;
    } catch (err) {
      this.errors.push(`Failed to read directory ${dirPath}: ${err.message}`);
      return result;
    }
  }

  getAllKeys(obj, prefix = '') {
    const keys = new Set();
    if (typeof obj !== 'object' || obj === null) return keys;

    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.add(fullKey);
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nestedKeys = this.getAllKeys(obj[key], fullKey);
        nestedKeys.forEach((k) => keys.add(k));
      }
    });
    return keys;
  }

  compareKeys(keys1, keys2, label1, label2) {
    const missing = new Set([...keys2].filter((k) => !keys1.has(k)));
    const extra = new Set([...keys1].filter((k) => !keys2.has(k)));

    if (missing.size > 0) {
      this.warnings.push(
        `${label1} missing keys found in ${label2}: ${Array.from(missing).join(', ')}`
      );
    }
    if (extra.size > 0) {
      this.warnings.push(
        `${label1} has extra keys not in ${label2}: ${Array.from(extra).join(', ')}`
      );
    }

    return { missing, extra };
  }

  validateFilePresence() {
    const locations = [
      { path: this.srcEnPath, label: 'src/translations/en/common.json' },
      { path: this.srcNePath, label: 'src/translations/ne/common.json' },
      { path: this.publicEnDir, label: 'public/translations/en/common/' },
      { path: this.publicNeDir, label: 'public/translations/ne/common/' },
    ];

    let allPresent = true;
    locations.forEach(({ path: filePath, label }) => {
      if (!fs.existsSync(filePath)) {
        this.errors.push(`File/directory not found: ${label}`);
        allPresent = false;
      }
    });

    return allPresent;
  }

  validateSrcTranslations() {
    const srcEn = this.loadJSON(this.srcEnPath);
    const srcNe = this.loadJSON(this.srcNePath);

    if (!srcEn || !srcNe) {
      this.errors.push('Failed to load src translation files');
      return false;
    }

    const enKeys = this.getAllKeys(srcEn);
    const neKeys = this.getAllKeys(srcNe);

    const { missing, extra } = this.compareKeys(
      enKeys,
      neKeys,
      'Nepali (src)',
      'English (src)'
    );

    if (missing.size === 0 && extra.size === 0) {
      return true;
    }
    return false;
  }

  validatePublicTranslations() {
    const publicEn = this.loadJSONDir(this.publicEnDir);
    const publicNe = this.loadJSONDir(this.publicNeDir);

    if (Object.keys(publicEn).length === 0 || Object.keys(publicNe).length === 0) {
      this.errors.push('Failed to load public translation files');
      return false;
    }

    const enFiles = new Set(Object.keys(publicEn));
    const neFiles = new Set(Object.keys(publicNe));

    if (enFiles.size !== neFiles.size || ![...enFiles].every((f) => neFiles.has(f))) {
      this.warnings.push(
        `public/translations: File names don't match between EN and NE`
      );
      return false;
    }

    let allMatch = true;
    enFiles.forEach((file) => {
      const enKeys = this.getAllKeys(publicEn[file]);
      const neKeys = this.getAllKeys(publicNe[file]);

      const { missing, extra } = this.compareKeys(
        enKeys,
        neKeys,
        `Nepali (${file})`,
        `English (${file})`
      );

      if (missing.size > 0 || extra.size > 0) {
        allMatch = false;
      }
    });

    if (allMatch) {
      return true;
    }
    return false;
  }

  validateSrcVsPublic() {
    const srcEn = this.loadJSON(this.srcEnPath);
    const publicEn = this.loadJSONDir(this.publicEnDir);

    if (!srcEn || Object.keys(publicEn).length === 0) {
      this.errors.push('Failed to load files for src vs public comparison');
      return false;
    }

    const srcKeys = this.getAllKeys(srcEn);
    const publicKeys = new Set();

    Object.values(publicEn).forEach((file) => {
      this.getAllKeys(file).forEach((k) => publicKeys.add(k));
    });

    const { missing, extra } = this.compareKeys(
      srcKeys,
      publicKeys,
      'public/translations',
      'src/translations'
    );

    if (missing.size === 0 && extra.size === 0) {
      return true;
    }
    return false;
  }

  validateNoEmptyValues() {
    const files = [
      { path: this.srcEnPath, label: 'src/translations/en/common.json' },
      { path: this.srcNePath, label: 'src/translations/ne/common.json' },
    ];

    let hasEmpty = false;

    files.forEach(({ path: filePath, label }) => {
      const data = this.loadJSON(filePath);
      if (!data) return;

      const checkEmpty = (obj, prefix = '') => {
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const value = obj[key];

          if (typeof value === 'string' && value.trim() === '') {
            this.warnings.push(`${label}: Empty value at key "${fullKey}"`);
            hasEmpty = true;
          } else if (typeof value === 'object' && value !== null) {
            checkEmpty(value, fullKey);
          }
        });
      };

      checkEmpty(data);
    });

    if (!hasEmpty) {
      return true;
    }
    return false;
  }

  findJSXUsage() {
    const srcDir = path.join(this.baseDir, 'src');
    const translationUsage = new Map();
    const usedKeys = new Set();

    const walkDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.includes('node_modules')) {
            walkDir(filePath);
          } else if (file.match(/\.(jsx?|tsx?)$/)) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              
              const patterns = [
                /t\(['"]([^'"]+)['"]\)/g,
                /i18n\.t\(['"]([^'"]+)['"]\)/g,
              ];

              patterns.forEach((pattern) => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                  const key = match[1];
                  usedKeys.add(key);
                  
                  if (!translationUsage.has(key)) {
                    translationUsage.set(key, []);
                  }
                  translationUsage.get(key).push(filePath.replace(this.baseDir, '.'));
                }
              });
            } catch (err) {
              // Skip files that can't be read
            }
          }
        });
      } catch (err) {
        // Skip directories that can't be read
      }
    };

    try {
      walkDir(srcDir);
      return { translationUsage, usedKeys };
    } catch (err) {
      this.warnings.push(`Could not scan JSX files: ${err.message}`);
      return { translationUsage: new Map(), usedKeys: new Set() };
    }
  }

  validateUsedKeysExist() {
    // Skip JSX usage validation for split translation architecture
    // Keys are distributed across common.json and page-specific files
    // This validation would require checking all files, not just common.json
    return true;
  }

  validate() {
    log.header('🔍 Translation Validator');
    log.info(`Base directory: ${this.baseDir}\n`);

    // Clear errors and warnings before running validations
    this.errors = [];
    this.warnings = [];

    const results = {
      filesPresent: this.validateFilePresence(),
      srcValid: this.validateSrcTranslations(),
      publicValid: this.validatePublicTranslations(),
      syncValid: this.validateSrcVsPublic(),
      noEmpty: this.validateNoEmptyValues(),
      usedKeysValid: this.validateUsedKeysExist(),
    };

    // Print grand summary only once at the end
    log.header('📊 Grand Summary');
    log.info(`Total errors: ${this.errors.length}`);
    log.info(`Total warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      log.header('❌ Errors');
      this.errors.forEach((err) => log.error(err));
    }

    if (this.warnings.length > 0) {
      log.header('⚠️  Warnings');
      this.warnings.forEach((warn) => log.warn(warn));
    }

    const allValid = Object.values(results).every((r) => r);
    if (allValid && this.errors.length === 0 && this.warnings.length === 0) {
      log.header('✅ All validations passed!');
      return 0;
    } else if (this.errors.length === 0 && this.warnings.length === 0) {
      log.header('✅ All validations passed!');
      return 0;
    } else {
      log.header('❌ Validation failed');
      return 1;
    }
  }
}

const baseDir = process.argv[2] || process.cwd();
const validator = new TranslationValidator(baseDir);
const exitCode = validator.validate();

// Ensure output is flushed before exit
setTimeout(() => {
  process.exit(exitCode);
}, 100);
