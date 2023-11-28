import { ecsign, ecrecover, bufferToHex, keccak256 } from "ethereumjs-util";

// import { ecrecover as lib } from "../server/src/utils/ecrecover/index.node";

// Sample private key (DO NOT use this private key for real transactions!)
const privateKey = Buffer.from(
  "4f3edf983ac636a65a842ce7c7d89d2b45a026e3db5b2e8913e202008b749c6d",
  "hex"
);

// Sample message
const message = "Hello, Ethereum!";

// Convert the message to a Buffer
const messageBuffer = Buffer.from(message);

// Hash the message buffer
const messageHash = keccak256(messageBuffer);

// Sign the message hash
const { v, r, s } = ecsign(messageHash, privateKey);

console.log(bufferToHex(messageHash), v, bufferToHex(r), bufferToHex(s));

// Recover the public key

let totalTime = 0;
const runs = 100;

for (let i = 0; i < runs; i++) {
  const startTime = process.hrtime();
  ecrecover(messageHash, v, r, s);
  const [seconds, nanoseconds] = process.hrtime(startTime);
  totalTime += seconds * 1000 + nanoseconds / 1e6; // convert to milliseconds
}

const averageTime = totalTime / runs;
console.log(`Average time per JS run: ${averageTime} ms`);