import { startTest } from './testCases/start'
import { transactionsTest } from './testCases/transactions'
import { stopTest } from './testCases/stop'
import { dataSyncTest } from './dataSyncTest'

describe('Smoke Testing to the Single Shard (Rotation on) Shardeum Network', () => {
  startTest(11)
  transactionsTest(11, 10)
  dataSyncTest(11, 10, true)
  stopTest()
})
