import axios from 'axios'

export const HOST = 'localhost:9001'
export const ARCHIVER_HOST = 'localhost:4000'
export const MONITOR_HOST = 'localhost:3000'

export async function _sleep(ms = 0): Promise<NodeJS.Timeout> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function queryActiveNodes() {
  const res = await axios.get(`http://${MONITOR_HOST}/api/report`)
  if (res.data.nodes.active) return res.data.nodes.active
  else return null
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

    // Math.max needed to be done because initially attempt is 0, zero times zero is zero.
    // also the reason for adding more delay is because it's not enough
    if (!ready) await _sleep(10000 * Math.max((attempt/2),1))
    if (attempt === numberOfExpectedNodes * 3) break // 3 attempts is in one cycle, total cycle is number of Nodes
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
      console.log('error while checking new archiver to join', e.message)
    }
    if (!ready) await _sleep(10000)
  }
  return true
}

export async function getInsyncAll() {
  const activeNodes = await queryActiveNodes()
  const activeNodeList: any = Object.values(activeNodes)
  const host = activeNodeList[0].nodeIpInfo.externalIp + ':' + activeNodeList[0].nodeIpInfo.externalPort
  let result = await axios.get(`http://${host}/get-tree-last-insync-all`)
  let lines = result.data.split('\n')
  let in_sync = 0
  let out_sync = 0
  let outOfSyncNodes = []
  for (let line of lines) {
    line = line.trim()
    if (line.includes('inSync')) {
      let isInSync = line.split(' ')[1] === 'true'
      let host = line.split(' ')[3]
      if (isInSync) in_sync += 1
      else {
        out_sync += 1
        outOfSyncNodes.push(host)
      }
    }
  }
  return {
    in_sync,
    out_sync,
    outOfSyncNodes,
  }
}

export async function nodeRewardsCheck() {
  const activeNodes = await queryActiveNodes()
  const activeNodeList: any = Object.values(activeNodes)
  for (let i = 0; i < activeNodeList.length; i++) {
    const host = activeNodeList[i].nodeIpInfo.externalIp + ':' + activeNodeList[i].nodeIpInfo.externalPort
    let result = await axios.get(`http://${host}/nodeRewardValidate`)
    if (!result.data.success) {
      return false
    }
  }
  if (activeNodeList.length > 0) {
    return true
  }
  return false
}

// Check if two objects are equal; comparing to the deep down
// export function deepObjCheck(obj1, obj2, keyToSkip = null) {
//     // Make sure an object to compare is provided
//     if (!obj2 || Object.prototype.toString.call(obj2) !== '[object Object]') {
//         return false
//     }

//     //  Check if two arrays are equal
//     var arraysMatch = function (arr1, arr2) {
//         // Check if the arrays are the same length
//         if (arr1.length !== arr2.length) {
//             return false
//         }

//         // Check if all items exist and are in the same order
//         for (var i = 0; i < arr1.length; i++) {
//             if (typeof arr1[i] === 'object' && typeof arr2[i] === 'object') shallowEqual(arr1[i], arr2[i])
//             else if (arr1[i] !== arr2[i]) return false
//         }

//         // Otherwise, return true
//         return true
//     }

//     //  Check if two objects are equal
//     var shallowEqual = function (object1, object2) {
//         const keys1 = Object.keys(object1)
//         const keys2 = Object.keys(object2)
//         if (keys1.length !== keys2.length) {
//             return false
//         }
//         for (let key of keys1) {
//             if (object1[key] !== object2[key]) {
//                 return false
//             }
//         }
//         return true
//     }

//     //  Compare two items
//     var compare = function (item1, item2) {
//         // Get the object type
//         var type1 = Object.prototype.toString.call(item1)
//         var type2 = Object.prototype.toString.call(item2)

//         // If type2 is undefined it has been removed
//         if (type2 === '[object Undefined]') {
//             return false
//         }

//         // If items are different types
//         if (type1 !== type2) {
//             return false
//         }

//         // If an object, compare recursively
//         if (type1 === '[object Object]') {
//             var objDiff = deepObjCheck(item1, item2)
//             if (!objDiff) {
//                 return false
//             }
//             return true
//         }

//         // If an array, compare
//         if (type1 === '[object Array]') {
//             if (!arraysMatch(item1, item2)) {
//                 return false
//             }
//             return true
//         }

//         // Else if it's a function, convert to a string and compare
//         // Otherwise, just compare
//         if (type1 === '[object Function]') {
//             if (item1.toString() !== item2.toString()) {
//                 return false
//             }
//         } else {
//             if (item1 !== item2) {
//                 return false
//             }
//         }

//         return true
//     }

//     let status = true
//     let key

//     // Loop through the first object
//     for (key in obj1) {
//         if (obj1.hasOwnProperty(key)) {
//             if (keyToSkip && key !== keyToSkip) {
//                 status = compare(obj1[key], obj2[key])
//             }
//             if (!status) {
//                 return status
//             }
//         }
//     }

//     // Loop through the second object and find missing items
//     for (key in obj2) {
//         if (obj2.hasOwnProperty(key)) {
//             if (!obj1[key] && obj1[key] !== obj2[key]) {
//                 return false
//             }
//         }
//     }

//     return status
// }
