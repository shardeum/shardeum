import { AccountFields, Proof, StorageDump, StorageRange } from "@ethereumjs/common"
import { Account, Address } from "@ethereumjs/util"


export interface StateManagerInterface {
  getAccount(address: Address): Promise<Account | undefined>
  putAccount(address: Address, account?: Account): Promise<void>
  deleteAccount(address: Address): Promise<void>
  modifyAccountFields(address: Address, accountFields: AccountFields): Promise<void>
  putContractCode(address: Address, value: Uint8Array): Promise<void>
  getContractCode(address: Address): Promise<Uint8Array>
  getContractStorage(address: Address, key: Uint8Array): Promise<Uint8Array>
  putContractStorage(address: Address, key: Uint8Array, value: Uint8Array): Promise<void>
  clearContractStorage(address: Address): Promise<void>
  checkpoint(): Promise<void>
  commit(): Promise<void>
  revert(message:string): Promise<void>
  getStateRoot(): Promise<Uint8Array>
  setStateRoot(stateRoot: Uint8Array, clearCache?: boolean): Promise<void>
  getProof?(address: Address, storageSlots: Uint8Array[]): Promise<Proof>
  hasStateRoot(root: Uint8Array): Promise<boolean> // only used in client
  shallowCopy(): StateManagerInterface
}

export interface EVMStateManagerInterface extends StateManagerInterface {
  originalStorageCache: {
    get(address: Address, key: Uint8Array): Promise<Uint8Array>
    clear(): void
  }

  dumpStorage(address: Address): Promise<StorageDump> // only used in client
  dumpStorageRange(address: Address, startKey: bigint, limit: number): Promise<StorageRange> // only used in client
  generateCanonicalGenesis(initState: any): Promise<void> // TODO make input more typesafe
  getProof(address: Address, storageSlots?: Uint8Array[]): Promise<Proof>

  shallowCopy(): EVMStateManagerInterface
}
