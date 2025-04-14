import { mergeWithOverwrite } from '../../../src/utils/customMerge'

describe('customMerge', () => {
  describe('mergeWithOverwrite', () => {
    it('should handle null/undefined inputs', () => {
      const target = { a: 1 }
      const source = { b: 2 }

      expect(mergeWithOverwrite(null, source)).toEqual(source)
      expect(mergeWithOverwrite(target, null)).toEqual(target)
      expect(mergeWithOverwrite(undefined, source)).toEqual(source)
      expect(mergeWithOverwrite(target, undefined)).toEqual(target)
    })

    it('should merge simple objects without overwrite keys', () => {
      const target = { a: 1, b: { c: 2 } }
      const source = { a: 3, b: { d: 4 } }

      const result = mergeWithOverwrite(target, source)

      expect(result).toEqual({
        a: 3,
        b: { c: 2, d: 4 },
      })
    })

    it('should completely overwrite specified paths', () => {
      const target = {
        server: {
          p2p: { cycleDuration: 60, minNodes: 1280 },
          sharding: { nodesPerConsensusGroup: 128 },
          debug: { devPublicKeys: { key1: 1 } },
        },
      }

      const source = {
        server: {
          p2p: { cycleDuration: 30 },
          sharding: { nodesPerConsensusGroup: 10 },
          debug: { devPublicKeys: { key2: 2 } },
        },
      }

      const result = mergeWithOverwrite(target, source, ['server.p2p', 'server.sharding', 'server.debug.devPublicKeys'])

      expect(result).toEqual({
        server: {
          p2p: { cycleDuration: 30 }, // Completely overwritten
          sharding: { nodesPerConsensusGroup: 10 }, // Completely overwritten
          debug: { devPublicKeys: { key2: 2 } }, // Completely overwritten
        },
      })
    })

    it('should handle nested object overwrites', () => {
      const target = {
        a: {
          b: {
            c: 1,
            d: 2,
          },
          e: 3,
        },
      }

      const source = {
        a: {
          b: {
            c: 4,
            f: 5,
          },
          e: 6,
        },
      }

      const result = mergeWithOverwrite(target, source, ['a.b'])

      expect(result).toEqual({
        a: {
          b: {
            c: 4,
            f: 5,
          },
          e: 6,
        },
      })
    })

    it('should handle array overwrites', () => {
      const target = {
        items: [1, 2, 3],
        nested: {
          items: [4, 5, 6],
        },
      }

      const source = {
        items: [7, 8],
        nested: {
          items: [9, 10],
        },
      }

      const result = mergeWithOverwrite(target, source, ['items', 'nested.items'])

      expect(result).toEqual({
        items: [7, 8],
        nested: {
          items: [9, 10],
        },
      })
    })

    it('should handle paths with leading dots', () => {
      const target = {
        server: {
          debug: {
            devPublicKeys: { key1: 1 },
          },
        },
      }

      const source = {
        server: {
          debug: {
            devPublicKeys: { key2: 2 },
          },
        },
      }

      const result = mergeWithOverwrite(target, source, ['.server.debug.devPublicKeys'])

      expect(result).toEqual({
        server: {
          debug: {
            devPublicKeys: { key2: 2 },
          },
        },
      })
    })

    it('should handle parent path overwrites', () => {
      const target = {
        server: {
          debug: {
            devPublicKeys: { key1: 1 },
            multisigKeys: { key2: 2 },
          },
        },
      }

      const source = {
        server: {
          debug: {
            devPublicKeys: { key3: 3 },
            multisigKeys: { key4: 4 },
          },
        },
      }

      const result = mergeWithOverwrite(target, source, ['server.debug'])

      expect(result).toEqual({
        server: {
          debug: {
            devPublicKeys: { key3: 3 },
            multisigKeys: { key4: 4 },
          },
        },
      })
    })

    it('should handle non-matching overwrite paths', () => {
      const target = {
        server: {
          p2p: { cycleDuration: 60 },
          sharding: { nodesPerConsensusGroup: 128 },
        },
      }

      const source = {
        server: {
          p2p: { cycleDuration: 30 },
          sharding: { nodesPerConsensusGroup: 10 },
        },
      }

      const result = mergeWithOverwrite(target, source, ['nonexistent.path'])

      expect(result).toEqual({
        server: {
          p2p: { cycleDuration: 30 },
          sharding: { nodesPerConsensusGroup: 10 },
        },
      })
    })

    it('should handle empty objects and arrays', () => {
      const target = {
        emptyObj: {},
        emptyArr: [],
        nested: {
          emptyObj: {},
          emptyArr: [],
        },
      }

      const source = {
        emptyObj: { a: 1 },
        emptyArr: [1],
        nested: {
          emptyObj: { b: 2 },
          emptyArr: [2],
        },
      }

      const result = mergeWithOverwrite(target, source, ['nested'])

      expect(result).toEqual({
        emptyObj: { a: 1 },
        emptyArr: [1],
        nested: {
          emptyObj: { b: 2 },
          emptyArr: [2],
        },
      })
    })
  })
})
