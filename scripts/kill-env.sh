#!/bin/bash

# Script to stop and clean up Shardeum environment
# This script will stop the network, clean the state, and remove instance directories

echo "Stopping Shardeum network..."
shardus stop

echo "Cleaning Shardeum state..."
shardus clean

echo "Removing instance directories..."
rm -rf instances

# Check if the cleanup was successful
if [ $? -eq 0 ]; then
  echo "Shardeum environment successfully cleaned up."
else
  echo "Error: Failed to clean up Shardeum environment."
  exit 1
fi 