#!/bin/bash

# Maximum time to wait (in seconds)
MAX_WAIT=1800
START_TIME=$SECONDS

# Function to check if a node is in active mode
check_node_mode() {
    local node_id=$1
    local port=$((9001 + node_id))
    local result=$(curl -s "http://localhost:${port}/nodeInfo" | jq -r '.nodeInfo.status')
    echo "$result"
}

# Function to check if all nodes are in active mode
check_all_nodes() {
    for node_id in {0..9}; do
        local mode=$(check_node_mode $node_id)
        if [ "$mode" != "active" ]; then
            return 1
        fi
    done
    return 0
}

echo "Waiting for all nodes to enter active mode..."

while true; do
    if check_all_nodes; then
        echo "All nodes are in active mode!"
        exit 0
    fi

    # Check if we've exceeded the maximum wait time
    ELAPSED_TIME=$((SECONDS - START_TIME))
    if [ $ELAPSED_TIME -gt $MAX_WAIT ]; then
        echo "Timeout waiting for nodes to enter active mode"
        exit 1
    fi

    echo "Not all nodes are in active mode yet. Waiting..."
    sleep 5
done 