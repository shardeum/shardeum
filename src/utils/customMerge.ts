import merge, { Options } from 'deepmerge'

const overwriteMerge = (target: any[], source: any[]): any[] => source

const shouldOverwrite = (path: string[], keysToOverwrite: string[]): boolean => {
  const pathStr = path.join('.')
  return keysToOverwrite.some((key) => {
    // Check if the path matches exactly or is a child of the key
    // OR if the key is a parent of the current path
    return pathStr === key || pathStr.startsWith(key + '.') || key.startsWith(pathStr + '.')
  })
}

interface CustomOptions extends Options {
  path?: string[]
}

export const createCustomMerge = (
  keysToOverwrite: string[]
): ((key: string, options?: CustomOptions) => ((target: any, source: any) => any) | undefined) => {
  return (key: string, options?: CustomOptions): ((target: any, source: any) => any) | undefined => {
    const path = options?.path || []
    const currentPath = [...path, key]

    if (shouldOverwrite(currentPath, keysToOverwrite)) {
      return (target: any, source: any) => {
        return source
      }
    }

    return undefined
  }
}

export const mergeWithOverwrite = (target: any, source: any, keysToOverwrite: string[] = []): any => {
  if (!target || !source) {
    return target || source
  }

 const processedKeys = Array.isArray(keysToOverwrite)
   ? keysToOverwrite.map((key) => {
       return key.replace(/^\.+/, '')
     })
   : []

  const result = merge(target, source, {
    arrayMerge: overwriteMerge,
    customMerge: createCustomMerge(processedKeys),
  })

  return result
}
