#!/bin/bash

# Default configuration
TARGET_NODE=${TARGET_NODE:-""}           # Node ID to monitor and pause
DB_PATH=${DB_PATH:-"shardeum/instances/archiver-db-4000/cycles.sqlite3"}  # Path to cycles database
CHECK_INTERVAL=${CHECK_INTERVAL:-1}      # How often to check for lost status (seconds)
COOLDOWN_CYCLES=${COOLDOWN_CYCLES:-1}    # Number of cycles to wait before checking again
MAX_ITERATIONS=${MAX_ITERATIONS:-3}     # Number of times to repeat the process
SHARDEUM_DIR=${SHARDEUM_DIR:-"shardeum"} # Path to shardeum directory

# Clean up function
cleanup() {
    echo "Cleaning up..."
    # Resume process if it was paused
    if [ -n "$PROCESS_PID" ]; then
        echo "Ensuring process PID: $PROCESS_PID is running"
        kill -CONT $PROCESS_PID 2>/dev/null
    fi
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Function to get process info
get_process_info() {
    if [ -n "$TARGET_NODE" ]; then
        # Get specific node's process info
        cd "$SHARDEUM_DIR"
        PROCESS_INFO=$(shardus pm2 jlist | grep '^\[' | jq -r ".[] | select(.name | contains(\"shardus-instance\")) | select(.pm_id == $TARGET_NODE) | \"\(.pid)\"")
        cd - > /dev/null
        
        if [ -z "$PROCESS_INFO" ]; then
            echo "No matching process found"
            cleanup
            exit 1
        fi
        
        PROCESS_PID=$PROCESS_INFO
        echo "Found process PID: $PROCESS_PID"
    else
        echo "ERROR: TARGET_NODE must be specified"
        cleanup
        exit 1
    fi
}

# Function to get current cycle
get_current_cycle() {
    sqlite3 "$DB_PATH" "SELECT counter FROM cycles ORDER BY counter DESC LIMIT 1;"
}

# Function to check if any node is reported lost
check_lost_status() {
    local cycle=$1
    echo "Checking cycle $cycle for lost status..."
    
    local lost_nodes=$(sqlite3 "$DB_PATH" "SELECT json_extract(cycleRecord, '\$.lost') FROM cycles WHERE counter = $cycle;")
    echo "Lost nodes: $lost_nodes"
    
    if [[ "$lost_nodes" != "[]" && "$lost_nodes" != "null" ]]; then
        return 0  # Some node is lost
    fi
    return 1  # No nodes lost
}

# Function to check if any node is refuted
check_refuted_status() {
    local cycle=$1
    echo "Checking cycle $cycle for refuted nodes..."
    
    local refuted_nodes=$(sqlite3 "$DB_PATH" "SELECT json_extract(cycleRecord, '\$.refuted') FROM cycles WHERE counter = $cycle;")
    echo "Refuted nodes: $refuted_nodes"
    
    if [[ "$refuted_nodes" != "[]" && "$refuted_nodes" != "null" ]]; then
        return 0  # Some node is refuted
    fi
    return 1  # No nodes refuted
}

# Get initial process info
echo "Getting process info..."
get_process_info

iteration=1
echo "Starting iteration $iteration of $MAX_ITERATIONS"

while [ $iteration -le $MAX_ITERATIONS ]; do
    echo "Pausing process PID: $PROCESS_PID"
    kill -STOP $PROCESS_PID

    echo "Waiting for any node to be reported as lost..."

    initial_cycle=$(get_current_cycle)
    lost_cycle=0
    resumed=false

    while true; do
        current_cycle=$(get_current_cycle)
        
        if ! $resumed; then
            if check_lost_status "$current_cycle"; then
                echo "Node(s) reported as lost. Waiting for refutation in next cycle..."
                lost_cycle=$current_cycle
                kill -CONT $PROCESS_PID
                resumed=true
            fi
        else
            # Only check for refutation if we're in a new cycle after the lost cycle
            if [ $current_cycle -gt $lost_cycle ] && [ $current_cycle -le $((lost_cycle + COOLDOWN_CYCLES)) ]; then
                if check_refuted_status "$current_cycle"; then
                    echo "Node(s) refuted in cycle $current_cycle."
                    break  # Break inner loop to start next iteration
                fi
            fi
        fi
        
        sleep $CHECK_INTERVAL
    done

    iteration=$((iteration + 1))
    if [ $iteration -le $MAX_ITERATIONS ]; then
        echo "Starting iteration $iteration of $MAX_ITERATIONS"
    else
        echo "Completed all $MAX_ITERATIONS iterations"
        exit 0
    fi
done 
</```
rewritten_file>