#!/bin/bash

# Duration to pause/resume in seconds
PAUSE_DURATION=${1:-5}
RESUME_DURATION=${1:-5}

while true; do
    echo "Getting process list..."
    # Get JSON output and extract pm_id and pid fields, only parsing lines that start with [
    PROCESS_INFO=$(shardus pm2 jlist | grep '^\[' | jq -r '.[] | select(.name | contains("shardus-instance")) | "\(.pm_id):\(.pid)"')
    
    echo "Pausing processes..."
    echo "$PROCESS_INFO" | while IFS=: read -r pm_id pid; do
        if [ ! -z "$pid" ]; then
            echo "Stopping process PM2 ID: $pm_id, PID: $pid"
            kill -STOP $pid
        fi
    done
    
    echo "Sleeping for $PAUSE_DURATION seconds..."
    sleep $PAUSE_DURATION
    
    echo "Resuming processes..."
    echo "$PROCESS_INFO" | while IFS=: read -r pm_id pid; do
        if [ ! -z "$pid" ]; then
            echo "Resuming process PM2 ID: $pm_id, PID: $pid"
            kill -CONT $pid
        fi
    done
    
    echo "Sleeping for $RESUME_DURATION seconds..."
    sleep $RESUME_DURATION
done 