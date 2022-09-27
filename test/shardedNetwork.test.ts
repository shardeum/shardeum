import { startTest, transactionsTest, archiverTest, nodeRewardTest, stopTest } from './testCases'

describe('Smoke Testing to the 20 Nodes Sharded Network (Rotation off) Shardeum Network', () => {
  startTest(12)
  transactionsTest(12)
  archiverTest(true, true, false)
  nodeRewardTest()
  transactionsTest(12)
  archiverTest(false, true, true)
  stopTest()
})
