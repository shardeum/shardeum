export interface AccountData {
  accountId: string
  data: string
  timestamp: number
  hash: string
  cycleNumber: number
  isGlobal: number
}

export interface TransactionData {
  txId: string
  appReceiptId: string
  timestamp: number
  cycleNumber: number
  data: string
  originalTxData: string
}

export interface ReceiptData {
  receiptId: string
  tx: string
  cycle: number
  applyTimestamp: number
  timestamp: number
  signedReceipt: string
  afterStates: string | null
  beforeStates: string | null
  appReceiptData: string | null
  executionShardKey: string | null
  globalModification: number
}

export interface AccountLedgerEntry {
  receiptId: string
  tx_hash: string
  eth_address: string
  accountId: string
  cycle: number
  timestamp: number
  tx_value: string
  final_balance: string
  balance_change: string
  data: string | null
}

export interface ProcessedTransaction {
  txId: string
  cycle: number
  txTimestamp: number
  applyTimestamp: number
}

export interface SimulationResult {
  transactionId: string
  originalStatus: number
  simulatedStatus: number
  affectedAccounts: string[]
  balanceImpact: Map<string, bigint>
  reconciles: boolean
}

export interface BalanceMismatch {
  accountId: string
  ethAddress: string
  expectedBalance: bigint
  actualBalance: bigint
  difference: bigint
  relatedTransactions: string[]
}

export interface StatusFlipCandidate {
  transactionId: string
  currentStatus: number
  reason: string
  potentialImpact: bigint
  affectedAccounts: string[]
}