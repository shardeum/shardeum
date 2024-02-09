# Important notice:

-Do not try to connect to the beta network from source yet.

-Visit https://gitlab.com/shardeum/validator/dashboard and use this instead

-local testing may not run great yet. We will update with information on this later

-for now the best use of this repo is to be able to see the code

# Getting Familiar with Shardus

## Setup

### Pre-install

Make sure you have the following installed and configured (we recommend using [nvm](https://github.com/nvm-sh/nvm)/[nvm-windows](https://github.com/coreybutler/nvm-windows) to manage your Node.js and npm versions):

- Node.js (18.16.1)
- npm (9.5.1)
- Git

Then, install the `node-gyp` dependencies for your platform listed [here](https://www.npmjs.com/package/node-gyp#installation).

On Ubuntu, it goes something like this:

```
$ sudo apt update && sudo apt install python3 make g++
$ npm config set python `which python3`
```

### Install

```
$ npm i -g git+https://gitlab.com/shardus/tools/shardus-cli.git
$ shardus init myApp https://gitlab.com/shardus/applications/coin-app-template.git
$ cd myApp
```

## Iterate on a single node

1. Make code changes to `index.ts` and / or `client.js`

2. Start the `seed-node-server`, `monitor-server`, and your `index.ts` server:

   ```
   $ npm run start
   ```

3. Interact with your `index.ts` server:

   ```
   $ node client.js
   $ client$ help
   ...
   ```

4. Stop the `seed-node-server` and `monitor-server`, and clean residual run files:

   ```
   $ npm run stop && npm run clean
   ```

Repeat until desired behavior is achieved...

## Local test network setup

1. cd to server directory

   ```
   $ cd server
   ```

2. Install dependencies

   ```
   $ npm ci
   $ npm run prepare
   $ npm install -g shardus
   $ npm update @shardus/archiver 
   ```

3. Create a local network with multiple nodes:

   ```
   $ shardus create <number-of-nodes>
   $ cd instances
   ```

4. Interact with the network:

   ```
   $ shardus --help
   ```
5. Viewing logs

   ```
   $ shardus pm2 monit
   ```

5. Stop the network:

   ```
   $ shardus stop
   ```

6. Clean databases and logs from the last run:

   ```
   $ shardus clean
   $ rm -rf instances
   ```



# CONTRIBUTING

Please read this contribution [guide](./CONTRIBUTING.md).
