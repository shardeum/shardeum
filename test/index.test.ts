// @ts-ignore
let mockApplicationInterface: ShardusTypes.App = {}

import Shardus from '@shardus/core/src/shardus/index'
import { ShardusTypes } from '@shardus/core'
import SHARDUS_CONFIG from '@shardus/core/src/config'

// Require so that the code in the module is run
require('../src/index')

// @ts-ignore: Also needs to be var for hoisting to work
// var mockApplicationInterface: ShardusTypes.App = {}
// @ts-ignore
// const mockApplicationInterface: ShardusTypes.App = {}

jest.mock('@shardus/core/src/shardus/index', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getDebugModeMiddleware: () => {},
      registerExternalGet: () => {},
      registerExternalPost: () => {},
      registerExceptionHandler: () => {},
      start: () => {},
      on: () => {},
      setup: (args: ShardusTypes.App) => {
        mockApplicationInterface = args
      },
    }
  })
})

jest.mock('@shardus/core', () => {
  return {
    shardusFactory: () => {
      return new Shardus(SHARDUS_CONFIG)
    },
  }
})

// jest.mock('@shardus/core')

describe('setup', () => {
  describe('apply', () => {
    it('does stuff', () => {
      const mockTimestampedTransaction = {
        tx: {},
        timestampReceipt: {
          timestamp: 'time',
        },
      }

      mockApplicationInterface.apply(mockTimestampedTransaction, {})
    })
  })
})
