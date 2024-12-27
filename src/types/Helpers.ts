import { VectorBufferStream, nestedCountersInstance } from '@shardus/core';
import { AccountType, NodeAccount2, SecureAccount } from '../shardeum/shardeumTypes';
import { BaseAccount } from './BaseAccount';
import { DevAccount, deserializeDevAccount, serializeDevAccount } from './DevAccount';
import { NetworkAccount, deserializeNetworkAccount, serializeNetworkAccount } from './NetworkAccount';
import { NodeAccount, deserializeNodeAccount, serializeNodeAccount } from './NodeAccount';
import { WrappedEVMAccount, deserializeWrappedEVMAccount, serializeWrappedEVMAccount, } from './WrappedEVMAccount';
import { TypeIdentifierEnum } from './enum/TypeIdentifierEnum';
import { Utils } from '@shardus/types';
import { deserializeSecureAccount, serializeSecureAccount } from './SecureAccount';
export const binarySerializer = <T>(data: T, serializerFunc: (stream: VectorBufferStream, obj: T, root?: boolean) => void): VectorBufferStream => {
    const serializedPayload = new VectorBufferStream(0);
    serializerFunc(serializedPayload, data, true);
    return serializedPayload;
};
export const binaryDeserializer = <T>(data: Buffer, deserializerFunc: (stream: VectorBufferStream, root?: boolean) => T): T => {
    const payloadStream = VectorBufferStream.fromBuffer(data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const payloadType = payloadStream.readUInt16();
    return deserializerFunc(payloadStream);
};
export const accountSerializer = <T extends BaseAccount>(data: T): VectorBufferStream => {
    const serializedPayload = new VectorBufferStream(0);
    switch (data.accountType) {
        case AccountType.DevAccount:
            serializeDevAccount(serializedPayload, data as unknown as DevAccount, true);
            break;
        case AccountType.NetworkAccount:
            serializeNetworkAccount(serializedPayload, data as unknown as NetworkAccount, true);
            break;
        case AccountType.NodeAccount:
            serializeNodeAccount(serializedPayload, data as unknown as NodeAccount, TypeIdentifierEnum.cNodeAccount, true);
            break;
        case AccountType.NodeAccount2:
            serializeNodeAccount(serializedPayload, data as unknown as NodeAccount2, TypeIdentifierEnum.cNodeAccount2, true);
            break;
        case AccountType.SecureAccount:
            serializeSecureAccount(serializedPayload, data as unknown as SecureAccount, true);
            break;
        case AccountType.Account:
        case AccountType.ContractCode:
        case AccountType.ContractStorage:
        case AccountType.Receipt:
            serializeWrappedEVMAccount(serializedPayload, data as unknown as WrappedEVMAccount, true);
            break;
        default:
            serializedPayload.writeUInt16(TypeIdentifierEnum.cUnknown);
            serializedPayload.writeString(Utils.safeStringify(data));
            break;
    }
    return serializedPayload;
};
export const accountDeserializer = <T extends BaseAccount>(data: Buffer): T => {
    const payloadStream = VectorBufferStream.fromBuffer(data);
    const payloadType = payloadStream.readUInt16();
    switch (payloadType) {
        case TypeIdentifierEnum.cDevAccount:
            return deserializeDevAccount(payloadStream) as unknown as T;
        case TypeIdentifierEnum.cNetworkAccount:
            return deserializeNetworkAccount(payloadStream) as unknown as T;
        case TypeIdentifierEnum.cNodeAccount:
            return deserializeNodeAccount(payloadStream) as unknown as T;
        case TypeIdentifierEnum.cNodeAccount2:
            return deserializeNodeAccount(payloadStream) as unknown as T;
        case TypeIdentifierEnum.cSecureAccount:
            return deserializeSecureAccount(payloadStream) as unknown as T;
        case TypeIdentifierEnum.cWrappedEVMAccount:
            return deserializeWrappedEVMAccount(payloadStream) as unknown as T;
        default:
            return Utils.safeJsonParse(payloadStream.readString()) as unknown as T;
    }
};