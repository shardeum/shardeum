import Ajv from 'ajv'

const ajv = new Ajv()
ajv.addKeyword('isBigInt', {
  validate: (schema, data) => typeof data === 'bigint',
})

const schemaMap: Map<string, object> = new Map()
const verifyFunctions: Map<string, Ajv.ValidateFunction> = new Map()

export function addSchema(name: string, schema: object): void {
  if (schemaMap.has(name)) {
    throw new Error(`error already registered ${name}`)
  }
  schemaMap.set(name, schema)
}

export function initializeSerialization(): void {
  // Register each schema exactly once in AJV
  for (const [name, schema] of schemaMap.entries()) {
    ajv.addSchema(schema, name)
  }
}

export function getVerifyFunction(name: string): Ajv.ValidateFunction {
  const existingFn = verifyFunctions.get(name)
  if (existingFn) {
    return existingFn
  }
  const schema = schemaMap.get(name)
  if (!schema) {
    throw new Error(`error missing schema ${name}`)
  }
  const verifyFn = ajv.compile(schema)
  verifyFunctions.set(name, verifyFn)
  return verifyFn
}
