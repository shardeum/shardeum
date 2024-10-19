import { AccountType, BaseAccount } from './shardeumTypes'
import { updateEthAccountHash } from './wrappedEVMAccountFunctions'
import { ShardeumFlags } from './shardeumFlags'

export interface SecureAccount extends BaseAccount {
  id: string
  hash: string
  timestamp: number
  name: string
  startingLockedFunds: number
  unlockRecipient: string
  unlockLimit: number
  unlockDelay: number
  unlockInitalConstant: number
  unlockRate: number
  mintedFunds: number
  lockedFunds: number
  lastUnlockTime: number
  nonce: number
}

export interface SecureAccountConfig {
  id: string
  name: string
  startingLockedFunds: number
  unlockRecipient: string
  unlockLimit: number
  unlockDelay: number
  unlockInitalConstant: number
  unlockRate: number
}

export function isSecureAccount(obj: unknown): obj is SecureAccount {
  return typeof obj === 'object' && obj !== null && 'name' in obj && 'unlockRecipient' in obj
}

export function initializeSecureAccount(
  secureAccountConfig: SecureAccountConfig,
  latestCycles: { start: number }[]
): SecureAccount {
  let cycleStart = 0
  if (latestCycles.length > 0) {
    cycleStart = latestCycles[0].start * 1000
  }

  const secureAccount: SecureAccount = {
    id: secureAccountConfig.id,
    hash: '',
    timestamp: cycleStart,
    accountType: AccountType.SecureAccount,
    name: secureAccountConfig.name,
    startingLockedFunds: secureAccountConfig.startingLockedFunds,
    unlockRecipient: secureAccountConfig.unlockRecipient,
    unlockLimit: secureAccountConfig.unlockLimit,
    unlockDelay: secureAccountConfig.unlockDelay,
    unlockInitalConstant: secureAccountConfig.unlockInitalConstant,
    unlockRate: secureAccountConfig.unlockRate,
    mintedFunds: 0,
    lockedFunds: secureAccountConfig.startingLockedFunds,
    lastUnlockTime: cycleStart,
    nonce: 0
  }

  updateEthAccountHash(secureAccount)

  if (ShardeumFlags.VerboseLogs) console.log('SecureAccount created', secureAccount)

  return secureAccount
}
