import { validateTransaction } from '../../src/setup'
import { InternalTXType } from '../../src/shardeum/shardeumTypes'

describe('validateTransaction', () => {
  describe('internal transaction', () => {
    it('validates global internal transaction correctly', () => {
      const transaction = {
        isInternalTx: true,
        internalTXType: InternalTXType.SetGlobalCodeBytes,
      }

      expect(validateTransaction(transaction)).toEqual({ result: 'pass', reason: 'valid' })
    })
  })
})
