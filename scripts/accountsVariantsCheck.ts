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
      .filter((address) => cycleData[cycle][address].size > 1)
      .map((address) => {
        const hashNodes = []
        cycleData[cycle][address].forEach((nodes, hash) => {
          hashNodes.push({ hash, nodes: Array.from(nodes) })
        })
        return { address, hashNodes }
      })

    if (differingAccounts[cycle].length === 0) {
      delete differingAccounts[cycle]
    }
  })

  return differingAccounts
}

function main() {
  const startCycle = parseInt(process.argv[2], 10) || 0

  const instances = fs.readdirSync(baseDir).filter((instance) => instance.startsWith('shardus-instance-'))
  const logEntries = []

  instances.forEach((instance) => {
    const logFilePath = path.join(baseDir, instance, 'logs', 'out.log')
    if (fs.existsSync(logFilePath)) {
      logEntries.push(...readLogFile(logFilePath, instance))
    } else {
      console.warn(`Log file not found for instance: ${instance}`)
    }
  })

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

main()
