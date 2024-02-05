import { SQLDataTypes } from '../utils/schemaDefintions'

const riAccountsCache = [
  'riAccountsCache',
  {
    accountId: { type: SQLDataTypes.STRING, allowNull: false, unique: 'compositeIndex' },
    timestamp: { type: SQLDataTypes.BIGINT, allowNull: false, unique: 'compositeIndex' },
    data: { type: SQLDataTypes.JSON, allowNull: false },
  },
]

export default riAccountsCache
