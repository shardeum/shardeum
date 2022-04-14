import * as utils from '../testUtils'

export const nodeRewardTest = () => {
  it('Node reward is correctly distributed to the payment address', async () => {
    console.log('TEST: Node reward is correctly distributed to the payment address')
    let result = await utils.nodeRewardsCheck()
    expect(result).toBe(true)
  })
}
