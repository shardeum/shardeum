import { createNamespace } from 'cls-hooked'

export const namespace = createNamespace('request-context')

// Function to run within the context
export function runWithContext(fn: (...args: unknown[]) => void, context: Record<string, unknown>): void {
  namespace.run(() => {
    Object.keys(context).forEach((key) => {
      // eslint-disable-next-line security/detect-object-injection
      namespace.set(key, context[key])
    })

    fn()
  })
}

export async function runWithContextAsync(
  fn: () => Promise<void> | void,
  context: Record<string, unknown>
): Promise<void> {
  return new Promise((resolve, reject) => {
    namespace.runAndReturn(async () => {
      Object.keys(context).forEach((key) => {
        // eslint-disable-next-line security/detect-object-injection
        namespace.set(key, context[key])
      })

      try {
        await fn()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
}

// Function to get a value from the context
export function getContextValue<T>(key: string): T | undefined {
  return namespace.get(key)
}
