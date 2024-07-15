# Shardeum Validator Debugging Script

## Description

This script sets up a debugging environment for a Shardeum validator running in a Docker container on a remote server. It facilitates remote debugging by establishing an SSH tunnel, forwarding the necessary ports, and configuring the Docker container to listen for debugger connections.

## Why It's Needed

When developing and debugging the Shardeum validator, it's often necessary to set breakpoints and inspect the running state of the node process. However, since the validator runs inside a Docker container on a remote server, setting up the environment for remote debugging can be complex and error-prone. This script automates the process, making it easier for developers to connect their local debugging tools to the remote node process.

## How It Works

1. **SSH into the Remote Server**: The script SSHs into the remote server where the Shardeum validator is running.
2. **Identify the Shardeum Container**: It identifies the Docker container running the Shardeum validator.
3. **Send Debugger Signal**: The script sends a signal to the node process inside the container to start listening for debugger connections.
4. **Install `socat`**: It installs `socat` inside the container if it's not already installed.
5. **Set Up Port Forwarding**: The script configures `socat` to forward packets from a public interface port to the local port where the debugger listens.
6. **Establish SSH Tunnel**: Finally, the script establishes an SSH tunnel from the local machine to the container's public interface port on the remote server.

## Usage

### Prerequisites

- SSH access to the remote server.
- The SSH key for accessing the remote server.
- Docker installed on the remote server.
- `socat` installed on the Docker container (the script will install it if not present).

### Running the Script

1. **Run the Script**:
    ```bash
    ./setup_shardeum_debug.sh -s <server_ip> -u <username> -k <ssh_key_path> [-l <local_port>] [-r <remote_port>] [-i <container_image>]
    ```

    Example:
    ```bash
    ./setup_shardeum_debug.sh -s 34.85.136.16 -u shardeumcoredev -k ~/.ssh/shardus-ent-cf.pem -l 9229 -r 1337 -i ghcr.io/shardeum/server:dev
    ```

![alt text](1-run-script.gif)

### Script Arguments

- `-s`: The IP address of the remote server.
- `-u`: The username for SSH access to the remote server.
- `-k`: The path to the SSH key for accessing the remote server.
- `-l`: (Optional) The local port to use for the SSH tunnel. Defaults to `9229`.
- `-r`: (Optional) The remote port to use for the SSH tunnel. Defaults to `1337`.
- `-i`: (Optional) The Docker container image name. Defaults to `ghcr.io/shardeum/server:dev`.

### Post-Script Configuration

After running the script, open the [`shardeum`](https://github.com/shardeum/shardeum) project in Visual Studio Code and add the following configuration to the projects `.vscode/launch.json` file to connect to the node process and start breakpoint debugging:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Remote Better",
  "port": 9229,
  "sourceMaps": true,
  "skipFiles": ["<node_internals>/**"],
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/usr/src/app"
}
```

![alt text](2-add-launch-config.gif)
