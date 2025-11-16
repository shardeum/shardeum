import fs from 'fs'
import path from 'path'
import { PenaltyTX } from '../../shardeum/shardeumTypes'
import config from '../../config'
import { FilePaths } from '../../shardeum/shardeumFlags'
import { Utils } from '@shardeum-foundation/lib-types'

const filePath = path.join(config.server.baseDir, FilePaths.PENALTY_TXS)

const penaltyTxs: Map<string, PenaltyTX> = new Map()

export function initPenaltyTxStorage(): void {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8')
      const data = Utils.safeJsonParse(raw)
      if (data && typeof data === 'object') {
        for (const [txId, tx] of Object.entries<PenaltyTX>(data as any)) {
          penaltyTxs.set(txId, tx as PenaltyTX)
        }
      }
    }
  } catch (e) {
    console.error('Failed to load penalty tx records', e)
  }
}

function persist(): void {
  try {
    const obj: Record<string, PenaltyTX> = {}
    penaltyTxs.forEach((tx, id) => {
      obj[id] = tx
    })
    fs.writeFileSync(filePath, JSON.stringify(obj))
  } catch (e) {
    console.error('Failed to persist penalty tx records', e)
  }
}

export function recordPenaltyTx(id: string, tx: PenaltyTX): void {
  if (penaltyTxs.has(id)) return
  penaltyTxs.set(id, tx)
  persist()
}

export function getPenaltyTx(id: string): PenaltyTX | undefined {
  return penaltyTxs.get(id)
}

export function deletePenaltyTx(id: string): void {
  if (penaltyTxs.delete(id)) {
    persist()
  }
}

export function entries(): IterableIterator<[string, PenaltyTX]> {
  return penaltyTxs.entries()
}
