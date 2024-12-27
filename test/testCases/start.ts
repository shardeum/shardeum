import execa from 'execa';
import { join } from 'path';
import * as crypto from '@shardus/crypto-utils';
import * as utils from '../testUtils';
crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc');
const USE_EXISTING_NETWORK = false;
const opts = { shell: true };
export const startTest = (START_NETWORK_SIZE, EXPECTED_ACTIVE_NODES = null) => {
    it(`Start a ${START_NETWORK_SIZE} nodes network successfully`, async () => {
        if (USE_EXISTING_NETWORK) {
            let activeNodes = await utils.queryActiveNodes();
            expect(Object.keys(activeNodes).length).toBe(EXPECTED_ACTIVE_NODES || START_NETWORK_SIZE);
        }
        else {
            try {
                await execa.command('shardus stop');
                await utils._sleep(3000);
                await execa.command('rm -rf instances');
            }
            catch (e) {
            }
            execa.commandSync(`shardus create  ${START_NETWORK_SIZE}`, { ...opts /* stdio: [0, 1, 2] */ });
            const isNetworkActive = await utils.waitForNetworkToBeActive(EXPECTED_ACTIVE_NODES || START_NETWORK_SIZE);
            expect(isNetworkActive).toBe(true);
        }
    });
};