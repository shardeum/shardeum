import * as utils from '../testUtils';
export const nodeRewardTest = () => {
    it('Node reward is correctly distributed to the payment address', async () => {
        let result = await utils.nodeRewardsCheck();
        expect(result).toBe(true);
    });
};