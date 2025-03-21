import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'

export const schemaSign = {
  type: 'object',
  properties: {
    owner: { type: 'string' },
    sig: { type: 'string' },
  },
  required: ['owner', 'sig'],
  additionalProperties: false,
}

export function initSign(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  // No dependencies
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.Sign, schemaSign)
}
