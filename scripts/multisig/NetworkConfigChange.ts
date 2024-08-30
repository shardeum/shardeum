import { Utils } from '@shardus/types'
import { ethers, Wallet } from 'ethers'

// Config to update
const config = {
  debug: {
    minMultiSigRequiredForGlobalTxs: 1,
  },
}

const rpcUrl = 'http://localhost:8080'

const privateKeys = [
  // add private keys here
]

const wallets: Wallet[] = []

for (const privateKey of privateKeys) {
  const wallet = new ethers.Wallet(privateKey)

  console.log('wallet.address', wallet.address)

  wallets.push(wallet)
}

const proposer = wallets[0]

const provider = new ethers.JsonRpcProvider(rpcUrl)

async function updateNetworkConfig(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changeConfigTx: any = {
    isInternalTx: true,
    internalTXType: 3,
    timestamp: Date.now(),
    from: proposer.address.slice(2).toLowerCase() + '0'.repeat(24),
    config: JSON.stringify(config),
    cycle: -1,
  }

  const configChangeTxString = Utils.safeStringify(changeConfigTx)

  console.log('configChangeTxString', configChangeTxString)

  const tx_hash = ethers.keccak256(ethers.toUtf8Bytes(configChangeTxString))

  console.log('tx_hash', tx_hash)

  const sigList: {
    owner: string
    sig: string
  }[] = []

  for (const wallet of wallets) {
    const sig = await wallet.signMessage(tx_hash)

    console.log('sig', sig)

    sigList.push({
      owner: wallet.address,
      sig,
    })
  }

  changeConfigTx.sign = sigList

  const res = await provider.send('eth_sendRawTransaction', [changeConfigTx])

  console.log('res', res)
}

updateNetworkConfig()
