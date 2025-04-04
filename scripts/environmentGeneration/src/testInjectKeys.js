import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Sample data
const mockDevKeysData = {
  testnet: ['devkey1', 'devkey2', 'devkey3'],
}

const mockMultisigKeysData = {
  testnet: {
    changeDevKey: ['multisigkey1', 'multisigkey2'],
    changeMultiSigKeyList: ['multisigkey2', 'multisigkey3'],
    initiateSecureAccountTransfer: ['multisigkey1', 'multisigkey3'],
    changeNonKeyConfigs: ['multisigkey1', 'multisigkey2', 'multisigkey3'],
  }
}

const DevSecurityLevel = {
  High: 3,
}

// Function to test key injection with a config file that already has a server object
function testInjectKeysIntoEnvironmentConfig(devKeysData, multisigKeysData) {
  console.log("\nTesting key injection into environment config files with existing server object...");
  
  // Correct path to the environments directory
  const environmentsDir = path.join(__dirname, "../../../environments");
  
  // Ensure the environments directory exists
  if (!fs.existsSync(environmentsDir)) {
    console.error(`Environment directory not found: ${environmentsDir}`);
    console.error("Please make sure the path to environments is correct");
    return;
  }

  // Only test with testnet
  const env = 'testnet';
  const configFilePath = path.join(environmentsDir, `${env}.config.json`);
  
  // Check if config file exists
  if (!fs.existsSync(configFilePath)) {
    console.warn(`Config file for ${env} does not exist: ${configFilePath}`);
    return;
  }
  
  console.log(`Processing ${env}.config.json`);
  
  try {
    // Make a backup of the original file
    const backupPath = path.join(environmentsDir, `${env}.config.backup.json`);
    fs.copyFileSync(configFilePath, backupPath);
    console.log(`Created backup of ${env}.config.json at ${backupPath}`);
    
    // Read current config
    const config = fs.readJsonSync(configFilePath);
    
    // Print the current config
    console.log("Current config:", JSON.stringify(config, null, 2));
    
    // Ensure server object exists
    if (!config.server) {
      console.log(`Creating server object in ${env}.config.json as it doesn't exist`);
      config.server = {};
    }
    
    // Ensure debug object exists in server
    if (!config.server.debug) {
      console.log(`Creating debug object in ${env}.config.json as it doesn't exist`);
      config.server.debug = {};
    }
    
    // Prepare dev keys object
    const devPublicKeys = {};
    devKeysData[env].forEach(key => {
      devPublicKeys[key] = DevSecurityLevel.High;
    });
    
    // Prepare multisig keys object
    const multisigKeys = {};
    // Extract all keys from all permission types for this environment
    const keys = new Set();
    Object.keys(multisigKeysData[env]).forEach(permissionType => {
      multisigKeysData[env][permissionType].forEach(key => keys.add(key));
    });
    // Convert to object with security level
    Array.from(keys).forEach(key => {
      multisigKeys[key] = 3; // Security level value
    });
    
    // Inject keys into config
    config.server.debug.devPublicKeys = devPublicKeys;
    config.server.debug.multisigKeys = multisigKeys;
    
    // Write updated config back to file
    fs.writeJsonSync(configFilePath, config, { spaces: 2 });
    
    console.log(`Updated ${env}.config.json with ${Object.keys(devPublicKeys).length} dev keys and ${Object.keys(multisigKeys).length} multisig keys`);
    
    // Read the updated config to verify
    const updatedConfig = fs.readJsonSync(configFilePath);
    console.log("Updated config:", JSON.stringify(updatedConfig, null, 2));
    
    console.log("\nTest completed successfully! Please check the backup file to restore if needed.");
  } catch (error) {
    console.error(`Error updating ${env}.config.json:`, error.message);
  }
}

// Function to test key injection with a config file that doesn't have a server object
function testInjectKeysIntoEmptyConfig(devKeysData, multisigKeysData) {
  console.log("\nTesting key injection into a config file without server object...");
  
  const environmentsDir = path.join(__dirname, "../../../environments");
  
  if (!fs.existsSync(environmentsDir)) {
    console.error(`Environment directory not found: ${environmentsDir}`);
    return;
  }
  
  // Create a temporary test config file
  const testConfigPath = path.join(environmentsDir, "test_empty.config.json");
  
  try {
    // Create an empty config
    const emptyConfig = {
      // No server object
      someOtherProperty: "test value"
    };
    
    // Write the empty config to a test file
    fs.writeJsonSync(testConfigPath, emptyConfig, { spaces: 2 });
    console.log("Created test config file without server object");
    
    // Print the current config
    console.log("Current empty config:", JSON.stringify(emptyConfig, null, 2));
    
    // Read the empty config
    let config = fs.readJsonSync(testConfigPath);
    
    // Ensure server object exists
    if (!config.server) {
      console.log(`Creating server object in empty config as it doesn't exist`);
      config.server = {};
    }
    
    // Ensure debug object exists in server
    if (!config.server.debug) {
      console.log(`Creating debug object in empty config as it doesn't exist`);
      config.server.debug = {};
    }
    
    // Prepare dev keys object
    const devPublicKeys = {};
    devKeysData.testnet.forEach(key => {
      devPublicKeys[key] = DevSecurityLevel.High;
    });
    
    // Prepare multisig keys object
    const multisigKeys = {};
    // Extract all keys from all permission types for this environment
    const keys = new Set();
    Object.keys(multisigKeysData.testnet).forEach(permissionType => {
      multisigKeysData.testnet[permissionType].forEach(key => keys.add(key));
    });
    // Convert to object with security level
    Array.from(keys).forEach(key => {
      multisigKeys[key] = 3; // Security level value
    });
    
    // Inject keys into config
    config.server.debug.devPublicKeys = devPublicKeys;
    config.server.debug.multisigKeys = multisigKeys;
    
    // Write updated config back to file
    fs.writeJsonSync(testConfigPath, config, { spaces: 2 });
    
    console.log(`Updated empty config with ${Object.keys(devPublicKeys).length} dev keys and ${Object.keys(multisigKeys).length} multisig keys`);
    
    // Read the updated config to verify
    const updatedConfig = fs.readJsonSync(testConfigPath);
    console.log("Updated empty config:", JSON.stringify(updatedConfig, null, 2));
    
    // Clean up - delete the test file
    fs.unlinkSync(testConfigPath);
    console.log("Cleaned up test file");
    
    console.log("\nEmpty config test completed successfully!");
  } catch (error) {
    console.error(`Error in empty config test:`, error.message);
    // Try to clean up even if there was an error
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  }
}

// Run the tests
testInjectKeysIntoEnvironmentConfig(mockDevKeysData, mockMultisigKeysData);
testInjectKeysIntoEmptyConfig(mockDevKeysData, mockMultisigKeysData); 