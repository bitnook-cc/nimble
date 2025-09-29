#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VAULT_ROOT = join(__dirname, '..');
const CONTENT_DIR = join(VAULT_ROOT, 'src', 'content');
const TEMP_DIR = join(VAULT_ROOT, 'temp-vault-content');

// Configuration - can be overridden by environment variables
const VAULT_CONTENT_REPO = process.env.VAULT_CONTENT_REPO || '/Users/six/prototype/nimble-vault';
const VAULT_CONTENT_BRANCH = process.env.VAULT_CONTENT_BRANCH || 'main';

function log(message) {
  console.log(`[vault-content] ${message}`);
}

function cleanupTemp() {
  if (existsSync(TEMP_DIR)) {
    log('Cleaning up temporary directory...');
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

function fetchContent() {
  try {
    log('Starting vault content fetch...');
    
    // Content sync is disabled - using placeholder content
    log('Content sync disabled - using placeholder content structure');
    return;
    
    // Clean up any existing temp directory
    cleanupTemp();
    
    // Check if content already exists
    if (existsSync(CONTENT_DIR) && existsSync(join(CONTENT_DIR, 'docs'))) {
      log('Content already exists, skipping fetch');
      return;
    }
    
    // Handle different source types
    if (VAULT_CONTENT_REPO.startsWith('http') || VAULT_CONTENT_REPO.startsWith('git@')) {
      // External git repository
      log(`Cloning vault content from ${VAULT_CONTENT_REPO}...`);
      execSync(`git clone --depth 1 --branch ${VAULT_CONTENT_BRANCH} "${VAULT_CONTENT_REPO}" "${TEMP_DIR}"`, {
        stdio: 'inherit'
      });
    } else {
      // Local repository path
      log(`Copying vault content from local repository: ${VAULT_CONTENT_REPO}...`);
      if (!existsSync(VAULT_CONTENT_REPO)) {
        throw new Error(`Local vault content repository not found: ${VAULT_CONTENT_REPO}`);
      }
      execSync(`cp -r "${VAULT_CONTENT_REPO}" "${TEMP_DIR}"`, {
        stdio: 'inherit'
      });
    }
    
    // Check if vault-content subdirectory exists
    const vaultContentPath = join(TEMP_DIR, 'vault-content', 'content');
    const directContentPath = join(TEMP_DIR, 'content');
    
    let sourcePath;
    if (existsSync(vaultContentPath)) {
      sourcePath = vaultContentPath;
      log('Found content in vault-content/content subdirectory');
    } else if (existsSync(directContentPath)) {
      sourcePath = directContentPath;
      log('Found content in content subdirectory');
    } else {
      throw new Error('No content directory found in vault repository');
    }
    
    // Copy content to vault src directory
    log('Copying content to vault...');
    execSync(`cp -r "${sourcePath}" "${CONTENT_DIR}"`, {
      stdio: 'inherit'
    });
    
    // Count files for verification
    const fileCount = execSync(`find "${CONTENT_DIR}" -name "*.md" | wc -l`, {
      encoding: 'utf-8'
    }).trim();
    
    log(`Successfully fetched ${fileCount} markdown files`);
    
  } catch (error) {
    log(`Error fetching vault content: ${error.message}`);
  } finally {
    // Clean up temp directory
    cleanupTemp();
  }
}

// Main execution
fetchContent();