import { ShardusTypes } from '@shardus/core'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export const shardusGet = async <ResponseType>(
  url: string,
  config: AxiosRequestConfig
): Promise<AxiosResponse<ResponseType>> => {
  const response = axios.get<ResponseType>(url, config)
  return response
}

export const shardusPost = async <ResponseType>(
  url: string,
  data: unknown,
  config: AxiosRequestConfig
): Promise<AxiosResponse<ResponseType>> => {
  const response = axios.post<ResponseType>(url, data, config)
  return response
}

export const shardusPut = async <ResponseType>(
  url: string,
  data: unknown,
  config: AxiosRequestConfig
): Promise<AxiosResponse<ResponseType>> => {
  const response = axios.put<ResponseType>(url, data, config)
  return response
}

function containsProtocol(url: string): boolean {
  if (!url.match('https?://*')) return false
  return true
}

function normalizeUrl(url: string): string {
  let normalized = url
  if (!containsProtocol(url)) normalized = 'http://' + url
  return normalized
}

const urlFromNode = (node: ShardusTypes.ValidatorNodeDetails, path: string): string => {
  const host = normalizeUrl(`${node.ip}:${node.port}`)
  const url = `${host}${path}`
  return url
}

/**
 * Perform a GET request on the specified node
 * @param node
 * @param path path prefixed with /
 * @param config
 * @returns
 */
export const shardusGetFromNode = async <ResponseType>(
  node: ShardusTypes.ValidatorNodeDetails,
  path: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ResponseType>> => {
  const url = urlFromNode(node, path)
  return shardusGet<ResponseType>(url, config)
}

/**
 * Perform a POST request on the specified node
 * @param node
 * @param path path prefixed with /
 * @param config
 * @returns
 */
export const shardusPostToNode = async <ResponseType>(
  node: ShardusTypes.ValidatorNodeDetails,
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ResponseType>> => {
  const url = urlFromNode(node, path)
  return shardusPost<ResponseType>(url, data, config)
}

/**
 * Perform a PUT request on the specified node
 * @param node
 * @param path path prefixed with /
 * @param config
 * @returns
 */
export const shardusPutToNode = async <ResponseType>(
  node: ShardusTypes.ValidatorNodeDetails,
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ResponseType>> => {
  const url = urlFromNode(node, path)
  return shardusPut<ResponseType>(url, data, config)
}

/**
 * Get an IP from a request.  This is kept simple and will not try to get
 * an IP from behind a proxy or load balancer.  This is for perf reasons
 * if the stats are not good enough we may rethink this.
 * This is for debug use only and does not validate that a potential proxy is trusted
 * This should only be used to get an IP so that we can log it for debugging purposes
 * @param req
 * @returns
 */
export function getUserIp(req): string {
  if (req == null) {
    return null
  }
  return (
    req.headers['x-forwarded-for'] ||
    (req.connection ? req.connection.remoteAddress : null) ||
    (req.socket ? req.socket.remoteAddress : null) ||
    null
  )
}

/**
 * This is for debug use only and does not validate that a potential proxy is trusted
 * This should only be used to get an IP so that we can log it for debugging purposes
 * @param req
 * @returns
 */
export function unsafeGetClientIp(req): string {
  if (req == null) {
    return null
  }
  let clientIp = req.headers['x-forwarded-for']
  if (clientIp) {
    // extract the client IP address from the X-Forwarded-For header
    const ips = clientIp.split(',')
    clientIp = ips[ips.length - 1].trim()
  } else {
    // fallback to remoteAddress if X-Forwarded-For header is not present
    clientIp = req.connection ? req.connection.remoteAddress : null
  }
  // make sure we return a string or null
  return clientIp as string
}
