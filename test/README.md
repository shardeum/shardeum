## How to run the test

1. Set `START_NETWORK_SIZE` to 5 (as an example) in shardeum/test/main.test.ts
2. Set `spam-client` located dir to `SPAM_CLIENT_DIR`. The load test command will be from that dir.
3. Keep the `json-rpc-server` running in the backgroud before starting the unit test.
4. Open terminal in shardeum directory and run `npm t`.
