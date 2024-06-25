import Ajv from 'ajv'

const ajv = new Ajv()

const dependencyMap: Map<string, string> = new Map()
const schemaMap: Map<string, object> = new Map()
const verifyFunctions: Map<string, Ajv.ValidateFunction> = new Map()

export function addSchemaDependency(name: string, requiredBy: string): void {
  dependencyMap.set(requiredBy, name)
}

export function addSchema(name: string, schema: object): void {
  if (schemaMap.has(name)) {
    throw new Error(`error already registered ${name}`)
  }
  schemaMap.set(name, schema)
}

export function initializeSerialization(): void {
  for (const [key, value] of dependencyMap.entries()) {
    const schema = schemaMap.get(value)
    if (schema != null) {
      ajv.addSchema(schema, value)
    } else {
      throw new Error(`error missing schema ${value} required by ${key}`)
    }
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
