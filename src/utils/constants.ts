import { Account, Address, BN, zeroAddress, isZeroAddress } from 'ethereumjs-util'

export const zeroAddressStr = '0x0000000000000000000000000000000000000000'

const acctData = {
  nonce: 0,
  balance: new BN(0)
}
export const zeroAddressAccount = Account.fromAccountData(acctData)
