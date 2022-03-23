import * as crypto from '@shardus/crypto-utils'
import axios from 'axios'
crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

export let walletEntries = {}

// console.log(infoGreen(` THIS TESTING WILL TAKE AROUND 5 MINUTES TO COMPLETE `))


export const HOST = 'localhost:9001'
export const ARCHIVER_HOST = 'localhost:4000'
export const MONITOR_HOST = 'localhost:3000'

export async function _sleep(ms = 0): Promise<NodeJS.Timeout> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function injectTx(tx, account, sign: boolean = true) {
    if (sign) {
        crypto.signObj(tx as any, account.keys.secretKey, account.keys.publicKey)
    }
    try {
        const seedNodes = await getSeedNodes();
        const target = seedNodes[Math.floor(Math.random() * seedNodes.length)].port
        const res = await axios.post(`http://localhost:${target}/inject`, tx)
        console.log(`"${tx.type}" transaction submitted ...`)
        console.log(`response: ${JSON.stringify(res.data)}`)
        expect(res.data.result.success).toBe(true)
    } catch (err) {
        // console.log(info(err))
    }
}

export function createAccount(keys = crypto.generateKeypair()) {
    return {
        address: keys.publicKey,
        keys,
        id: '',
    }
}

export function createEntry(name, id) {
    const account = createAccount()
    if (typeof id === 'undefined' || id === null) {
        id = crypto.hash(name)
    }
    account.id = id
    walletEntries[name] = account
    return account
}

export async function queryParameters() {
    const res = await axios.get(`http://${HOST}/network/parameters`)
    if (res.data.error) {
        return res.data.error
    } else {
        return res.data.parameters
    }
}

export async function queryLatestCycleRecordFromConsensor() {
    const activeNodes = await queryActiveNodes()
    const activeNodeList = Object.values(activeNodes)
    if (activeNodeList.length > 0) {
        const node: any = activeNodeList[0]
        const res = await axios.get(`http://${node.nodeIpInfo.externalIp}:${node.nodeIpInfo.externalPort}/sync-newest-cycle`)
        return res.data.newestCycle
    }
}

export async function queryActiveNodes() {
    const res = await axios.get(`http://${MONITOR_HOST}/api/report`)
    if (res.data.nodes.active) return res.data.nodes.active
    else return null
}

export async function queryAccounts() {
    const res = await axios.get(`http://${MONITOR_HOST}/api/report`)
    if (res.data.nodes.active) {
        const node: any = Object.values(res.data.nodes.active)[0]
        if (!node) return []
        const response = await axios.get(`http://${node.nodeIpInfo.externalIp}:${node.nodeIpInfo.externalPort}/accounts`)
        return response.data.accounts
    }
}

export async function queryAccountById(id) {
    const res = await axios.get(`http://${MONITOR_HOST}/api/report`)
    if (res.data.nodes.active) {
        const node: any = Object.values(res.data.nodes.active)[0]
        if (!node) return []
        const response = await axios.get(`http://${node.nodeIpInfo.externalIp}:${node.nodeIpInfo.externalPort}/account/${id}`)
        return response.data.account
    }
}

export async function queryLatestReport() {
    const res = await axios.get(`http://${MONITOR_HOST}/api/report`)
    if (res.data.nodes.active) return res.data
    else return null
}

export async function resetReport() {
    const res = await axios.get(`http://${MONITOR_HOST}/api/flush`)
    return res.data
}

export async function queryLatestCycleRecordFromArchiver() {
    const res = await axios.get(`http://${ARCHIVER_HOST}/cycleinfo/1`)
    if (res.data.cycleInfo.length > 0) return res.data.cycleInfo[0]
    else return null
}

export async function queryArchivedCycles(ip, port, count) {
    const res = await axios.get(`http://${ip}:${port}/full-archive/${count}`)
    return res.data.archivedCycles
}

export async function waitForNetworkParameters() {
    let ready = false
    await _sleep(60000) // wait for 1 minute
    while (!ready) {
        try {
            ready = (await queryParameters()).current !== undefined
            if (!ready) await _sleep(5000) // wait for 5 seconds
        } catch {
            await _sleep(1000)
        }
    }
    return
}

export async function waitForNetworkToBeActive(numberOfExpectedNodes) {
    let ready = false
    await _sleep(60000) // wait for 1 minute
    let attempt = 0
    while (!ready) {
        try {
            let activeNodes = await queryActiveNodes()
            if (activeNodes) {
                if (Object.keys(activeNodes).length >= numberOfExpectedNodes) ready = true
            }
        } catch (e) {
            console.log(e)
        }
        if (!ready) await _sleep(10000)
        if (attempt === numberOfExpectedNodes * 3) break  // 3 attempts is in one cycle, total cycle is number of Nodes
        attempt++
    }
    return ready
}

export async function waitForArchiverToJoin(ip, port) {
    let ready = false

    while (!ready) {
        try {
            let cycleRecord = await queryLatestCycleRecordFromArchiver()
            let newArchiver = cycleRecord.joinedArchivers[0]
            if (newArchiver) {
                if (newArchiver.ip === ip && newArchiver.port === port) ready = true
            }
        } catch (e) {
            console.log("error while checking new archiver to join", e.message)
        }
        if (!ready) await _sleep(10000)
    }
    return true
}

export async function waitForNetworkLoad(load, value) {
    let isCriteriaMet = false
    while (!isCriteriaMet) {
        try {
            let activeNodes = await queryActiveNodes()
            if (activeNodes) {
                let totalLoad = 0
                let avgLoad = 0
                for (let nodeId in activeNodes) {
                    const node = activeNodes[nodeId]
                    totalLoad += node.currentLoad.networkLoad
                }
                avgLoad = totalLoad / Object.keys(activeNodes).length
                console.log('avg load', avgLoad)
                if (load === 'high' && avgLoad >= value) isCriteriaMet = true
                else if (load === 'low' && avgLoad <= value) isCriteriaMet = true
                else {
                    await _sleep(30000)
                }
            }
        } catch (e) {
            // console.log(e)
            await _sleep(30000)
        }
    }
    return true
}

export async function waitForNetworkScaling(desired) {
    let isCriteriaMet = false
    while (!isCriteriaMet) {
        try {
            let activeNodes = await queryActiveNodes()
            if (Object.keys(activeNodes).length === desired) isCriteriaMet = true
            else await _sleep(30000)
        } catch (e) {
            await _sleep(30000)
        }
    }
    return true
}

// QUERY'S THE CURRENT PHASE OF THE DYNAMIC PARAMETER SYSTEM
export async function queryWindow() {
    const res = await axios.get(`http://${HOST}/network/windows/all`)
    if (res.data.error) {
        return res.data.error
    } else {
        const { windows, devWindows } = res.data
        const timestamp = Date.now()
        let windowTime, devWindowTime
        if (inRange(timestamp, windows.proposalWindow)) windowTime = { proposals: Math.round((windows.proposalWindow[1] - timestamp) / 1000) }
        else if (inRange(timestamp, windows.votingWindow)) windowTime = { voting: Math.round((windows.votingWindow[1] - timestamp) / 1000) }
        else if (inRange(timestamp, windows.graceWindow)) windowTime = { grace: Math.round((windows.graceWindow[1] - timestamp) / 1000) }
        else if (inRange(timestamp, windows.applyWindow)) windowTime = { apply: Math.round((windows.applyWindow[1] - timestamp) / 1000) }
        else windowTime = { apply: Math.round((windows.proposalWindow[0] - timestamp) / 1000) }

        if (inRange(timestamp, devWindows.devProposalWindow)) devWindowTime = { devProposals: Math.round((devWindows.devProposalWindow[1] - timestamp) / 1000) }
        else if (inRange(timestamp, devWindows.devVotingWindow)) devWindowTime = { devVoting: Math.round((devWindows.devVotingWindow[1] - timestamp) / 1000) }
        else if (inRange(timestamp, devWindows.devGraceWindow)) devWindowTime = { devGrace: Math.round((devWindows.devGraceWindow[1] - timestamp) / 1000) }
        else if (inRange(timestamp, devWindows.devApplyWindow)) devWindowTime = { devApply: Math.round((devWindows.devApplyWindow[1] - timestamp) / 1000) }
        else devWindowTime = { devApply: Math.round((devWindows.devProposalWindow[0] - timestamp) / 1000) }
        return { window: windowTime, devWindow: devWindowTime }
    }
    function inRange(now, times) {
        return now > times[0] && now < times[1]
    }
}

export async function getAccountData(id) {
    try {
        const res = await axios.get(`http://${HOST}/account/${id}`)
        return res.data.account
    } catch (err) {
        return err.message
    }
}

// Waits until there's 60 seconds left within a chosen window
export async function waitForWindow(name: string) {
    console.log(` Waiting for ${name} window to become available `)
    switch (name) {
        case 'proposals':
            while (!((await queryWindow()).window?.proposals < 50)) await _sleep(1000)
            break
        case 'devProposals':
            while (!((await queryWindow()).devWindow?.devProposals < 60)) await _sleep(1000)
            break
        case 'voting':
            while (!((await queryWindow()).window?.voting < 60)) await _sleep(1000)
            break
        case 'devVoting':
            while (!((await queryWindow()).devWindow?.devVoting < 60)) await _sleep(1000)
            break
        case 'grace':
            while (!((await queryWindow()).window?.grace < 50)) await _sleep(1000)
            break
        case 'devGrace':
            while (!((await queryWindow()).devWindow?.devGrace < 50)) await _sleep(1000)
            break
        case 'apply':
            while (!((await queryWindow()).window?.apply < 50)) await _sleep(1000)
            break
        case 'devApply':
            while (!((await queryWindow()).devWindow?.devApply < 50)) await _sleep(1000)
            break
    }
    return
}


function mode(list) {
    const arr = [...list]
    return arr
        .sort(
            (a, b) =>
                arr.filter(v => v === a).length - arr.filter(v => v === b).length
        )
        .pop()
}

const checkNodeSyncedState = function (partitionMatrix, cycleCounter) {
    // console.log('checkNodeSyncedState', arguments)
    if (!cycleCounter || !partitionMatrix[cycleCounter]) return false
    let nodeSyncState = {}
    let nodeList = Object.keys(partitionMatrix[cycleCounter])
    nodeList = nodeList.sort()
    let syncedObj = {}
    for (let nodeId of nodeList) {
        const partitionReport = partitionMatrix[cycleCounter][nodeId].res
        for (let i in partitionReport) {
            const index = partitionReport[i].i
            let hash = partitionReport[i].h
            hash = hash.split('0').join('')
            hash = hash.split('x').join('')
            // collect to syncedObj to decide synced status of nodes later
            if (!syncedObj[index]) {
                syncedObj[index] = []
            } else {
                syncedObj[index].push({
                    nodeId,
                    hash
                })
            }
        }
        let syncedPenaltyObj = {}
        for (let nodeId of nodeList) {
            syncedPenaltyObj[nodeId] = 0
        }
        for (let index in syncedObj) {
            let hashArr = syncedObj[index].map(obj => obj.hash)
            let mostCommonHash = mode(hashArr)
            syncedObj[index].forEach(obj => {
                if (obj.hash !== mostCommonHash) {
                    syncedPenaltyObj[obj.nodeId] += 1
                }
            })
        }
        for (let nodeId in syncedPenaltyObj) {
            if (syncedPenaltyObj[nodeId] === 0) {
                nodeSyncState[nodeId] = 0
            } else if (syncedPenaltyObj[nodeId] <= 3) {
                nodeSyncState[nodeId] = 1
            } else if (syncedPenaltyObj[nodeId] > 3) {
                nodeSyncState[nodeId] = 2
            }
        }
    }
    let areAllNodeSynced = true
    for (let nodeId in nodeSyncState) {
        if (nodeSyncState[nodeId] !== 0) {
            areAllNodeSynced = false
            break
        }
    }
    console.log("nodeSyncState", cycleCounter, areAllNodeSynced)
    return areAllNodeSynced
}


export async function getInsyncAll() {

    let result = await axios.get(`http://${HOST}/get-tree-last-insync-all`)
    let lines = result.data.split('\n')
    let in_sync = 0
    let out_sync = 0
    let outOfSyncNodes = []
    for (let line of lines) {
        line = line.trim()
        if (line.includes('inSync')) {
            let isInSync = line.split(' ')[1] === 'true'
            let host = line.split(' ')[3]
            if (isInSync)
                in_sync += 1
            else {
                out_sync += 1
                outOfSyncNodes.push(host)
            }
        }
    }
    return {
        in_sync,
        out_sync,
        outOfSyncNodes
    }
}

export async function checkPartitionMatrix() {
    let partitionMatrix = {}
    let syncTracker = {}
    let ready = false
    let isCriteriaMet = false
    while (!ready) {
        const activeNodes = await queryActiveNodes()
        const activeCount = Object.keys(activeNodes).length
        let cycleCounter
        for (let nodeId in activeNodes) {
            const partitionReport = activeNodes[nodeId].partitionReport
            cycleCounter = activeNodes[nodeId].cycleCounter
            if (partitionReport && partitionReport.hasOwnProperty('res')) {
                if (!partitionMatrix[cycleCounter]) {
                    partitionMatrix[cycleCounter] = {}
                    partitionMatrix[cycleCounter][nodeId] = partitionReport
                } else {
                    partitionMatrix[cycleCounter][nodeId] = partitionReport
                }
            }
        }
        if (Object.keys(partitionMatrix).length > 0) {
            const currentCycleCounter = Math.max(...Object.keys(partitionMatrix).map(x => parseInt(x)))
            const receivedReport = Object.keys(partitionMatrix[currentCycleCounter]).length
            if (!syncTracker[currentCycleCounter] && receivedReport === activeCount) {
                const isSynced = checkNodeSyncedState(partitionMatrix, currentCycleCounter)
                syncTracker[currentCycleCounter] = isSynced
                if (isSynced) {
                    isCriteriaMet = true
                    break
                }
            }
        }
        if (Object.keys(syncTracker).length >= 3) {
            console.log("criteria is not met within 3 cycles")
            break
        }
        if (!ready) _sleep(2000)
    }
    console.log('isCriteriaMet', isCriteriaMet)
    return isCriteriaMet
}

export function isIncreasingSequence(numbers) {
    return numbers.every((number, i) => i === 0 || numbers[i - 1] + 1 === number)
}

export function isDecreasingSequence(numbers) {
    return numbers.every((number, i) => i === 0 || numbers[i - 1] - 1 === number)
}

export async function getSeedNodes() {
    const result = await axios.get(`http://${ARCHIVER_HOST}/nodelist`)
    let seedNodes = []
    const nodelist = result.data.nodeList
    if (nodelist !== null) seedNodes = nodelist
    else console.log('No nodes list found')
    return seedNodes
}

// Check if two objects are equal; comparing to the deep down
export function deepObjCheck(obj1, obj2, keyToSkip = null) {
    // Make sure an object to compare is provided
    if (!obj2 || Object.prototype.toString.call(obj2) !== '[object Object]') {
        return false
    }

    //  Check if two arrays are equal
    var arraysMatch = function (arr1, arr2) {
        // Check if the arrays are the same length
        if (arr1.length !== arr2.length) {
            return false
        }

        // Check if all items exist and are in the same order
        for (var i = 0; i < arr1.length; i++) {
            if (typeof arr1[i] === 'object' && typeof arr2[i] === 'object') shallowEqual(arr1[i], arr2[i])
            else if (arr1[i] !== arr2[i]) return false
        }

        // Otherwise, return true
        return true
    }

    //  Check if two objects are equal
    var shallowEqual = function (object1, object2) {
        const keys1 = Object.keys(object1)
        const keys2 = Object.keys(object2)
        if (keys1.length !== keys2.length) {
            return false
        }
        for (let key of keys1) {
            if (object1[key] !== object2[key]) {
                return false
            }
        }
        return true
    }

    //  Compare two items
    var compare = function (item1, item2) {
        // Get the object type
        var type1 = Object.prototype.toString.call(item1)
        var type2 = Object.prototype.toString.call(item2)

        // If type2 is undefined it has been removed
        if (type2 === '[object Undefined]') {
            return false
        }

        // If items are different types
        if (type1 !== type2) {
            return false
        }

        // If an object, compare recursively
        if (type1 === '[object Object]') {
            var objDiff = deepObjCheck(item1, item2)
            if (!objDiff) {
                return false
            }
            return true
        }

        // If an array, compare
        if (type1 === '[object Array]') {
            if (!arraysMatch(item1, item2)) {
                return false
            }
            return true
        }

        // Else if it's a function, convert to a string and compare
        // Otherwise, just compare
        if (type1 === '[object Function]') {
            if (item1.toString() !== item2.toString()) {
                return false
            }
        } else {
            if (item1 !== item2) {
                return false
            }
        }

        return true
    }

    let status = true
    let key

    // Loop through the first object
    for (key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            if (keyToSkip && key !== keyToSkip) {
                status = compare(obj1[key], obj2[key])
            }
            if (!status) {
                return status
            }
        }
    }

    // Loop through the second object and find missing items
    for (key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            if (!obj1[key] && obj1[key] !== obj2[key]) {
                return false
            }
        }
    }

    return status
}