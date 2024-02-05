import { SQLDataTypes } from '../utils/schemaDefintions'

const accountsEntry = [
  'accountsEntry',
  {
    accountId: { type: SQLDataTypes.STRING, allowNull: false, unique: 'compositeIndex' }, //, primaryKey: true
    timestamp: { type: SQLDataTypes.BIGINT, allowNull: false, unique: 'compositeIndex' }, //do we need bigint...
    data: { type: SQLDataTypes.JSON, allowNull: false }, //binary?
    //hash: { type: SQLDataTypes.STRING, allowNull: false },
  },
]

export default accountsEntry
