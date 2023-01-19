import { BN } from 'ethereumjs-util'

export const networkAccount = '0'.repeat(64) //address
export const oneEth = new BN(10).pow(new BN(18))
export const ONE_SECOND = 1000
export const ONE_MINUTE = 60 * ONE_SECOND
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_DAY = 24 * ONE_HOUR
