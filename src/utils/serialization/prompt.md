```ts
//example types used for schema generation:
export type Foo2 {
  someData: number
  someName: string
}
export type FooParent {
  someName: string
  arrayOfFoo: Foo2[]
}
```

ajv object schema verification:
Please also generate a verify\* function like verifyFooParent for each type you see.
When versions change these should be updated to verify only the latest version.

//there will ve a helper functions imported that will have these signatures:
export function addSchemaDependency(name:string, schema: object, requiredBy: string): void
export function addSchema(name: string, schema: object): void

Please generate:
schema\* for each type like schemaFoo2 this should be undefined by default.

also please generate the functions addSchemaDependencies() and addSchemas()
for each dependency call addSchema in the appropriate way
for each type call addSchema
it is ok to call addSchemaDependency multiple times for the same class as long as
the parent is different.

```ts
//This is an example of the function to generate:
export function addSchemaDependencies(): void {
  //all dependencies are added here (for types being worked on in this response)
  addSchemaDependency('Foo2', 'FooParent') //FooParent is the type that requires this
}

//This is an example of the function to generate:
export function addSchemas(): void {
  //register schemas here: (for types being worked on in this response)
  addSchema('Foo2', schemaFoo2) //here we register Foo2
  addSchema('FooParent', schemaFooParent) //here we register FooParent
}
```

you do not need to generate any output other than "ok" at the end of this first query. Follow up queries

Following this when you see a type pasted, please write the serialize and deserialize functions.
Also please generate the ajv schemas and register them per the addSchemaDependencies example

you do not need to generate a verify\* function or actually instantiate ajv, just handle the above mentioned
registration tasks for the schema.
please put all output in a single file.
remember you can just reply ok to this first statement, then provide generated code when types are listed in follow
up requests.