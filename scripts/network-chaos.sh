#!/bin/bash

# Default configuration
ISOLATION_DURATION=${ISOLATION_DURATION:-15}     # Duration of isolation in seconds
NORMAL_DURATION=${NORMAL_DURATION:-15}           # Duration of normal operation in seconds
ISOLATION_PROBABILITY=${ISOLATION_PROBABILITY:-20} # Probability of isolation during degraded state
TARGET_NODE=${TARGET_NODE:-""}                   # Specific node ID to target (empty = random selection)
GRADUAL_DEGRADATION=${GRADUAL_DEGRADATION:-0}   # Whether to gradually increase isolation frequency
MAX_CYCLES=${MAX_CYCLES:-0}                     # Maximum number of cycles (0 = infinite)

# Clean up function
cleanup() {
    echo "Cleaning up..."
    # Resume any stopped processes
    if [ -n "$PROCESS_INFO" ]; then
        echo "$PROCESS_INFO" | while IFS=: read -r pm_id pid; do
            if [ ! -z "$pid" ]; then
                echo "Ensuring process PM2 ID: $pm_id, PID: $pid is running"
                kill -CONT $pid 2>/dev/null
            fi
        done
    fi
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Function to get process list
get_process_info() {
    if [ -n "$TARGET_NODE" ]; then
        # Get specific node's process
        PROCESS_INFO=$(shardus pm2 jlist | grep '^\[' | jq -r ".[] | select(.name | contains(\"shardus-instance\")) | select(.pm_id == $TARGET_NODE) | \"\(.pm_id):\(.pid)\"")
    else
        # Get all node processes
        PROCESS_INFO=$(shardus pm2 jlist | grep '^\[' | jq -r '.[] | select(.name | contains("shardus-instance")) | "\(.pm_id):\(.pid)"')
    fi
    
    if [ -z "$PROCESS_INFO" ]; then
        echo "No matching processes found"
        exit 1
    fi
}

# Function to simulate node issues
simulate_node_issues() {
    local cycle=$1
    local isolation_prob=$ISOLATION_PROBABILITY
    
    # If gradual degradation is enabled, increase probability over time
    if [ "$GRADUAL_DEGRADATION" = "1" ]; then
        isolation_prob=$((ISOLATION_PROBABILITY + (cycle * 10)))  # Add 10% per cycle
        if [ $isolation_prob -gt 100 ]; then
            isolation_prob=100
        fi
    fi
    
    echo "$PROCESS_INFO" | while IFS=: read -r pm_id pid; do
        if [ ! -z "$pid" ]; then
            if [ $((RANDOM % 100)) -lt $isolation_prob ]; then
                echo "Cycle $cycle: Stopping process PM2 ID: $pm_id, PID: $pid"
                kill -STOP $pid
                
                # Random micro-recoveries during isolation period
                (
                    sleep $((RANDOM % ISOLATION_DURATION))
                    if [ $((RANDOM % 100)) -lt 30 ]; then  # 30% chance of brief recovery
                        echo "Brief recovery for PM2 ID: $pm_id"
                        kill -CONT $pid
                        sleep 2
                        kill -STOP $pid
                    fi
                ) &
            fi
        fi
    done
}

# Function to restore normal operation
restore_normal() {
    echo "$PROCESS_INFO" | while IFS=: read -r pm_id pid; do
        if [ ! -z "$pid" ]; then
            echo "Resuming process PM2 ID: $pm_id, PID: $pid"
            kill -CONT $pid
        fi
    done
}

# Get initial process list
echo "Getting process list..."
get_process_info

# Main loop
cycle=0
while true; do
    if [ $MAX_CYCLES -gt 0 ] && [ $cycle -ge $MAX_CYCLES ]; then
        echo "Reached maximum cycles ($MAX_CYCLES), exiting..."
        cleanup
    fi
    
    echo "Cycle $cycle: Simulating node issues..."
    simulate_node_issues $cycle
    sleep $ISOLATION_DURATION
    
    echo "Cycle $cycle: Restoring normal operation..."
    restore_normal
    sleep $NORMAL_DURATION
    
    # Refresh process list periodically
    if [ $((cycle % 5)) -eq 0 ]; then
        get_process_info
    fi
    
    ((cycle++))
done 