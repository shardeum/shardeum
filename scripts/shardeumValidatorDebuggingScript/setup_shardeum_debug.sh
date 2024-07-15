#!/bin/bash

# Summary:
# This script sets up a debugging environment for a Shardeum validator running in a Docker container on a remote server.
# It SSHs into the remote server, identifies the Shardeum container, sets up port forwarding, and establishes an SSH tunnel for debugging.

# Usage:
# ./setup_shardeum_debug.sh -s <server_ip> -u <username> -k <ssh_key_path> [-l <local_port>] [-r <remote_port>] [-i <container_image>]
# Example:
# ./setup_shardeum_debug.sh -s 34.85.136.16 -u shardeumcoredev -k ~/.ssh/shardus-ent-cf.pem -l 9229 -r 1337 -i ghcr.io/shardeum/server:dev

# Default values
LOCAL_PORT=9229
REMOTE_PORT=1337
CONTAINER_IMAGE="ghcr.io/shardeum/server:dev"

# Function to display usage instructions
usage() {
    echo "Usage: $0 -s <server_ip> -u <username> -k <ssh_key_path> [-l <local_port>] [-r <remote_port>] [-i <container_image>]"
    echo "Example: $0 -s 34.85.136.16 -u shardeumcoredev -k ~/.ssh/shardus-ent-cf.pem -l 9229 -r 1337 -i ghcr.io/shardeum/server:dev"
    exit 1
}

# Function to clean up lingering artifacts upon interruption
cleanup() {
    echo "Cleaning up..."
    exit 0
}

# Trap SIGINT and call cleanup function
trap cleanup SIGINT

# Check if no arguments are provided and print usage
if [ $# -eq 0 ]; then
    usage
fi

# Parse command line arguments
while getopts ":s:u:k:l:r:i:" opt; do
  case $opt in
    s) SERVER_IP="$OPTARG"
    ;;
    u) USERNAME="$OPTARG"
    ;;
    k) SSH_KEY_PATH="$OPTARG"
    ;;
    l) LOCAL_PORT="$OPTARG"
    ;;
    r) REMOTE_PORT="$OPTARG"
    ;;
    i) CONTAINER_IMAGE="$OPTARG"
    ;;
    *) usage
    ;;
  esac
done

# Prompt for inputs if not provided
if [ -z "$SERVER_IP" ]; then
    read -p "Enter the server IP: " SERVER_IP
fi

if [ -z "$USERNAME" ]; then
    read -p "Enter the username: " USERNAME
fi

if [ -z "$SSH_KEY_PATH" ]; then
    read -p "Enter the path to the SSH key: " SSH_KEY_PATH
fi

# Ensure all arguments are provided
if [ -z "$SERVER_IP" ] || [ -z "$USERNAME" ] || [ -z "$SSH_KEY_PATH" ]; then
    usage
fi

echo "Connecting to the remote server to configure the Shardeum validator container..."
ssh -T -i "$SSH_KEY_PATH" "$USERNAME@$SERVER_IP" << EOF
echo "Fetching the container ID..."
CONTAINER_ID=\$(docker container ls --all --filter=ancestor="$CONTAINER_IMAGE" --format "{{.ID}}")
if [ -z "\$CONTAINER_ID" ]; then
    echo "Error: No container found with image $CONTAINER_IMAGE."
    exit 1
fi
echo "Container ID: \$CONTAINER_ID"

echo "Sending SIGUSR1 signal to the container..."
docker exec \$CONTAINER_ID kill -SIGUSR1 1
if [ \$? -ne 0 ]; then
    echo "Error: Failed to send SIGUSR1 signal to the container."
    exit 1
fi

echo "Installing socat if not already installed..."
docker exec \$CONTAINER_ID apt-get update
docker exec \$CONTAINER_ID apt-get install -y socat
if [ \$? -ne 0 ]; then
    echo "Error: Failed to install socat in the container."
    exit 1
fi

echo "Setting up port forwarding with socat..."
docker exec -d \$CONTAINER_ID socat TCP-LISTEN:$REMOTE_PORT,fork,bind=0.0.0.0 TCP:127.0.0.1:9229
if [ \$? -ne 0 ]; then
    echo "Error: Failed to set up port forwarding with socat."
    exit 1
fi
EOF

# Check if SSH session was successful
if [ $? -ne 0 ]; then
    echo "Error: SSH commands failed on the remote server."
    exit 1
fi

CONTAINER_IP=$(ssh -T -i "$SSH_KEY_PATH" "$USERNAME@$SERVER_IP" \
    "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \$(docker ps -q --filter ancestor='$CONTAINER_IMAGE')")
if [ -z "$CONTAINER_IP" ]; then
    echo "Error: Failed to retrieve the container IP."
    exit 1
fi

echo "Container IP: $CONTAINER_IP"
echo "Establishing SSH tunnel from localhost port $LOCAL_PORT to container's public interface port $REMOTE_PORT on the remote server..."
ssh -T -i "$SSH_KEY_PATH" -L "$LOCAL_PORT:$CONTAINER_IP:$REMOTE_PORT" "$USERNAME@$SERVER_IP"

if [ $? -ne 0 ]; then
    echo "Error: Failed to establish SSH tunnel."
    exit 1
fi

echo "SSH tunnel established. Press Ctrl+C to close the tunnel and exit."
wait
