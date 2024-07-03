const fs = require('fs')
const path = require('path')

const baseDir = 'instances'

function readLogFile(logFile) {
  const data = fs.readFileSync(logFile, 'utf8')
  const logEntries = data.split('\n').filter((entry) => entry.includes('dumpAccountData'))
  return logEntries
    .map((entry) => {
      const match = entry.match(/dumpAccountData - cycle: (\d+) node: (\d+) accounts: (.+)/)
      if (match) {
        const cycle = parseInt(match[1], 10)
        const nodeName = match[2]
        let accounts
        try {
          accounts = JSON.parse(match[3])
        } catch (e) {
          console.error(`Error parsing JSON for log entry: ${entry}`, e)
          return null
        }
        if (accounts.length === 0) {
          return null
        }
        return { cycle, accounts, nodeName }
      }
      return null
    })
    .filter((entry) => entry)
}

function compareAccountHashes(logEntries, startCycle) {
  const cycleData = {}

  logEntries.forEach((entry) => {
    if (entry.cycle >= startCycle) {
      if (!cycleData[entry.cycle]) {
        cycleData[entry.cycle] = {}
      }
      entry.accounts.forEach((account) => {
        if (account.address) {
          if (!cycleData[entry.cycle][account.address]) {
            cycleData[entry.cycle][account.address] = new Map()
          }
          if (!cycleData[entry.cycle][account.address].has(account.hash)) {
            cycleData[entry.cycle][account.address].set(account.hash, new Set())
          }
          cycleData[entry.cycle][account.address].get(account.hash).add(entry.nodeName)
        }
      })
    }
  })

  const differingAccounts = {}

  Object.keys(cycleData).forEach((cycle) => {
    differingAccounts[cycle] = Object.keys(cycleData[cycle])
      .map((address) => {
        const hashCounts = Array.from(cycleData[cycle][address].entries()).map(([hash, nodes]) => ({
          hash,
          nodes: Array.from(nodes),
          count: nodes.size,
        }))
        hashCounts.sort((a, b) => b.count - a.count)
        const majorityHash = hashCounts[0]
        const nonMajorityHashes = hashCounts.slice(1)
        return {
          address,
          majorityHash: majorityHash.hash,
          majorityCount: majorityHash.count,
          nonMajorityHashes,
        }
      })
      .filter((entry) => entry.nonMajorityHashes.length > 0)

    if (differingAccounts[cycle].length === 0) {
      delete differingAccounts[cycle]
    }
  })

  return differingAccounts
}

function getAccountStatus(logEntries, accountAddress, startCycle) {
  const accountStatus = {}

  logEntries.forEach((entry) => {
    if (entry.cycle >= startCycle) {
      entry.accounts.forEach((account) => {
        if (account.address === accountAddress) {
          if (!accountStatus[entry.cycle]) {
            accountStatus[entry.cycle] = new Map()
          }
          if (!accountStatus[entry.cycle].has(account.hash)) {
            accountStatus[entry.cycle].set(account.hash, new Set())
          }
          accountStatus[entry.cycle].get(account.hash).add(entry.nodeName)
        }
      })
    }
  })

  const result = {}

  Object.keys(accountStatus).forEach((cycle) => {
    const hashCounts = Array.from(accountStatus[cycle].entries()).map(([hash, nodes]) => ({
      hash,
      nodes: Array.from(nodes),
      count: nodes.size,
    }))
    hashCounts.sort((a, b) => b.count - a.count)
    const majorityHash = hashCounts[0]
    const nonMajorityHashes = hashCounts.slice(1)

    result[cycle] = {
      majorityHash: majorityHash.hash,
      majorityCount: majorityHash.count,
      nonMajorityHashes,
    }
  })

  return result
}

function main() {
  const args = process.argv.slice(2)
  const startCycle = args[0] ? parseInt(args[0], 10) : 0
  const accountAddress = args[1]

  if (isNaN(startCycle) || (accountAddress && !/^(0x)?[0-9a-fA-F]{40}$/.test(accountAddress))) {
    console.error('Invalid input. Please provide a valid start cycle and optionally a valid account address.')
    process.exit(1)
  }

  const instances = fs.readdirSync(baseDir).filter((instance) => instance.startsWith('shardus-instance-'))
  const logEntries = []

  instances.forEach((instance) => {
    const logFilePath = path.join(baseDir, instance, 'logs', 'out.log')
    if (fs.existsSync(logFilePath)) {
      logEntries.push(...readLogFile(logFilePath))
    } else {
      console.warn(`Log file not found for instance: ${instance}`)
    }
  })

  if (accountAddress) {
    const accountStatus = getAccountStatus(logEntries, accountAddress, startCycle)
    console.log(
      `Status of account ${accountAddress} starting from cycle ${startCycle}:`,
      JSON.stringify(accountStatus, null, 2)
    )
  } else {
    const differingAccounts = compareAccountHashes(logEntries, startCycle)
    if (Object.keys(differingAccounts).length > 0) {
      console.log(
        `Cycles with differing account hashes starting from cycle ${startCycle}:`,
        JSON.stringify(differingAccounts, null, 2)
      )
    } else {
      console.log(`No cycles with differing account hashes found starting from cycle ${startCycle}.`)
    }
  }
}

main()
