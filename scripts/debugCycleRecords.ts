// ts-nocheck
import { Utils } from '@shardus/types'
const fs = require('fs')
const readline = require('readline')
const path = require('path')
const isEqual = require('fast-deep-equal')

let func = process.argv[2]
const arg1 = process.argv[3] === undefined ? undefined : parseInt(process.argv[3])
const arg2 = process.argv[4] === undefined ? undefined : parseInt(process.argv[4])
const details = func.endsWith('d')
if (details) func = func.slice(0, -1)
//const fileName = process.argv[4] === undefined ? 'cycleRecords2.txt' : process.argv[4];

// Initialize the completeCycles array
const completeCycles = []

// Define the path to the completeCycles.txt file
const filePath = path.join(__dirname, '..', 'instances', 'data-logs', 'cycleRecords1.txt')

// Create a readline interface
const rl = readline.createInterface({
  input: fs.createReadStream(filePath),
  output: process.stdout,
  terminal: false,
})

// Read the file line by line
rl.on('line', (line) => {
  // Parse the stringified JSON object from each line
  const { id, port, cycleNumber, cycleRecord } = Utils.safeJsonParse(line)

  // Ensure the completeCycles array is large enough
  while (completeCycles.length <= cycleNumber) {
    completeCycles.push([])
  }

  // Append the cycleRecord to the appropriate subarray
  completeCycles[cycleNumber].push({ id, port, cycleRecord })
})

// When file reading is complete, log the completeCycles array or perform further processing
rl.on('close', () => {
  console.log('Finished reading the file. Processing complete.')
  const cycleDetails = []

  const checkDetails = (checkId, cycleArray, index) => {
    if (!details) return

    while (cycleDetails.length < index + 1) {
      cycleDetails.push({
        edge: [],
        startedSyncing: [],
        finishedSyncing: [],
      })
    }

    for (const cycle of cycleArray) {
      if (cycle.id == checkId) continue

      if (cycle.cycleRecord.startedSyncing && cycle.cycleRecord.startedSyncing.contains(checkId)) {
        cycleDetails[index].startedSyncing.push(checkId)
        cycleDetails[index].edge.push(checkId)
        break
      }

      if (cycle.cycleRecord.finishedSyncing && cycle.cycleRecord.finishedSyncing.contains(checkId)) {
        cycleDetails[index].finishedSyncing.push(checkId)
        cycleDetails[index].edge.push(checkId)
        break
      }
    }
  }

  const printDetails = (i) => {
    if (!details) return

    if (cycleDetails[i].finishedSyncing.length > 0) {
      console.log(`${cycleDetails[i].finishedSyncing.length} nodes finished syncing`)
    }
    if (cycleDetails[i].startedSyncing.length > 0) {
      console.log(`${cycleDetails[i].startedSyncing.length} nodes started syncing`)
    }
    if (cycleDetails[i].edge.length > 0) {
      console.log(`${cycleDetails[i].edge.length} nodes on edge`)
    } else {
      console.log(`no edge nodes`)
    }
  }

  const uniqueCompleteCycles = completeCycles.map((cycleArray, index) => {
    const cycleMap = new Map()
    //console.log(cycleArray);
    //console.log(cycleMap);
    cycleArray.forEach(({ id, port, cycleRecord }) => {
      let found = false
      for (const [key, value] of cycleMap.entries()) {
        if (isEqual(key, cycleRecord)) {
          value.push(port)
          cycleMap.set(key, value)
          found = true
          checkDetails(id, cycleArray, index)
          break
        }
      }

      if (!found) {
        cycleMap.set(cycleRecord, [port])
        checkDetails(id, cycleArray, index)
      }
    })

    return cycleMap
  })

  function printCycle(cycle) {
    console.log('Cycle', cycle)
    console.log('Unique records:', uniqueCompleteCycles[cycle].size)
    for (const [key, value] of uniqueCompleteCycles[cycle].entries()) {
      console.log(`${value.length} nodes: ${value.join(', ')} `)
      console.log(key)
    }
  }

  function printCycles(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length
    for (let i = start; i < end; i++) {
      printCycle(i)
    }
  }

  function printVariantCycles(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length
    for (let i = start; i < end; i++) {
      if (uniqueCompleteCycles[i].size > 1) printCycle(i)
    }
  }

  function printVariancePerCycle(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length
    for (let i = start; i < end; i++) {
      console.log(`Cycle ${i} has ${uniqueCompleteCycles[i].size} unique records`)
      printDetails(i)
    }
  }

  function printVariancePerVariantCycles(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length
    for (let i = start; i < end; i++) {
      if (uniqueCompleteCycles[i].size > 1) {
        console.log(`Cycle ${i} has ${uniqueCompleteCycles[i].size} unique records`)
        printDetails(i)
      }
    }
  }

  if (func === 'help') {
    console.log('Available functions: pc, pcs, pvc, pvpc')
    console.log('pc: print cycle (args: cycle number)')
    console.log('pcs: print cycles (args: start cycle number, end cycle number)')
    console.log('pvc: print variant cycles (args: start cycle number, end cycle number)')
    console.log(
      'pvpc: (pvpcd for edge node details) print variance per cycle (args: start cycle number, end cycle number)'
    )
    console.log(
      'pvpvc: (pvpvcd for edge node details) print variance per variant cycles (args: start cycle number, end cycle number)'
    )
  } else if (func === 'pc') {
    printCycle(arg1)
  } else if (func === 'pcs') {
    printCycles(arg1, arg2)
  } else if (func === 'pvc') {
    printVariantCycles(arg1, arg2)
  } else if (func === 'pvpc') {
    printVariancePerCycle(arg1, arg2)
  } else if (func === 'pvpvc') {
    printVariancePerVariantCycles(arg1, arg2)
  }
})
