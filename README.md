<p align="center">
    <img src="https://github.com/shardeum/.github/raw/dev/shardeum-white-bg.png" alt="Shardeum Logo" width="70%">
</p>

<h2 align="center">Shardeum is an EVM based autoscaling blockchain</h2>

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Community](#community)
4. [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
5. [Usage](#usage)
    - [Running the Node](#running-the-node)
    - [Interacting with the Blockchain](#interacting-with-the-blockchain)
6. [Local Development](#local-development)
    - [Environment Setup](#environment-setup)
    - [Node.js and NVM](#nodejs-and-nvm)
    - [Rust Toolchain](#rust-toolchain)
    - [Build Essentials](#build-essentials)
    - [Project Initialization](#project-initialization)
7. [Configuration](#configuration)
    - [Easy Mode](#easy-mode)
    - [Advanced Mode](#advanced-mode)
8. [Running the Network](#running-the-network)
9. [Stopping the Network and Cleanup](#stopping-the-network-and-cleanup)
10. [Testing and Metamask](#testing-and-metamask)
    - [Install Metamask](#install-metamask)
    - [Adding Shardeum Network to Metamask](#adding-shardeum-network-to-metamask)
11. [Starting the JSON-RPC Server](#starting-the-json-rpc-server)
12. [Contributing](#contributing)
13. [License](#license)
14. [Contact](#contact)

## Introduction

Shardeum is built to solve the scalability and performance challenges faced by existing blockchain networks. By implementing sharding, Shardeum ensures that the network can handle a large number of transactions per second without compromising security or decentralization.

## Features

- **Scalability**: Sharding enables horizontal scalability, allowing the network to process more transactions as the number of nodes increases.
- **High Performance**: Optimized consensus mechanisms and efficient transaction handling ensure low latency and high throughput.
- **Security**: Advanced cryptographic techniques and robust consensus protocols provide a secure environment for transactions and smart contracts.
- **Decentralization**: Designed to be a truly decentralized network with no single point of failure.
- **Interoperability**: Supports Ethereum Virtual Machine (EVM) for compatibility with existing DApps and smart contracts.

## Community

For help, discussion about code, or any other conversation that would benefit from being searchable:

[Discuss Shardeum on GitHub](https://github.com/shardeum/shardeum/discussions)

For chatting with others using Shardeum:

[Join the Shardeum Discord Server](https://discord.com/invite/shardeum)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (version 18.16.1)
- npm (version 9.5.1)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/shardeum/shardeum.git
    cd shardeum
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Setup Environment Variables**:
    Copy the `.env_example` to `.env` and customize the settings as needed.
    ```bash
    cp .env_example .env
    ```

## Usage

### Running the Node

1. **Start the Node**:
    ```bash
    npm run start
    ```

2. **Run in Docker (Optional)**:
    ```bash
    docker build -t shardeum .
    docker run -d -p 8080:8080 shardeum
    ```

### Interacting with the Blockchain

- **Using CLI**:
    ```bash
    npm run cli
    ```

- **Using API**:
    The node exposes a REST API for interacting with the blockchain. Refer to the API documentation for more details.

## Local Development

### Environment Setup

To run a Shardeum network for local development, the instructions below will help you configure your machine to spin up local validator, archiver, and monitor servers.

### Node.js and NVM

Shardeum requires a specific version of Node.js version 18.16.1 and npm version 9.5.1. To manage multiple versions of Node.js, we recommend using the Node Version Manager (NVM). Follow these steps to install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Set NVM directory

```bash
export NVM_DIR="$HOME/.nvm"
```

Load NVM and its bash completion scripts by adding the following lines to your `.bashrc` or `.bash_profile`:

```bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

### Rust Toolchain

The networking code for the validator has been implemented in Rust as a node module to optimize the performance of Shardeum. You can install Rust using the following command:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Import the Rust environment variables by running the following command:

```bash
source "$HOME/.cargo/env"
```

To compile the code, ensure you have the correct Rust version installed. For compatibility reasons, use Rust version 1.74.1. You can install it by running:

```bash
rustup install 1.74.1
```

And set it as the default Rust version:

```bash
rustup default 1.74.1
```

### Build Essentials

For Linux:

```bash
sudo apt-get install build-essential
```

For MacOS:

```bash
brew install gcc
```

Before proceeding further, run the following commands to check the version of npm and node associated with your system.

```bash
node --version
18.16.1

npm --version
9.5.1
```

Make sure you have `node version 18.16.1` and `npm version 9.5.1` installed which is what most of our tech currently requires. If you are on the wrong version of Node, you can use the Node Version Manager (aka “nvm”) to get the correct one.

```bash
nvm use 18.16.1
```

### Node-gyp

node-gyp is a command-line tool that enables the compilation of native addon modules for Node.js. To ensure its proper functioning, it's essential to install node-gyp globally using npm. Additionally, configure the Python version. Follow these steps to install node-gyp and set the Python version:

```bash
npm i -g node-gyp         // Install node-gyp globally
npm config set python `which python3`   // Configure the Python version
npm config list                         // Verify the configuration
```

### Downloading Project Source Code

Now that the environment is setup, let’s install the project source code and switch to `dev` branch:

```bash
git clone https://github.com/shardeum/shardeum.git
cd server
git switch dev
```

#### Installing npm Dependencies

Once you are on the `dev` branch, install the local node modules to build the project by the following command:

```bash
npm ci
```

### Project Initialization

Now, you can initialize the project using the following command:

```bash
npm run prepare
```

### Installing the Shardus CLI

[Shardus](https://docs.shardus.com/docs/tools/shardus-cli-tool/README) is a command line tool from Shardus SDK that makes launching any Shardus protocol powered network easier:

```bash
npm install -g shardus
npm update @shardus/archiver
```

## Configuration

You have two ways to configure your local environment: easy mode or advanced mode.

### Easy Mode

You have the option to quickly configure your local environment by applying one of the patches located in the `/server/` folder, such as:

```bash
git apply debug-20-nodes.patch
```

For instance, `debug-20-nodes.patch` configures a network with debug settings, requiring 20 nodes to begin processing. These patches are designed to streamline the setup process for specific network configurations, eliminating the need for manual configuration to the following settings.

### Advanced Mode

The default settings included are intended to be used on the live network, so to configure the Shardeum network for local development, there are a few changes that need to be made:

1. **Configure Debug Mode:** Enabling debug mode ensures all network addresses have a designated amount of SHM. Open the `src/config/index.ts` file and set the following configuration settings:

```typescript
// src/config/index.ts
forceBogonFilteringOn: false,
mode: 'debug'
```

> Please note that setting `forceBogonFilteringOn` to false is only required when you are running all the nodes locally. By default, it is

 set to true for production network that prevents certain IP addresses from joining the network.

2. **Debug Flag Configuration:** Disabling `txBalancePreCheck` allows processing without balance checks for debugging purposes. For that, modify the following flags in `src/shardeum/shardeumFlags.ts` as follows:

```typescript
// src/shardeum/shardeumFlags.ts
txBalancePreCheck: false,
StakingEnabled: false
```

3. **Local Testing:** Additionally, for local testing, adjust the following settings. These changes allow nodes to get active in 30 seconds compared to 60 seconds and generate a new block every 3 seconds instead of 6 seconds, enhancing your local testing efficiency.

```typescript
// src/config/index.ts
cycleDuration: 30,

// src/shardeum/shardeumFlags.ts
blockProductionRate: 3,
```

After completing the above steps, compile again with `npm run prepare`.

## Running the Network

Now we’re ready to create the network from within the Shardeum validator repo:

```bash
shardus start 20
```

This command will start a Shardeum network of 20 nodes, 1 archiver server, and 1 monitor server exposed through port number 3000. You can inspect the nodes via the `shardus pm2 list` command.

For usage instructions and available options for the shardus command-line tool, run `shardus --help`.

## Stopping the Network and Cleanup

```bash
shardus stop && shardus clean && rm -rf instances
```
This command will stop the running network, clean up the associated resources, and remove the `instances` folder from the system.

## Testing and Metamask

### Install Metamask

Click [here](https://metamask.io/download/) to install the MetaMask extension on your browser.

### Adding Shardeum Network to Metamask

1. Open MetaMask and click the list of networks at the top, then select "Add Network".
2. Add Shardeum automatically or manually:

| Field                | Details                |
| -------------------- | ---------------------- |
| Network Name         | Shardeum Sphinx        |
| New RPC URL          | <http://localhost:8080> |
| Chain ID             | 8082                   |
| Currency Symbol      | SHM                    |
| Block Explorer URL   | <http://localhost:6001/> |

## Starting the JSON-RPC Server

A Shardeum validator node does not have an integrated RPC API, instead, we provide an Ethereum compatible JSON-RPC server that can be used to interact with the network, allowing the existing Ethereum tools to use Shardeum seamlessly. To start the JSON-RPC server, clone the repository:

```bash
git clone https://github.com/shardeum/json-rpc-server.git
```

Change directory to `json-rpc-server`, switch to the `dev` branch, and install the required dependencies:

```bash
cd json-rpc-server
git switch dev
npm install
```

If you want to modify the chainId or the port number, go to the `src/config.ts` file:

```typescript
chainId: 8082,
port: 8080
```

The RPC URL for using Metamask with Remix IDE and for running scripts is `http://localhost:port` (default: <http://localhost:8080>).

### Run the JSON-RPC Server

To run the server, use the command:

```bash
npm run start
```

You now have a fully functioning Shardeum network on your local machine! 🎉

## Additional Features and Configurations

### Sharding and State Manager

The Shardeum network uses a sophisticated sharding mechanism to ensure scalability and performance. Some key configuration settings include:

```typescript
sharding: {
  nodesPerConsensusGroup: process.env.nodesPerConsensusGroup ? parseInt(process.env.nodesPerConsensusGroup) : 10,
  nodesPerEdge: process.env.nodesPerEdge ? parseInt(process.env.nodesPerEdge) : 5,
  executeInOneShard: true,
},
stateManager: {
  accountBucketSize: 200,
  includeBeforeStatesInReceipts: true,
  useNewPOQ: true,
  forwardToLuckyNodes: false,
  removeStuckTxsFromQueue: false,
  removeStuckChallengedTXs: false,
}
```

### Debug Settings

Shardeum provides extensive debugging options to aid developers in troubleshooting and optimizing the network:

```typescript
debug: {
  startInFatalsLogMode: false,
  startInErrorLogMode: true,
  robustQueryDebug: false,
  fakeNetworkDelay: 0,
  disableSnapshots: true,
  countEndpointStart: -1,
  hashedDevAuth: '',
  devPublicKeys: {
    'a45f9a87e10d6dbd88c141e4fb293f96ab30441cbb77a4b04c577ba18d393505': DevSecurityLevel.Low,
    'b51124e6d01e0684ff2b86eac9433d585a17319f15b393c8e4426af19117f704': DevSecurityLevel.Medium,
    'c980f4dbdd40a9d334b3815b223e83d27e227892a109413e4bc114e8220bd281': DevSecurityLevel.High,
  },
  checkAddressFormat: true,
  enableCycleRecordDebugTool: false,
  enableScopedProfiling: false,
}
```

### Rate Limiting and Load Detection

To maintain network stability and performance, Shardeum implements rate limiting and load detection mechanisms:

```typescript
rateLimiting: {
  limitRate: true,
  loadLimit: {
    internal: 0.6,
    external: 0.6,
    txTimeInQueue: 0.6,
    queueLength: 0.6,
    executeQueueLength: 0.6,
  },
},
loadDetection: {
  queueLimit: 320,
  executeQueueLimit: 160,
  desiredTxTime: 15,
  highThreshold: 0.5,
  lowThreshold: 0.2,
}
```

## Contributing

Contributions are very welcome! See our [contribution guide](./CONTRIBUTING.md) for more information. Everyone interacting in our codebases, issue trackers, and any other form of communication, including chat rooms and mailing lists, is expected to follow our [code of conduct](./CODE_OF_CONDUCT.md) so we can all enjoy the effort we put into this project.

## License

This project is licensed under the terms of the MIT license. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions or support, please reach out to us at:
- Email: support@shardeum.org
- Twitter: [@Shardeum](https://twitter.com/Shardeum)
- Discord: [Join our community](https://discord.com/invite/shardeum)
