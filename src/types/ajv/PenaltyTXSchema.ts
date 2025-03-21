import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { InternalTXType, ViolationType } from '../../shardeum/shardeumTypes'

export const schemaInternalTxBase = {
  type: 'object',
  properties: {
    isInternalTx: { type: 'boolean' },
    internalTXType: { enum: Object.values(InternalTXType) },
  },
  required: ['isInternalTx', 'internalTXType'],
  additionalProperties: false,
}

// LeftNetworkEarlyViolationData schema
export const schemaLeftNetworkEarlyViolationData = {
  type: 'object',
  properties: {
    nodeLostCycle: { type: 'number' },
    nodeDroppedCycle: { type: 'number' },
    nodeDroppedTime: { type: 'number' },
  },
  required: ['nodeLostCycle', 'nodeDroppedCycle', 'nodeDroppedTime'],
  additionalProperties: false,
}

// SyncingTimeoutViolationData schema
export const schemaSyncingTimeoutViolationData = {
  type: 'object',
  properties: {
    nodeLostCycle: { type: 'number' },
    nodeDroppedTime: { type: 'number' },
  },
  required: ['nodeLostCycle', 'nodeDroppedTime'],
  additionalProperties: false,
}

// NodeRefutedViolationData schema
export const schemaNodeRefutedViolationData = {
  type: 'object',
  properties: {
    nodeRefutedCycle: { type: 'number' },
    nodeRefutedTime: { type: 'number' },
  },
  required: ['nodeRefutedCycle', 'nodeRefutedTime'],
  additionalProperties: false,
}

// PenaltyTX schema
export const schemaPenaltyTX = {
  type: 'object',
  properties: {
    reportedNodeId: { type: 'string', minLength: 64, maxLength: 64 },
    reportedNodePublickKey: { type: 'string' },
    operatorEVMAddress: { type: 'string' },
    violationType: { enum: Object.values(ViolationType) },
    violationData: {
      anyOf: [
        { $ref: AJVSchemaEnum.LeftNetworkEarlyViolationData },
        { $ref: AJVSchemaEnum.SyncingTimeoutViolationData },
        { $ref: AJVSchemaEnum.NodeRefutedViolationData },
      ],
    },
    timestamp: { type: 'number', exclusiveMinimum: 0 },
    sign: { $ref: AJVSchemaEnum.Sign },
    isInternalTx: { type: 'boolean' },
    internalTXType: { enum: Object.values(InternalTXType) },
  },
  required: [
    'reportedNodeId',
    'reportedNodePublickKey',
    'operatorEVMAddress',
    'violationType',
    'violationData',
    'timestamp',
    'sign',
    'isInternalTx',
    'internalTXType',
  ],
  additionalProperties: false,
}

export function initPenaltyTX(): void {
  addSchemas()
}

// Function to register the schema
function addSchemas(): void {
  addSchema(AJVSchemaEnum.InternalTxBase, schemaInternalTxBase)
  addSchema(AJVSchemaEnum.LeftNetworkEarlyViolationData, schemaLeftNetworkEarlyViolationData)
  addSchema(AJVSchemaEnum.SyncingTimeoutViolationData, schemaSyncingTimeoutViolationData)
  addSchema(AJVSchemaEnum.NodeRefutedViolationData, schemaNodeRefutedViolationData)
  addSchema(AJVSchemaEnum.PenaltyTx, schemaPenaltyTX)
}
