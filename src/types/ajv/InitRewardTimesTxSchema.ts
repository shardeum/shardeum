import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'
import { schemaSign } from './SignSchema'

const schemaNodeInitTxData = {
  type: 'object',
  properties: {
    publicKey: { type: 'string' },
    nodeId: { type: 'string' },
    startTime: { type: 'number' },
  },
  required: ['publicKey', 'nodeId', 'startTime'],
  additionalProperties: false,
}

const schemaInitRewardTimesTx = {
  type: 'object',
  properties: {
    isInternalTx: { type: 'boolean', enum: [true] },
    internalTXType: { enum: [InternalTXType.InitRewardTimes] },
    nominee: { type: 'string' },
    timestamp: { type: 'number', exclusiveMinimum: 0 },
    nodeActivatedTime: { type: 'number' },
    txData: schemaNodeInitTxData,
    sign: schemaSign,
  },
  required: ['isInternalTx', 'internalTXType', 'nominee', 'timestamp', 'nodeActivatedTime', 'txData', 'sign'],
  additionalProperties: false,
}

export function initInitRewardTimesTx(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  addSchema(AJVSchemaEnum.NodeInitTxData, schemaNodeInitTxData)
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.InitRewardTimesTx, schemaInitRewardTimesTx)
}
