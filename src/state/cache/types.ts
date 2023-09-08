export enum CacheType {
  LRU = 'lru',
  ORDERED_MAP = 'ordered_map',
}

export interface CacheOpts {
  size: number
  type: CacheType
}
