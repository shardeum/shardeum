import { Account, Address, BN, bufferToHex, toBuffer } from 'ethereumjs-util'

import { Transaction, AccessListEIP2930Transaction } from '@ethereumjs/tx'
import { TxReceipt } from '@ethereumjs/vm/dist/types'

export enum AccountType {
  Account, //  EOA or CA
  ContractStorage, // Contract storage key value pair
  ContractCode, // Contract code bytes
  Receipt, //This holds logs for a TX
}

/**
 * Still working out the details here.
 * This has become a variant data type now that can hold an EVM account or a key value pair from CA storage
 * I think that is the shortest path for now to get syncing and repair functionality working
 *
 * Long term I am not certain if we will be able to hold these in memory.  They may have to be a temporary thing
 * that is held in memory for awhile but eventually cleared.  This would mean that we have to be able to pull these
 * from disk again, and that could be a bit tricky.
 */
export interface WrappedEVMAccount {
  accountType: AccountType
  ethAddress: string //account address in EVM space. can have different meanings depending on account type
  hash: string //account hash
  timestamp: number //account timestamp.  last time a TX changed it
  account?: Account //actual EVM account. if this is type Account
  
  // contract storage variant data
  key?: string //EVM CA storage key
  value?: Buffer //EVM buffer value if this is of type CA_KVP
  //Contract code related variant data and addresses
  codeHash?: Buffer
  codeByte?: Buffer
  contractAddress?: string
  //Receipt related variant data
  receipt?: TxReceipt
  txId?: string
  txFrom?: string
}

export interface WrappedEVMAccountMap {
  [id: string]: WrappedEVMAccount
}

export interface EVMAccountInfo {
  type: AccountType
  evmAddress: string
  contractAddress?: string
}


export enum InternalTXType {
  SetGlobalCodeBytes,
}

/**
 * InternalTx is a non EVM TX that shardeum can use for utility task such as global changes
 * 
 */
export interface InternalTx {
  isInternalTx: boolean
  internalTXType: InternalTXType
  timestamp: number
  from: string
  to?: string
  accountData?: WrappedEVMAccount

}

export interface WrappedAccount {
  accountId: string
  stateId: string
  data: any
  timestamp: number
  accountCreated?: boolean
}

export interface WrappedStates {
  [id: string]: WrappedAccount
}

