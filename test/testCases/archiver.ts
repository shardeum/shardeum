import execa from 'execa'
import * as utils from '../testUtils'

const opts = { shell: true }

export const archiverTest = () => {
  test('Start new archivers successfully', async () => {
    console.log('TEST: Start new archivers successfully')

    try {
      execa.commandSync('shardus start --archivers 1', { ...opts, stdio: [0, 1, 2] })
    } catch (e) {
      console.log(e)
    }
    let hasNewArchiverJoined = await utils.waitForArchiverToJoin('localhost', 4001)

    expect(hasNewArchiverJoined).toBe(true)
  })

  test('New archivers sync archived data successfully', async () => {
    console.log('TEST: New archivers sync archived data successfully')
    await utils._sleep(60000 * 5) // needs to wait while new archiver is syncing data

    const dataFromArchiver_1 = await utils.queryArchivedCycles('localhost', 4000, 5)
    console.log('archiver:4000')
    const dataFromArchiver_2 = await utils.queryArchivedCycles('localhost', 4001, 5)
    console.log('archiver:4001')
    let hasSameData = false
    for (let i = 0; i < dataFromArchiver_1.length; i++) {
      const data1 = dataFromArchiver_1[i]
      const data2 = dataFromArchiver_2[i]
      hasSameData = JSON.stringify(data1) === JSON.stringify(data2) 
    }
    expect(hasSameData).toBe(true)
  })
}
