const crypto = require('@shardus/crypto-utils');

// Generate a random keypair
const keypair = crypto.generateKeypair();

// Print the generated keypair to the console
console.log('Public Key:', keypair.publicKey);
console.log('Secret Key:', keypair.secretKey);