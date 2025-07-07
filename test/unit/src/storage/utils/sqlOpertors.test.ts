import { Op } from '../../../../../src/storage/utils/sqlOpertors'

describe('sqlOpertors', () => {
  describe('Op', () => {
    it('should export an object with operator symbols', () => {
      expect(Op).toBeDefined()
      expect(typeof Op).toBe('object')
    })

    it('should have gte operator as a Symbol', () => {
      expect(typeof Op.gte).toBe('symbol')
      expect(Op.gte.toString()).toBe('Symbol(gte)')
    })

    it('should have lte operator as a Symbol', () => {
      expect(typeof Op.lte).toBe('symbol')
      expect(Op.lte.toString()).toBe('Symbol(lte)')
    })

    it('should have in operator as a Symbol', () => {
      expect(typeof Op.in).toBe('symbol')
      expect(Op.in.toString()).toBe('Symbol(in)')
    })

    it('should have between operator as a Symbol', () => {
      expect(typeof Op.between).toBe('symbol')
      expect(Op.between.toString()).toBe('Symbol(between)')
    })

    it('should have exactly 4 operators', () => {
      const operatorKeys = Object.keys(Op)
      expect(operatorKeys).toHaveLength(4)
      expect(operatorKeys).toEqual(['gte', 'lte', 'in', 'between'])
    })

    it('should have unique symbols for each operator', () => {
      const symbols = Object.values(Op)
      const uniqueSymbols = new Set(symbols)
      expect(uniqueSymbols.size).toBe(symbols.length)
    })

    it('should maintain the same symbol references', () => {
      const originalGte = Op.gte
      const originalLte = Op.lte
      const originalIn = Op.in
      const originalBetween = Op.between
      
      // Even if we try to reassign (which won't work with const), 
      // the references should remain the same
      expect(Op.gte).toBe(originalGte)
      expect(Op.lte).toBe(originalLte)
      expect(Op.in).toBe(originalIn)
      expect(Op.between).toBe(originalBetween)
    })

    it('should be usable as object keys', () => {
      const queryConditions = {
        [Op.gte]: 10,
        [Op.lte]: 20,
        [Op.in]: [1, 2, 3],
        [Op.between]: [5, 15],
      }

      expect(queryConditions[Op.gte]).toBe(10)
      expect(queryConditions[Op.lte]).toBe(20)
      expect(queryConditions[Op.in]).toEqual([1, 2, 3])
      expect(queryConditions[Op.between]).toEqual([5, 15])
    })

    it('should work in switch statements', () => {
      const testOperator = (op: symbol): string => {
        switch (op) {
          case Op.gte:
            return 'greater than or equal'
          case Op.lte:
            return 'less than or equal'
          case Op.in:
            return 'in array'
          case Op.between:
            return 'between values'
          default:
            return 'unknown'
        }
      }

      expect(testOperator(Op.gte)).toBe('greater than or equal')
      expect(testOperator(Op.lte)).toBe('less than or equal')
      expect(testOperator(Op.in)).toBe('in array')
      expect(testOperator(Op.between)).toBe('between values')
      expect(testOperator(Symbol('other'))).toBe('unknown')
    })
  })
})