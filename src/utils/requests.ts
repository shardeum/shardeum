import { ShardusTypes } from '@shardus/core'
import axios, { AxiosRequestConfig } from 'axios'

export const shardusGet = async <ResponseType>(url: string, config: AxiosRequestConfig) => {
  const response = axios.get<ResponseType>(url, config)
  return response
}

export const shardusPost = async <ResponseType>(url: string, config: AxiosRequestConfig) => {
  const response = axios.post<ResponseType>(url, config)
  return response
}

export const shardusPut = async <ResponseType>(url: string, config: AxiosRequestConfig) => {
  const response = axios.put<ResponseType>(url, config)
  return response
}

/**
 * Perform a GET request on the specified node
 * @param node
 * @param path path prefixed with /
 * @param config
 * @returns
 */
export const shardusGetFromNode = async <ResponseType>(
  node: ShardusTypes.Node,
  path: string,
  config?: AxiosRequestConfig
) => {
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
  node: ShardusTypes.Node,
  path: string,
  config?: AxiosRequestConfig
) => {
  const url = urlFromNode(node, path)
  return shardusPost<ResponseType>(url, config)
}

/**
 * Perform a PUT request on the specified node
 * @param node
 * @param path path prefixed with /
 * @param config
 * @returns
 */
export const shardusPutToNode = async <ResponseType>(
  node: ShardusTypes.Node,
  path: string,
  config?: AxiosRequestConfig
) => {
  const url = urlFromNode(node, path)
  return shardusPut<ResponseType>(url, config)
}

// Update the node type here; We can import from P2P.P2PTypes.Node from '@shardus/type' lib but seems it's not installed yet
const urlFromNode = (node: any, path: string) => {
  const host = normalizeUrl(`${node.ip}:${node.port}`)
  const url = `${host}/${path}`
  return url
}

function containsProtocol(url: string) {
  if (!url.match('https?://*')) return false
  return true
}

function normalizeUrl(url: string) {
  let normalized = url
  if (!containsProtocol(url)) normalized = 'http://' + url
  return normalized
}
