# Network Account Compare Tool

A CLI tool for comparing network account configurations between different environments in the Shardeum network.

## Features

- Compare network account configurations across different environments
- Support for multiple environments (mainnet, testnet, stagenet, devnet-us, devnet-apac, local)
- Detailed comparison output with color-coded results
- Optional verbose mode for additional debugging information

## Installation

1. Navigate to the tool directory:
```bash
cd scripts/network-account-compare
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Usage

### Quick Start

The easiest way to use the tool is with the environment-specific commands:

```bash
# Compare with mainnet
npm run mainnet

# Compare with testnet
npm run testnet

# Compare with stagenet
npm run stagenet

# Compare with devneUus
npm run devnetUs

# Compare with devnetApac
npm run devnetApac

# Compare with local
npm run local
```

### Available Environments

- `mainnet`: Mainnet environment
- `testnet`: Testnet environment
- `stagenet`: Stagenet environment
- `devnetUs`: US Devnet environment
- `devnetApac`: APAC Devnet environment
- `local`: Local development environment



## Configuration

The tool uses predefined archiver URLs for each environment in `src/config.ts`. You can modify these URLs if needed.

## Output

The tool provides color-coded output:
- Green: Matching configurations
- Red: Mismatches or errors
- Blue: Information messages
- Cyan: Change details
- Yellow: Warnings
