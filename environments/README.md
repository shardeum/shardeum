# Shardeum Environment Configuration Files

This directory contains environment-specific configuration files for Shardeum. Each file is tailored for a specific deployment environment.

## Available Configurations

- **local.config.json**: For local development on your machine
- **devnet.config.json**: For development network deployments (uses same key list as local)
- **testnet.config.json**: For testnet (ITN) deployments (has its own key list)
- **mainnet.config.json**: For mainnet deployments (has its own key list)

## Usage

To use a specific configuration file, set the `LOAD_JSON_CONFIGS` environment variable to point to the desired configuration file:

```bash
# For local environment
LOAD_JSON_CONFIGS=config/environments/local.config.json shardus start 10

# For devnet environment
LOAD_JSON_CONFIGS=config/environments/devnet.config.json shardus start 10

# For testnet environment
LOAD_JSON_CONFIGS=config/environments/testnet.config.json shardus start 10

# For mainnet environment
LOAD_JSON_CONFIGS=config/environments/mainnet.config.json shardus start 10
```

Alternatively, use the provided convenience script:

```bash
# For local environment with 10 nodes
./scripts/run-env.sh local 10

# For devnet environment with 15 nodes
./scripts/run-env.sh devnet 15

# For testnet environment with 25 nodes
./scripts/run-env.sh testnet 25
```

This approach uses the built-in configuration loading mechanism of Shardus without modifying any files.

## Archiver Configuration

When connecting to existing networks like testnet or mainnet, you need to configure the archivers correctly. The following script is available to help with this:

### Configure Archivers

The `configure-archiver.js` script provides several ways to configure archivers:

#### Check Current Configuration

Verify if the current configuration matches what we would get from the specified archiver:

```bash
node scripts/configure-archiver.js check testnet 35.193.191.159 4000
```

This will:
1. Connect to the specified archiver
2. Fetch its public key
3. Discover all archivers in the network
4. Compare them with the current configuration
5. Exit with code 0 if they match, or 1 if they don't

#### Set All Archivers

Replace all existing archivers with all archivers discovered from the network:

```bash
node scripts/configure-archiver.js set testnet 35.193.191.159 4000
```

This will:
1. Connect to the specified archiver
2. Fetch its public key
3. Discover all other archivers in the network
4. Update the configuration file with all discovered archivers

#### Add an Additional Archiver

Add a new archiver to the existing list:

```bash
node scripts/configure-archiver.js add testnet archiver2.testnet.shardeum.org 4000
```

The script will automatically fetch the public key from the archiver.

## Configuration Details

### Local and DevNet

These configurations are designed for development purposes and include:
- Debug mode enabled
- Local IP addresses (127.0.0.1)
- Minimal node requirements
- Development-friendly settings
- Chain IDs:
  - Local: 8081
  - DevNet: 8083

### TestNet (ITN)

This configuration is designed for the Incentivized Test Network:
- Release mode
- Auto IP detection
- Higher node requirements
- TestNet-specific archiver and monitoring endpoints
- Chain ID: 8082

### MainNet

This configuration is designed for the production Shardeum network:
- Release mode
- Auto IP detection
- Highest node requirements
- MainNet-specific archiver and monitoring endpoints
- Chain ID: 8080

## Security Note

The placeholder keys in the TestNet and MainNet configurations must be replaced with actual secure keys before deployment. Never commit real private keys to version control.

For local and development environments, the included keys are for testing only and should not be used in production. 