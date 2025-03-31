import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaApplyNetworkParamTx = {
  type: 'object',
  properties: {
    isInternalTx: { type: 'boolean', enum: [true] },
    internalTXType: { enum: [InternalTXType.ApplyNetworkParam] },
    from: { type: 'string' },
    network: { type: 'string' },
    change: { type: 'object' },
    timestamp: { type: 'number', exclusiveMinimum: 0 },
  },
  required: ['isInternalTx', 'internalTXType', 'from', 'network', 'change', 'timestamp'],
  additionalProperties: false,
}

export function initApplyNetworkParamTx(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  // No dependencies
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.ApplyNetworkParamTx, schemaApplyNetworkParamTx)
}
