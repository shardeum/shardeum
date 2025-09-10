const noUnusedPureCalls = require('./rules/no-unused-pure-calls');

module.exports = {
  rules: {
    'no-unused-pure-calls': noUnusedPureCalls,
  },
  configs: {
    recommended: {
      plugins: ['pure-functions'],
      rules: {
        'pure-functions/no-unused-pure-calls': 'error',
      },
    },
  },
};