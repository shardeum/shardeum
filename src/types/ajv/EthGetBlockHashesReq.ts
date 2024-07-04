import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'

export const schemaEthGetBlockHashesReq = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        fromBlock: { type: ['string', 'number'] },
        toBlock: {
          type: ['string', 'number', 'null'],
        },
      },
      required: ['fromBlock'],
    },
  },
  required: ['query'],
}

export function initEthGetBlockHashesReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.EthGetBlockHashesReq, schemaEthGetBlockHashesReq)
}
