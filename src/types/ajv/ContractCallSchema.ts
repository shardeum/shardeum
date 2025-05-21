import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'

const schemaContractCallReq = {
  type: 'object',
  properties: {
    to: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
    from: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
    data: { type: 'string', pattern: '^0x[a-fA-F0-9]*$' },
    gas: { anyOf: [ { type: 'number' }, { type: 'string', pattern: '^[0-9]+$' } ] },
    gasPrice: { type: 'string', pattern: '^0x[a-fA-F0-9]+$' },
  },
  required: ['to', 'from', 'data'],
  additionalProperties: false,
}

export function initContractCallReq(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  // No dependencies
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.ContractCallReq, schemaContractCallReq)
}
