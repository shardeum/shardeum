<p align="center">
    <img src="https://github.com/shardeum/.github/raw/dev/shardeum-white-bg.png" alt="Shardeum Logo" width="70%">
</p>

<p align="center">
    <h2 align="center">Shardeum is an EVM based autoscaling blockchain</h2>
</p>

## Community

For help, discussion about code, or any other conversation that would benefit from being searchable:

[Discuss Shardeum on GitHub](https://github.com/shardeum/shardeum/discussions)

For chatting with others using Shardeum:

[Join the Shardeum Discord Server](https://discord.com/invite/shardeum)

## Installation

To run a Shardeum validator on your linux host for the public network, you can use the installer script by running the following command:

`curl -O https://gitlab.com/shardeum/validator/dashboard/-/raw/main/installer.sh && chmod +x installer.sh && ./installer.sh`

## Local development

To run a Shardeum network for local development the instructions below will help you configure your machine to be able to spin up local validator, archiver and monitor servers.

Shardeum requires a specific version of Node.js version 18.16.1 and npm version 9.5.1. To manage multiple versions of Node.js, we recommend using the Node Version Manager (NVM). Follow these steps to install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Or checkout the [official documentation](https://github.com/nvm-sh/nvm?tab=readme-ov-file#important-notes) for NVM for more information.

Set NVM directory

```bash
export NVM_DIR="$HOME/.nvm"
```

Load NVM and its bash completion scripts by adding the following lines to your `.bashrc` or `.bash_profile`:

```bash
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

### Rust toolchain

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

## Build essentials

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

### Downloading project source code

Now that the environment is setup, let’s install the project source code and switch to `dev` branch

```bash
git clone https://github.com/shardeum/shardeum.git
cd server
git switch dev
```

#### Installing npm dependencies

Once you are on the `dev` branch, install the local node modules to build the project by the following command

```bash
npm ci
```

### Initializing project

Now, you can initialize the project using the following command

```bash
npm run prepare
```

### Installing the Shardus CLI

[Shardus](https://docs.shardus.com/docs/tools/shardus-cli-tool/README) is a command line tool from Shardus SDK that makes launching any Shardus protocol powered network easier

```bash
npm install -g shardus
npm update @shardus/archiver
```

## Local Configuration

You have two ways to configure your local environment either easy mode or advanced mode

### Easy Mode

You have the option to quickly configure your local environment by applying one of the patches located in the /server/ folder, such as:

```bash
git apply debug-20-nodes.patch
```

For instance, `debug-20-nodes.patch` configures a network with debug settings, requiring 20 nodes to begin processing. These patches are designed to streamline the setup process for specific network configurations, eliminating the need for manual configuration to the following settings.

### Advanced Mode

The default settings included are intended to be used on the live network, so to configure the Shardeum network for local development, there are a few changes that need to be made:

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

## Running the Shardeum Network

Now we’re ready to create the network from within the Shardeum validator repo

```bash
shardus start 20
```

This command will start a Shardeum network of 20 nodes, 1 archiver server and 1 monitor server exposed through port number 3000. You can inspect the nodes via `shardus pm2 list` command.

> **Note:** If one of the services fails to start, it might be that the port is still in use from a previous session.

For usage instructions and available options for the shardus command-line tool, run `shardus --help`

## Stopping the Running Network and Cleanup

```bash
shardus stop && shardus clean && rm -rf instances
```
This command will stop the running network, clean up the associated resources, and remove the `instances` folder from the system.

### Obtaining Test Tokens on the Local Network

If you're running a local Shardeum network, add your wallet address to the [src/config/genesis.json](src/config/genesis.json) file and save the changes. To compile the project, run `npm run prepare` and restart the network. Voila! You'll now have SHM tokens available on your wallet within the local network.

## Install Metamask

Click [here](https://metamask.io/download/). to install the MetaMask extension on your browser.

### Adding Shardeum Network to MetaMask

1. Open MetaMask and click the list of networks at the top, then select "Add Network".
2. Add Shardeum automatically or manually

| Field | Details |
| ---      | ---      |
| Network Name   | Shardeum Atomium |
| New RPC URL | <http://localhost:8080> |
| Chain ID   | 8082 |
| Currency Symbol | SHM |
| Block Explorer URL (optional) | none or <http://localhost:6001/> |

### Starting the JSON-RPC Server

A Shardeum validator node does not have an integrated RPC API, instead we provide an Ethereum compatible JSON-RPC server that can be used to interact with the network that allows the existing Ethereum tools to use Shardeum seamlessly. To start the JSON-RPC server, clone the repository:

```bash
git clone https://github.com/shardeum/json-rpc-server.git
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

### Run the JSON-RPC Server

To run the server, use the command

```bash
npm run start
```

You now have a fully functioning Shardeum network on your local machine! 🎉

## Contributing

Contributions are very welcome! See our [contribution guide](./CONTRIBUTING.md) for more information. Everyone interacting in our codebases, issue trackers, and any other form of communication, including chat rooms and mailing lists, is expected to follow our [code of conduct](./CODE_OF_CONDUCT.md) so we can all enjoy the effort we put into this project.
