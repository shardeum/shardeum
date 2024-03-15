import { ShardeumFlags } from '../shardeum/shardeumFlags'

export const getExternalApiMiddleware = () => {
  return (req, res, next): unknown => {
    const { path, method } = req

    let isAllowed = true // Default to true

    if (ShardeumFlags.startInServiceMode && Array.isArray(ShardeumFlags.allowedEndpointsInServiceMode)) {
      /* prettier-ignore */ console.log(`time: ${new Date().toISOString()} - ${method} ${path} - Service mode is enabled`)
      isAllowed = checkIfRequestIsAllowed(path, method, ShardeumFlags.allowedEndpointsInServiceMode)
    }

    if (isAllowed) {
      next()
    } else {
      return res.status(403).json({
        status: 403,
        message: 'FORBIDDEN. This endpoint and method are not allowed in Service mode.',
      })
    }
  }
}

function checkIfRequestIsAllowed(requestPath, requestMethod, allowedEndpoints): boolean {
  const endpointMatch = allowedEndpoints.find((endpoint) => {
    const [allowedMethod, allowedPattern] = endpoint.split(' ')
    // eslint-disable-next-line security/detect-non-literal-regexp
    const pathRegex = new RegExp(`^${allowedPattern.replace(/\*/g, '.*')}$`)

    return requestMethod === allowedMethod && pathRegex.test(requestPath)
  })

  return !!endpointMatch
}
