import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'

const schemaInjectTxReq = {
  type: 'object',
  properties: {
    timestamp: { type: 'number' },
    tx: { type: 'object' },
    raw: { type: 'string' },
    isInternalTx: { type: 'boolean' },
  },
  required: [],
  additionalProperties: false,
}

export function initInjectTxReq(): void {
  addSchemaDependencies()
  addSchemas()
}

// Function to add schema dependencies
function addSchemaDependencies(): void {
  // No dependencies
}

// Function to register the schema
function addSchemas(): void {
  addSchema(AJVSchemaEnum.InjectTxReq, schemaInjectTxReq)
}
