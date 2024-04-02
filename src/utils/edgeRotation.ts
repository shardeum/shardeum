import config from '../config'

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