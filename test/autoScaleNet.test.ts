import { startTest } from './testCases/start'
import { stopTest } from './testCases/stop'
import { scaleTest } from './scaleTest'

describe('Smoke Autoscaling Testing Shardeum Network', () => {
  // startTest(10, 5), 
  scaleTest(5)
  // , stopTest()
})
