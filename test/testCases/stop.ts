import execa from 'execa'
import * as utils from '../testUtils'

export const stopTest = () => {
  test('Cleans a network successfully', async () => {
    execa.commandSync('shardus stop', { stdio: [0, 1, 2] })
    await utils._sleep(3000)
    execa.commandSync('shardus clean', { stdio: [0, 1, 2] })
    await utils._sleep(2000)
    execa.commandSync('rm -rf instances')
    expect(true).toBe(true)
  })
}
