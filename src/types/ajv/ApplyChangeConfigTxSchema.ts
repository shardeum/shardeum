import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaApplyChangeConfigTx = {
  type: 'object',
  properties: {
    isInternalTx: { type: 'boolean', enum: [true] },
    internalTXType: { enum: [InternalTXType.ApplyChangeConfig] },
    from: { type: 'string' },
    network: { type: 'string' },
    change: { type: 'object' },
    timestamp: { type: 'number', exclusiveMinimum: 0 },
  },
  required: ['isInternalTx', 'internalTXType', 'from', 'network', 'change', 'timestamp'],
  additionalProperties: false,
}

export function initApplyChangeConfigTx(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  // No dependencies
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.ApplyChangeConfigTx, schemaApplyChangeConfigTx)
}
