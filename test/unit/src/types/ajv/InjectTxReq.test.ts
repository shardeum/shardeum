import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers'
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum'

describe('InjectTxReq AJV tests', () => {
  beforeAll(() => {
    initAjvSchemas()
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('Valid object positive case', () => {
    const obj = {
      timestamp: 1,
      tx: {
        isInternalTx: true,
        nominee: 'nominee',
      },
      raw: 'raw',
      isInternalTx: true,
    }
    const errors = verifyPayload(AJVSchemaEnum.InjectTxReq, obj)
    expect(errors).toBeNull()
  })

})
