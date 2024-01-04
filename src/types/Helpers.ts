import { VectorBufferStream } from "@shardus/core"

export const binarySerializer = <T>(
  data: T,
  serializerFunc: (stream: VectorBufferStream, obj: T, root?: boolean) => void
): VectorBufferStream => {
  const serializedPayload = new VectorBufferStream(0)
  serializerFunc(serializedPayload, data, true)
  return serializedPayload
}

export const binaryDeserializer = <T>(
  data: Buffer,
  deserializerFunc: (stream: VectorBufferStream, root?: boolean) => T
): T => {
  const payloadStream = VectorBufferStream.fromBuffer(data)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const payloadType = payloadStream.readUInt16()
  return deserializerFunc(payloadStream)
}