import * as Sequelize from 'sequelize'

const accountsEntry = [
  'accountsEntry',
  {
    accountId: { type: Sequelize.STRING, allowNull: false, unique: 'compositeIndex' }, //, primaryKey: true
    timestamp: { type: Sequelize.BIGINT, allowNull: false, unique: 'compositeIndex' }, //do we need bigint...
    data: { type: Sequelize.JSON, allowNull: false }, //binary?
    //hash: { type: Sequelize.STRING, allowNull: false },
  },
]

export default accountsEntry
