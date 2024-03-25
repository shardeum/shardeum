# Overview

Shardeum is a Ethereum Virtual Machine compatible Layer 1 platform that is fast, scalable, and transaction fees that are always below $0.01

It uses dynamic state sharding which minimizes transaction costs through efficient resource utilization, enhancing network scalability by automatically growing and shrinking the network to meet demand, and ensures decentralization and security​​. This allows Shardeum to achieve a balance among the three fundamental properties of security, scalability, and decentralization simultaneously.

# Developer Environment setup (Linux/MAC UNIX LIKE)

To use this repository, you need the following installed locally:

## NVM SetUp

* Install NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

> You can also checkout the [official documentation](https://github.com/nvm-sh/nvm?tab=readme-ov-file#important-notes) for more information.

* Set NVM directory

```bash
export NVM_DIR="$HOME/.nvm"
```

* (Optional) Load NVM and its bash completion scripts by adding the following lines to your `.bashrc` or `.bash_profile`:

```bash
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

## Rust Setup

* Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

* Source the Rust environment

```bash
source "$HOME/.cargo/env"
```

## Install build essentials

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

## Install node gyp and configure the Python version

node-gyp is a command-line tool that enables the compilation of native addon modules for Node.js. To ensure its proper functioning, it's essential to install node-gyp globally using npm. Additionally, configure the Python version. Follow these steps to install node-gyp and set the Python version:

```
npm i -g node-gyp         // Install node-gyp globally
npm config set python `which python3`   // Configure the Python version
npm config list                         // Verify the configuration
```

# Installing project source code

Now that the environment is setup, let’s install the project source code and switch to `dev` branch

```bash
git clone https://gitlab.com/shardeum/server
cd server
git switch dev
```

# Installing npm dependencies

Once you are on the `dev` branch, install the local node modules to build the project by the following command

```bash
npm ci
```

# Initializing project

Now, you can initialize the project using the following command

```bash
npm run prepare
```

# Installing Shardus globally

[Shardus](https://docs.shardus.com/docs/tools/shardus-cli-tool/README) is a command line tool from Shardus SDK that makes launching any Shardus protocol powered network easier

```bash
npm install -g shardus
npm update @shardus/archiver
```

# Local Configuration

Before starting the network, make sure to configure your local setup

1. **Configure Debug Mode:** Enabling debug mode ensures all network addresses have a designated amount of SHM. Open the `src/config/index.ts` file and set the following configuration settings:

```bash
// src/config/index.ts
forceBogonFilteringOn: false
mode: 'debug'
```

> Please note that setting `forceBogonFilteringOn` to false is only required when you are running all the nodes locally. By default, it is set to true for production network that prevents certain IP addresses from joining the network.

2. **Debug Flag Configuration:** Disabling txBalancePreCheck allows processing without balance checks for debugging purposes. For that, modify the following flags in `src/shardeum/shardeumFlags.ts` as follows:

```bash
// src/shardeum/shardeumFlags.ts
txBalancePreCheck: false
StakingEnabled: false
```

3. **Local Testing:** Additionally, for local testing, adjust the following settings, these changes allow nodes to get active in 30 seconds compared to 60 seconds and generates new block every 3 second instead of 6 seconds, enhancing your local testing efficiency.

```bash
// Local Testing Adjustments
// src/config/index.ts
cycleDuration: 30,

// Generate new block every 3s
// src/shardeum/shardeumFlags.ts
blockProductionRate: 3,
```

After completing the above steps, compile again with `npm run prepare`.

# Run Locally

Now we’re ready to create the network from within the Shardeum validator repo

```bash
shardus start 20
```

This command will start a Shardeum network of 20 nodes, 1 archiver server and 1 monitor server exposed through port number 3000. You can inspect the nodes via `shardus pm2 list` command.

> Please note for usage instructions and available options for the shardus command-line tool, you can use `shardus --help`

# Install Metamask

Click [here](https://metamask.io/download/). to install the MetaMask extension on your browser.

## Adding Shardeum Network to MetaMask

1. Open MetaMask and click the list of networks at the top, then select "Add Network".
2. Add Shardeum automatically or manually

| Field | Details |
| ---      | ---      |
| Network Name   | Shardeum Sphinx |
| New RPC URL | <http://localhost:8080> |
| Chain ID   | 8082 |
| Currency Symbol | SHM |
| Block Explorer URL (optional) | none or <http://localhost:6001/> |

# Starting RPC Server

A Shardeum validator node does not have an integrated RPC API and that is provided by a separate server. For starting the RPC server, clone the repository and follow the instructions

```bash
git clone https://gitlab.com/shardeum/json-rpc-server
```

Change directory to `json-rpc-server`, switch to `dev` branch and install the required dependencies

```bash
cd json-rpc-server
git switch dev
npm install
```

If you want to modify the chainId or the port number, go to `src/config.ts` file:

```bash
chainId: 8082
port: 8080
```

The RPC URL for using Metamask with Remix IDE and for running scripts is `http://localhost:port` (default: <http://localhost:8080>)

# Run the Server

To run the server, use the command

```bash
npm run start
```

You now have a fully functioning Shardeum network on your local machine! 🎉

# Contributing

Contributions are very welcome! See our [contribution guide](./CONTRIBUTING.md)for more information. Everyone interacting in our codebases, issue trackers, and any other form of communication, including chat rooms and mailing lists, is expected to follow our [code of conduct](./CODE_OF_CONDUCT.md) so we can all enjoy the effort we put into this project.
