#!/usr/bin/env node

/**
 * Script to configure archiver information for a given environment
 * This script can either set (replace all) or add (append) archiver information
 * The script will automatically fetch the public key from the archiver
 * The script can also check if the current configuration matches what we would get from the specified archiver
 */

const fs = require('fs');
const path = require('path');

// Display usage information
function showUsage() {
  console.log('Usage: node configure-archiver.js [mode] [environment] [ip] [port]');
  console.log('');
  console.log('mode        - "set" to replace all existing archivers');
  console.log('            - "add" to append to existing ones');
  console.log('            - "check" to verify if current configuration matches the specified archiver');
  console.log('');
  console.log('Available environments:');
  console.log('  local    - Local development environment');
  console.log('  devnet   - Development network environment');
  console.log('  testnet  - Testnet (ITN) environment');
  console.log('  mainnet  - Mainnet environment');
  console.log('');
  console.log('ip         - IP address or domain name of the archiver');
  console.log('port       - Port number of the archiver');
  console.log('');
  console.log('Examples:');
  console.log('  node configure-archiver.js set testnet archiver.testnet.shardeum.org 4000');
  console.log('  node configure-archiver.js add testnet archiver2.testnet.shardeum.org 4000');
  console.log('  node configure-archiver.js check testnet 35.193.191.159 4000');
}

// Fetch archiver info and extract the public key
async function fetchPublicKey(ip, port) {
  console.log(`Fetching public key from archiver at ${ip}:${port}...`);
  
  try {
    const response = await fetch(`http://${ip}:${port}/nodeInfo`);
    
    if (!response.ok) {
      throw new Error(`Failed to connect to archiver at ${ip}:${port}. Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.publicKey) {
      throw new Error(`Could not find public key in archiver response: ${JSON.stringify(data)}`);
    }
    
    return data.publicKey;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

// Discover all archivers in the network
async function discoverArchivers(seedIp, seedPort) {
  let archivers = [];
  
  try {
    // Fetch public key from the seed archiver
    const seedPublicKey = await fetchPublicKey(seedIp, seedPort);
    
    // Add the seed archiver to our list
    archivers.push({
      ip: seedIp,
      port: parseInt(seedPort),
      publicKey: seedPublicKey
    });
    
    // Try to fetch the list of other archivers from the seed archiver
    console.log('Trying to fetch archivers from /archivers endpoint...');
    
    const response = await fetch(`http://${seedIp}:${seedPort}/archivers`);
    
    if (!response.ok) {
      console.log('Failed to connect to /archivers endpoint');
      console.log('Could not discover other archivers, using only the seed archiver');
      return archivers;
    }
    
    const data = await response.json();
    
    if (!data.activeArchivers || !Array.isArray(data.activeArchivers) || data.activeArchivers.length === 0) {
      console.log('No active archivers found in the response');
      console.log('Could not discover other archivers, using only the seed archiver');
      return archivers;
    }
    
    console.log(`Found ${data.activeArchivers.length} archivers from /archivers endpoint`);
    
    // Process each archiver in the array
    for (const archiver of data.activeArchivers) {
      const { ip, port, publicKey } = archiver;
      
      // Add this archiver to our list if it's not already there
      if (!archivers.some(a => a.publicKey === publicKey)) {
        archivers.push({
          ip,
          port: parseInt(port),
          publicKey
        });
        console.log(`Added archiver: ${ip}:${port} (${publicKey})`);
      }
    }
    
    console.log('Successfully discovered all archivers');
    return archivers;
  } catch (error) {
    console.error(`Error discovering archivers: ${error.message}`);
    
    if (archivers.length > 0) {
      console.log('Could not discover other archivers, using only the seed archiver');
      return archivers;
    }
    
    throw error;
  }
}

// Check if the current configuration matches what we would get from the specified archiver
async function checkConfiguration(configFile, ip, port) {
  try {
    // Read the configuration file
    let fileContent = fs.readFileSync(configFile, 'utf8');
    
    // Trim any whitespace to ensure valid JSON
    fileContent = fileContent.trim();
    
    // Parse the JSON
    const config = JSON.parse(fileContent);
    
    // Get the current archivers from the configuration
    const currentArchivers = config.server.p2p.existingArchivers || [];
    
    // Discover archivers from the specified archiver
    const discoveredArchivers = await discoverArchivers(ip, port);
    
    // Check if the current configuration matches the discovered archivers
    if (currentArchivers.length !== discoveredArchivers.length) {
      console.log(`Configuration mismatch: Current configuration has ${currentArchivers.length} archivers, but discovered ${discoveredArchivers.length} archivers.`);
      return false;
    }
    
    // Check if all discovered archivers are in the current configuration
    for (const discoveredArchiver of discoveredArchivers) {
      const match = currentArchivers.find(a => 
        a.publicKey === discoveredArchiver.publicKey && 
        a.ip === discoveredArchiver.ip && 
        a.port === discoveredArchiver.port
      );
      
      if (!match) {
        console.log(`Configuration mismatch: Discovered archiver ${discoveredArchiver.ip}:${discoveredArchiver.port} (${discoveredArchiver.publicKey}) is not in the current configuration.`);
        return false;
      }
    }
    
    // Check if all current archivers are in the discovered list
    for (const currentArchiver of currentArchivers) {
      const match = discoveredArchivers.find(a => 
        a.publicKey === currentArchiver.publicKey && 
        a.ip === currentArchiver.ip && 
        a.port === currentArchiver.port
      );
      
      if (!match) {
        console.log(`Configuration mismatch: Current archiver ${currentArchiver.ip}:${currentArchiver.port} (${currentArchiver.publicKey}) was not discovered.`);
        return false;
      }
    }
    
    console.log('Configuration check passed: Current configuration matches the discovered archivers.');
    return true;
  } catch (error) {
    console.error(`Error checking configuration: ${error.message}`);
    return false;
  }
}

// Update the configuration file
function updateConfigFile(configFile, archivers, mode) {
  try {
    // Read the configuration file
    let fileContent = fs.readFileSync(configFile, 'utf8');
    
    // Trim any whitespace to ensure valid JSON
    fileContent = fileContent.trim();
    
    // Parse the JSON
    const config = JSON.parse(fileContent);
    
    // Update the existingArchivers array based on the mode
    if (mode === 'set') {
      config.server.p2p.existingArchivers = archivers;
    } else if (mode === 'add') {
      if (!config.server.p2p.existingArchivers) {
        config.server.p2p.existingArchivers = [];
      }
      
      // Add new archivers that don't already exist
      for (const archiver of archivers) {
        if (!config.server.p2p.existingArchivers.some(a => a.publicKey === archiver.publicKey)) {
          config.server.p2p.existingArchivers.push(archiver);
        }
      }
    }
    
    // Write the updated configuration back to the file
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Error updating configuration file: ${error.message}`);
    console.error(`Try running: cat ${configFile} | jq . > ${configFile}.fixed && mv ${configFile}.fixed ${configFile}`);
    return false;
  }
}

// Main function
async function main() {
  // Check if required arguments were provided
  if (process.argv.length < 6) {
    showUsage();
    process.exit(1);
  }
  
  const mode = process.argv[2];
  const env = process.argv[3];
  const ip = process.argv[4];
  const port = process.argv[5];
  
  const configDir = 'config/environments';
  const configFile = path.join(configDir, `${env}.config.json`);
  
  // Validate mode
  if (mode !== 'set' && mode !== 'add' && mode !== 'check') {
    console.error('Error: Mode must be "set", "add", or "check"');
    showUsage();
    process.exit(1);
  }
  
  // Check if the specified environment config exists
  if (!fs.existsSync(configFile)) {
    console.error(`Error: Configuration file for environment '${env}' not found at ${configFile}`);
    showUsage();
    process.exit(1);
  }
  
  try {
    // Handle the different modes
    if (mode === 'check') {
      // Check if the current configuration matches what we would get from the specified archiver
      const isMatch = await checkConfiguration(configFile, ip, port);
      
      if (isMatch) {
        console.log('Configuration is up to date.');
        process.exit(0);
      } else {
        console.log('Configuration needs to be updated. Run with "set" mode to update it.');
        process.exit(1);
      }
    } else if (mode === 'set') {
      // Discover all archivers in the network
      const archivers = await discoverArchivers(ip, port);
      
      // Update the configuration file with all discovered archivers
      const success = updateConfigFile(configFile, archivers, 'set');
      
      if (success) {
        console.log(`Configuration file ${configFile} has been updated with all discovered archivers.`);
        console.log('You can now start a node with:');
        console.log(`LOAD_JSON_CONFIGS=${configFile} shardus start 1`);
      } else {
        console.error('Failed to update configuration file');
        process.exit(1);
      }
    } else {
      // If in add mode, proceed with adding a single archiver
      // Fetch the public key from the archiver
      const publicKey = await fetchPublicKey(ip, port);
      console.log(`Successfully fetched public key: ${publicKey}`);
      
      // Create the archiver information
      const archiver = {
        ip,
        port: parseInt(port),
        publicKey
      };
      
      // Update the configuration file
      const success = updateConfigFile(configFile, [archiver], 'add');
      
      if (success) {
        console.log(`Configuration file ${configFile} has been updated (added):`);
        console.log(`  IP: ${ip}`);
        console.log(`  Port: ${port}`);
        console.log(`  Public Key: ${publicKey}`);
        console.log('');
        console.log('You can now start a node with:');
        console.log(`LOAD_JSON_CONFIGS=${configFile} shardus start 1`);
      } else {
        console.error('Failed to update configuration file');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 