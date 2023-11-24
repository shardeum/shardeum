import * as Sequelize from 'sequelize'

const riAccountsCache = [
  'riAccountsCache',
  {
    accountId: { type: Sequelize.STRING, allowNull: false, unique: 'compositeIndex' },
    timestamp: { type: Sequelize.BIGINT, allowNull: false, unique: 'compositeIndex' },
    data: { type: Sequelize.JSON, allowNull: false },
  },
]

export default riAccountsCache
