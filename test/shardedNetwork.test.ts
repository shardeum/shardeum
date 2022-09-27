import { startTest, transactionsTest, archiverTest, nodeRewardTest, stopTest } from './testCases'
import { dataSyncTest } from './dataSyncTest'

describe('Smoke Testing to the 20 Nodes Sharded Network (Rotation off) Shardeum Network', () => {
  startTest(12)
  transactionsTest(12)
  dataSyncTest(12, 12)
  archiverTest(true, true, false)
  nodeRewardTest()
  transactionsTest(12)
  archiverTest(false, true, true)
  dataSyncTest(12, 12)
  stopTest()
})
