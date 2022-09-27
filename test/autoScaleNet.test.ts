import { startTest } from './testCases/start'
import { stopTest } from './testCases/stop'
import { scaleTest } from './scaleTest'
import { dataSyncTest } from './dataSyncTest'

describe('Smoke Autoscaling Testing Shardeum Network', () => {
  startTest(10, 5)
  scaleTest(5, 10)
  dataSyncTest(5, 5)
  stopTest()
})
