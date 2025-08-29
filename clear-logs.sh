#!/bin/bash

# Script to clear all .log files from shardus-instance-* directories

# Set the base directory
INSTANCES_DIR="/home/marc/work/shardeum/instances"

# Check if instances directory exists
if [ ! -d "$INSTANCES_DIR" ]; then
    echo "Error: Instances directory not found at $INSTANCES_DIR"
    exit 1
fi

# Count total log files before clearing
TOTAL_FILES=$(find "$INSTANCES_DIR" -path "*/shardus-instance-*/logs/*.log" -type f 2>/dev/null | wc -l)

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "No log files found to clear."
    exit 0
fi

echo "Found $TOTAL_FILES log file(s) to clear..."

# Clear all .log files in shardus-instance-*/logs/ directories
for log_file in "$INSTANCES_DIR"/shardus-instance-*/logs/*.log; do
    if [ -f "$log_file" ]; then
        # Truncate the file (clear contents but keep the file)
        > "$log_file"
        echo "Cleared: $log_file"
    fi
done

echo "✓ Successfully cleared all log files!"