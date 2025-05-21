import { generateTxId } from '../../../../src/utils/transaction'

type ShardusMock = {
  put: jest.Mock
  serviceQueue: {
    containsTxId: jest.Mock
  }
}

async function injectTx(shardus: ShardusMock, tx: any) {
  const txId = generateTxId(tx)
  if (shardus.serviceQueue.containsTxId(txId)) {
    return { success: false, reason: 'duplicate transaction' }
  }
  return shardus.put(tx)
}

describe('duplicate transaction injection', () => {
  let shardus: ShardusMock
  const sampleTx = { foo: 'bar', timestamp: 1 }

  beforeEach(() => {
    shardus = {
      put: jest.fn().mockResolvedValue({ success: true }),
      serviceQueue: {
        containsTxId: jest.fn().mockReturnValue(false),
      },
    }
  })

  it('rejects duplicate transactions', async () => {
    const first = await injectTx(shardus, sampleTx)
    expect(first.success).toBe(true)
    expect(shardus.put).toHaveBeenCalledTimes(1)

    shardus.serviceQueue.containsTxId.mockReturnValue(true)
    const second = await injectTx(shardus, sampleTx)

    expect(second).toEqual({ success: false, reason: 'duplicate transaction' })
    expect(shardus.put).toHaveBeenCalledTimes(1)
  })
})
