import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { ValidatorAjvTypeReqRespEnum } from '../enum/ValidatorAjvTypeReqRespEnum'
export const schemaContractCallReq = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        from: { type: 'string' },
        data: { type: 'string' },
        gas: { type: 'string' },
        gasPrice: { type: 'string' },
      },
      required: ['to', 'from'],
    },
  },
  required: ['body'],
}

export function initContractCallReq(): void {
  addSchemaDependencies()
  addSchemas()
}
// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(ValidatorAjvTypeReqRespEnum.ContractCallReq, schemaContractCallReq)
}
