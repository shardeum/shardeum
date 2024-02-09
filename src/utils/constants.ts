import { Account } from '@ethereumjs/util'

export const zeroAddressStr = '0x0000000000000000000000000000000000000000'
export const emptyCodeHash = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'

const acctData = {
  nonce: 0,
  balance: BigInt(0),
}
export const zeroAddressAccount = Account.fromAccountData(acctData)
