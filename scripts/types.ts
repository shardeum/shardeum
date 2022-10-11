export type DBHistoryFile = {
  oldFilename: string
  newFilename: string
  historyFileName: string
}

export type AccountHistoryModel = {
  accountId: string
  evmAddress: string
  accountType: string
  firstSeen: number
  lastSeen: number
  accountBalance: string
  codehash: string
  typeChanged: boolean
}
