import config from '../config'
import {nestedCountersInstance, Shardus} from '@shardus/core'

export function isNodeRecentlyRotatedIn(idx: number, numActiveNodes: number): boolean {
  return (
    numActiveNodes >= 10 + config.server.p2p.rotationEdgeToAvoid &&
    config.server.p2p.rotationEdgeToAvoid &&
    idx <= config.server.p2p.rotationEdgeToAvoid
  )
}

export function isNodeNearRotatingOut(idx: number, numActiveNodes: number): boolean {
  return (
    numActiveNodes >= 10 + config.server.p2p.rotationEdgeToAvoid &&
    config.server.p2p.rotationEdgeToAvoid &&
    idx >= numActiveNodes - config.server.p2p.rotationEdgeToAvoid
  )
}
export function isNodeOutOfRotationBounds(
  shardus: Shardus,
  nodeId: string
): boolean {

  const { idx, total } = shardus.getNodeRotationIndex(nodeId)
  // skip freshly rotated in nodes
  if (isNodeRecentlyRotatedIn(idx, total)) {
    nestedCountersInstance.countEvent('skip-newly-rotated-node', nodeId)
    return false
  }

  // skip about to be rotated out nodes
  if (isNodeNearRotatingOut(idx, total)) {
    nestedCountersInstance.countEvent('skip-about-to-rotate-out-node', nodeId)
    return false
  }
}
