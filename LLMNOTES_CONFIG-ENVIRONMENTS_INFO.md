# Environment Configuration Setup Notes

## Overview

Created environment-specific configuration files for Shardeum to support different deployment scenarios:

1. **Local Environment**: For local development on a single machine
2. **DevNet Environment**: For development network deployments (uses same key list as local)
3. **TestNet Environment**: For testnet (ITN) deployments (has its own key list)
4. **MainNet Environment**: For mainnet deployments (has its own key list)

## File Structure

- `config/environments/local.config.json`: Local environment configuration
- `config/environments/devnet.config.json`: DevNet environment configuration
- `config/environments/testnet.config.json`: TestNet environment configuration
- `config/environments/mainnet.config.json`: MainNet environment configuration
- `config/environments/README.md`: Documentation for using the configuration files
- `scripts/run-env.sh`: Script to easily run Shardeum with a specific environment configuration

## Configuration Details

### Common Structure

All configuration files follow this basic structure:
```json
{
  "server": {
    "baseDir": ".",
    "p2p": {
      // P2P network settings
      "existingArchivers": [
        // Archiver node information
      ]
    },
    "ip": {
      // IP configuration
    },
    "sharding": {
      // Sharding configuration
    },
    "features": {
      // Feature flags and settings
    },
    "mode": "debug|release",
    "reporting": {
      // Reporting configuration
    },
    "security": {
      // Security settings
    },
    "network": {
      // Network-specific settings
      "chainId": 8080, // Example
      "name": "Network Name"
    },
    "keys": {
      "nodeKeys": [
        // Node key pairs
      ]
    }
  }
}
```

### Key Differences

1. **Local/DevNet**:
   - Debug mode enabled
   - Local IP addresses (127.0.0.1)
   - Local archiver
   - Minimal node requirements (10 nodes)
   - Same key list used for both
   - Chain IDs:
     - Local: 8081
     - DevNet: 8083

2. **TestNet**:
   - Release mode
   - Auto IP detection
   - TestNet-specific archiver
   - Higher node requirements (25 nodes)
   - TestNet-specific key list (placeholders in config)
   - Chain ID: 8082

3. **MainNet**:
   - Release mode
   - Auto IP detection
   - MainNet-specific archiver
   - Highest node requirements (100 nodes)
   - MainNet-specific key list (placeholders in config)
   - Chain ID: 8080

## Usage

To use a specific environment configuration, set the `LOAD_JSON_CONFIGS` environment variable:

```bash
LOAD_JSON_CONFIGS=config/environments/local.config.json shardus start 10
```

Alternatively, use the provided convenience script:

```bash
./scripts/run-env.sh local 10
```

This script sets the `LOAD_JSON_CONFIGS` environment variable and starts the Shardeum network with the specified configuration.

## Security Considerations

- The placeholder keys in TestNet and MainNet configurations must be replaced with actual secure keys before deployment
- Never commit real private keys to version control
- For local and development environments, the included keys are for testing only 