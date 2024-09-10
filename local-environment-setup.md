# Local Development Environment Guide for Shardeum

This guide provides detailed instructions for setting up a local development environment for Shardeum.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Node.js and NVM](#nodejs-and-nvm)
- [Rust Toolchain](#rust-toolchain)
- [Build Essentials](#build-essentials)
- [Project Setup](#project-setup)
- [Network Configuration](#network-configuration)
  - [Automatic Mode](#automatic-mode)
  - [Manual Mode](#manual-mode)
- [Running the Network](#running-the-network)
- [Stopping and Cleaning Up](#stopping-and-cleaning-up)


## Environment Setup

To run a Shardeum network for local development, you need to configure your machine to spin up local validator, archiver, and monitor servers.

## Node.js and NVM

Shardeum requires Node.js version 18.19.1 and npm version 10.2.4. We recommend using Node Version Manager (NVM) to manage multiple Node.js versions.

1. Install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
2. Set NVM directory:

```bash
export NVM_DIR="$HOME/.nvm"
```
3. Add the following to your `.bashrc` or `.bash_profile`:

```bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```
4. Install and use the correct Node.js version

```bash
nvm install 18.19.1
nvm use 18.19.1
```
## Rust Toolchain

1. Install Rust:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
2. Import Rust environment variables:

```bash
source "$HOME/.cargo/env"
```
3. Install and set the correct Rust version:

```bash
rustup install 1.74.1
rustup default 1.74.1
```

## Build Essentials

**For Linux:**

```bash
sudo apt-get install build-essential
```
**For MacOS:**

```bash
brew install gcc
```

**Node-gyp**

1. Install node-gyp globally:

```bash
npm i -g node-gyp
```

2. Configure Python version:

```bash
npm config set python `which python3`
```
3. Verify the configuration:

```bash
npm config list
```

## Project Setup

1. Clone the repository:

```bash
git clone https://github.com/shardeum/shardeum.git
cd shardeum
```

2. Install project dependencies:

```bash
npm ci
```

3. Compile the project:

```bash
npm run prepare
```
4. Install the Shardus CLI:

```bash
npm install -g shardus
npm update @shardus/archiver
```

## Network Configuration
You can configure the Shardeum network for local development using either the automatic or manual mode.

### Automatic Mode
Apply a pre-configured patch:

```bash
git apply debug-10-nodes.patch
```
### Manual Mode

1. Configure Debug Mode in `src/config/index.ts`

```bash
forceBogonFilteringOn: false,
mode: 'debug'
```
2. Modify flags in `src/shardeum/shardeumFlags.ts`:

```bash
txBalancePreCheck: false,
StakingEnabled: false
```
3. Adjust settings for local testing:

```bash
// src/config/index.ts
cycleDuration: 30,

// src/shardeum/shardeumFlags.ts
blockProductionRate: 3,
```
4. Recompile the project:

```bash
npm run prepare
```

## Running the Network
Start a Shardeum network with 10 nodes:

```bash
shardus start 10
```

## Stopping and Cleaning Up
To stop the network and clean up resources:

```bash
shardus stop && shardus clean && rm -rf instances
```

This guide should help you set up and run a local Shardeum network for development purposes. 
If you encounter any issues, please refer to our community resources or open an issue on this repo.