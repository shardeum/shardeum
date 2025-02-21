import { addSchema } from '../../utils/serialization/SchemaHelpers'
import { AJVSchemaEnum } from '../enum/AJVSchemaEnum'
import { InternalTXType } from '../../shardeum/shardeumTypes'

const schemaChangeConfigTx = {
    type: 'object',
    properties: {
        isInternalTx: { type: 'boolean', enum: [true] },
        internalTXType: { enum: [InternalTXType.ChangeConfig] },
        type: { type: 'string' },
        from: { type: 'string' },
        cycle: {
            type: 'object',
            properties: {
                networkId: { type: 'string' },
                counter: { type: 'number' },
                previous: { type: 'string' },
                start: { type: 'number' },
                duration: { type: 'number' },
                networkConfigHash: { type: 'string' },
                mode: {
                    type: 'string',
                    enum: ['forming', 'processing', 'safety', 'recovery', 'restart', 'restore', 'shutdown'],
                },
                safetyMode: { type: 'boolean' },
                safetyNum: { type: 'number' },
                networkStateHash: { type: 'string' },
                refreshedArchivers: { type: 'array', items: true },
                refreshedConsensors: { type: 'array', items: true },
                joinedArchivers: { type: 'array', items: true },
                leavingArchivers: { type: 'array', items: true },
                archiversAtShutdown: { type: 'array', items: true },
                syncing: { type: 'number' },
                joinedConsensors: { type: 'array', items: true },
                standbyAdd: { type: 'array', items: true },
                standbyRemove: { type: 'array', items: { type: 'string' } },
                startedSyncing: { type: 'array', items: { type: 'string' } },
                lostAfterSelection: { type: 'array', items: { type: 'string' } },
                finishedSyncing: { type: 'array', items: { type: 'string' } },
                standbyRefresh: { type: 'array', items: { type: 'string' } },
                active: { type: 'number' },
                standby: { type: 'number' },
                activated: { type: 'array', items: { type: 'string' } },
                activatedPublicKeys: { type: 'array', items: { type: 'string' } },
                maxSyncTime: { type: 'number' },
                apoptosized: { type: 'array', items: { type: 'string' } },
                lost: { type: 'array', items: { type: 'string' } },
                lostSyncing: { type: 'array', items: { type: 'string' } },
                refuted: { type: 'array', items: { type: 'string' } },
                appRemoved: { type: 'array', items: { type: 'string' } },
                expired: { type: 'number' },
                removed: { type: 'array', items: { type: 'string' } },
                nodeListHash: { type: 'string' },
                archiverListHash: { type: 'string' },
                standbyNodeListHash: { type: 'string' },
                random: { type: 'number' },
                joined: { type: 'array', items: { type: 'string' } },
                returned: { type: 'array', items: { type: 'string' } },
                networkDataHash: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: { hash: { type: 'string' }, cycle: { type: 'number' } },
                        required: ['hash', 'cycle'],
                    },
                },
                desired: { type: 'number' },
                target: { type: 'number' },
            },
            required: [
                'networkId',
                'counter',
                'previous',
                'start',
                'duration',
                'networkConfigHash',
                'nodeListHash',
                'archiverListHash',
                'standbyNodeListHash',
            ],
            additionalProperties: true,
        },
        config: { type: 'string' },
        timestamp: { type: 'number', exclusiveMinimum: 0 },
        sign: { $ref: AJVSchemaEnum.Sign }
    },
    required: [
        'isInternalTx',
        'internalTXType',
        'from',
        'cycle',
        'config',
        'timestamp',
        'sign'
    ],
    additionalProperties: false
}

export function initChangeConfigTx(): void {
    addSchemaDependencies()
    addSchemas()
}

function addSchemaDependencies(): void {
    // No dependencies
}

function addSchemas(): void {
    addSchema(AJVSchemaEnum.ChangeConfigTx, schemaChangeConfigTx)
}
