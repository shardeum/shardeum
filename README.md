<p align="center">
  <img src="https://github.com/shardeum/.github/raw/dev/shardeum-white-bg.png" alt="Shardeum Logo" width="70%">
</p>

<p align="center">
  <strong>An EVM-based autoscaling blockchain platform</strong>
</p>

<p align="center">
  <a href="https://github.com/shardeum/shardeum/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <a href="https://discord.com/invite/shardeum"><img src="https://img.shields.io/discord/933959587462254612?logo=discord" alt="Discord"></a>
  <a href="https://x.com/Shardeum"><img src="https://img.shields.io/twitter/follow/Shardeum?style=social" alt="Twitter"></a>
</p>

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Running the Network Locally](#running-the-network-locally)
  - [Running the JSON-RPC Server](#running-the-json-rpc-server)
- [Testing with MetaMask](#testing-with-metamask)
- [Stopping and Cleaning Up](#stopping-and-cleaning-up)
- [Health Checks](#health-checks)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

## Introduction

Shardeum is an innovative EVM-compliant blockchain platform that leverages dynamic state sharding to achieve unprecedented scalability. By implementing a sharding model, Shardeum ensures faster processing times and lower transaction costs without compromising security or decentralization.

## Features

- **Scalability**: Horizontal scalability through sharding
- **High Performance**: Low latency and high throughput
- **Security**: Advanced cryptographic techniques and robust consensus protocols
- **Decentralization**: Truly decentralized network with no single point of failure
- **Interoperability**: EVM compatibility for existing DApps and smart contracts

## Getting Started

### Prerequisites

- Node.js (v18.19.1)
- npm (v10.2.4)
- Rust (v1.74.1)
- Docker (optional, for containerized deployment)

### Setting Up Your Environment

Shardeum requires specific versions of Nodejs, Rust and other build tools to run. 

We have detailed setup instructions [in this page](local-environment-setup.md) 

>[!IMPORTANT] 
> This is a crucial step, ensure your local environment is correctly set up before proceeding with the next steps

### Installation

1. Clone the repository:

```bash
git clone https://github.com/shardeum/shardeum.git
cd shardeum
```

2. Install dependencies:

```bash
npm ci
```

3. Network Configuration:

```bash
git apply debug-10-nodes.patch
```

Learn more about the different config options [here](local)

4. Compile project

```bash
npm run prepare
```

5. Install the Shardus CLI:

```bash
npm install -g shardus
npm update @shardus/archiver
```

### Managing shardus-core Updates

The project automatically checks for shardus-core updates before every `npm install`. If updates are available, you'll see a warning message.

To manually check for and apply updates to the shardus-core dependency:

```bash
# Check and update if needed
node scripts/check-shardus-core.js

# Check only (won't make any changes)
node scripts/check-shardus-core.js --check
```

This script will:
- Check your currently installed shardus-core commit
- Compare it with the latest commit on the dev branch
- In normal mode: Update package.json if a newer version is available
- In check mode (--check): Only display a warning if updates are available
- Exit with error code 1 in check mode if updates are needed (useful for CI/CD)

After updating, run `npm install` to apply the changes.

## Running the Network Locally

To start a local Shardeum network with 10 nodes, run:

```bash
shardus start 10
```

### Running the JSON-RPC Server

1. Clone the JSON-RPC server repository:

```bash
git clone https://github.com/shardeum/json-rpc-server.git
cd json-rpc-server
npm install
```

2. Start the server:

```bash
npm run start
```

The default RPC URL is `http://localhost:8080`.

## Testing with MetaMask

To test your local Shardeum network using MetaMask:

1. Install the [MetaMask extension](https://metamask.io/download/).
2. Add the Shardeum network to MetaMask:

- Network Name: Shardeum
- RPC URL: http://localhost:8080
- Chain ID: 8082
- Currency Symbol: SHM
- Block Explorer URL: http://localhost:6001/

3. Obtaining Test Tokens and Configuring the Genesis File: To receive SHM tokens for testing on your local Shardeum network, you need to add your wallet address to the [src/config/genesis.json](src/config/genesis.json) file. Open this file in a text editor and add an entry for your wallet address with the desired SHM balance like this:

```json
"YOUR-WALLET-ADDRESS": {
    "wei": "200000000000000000000000000"
},
```

## Stopping and Cleaning Up

To stop the network and clean up resources:

```bash
shardus stop && shardus clean && rm -rf instances
```

## Health Checks
Diagnostic endpoints to check the health of the node

- GET `/is-alive` this endpoint returns 200 if the server is running.
- GET `/is-healthy` currently the same as `/is-alive` but will be expanded.

## Contributing

We welcome contributions! Please see our [Contribution Guidelines](CONTRIBUTING.md) for more information. All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Community

- [GitHub Discussions](https://github.com/shardeum/shardeum/discussions)
- [Discord](https://discord.com/invite/shardeum)
- [X (formerly Twitter)](https://x.com/Shardeum)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
