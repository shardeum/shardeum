import { WrappedEVMAccount, AccountType } from '../shardeum/shardeumTypes'

export function isContractStorageAccount(account: WrappedEVMAccount): boolean {
  return account && account.accountType === AccountType.ContractStorage && account.value instanceof Uint8Array
}

export function compressContractStorageValue(account: WrappedEVMAccount): WrappedEVMAccount {
  if (!isContractStorageAccount(account)) return account
  
  const value = account.value as Uint8Array
  let firstNonZero = 0
  while (firstNonZero < value.length && value[firstNonZero] === 0) firstNonZero++
  
  if (firstNonZero === value.length) return { ...account, value: new Uint8Array([0]) }
  return { ...account, value: value.slice(firstNonZero) }
}

export function decompressContractStorageValue(account: WrappedEVMAccount): WrappedEVMAccount {
  if (!isContractStorageAccount(account)) return account
  
  // Handle case where Uint8Array was corrupted during JSON serialization
  let value: Uint8Array
  if (account.value instanceof Uint8Array) {
    value = account.value
  } else if (typeof account.value === 'object' && account.value !== null && !Array.isArray(account.value)) {
    // Convert plain object back to Uint8Array (this handles the JSON serialization issue)
    const keys = Object.keys(account.value).map(k => parseInt(k)).filter(k => !isNaN(k)).sort((a, b) => a - b)
    
    // Find the maximum index to determine the correct array length
    const maxIndex = Math.max(...keys)
    const arrayLength = maxIndex + 1
    
    value = new Uint8Array(arrayLength)
    for (const key of keys) {
      value[key] = (account.value as any)[key.toString()]
    }
  } else {
    return account
  }
  
  if (value.length === 1 && value[0] === 0) {
    return { ...account, value: new Uint8Array(32) }
  }
  if (value.length < 32) {
    const padded = new Uint8Array(32)
    padded.set(value, 32 - value.length)
    return { ...account, value: padded }
  }
  return { ...account, value }
}
