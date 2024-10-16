import axios, { AxiosError } from 'axios'
import { ethers } from 'ethers'
import { Utils } from '@shardus/types'

// Params
const nodeIds = ['6039'] // First 4 characters of the node ID for the target nodes
const networkId = '939de9f2f0e5db90a18ddfdbbeb303c00a391b7c0ce3fb5733218d1440ecb8f9' // Network ID for the target network
const route = '/df' // Route with / prefix
const nodeUrl = 'http://localhost:9003'

const privateKeys = [
  // add private keys here
]

async function callDebugEndpoint(): Promise<void> {
  const sig_counter = Date.now()

  const payload = {
    route: route,
    nodes: nodeIds.join(','),
    count: sig_counter,
    networkId: networkId,
  }

  const payloadString = Utils.safeStringify(payload)

  console.log('payloadString', payloadString)

  const hash = ethers.keccak256(ethers.toUtf8Bytes(payloadString))

  console.log('hash', hash)

  const sigList: {
    owner: string
    sig: string
  }[] = []

  for (const privateKey of privateKeys) {
    const wallet = new ethers.Wallet(privateKey)

    const sig = await wallet.signMessage(hash)

    console.log('sig', sig)

    const recoveredAddress = ethers.verifyMessage(hash, sig)

    console.log('recoveredAddress', recoveredAddress)
    console.log('wallet.address', wallet.address)

    sigList.push({
      owner: wallet.address,
      sig,
    })
  }

  try {
    const response = await axios.get(`${nodeUrl}${route}`, {
      params: {
        nodeIds: nodeIds.join(','),
        sig_counter: sig_counter,
        sig: JSON.stringify(sigList),
      },
    })
    console.log(response.data)
  } catch (error) {
    console.error((error as AxiosError).code)
    console.error((error as AxiosError).message)
    console.error((error as AxiosError).response?.data)
  }
}

callDebugEndpoint()
