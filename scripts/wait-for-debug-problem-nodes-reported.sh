#!/bin/bash

# Maximum time to wait (in seconds)
MAX_WAIT=600
START_TIME=$SECONDS

# Function to check if problem nodes are reported
check_problem_nodes() {
    local result=$(curl -s "http://localhost:9001/debug_problemNodeTrackerDump")
    local cycle=$(echo "$result" | jq -r '.data.cycle')
    local node_count=$(echo "$result" | jq -r '.data.nodeHistories | length')
    
    echo "Current cycle: $cycle, Problem nodes: $node_count"
    
    # If we have any problem nodes reported, return success
    if [ "$node_count" -gt 0 ]; then
        echo "Problem nodes detected!"
        echo "$result" | jq '.'
        return 0
    fi
    
    return 1
}

echo "Waiting for problem nodes to be reported..."

while true; do
    if check_problem_nodes; then
        exit 0
    fi

    # Check if we've exceeded the maximum wait time
    ELAPSED_TIME=$((SECONDS - START_TIME))
    if [ $ELAPSED_TIME -gt $MAX_WAIT ]; then
        echo "Timeout waiting for problem nodes to be reported"
        exit 1
    fi

    echo "No problem nodes reported yet. Waiting..."
    sleep 5
done 