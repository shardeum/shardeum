import { nestedCountersInstance } from '@shardeum-foundation/core'

export function logEnvSetup(): void {
  try {
    console.log('LOAD_JSON_CONFIGS', process.env.LOAD_JSON_CONFIGS)
    console.log('LOAD_JSON_MULTISIG_PERMISSIONS', process.env.LOAD_JSON_MULTISIG_PERMISSIONS)
    console.log('LOAD_JSON_GENESIS_SECURE_ACCOUNTS', process.env.LOAD_JSON_GENESIS_SECURE_ACCOUNTS)
    console.log('LOAD_JSON_GENESIS', process.env.LOAD_JSON_GENESIS)

    if (nestedCountersInstance != null) {
      nestedCountersInstance.countEvent('env', 'LOAD_JSON_CONFIGS ' + process.env.LOAD_JSON_CONFIGS)
      nestedCountersInstance.countEvent(
        'env',
        'LOAD_JSON_MULTISIG_PERMISSIONS ' + process.env.LOAD_JSON_MULTISIG_PERMISSIONS
      )
      nestedCountersInstance.countEvent(
        'env',
        'LOAD_JSON_GENESIS_SECURE_ACCOUNTS ' + process.env.LOAD_JSON_GENESIS_SECURE_ACCOUNTS
      )
      nestedCountersInstance.countEvent('env', 'LOAD_JSON_GENESIS ' + process.env.LOAD_JSON_GENESIS)
    }
  } catch (e) {
    //if we crashed from logging I guess we should not log right now.
  }
}
