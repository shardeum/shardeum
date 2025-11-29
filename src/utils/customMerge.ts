import merge, { Options } from 'deepmerge'

const overwriteMerge = (target: unknown[], source: unknown[]): unknown[] => source

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
): ((key: string, options?: CustomOptions) => ((target: unknown, source: unknown) => unknown) | undefined) => {
  return (key: string, options?: CustomOptions): ((target: unknown, source: unknown) => unknown) | undefined => {
    const path = options?.path || []
    const currentPath = [...path, key]

    if (shouldOverwrite(currentPath, keysToOverwrite)) {
      return (target: unknown, source: unknown): unknown => {
        return source
      }
    }

    return undefined
  }
}

export const mergeWithOverwrite = <T>(
  target: T,
  source: Partial<T> | Record<string, unknown>,
  keysToOverwrite: string[] = []
): T => {
  if (!target || !source) {
    return (target || source) as T
  }

  const processedKeys = Array.isArray(keysToOverwrite)
    ? keysToOverwrite.map((key) => {
        return key.replace(/^\.+/, '')
      })
    : []

  const result = merge<T>(target, source as Partial<T>, {
    arrayMerge: overwriteMerge,
    customMerge: createCustomMerge(processedKeys),
  })

  return result
}
