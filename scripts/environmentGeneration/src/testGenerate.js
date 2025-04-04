import fs from 'fs-extra';
import path from 'path';

// Mock DevSecurityLevel enum
const DevSecurityLevel = {
  Unauthorized: 0,
  Low: 1,
  Medium: 2,
  High: 3
};

// Mock environment data
const ENVIRONMENTS = ['local', 'devnet', 'testnet', 'stagenet', 'mainnet'];

// Mock keys data
const mockDevKeysData = {
  local: ['key1', 'key2', 'key3'],
  devnet: ['key1', 'key4'],
  testnet: ['key2', 'key5'],
  stagenet: ['key3', 'key6'],
  mainnet: ['key4', 'key7']
};

// Mock multisig keys data with permission types
const mockMultisigKeysData = {
  local: {
    changeDevKeyList: ['0x1234', '0x5678'],
    changeMultiSigKeyList: ['0x1234', '0x9ABC'],
    initiateSecureAccountTransfer: ['0x5678', '0xDEF0'],
    changeNonKeyConfigs: ['0x9ABC', '0xDEF0', '0x1234']
  },
  devnet: {
    changeDevKeyList: ['0x1234'],
    changeMultiSigKeyList: ['0x5678'],
    initiateSecureAccountTransfer: ['0x9ABC'],
    changeNonKeyConfigs: ['0xDEF0']
  },
  testnet: {
    changeDevKeyList: ['0x2345'],
    changeMultiSigKeyList: ['0x6789'],
    initiateSecureAccountTransfer: ['0xABCD'],
    changeNonKeyConfigs: ['0xEF01']
  },
  stagenet: {
    changeDevKeyList: ['0x3456'],
    changeMultiSigKeyList: ['0x789A'],
    initiateSecureAccountTransfer: ['0xBCDE'],
    changeNonKeyConfigs: ['0xF012']
  },
  mainnet: {
    changeDevKeyList: ['0x4567'],
    changeMultiSigKeyList: ['0x89AB'],
    initiateSecureAccountTransfer: ['0xCDEF'],
    changeNonKeyConfigs: ['0x0123']
  }
};

/**
 * @param {string[]} keys - Array of public keys
 * @returns {string} - JSON string of dev keys file content
 */
function generateDevKeysFile(keys) {
  const content = {
    devPublicKeys: keys.reduce((acc, key) => {
      acc[key] = DevSecurityLevel.High;
      return acc;
    }, {})
  };
  return JSON.stringify(content, null, 2);
}

/**
 * @param {string[]} keys - Array of public keys
 * @returns {string} - JSON string of multisig keys file content
 */
function generateMultisigKeysFile(keys) {
  const content = {
    multisigKeys: keys.reduce((acc, key) => {
      acc[key] = DevSecurityLevel.High;
      return acc;
    }, {})
  };
  return JSON.stringify(content, null, 2);
}

/**
 * Generate dev keys files
 * @param {Object} devKeysData - Dev keys data
 */
function generateDevKeysFiles(devKeysData) {
  console.log("\nGenerating dev keys files...");
  
  const devKeysDir = path.join(process.cwd(), "test-output", "devkeys");
  fs.ensureDirSync(devKeysDir);

  for (const env of ENVIRONMENTS) {
    const keys = devKeysData[env];
    
    fs.writeFileSync(
      path.join(devKeysDir, `${env}.devKeys.json`),
      generateDevKeysFile(keys),
      "utf-8"
    );
    console.log(`Generated ${env}.devKeys.json with ${keys.length} keys`);
  }
}

/**
 * Generate multisig keys files
 * @param {Object} multisigKeysData - Multisig keys data
 */
function generateMultisigKeysFiles(multisigKeysData) {
  console.log("\nGenerating multisig keys files...");
  
  const multisigKeysDir = path.join(process.cwd(), "test-output", "multisigKeys");
  fs.ensureDirSync(multisigKeysDir);

  for (const env of ENVIRONMENTS) {
    // Extract all keys from all permission types for this environment
    const keys = new Set();
    
    // Collect all keys from various permission types
    Object.keys(multisigKeysData[env]).forEach(permissionType => {
      multisigKeysData[env][permissionType].forEach(key => keys.add(key));
    });
    
    // Convert to array and generate file
    const keyArray = Array.from(keys);
    
    fs.writeFileSync(
      path.join(multisigKeysDir, `${env}.MultisigKeys.json`),
      generateMultisigKeysFile(keyArray),
      "utf-8"
    );
    console.log(`Generated ${env}.MultisigKeys.json with ${keyArray.length} keys`);
  }
}

// Create test-output directory
const testOutputDir = path.join(process.cwd(), "test-output");
fs.ensureDirSync(testOutputDir);
fs.emptyDirSync(testOutputDir);

// Run the tests
generateDevKeysFiles(mockDevKeysData);
generateMultisigKeysFiles(mockMultisigKeysData);

console.log("\nTest completed successfully!"); 