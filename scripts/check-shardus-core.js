#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');

// Function to get the current installed commit
function getCurrentCommit() {
  try {
    const modulePath = path.join(__dirname, '..', 'node_modules', '@shardus', 'core');
    process.chdir(modulePath);
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    console.error('Error getting current commit:', error.message);
    return null;
  }
}

// Function to get the latest commit from dev branch
function getLatestDevCommit() {
  try {
    // Fetch the latest without modifying the working directory
    execSync('git fetch origin dev --quiet');
    return execSync('git rev-parse origin/dev').toString().trim();
  } catch (error) {
    console.error('Error getting latest dev commit:', error.message);
    return null;
  }
}

// Function to update package.json with the specific commit
function updatePackageJson(commit) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const package = require(packagePath);
  
  // Update the dependency to point to the specific commit
  package.dependencies['@shardus/core'] = `git+https://github.com/shardeum/shardus-core#${commit}`;
  
  // Write back to package.json with proper formatting
  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
}

// Function to print warning in red
function printWarning(message) {
  console.log('\x1b[31m%s\x1b[0m', message);
}

// Main function
async function main() {
  const currentCommit = getCurrentCommit();
  const latestCommit = getLatestDevCommit();

  if (!currentCommit || !latestCommit) {
    console.error('Failed to get commit information');
    process.exit(1);
  }

  console.log('Current installed commit:', currentCommit);
  console.log('Latest dev branch commit:', latestCommit);

  if (currentCommit !== latestCommit) {
    if (CHECK_ONLY) {
      printWarning('\n⚠️  WARNING: shardus-core Updates Available! ⚠️');
      printWarning('\nYour local shardus-core is behind the dev branch:');
      printWarning(`Current version:  ${currentCommit}`);
      printWarning(`Latest version:   ${latestCommit}`);
      printWarning('\nTo update, run:');
      printWarning('node scripts/check-shardus-core.js');
      printWarning('npm install\n');
      return;
    } else {
      console.log('Updates available! Updating package.json...');
      updatePackageJson(latestCommit);
      console.log('package.json updated. Run npm install to apply the changes.');
    }
  } else {
    console.log('Already on the latest commit!');
  }
}

main().catch(console.error); 