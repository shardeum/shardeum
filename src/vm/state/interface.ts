import { Account, Address } from 'ethereumjs-util'
import { AccessList } from '@ethereumjs/tx'
import { Proof } from './stateManager'

/**
 * Storage values of an account
 */
export interface StorageDump {
  [key: string]: string
}

export interface StateManager {
  copy(): StateManager
  getAccount(address: Address): Promise<Account>
  putAccount(address: Address, account: Account): Promise<void>
  deleteAccount(address: Address): Promise<void>
  touchAccount(address: Address): void
  putContractCode(address: Address, value: Buffer): Promise<void>
  getContractCode(address: Address): Promise<Buffer>
  getContractStorage(address: Address, key: Buffer): Promise<Buffer>
  getOriginalContractStorage(address: Address, key: Buffer): Promise<Buffer>
  putContractStorage(address: Address, key: Buffer, value: Buffer): Promise<void>
  clearContractStorage(address: Address): Promise<void>
  checkpoint(): Promise<void>
  commit(): Promise<void>
  revert(): Promise<void>
  getStateRoot(force?: boolean): Promise<Buffer>
  setStateRoot(stateRoot: Buffer): Promise<void>
  dumpStorage(address: Address): Promise<StorageDump>
  hasGenesisState(): Promise<boolean>
  generateCanonicalGenesis(): Promise<void>
  generateGenesis(initState: any): Promise<void>
  accountIsEmpty(address: Address): Promise<boolean>
  accountExists(address: Address): Promise<boolean>
  cleanupTouchedAccounts(): Promise<void>
  clearOriginalStorageCache(): void
  getProof?(address: Address, storageSlots: Buffer[]): Promise<Proof>
  verifyProof?(proof: Proof): Promise<boolean>
}

export interface EIP2929StateManager extends StateManager {
  addWarmedAddress(address: Buffer): void
  isWarmedAddress(address: Buffer): boolean
  addWarmedStorage(address: Buffer, slot: Buffer): void
  isWarmedStorage(address: Buffer, slot: Buffer): boolean
  clearWarmedAccounts(): void
  generateAccessList?(addressesRemoved: Address[], addressesOnlyStorage: Address[]): AccessList
}
