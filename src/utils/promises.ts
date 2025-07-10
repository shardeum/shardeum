export const fireAndForget = (fn: () => Promise<unknown>, onError?: (error: Error) => void): void => {
  fn().catch((err) => {
    const errorHandler =
      onError ||
      ((error: Error) => {
        console.log('Fire-and-forget error caught:', error)
        // TODO: Consider integrating with a more robust logging system if available.
      })

    if (err instanceof Error) {
      errorHandler(err)
    } else {
      // If it's not an Error instance, wrap it in one.
      errorHandler(new Error(String(err)))
    }
  })
}
