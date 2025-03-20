import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'
import { schemaSign } from './SignSchema'

const schemaNodeRewardTxData = {
  type: 'object',
  properties: {
    publicKey: { type: 'string' },
    nodeId: { type: 'string' },
    endTime: { type: 'number' },
  },
  required: ['publicKey', 'nodeId', 'endTime'],
  additionalProperties: false,
}

const schemaClaimRewardTx = {
  type: 'object',
  properties: {
    isInternalTx: { type: 'boolean', enum: [true] },
    internalTXType: { enum: [InternalTXType.ClaimReward] },
    nominee: { type: 'string' },
    nominator: { type: 'string' },
    timestamp: { type: 'number', exclusiveMinimum: 0 },
    cycle: { type: ['object', 'number', 'string'] },
    deactivatedNodeId: { type: 'string' },
    nodeDeactivatedTime: { type: 'number' },
    txData: schemaNodeRewardTxData,
    sign: schemaSign,
  },
  required: [
    'isInternalTx',
    'internalTXType',
    'nominee',
    'nominator',
    'timestamp',
    'cycle',
    'deactivatedNodeId',
    'nodeDeactivatedTime',
    'txData',
    'sign',
  ],
  additionalProperties: false,
}

export function initClaimRewardTx(): void {
  addSchemaDependencies()
  addSchemas()
}

function addSchemaDependencies(): void {
  addSchema(AJVSchemaEnum.NodeRewardTxData, schemaNodeRewardTxData)
}

function addSchemas(): void {
  addSchema(AJVSchemaEnum.ClaimRewardTx, schemaClaimRewardTx)
}
