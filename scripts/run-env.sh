#!/bin/bash

# Script to run Shardeum with a specific environment configuration
# This script uses the LOAD_JSON_CONFIGS environment variable to specify the configuration file

# Display usage information
function show_usage {
  echo "Usage: $0 [environment] [node_count]"
  echo "Available environments:"
  echo "  local    - Local development environment"
  echo "  devnet   - Development network environment"
  echo "  testnet  - Testnet (ITN) environment"
  echo "  mainnet  - Mainnet environment"
  echo ""
  echo "node_count - Number of nodes to start (default: 10)"
  echo ""
  echo "Example: $0 local 10"
}

# Check if an environment argument was provided
if [ $# -lt 1 ]; then
  show_usage
  exit 1
fi

ENV=$1
NODE_COUNT=${2:-10}  # Default to 10 nodes if not specified
CONFIG_DIR="environments"
CONFIG_FILE="${CONFIG_DIR}/${ENV}.config.json"

# Check if the specified environment config exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file for environment '$ENV' not found at $CONFIG_FILE"
  show_usage
  exit 1
fi

# Run Shardus with the specified configuration
echo "Starting Shardeum network with $ENV environment configuration..."
echo "Using configuration file: $CONFIG_FILE"
echo "Starting $NODE_COUNT nodes..."

# Use the LOAD_JSON_CONFIGS environment variable to specify the configuration file
LOAD_JSON_CONFIGS="$CONFIG_FILE" shardus start $NODE_COUNT

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "Shardeum network started successfully with $ENV environment configuration."
else
  echo "Error: Failed to start Shardeum network."
  exit 1
fi 