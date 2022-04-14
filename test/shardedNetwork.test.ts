import { startTest, transactionsTest, archiverTest, nodeRewardTest, stopTest } from './testCases'

describe('Smoke Testing to the 20 Nodes Sharded Network (Rotation off) Shardeum Network', () => {
  startTest(6), transactionsTest(6), archiverTest(), nodeRewardTest(), stopTest()
})
