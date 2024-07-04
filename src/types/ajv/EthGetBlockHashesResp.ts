import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'

export const schemaEthGetBlockHashesResp = {
  type: 'object',
  properties: {
    fromBlock: { type: ['string', 'number'] },
    toBlock: {
      type: ['string', 'number', 'null'],
    },
    blockHashes: { type: 'array', items: { type: 'string' } },
  },
  required: ['blockHashes', 'fromBlock', 'toBlock'],
}

export function initEthGetBlockHashesResp(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.EthGetBlockHashesResp, schemaEthGetBlockHashesResp)
}
