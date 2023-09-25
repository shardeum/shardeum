import { Common, Hardfork } from '@ethereumjs/common'
import { ShardeumFlags } from '../../shardeum/shardeumFlags'
import { ShardeumBlock } from '../block/blockchain'
import { VM } from '../../vm_v7/vm'
import { ShardeumState } from '../state'
import { EVMAccountInfo } from '../../shardeum/shardeumTypes'
import { ShardusTypes } from '@shardus/core'
import { EVM as EthereumVirtualMachine } from '../../evm_v2'

let shardeumBlock: ShardeumBlock
export let evmCommon: Common
export let EVM: { -readonly [P in keyof VM] }
export let shardeumStateTXMap: Map<string, ShardeumState>
export let shardusAddressToEVMAccountInfo: Map<string, EVMAccountInfo>
export let debugAppdata: Map<string, unknown>

// Instead of hardcoding as follows, it can also be fetched using a random active node
export const networkAccount: ShardusTypes.WrappedData = {
  accountId: '0000000000000000000000000000000000000000000000000000000000000000',
  stateId: '465ed7933f3b284740d3aca848273c50f1d6eaf406b12a2055907cbab9784cdc',
  data: {
    accountType: 5,
    current: {
      activeVersion: '1.3.0',
      certCycleDuration: 30,
      description: 'These are the initial network parameters Shardeum started with',
      latestVersion: '1.3.0',
      maintenanceFee: 0,
      maintenanceInterval: 86400000,
      minVersion: '1.3.0',
      nodePenaltyUsd: '8ac7230489e80000',
      nodeRewardAmountUsd: '0de0b6b3a7640000',
      nodeRewardInterval: 3600000,
      stabilityScaleDiv: 1000,
      stabilityScaleMul: 1000,
      stakeRequiredUsd: '8ac7230489e80000',
      title: 'Initial parameters',
      txPause: false,
    },
    id: '0000000000000000000000000000000000000000000000000000000000000000',
    listOfChanges: [{ change: { server: { p2p: { minNodes: 15 } } }, cycle: 1 }],
    next: {},
    timestamp: 1686049697067,
    hash: '465ed7933f3b284740d3aca848273c50f1d6eaf406b12a2055907cbab9784cdc',
  },
  timestamp: 1686049697067,
  // seenInQueue: false,
}

export async function initEVMSingletons(): Promise<void> {
  const chainIDBN = BigInt(ShardeumFlags.ChainID)

  // setting up only to 'istanbul' hardfork for now
  // https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/common/src/chains/mainnet.json
  evmCommon = new Common({ chain: 'mainnet', hardfork: Hardfork.Istanbul, eips: [3855] })

  //hack override this function.  perhaps a nice thing would be to use forCustomChain to create a custom common object
  evmCommon.chainId = (): bigint => {
    return BigInt(chainIDBN.toString(10))
  }

  //let shardeumStateManager = new ShardeumState({ common }) //as StateManager

  shardeumBlock = new ShardeumBlock({ common: evmCommon })
  //let EVM = new VM({ common, stateManager: shardeumStateManager, blockchain: shardeumBlock })

  if (ShardeumFlags.useShardeumVM) {
    const customEVM = new EthereumVirtualMachine({
      common: evmCommon,
      stateManager: undefined,
    })
    EVM = await VM.create({
      common: evmCommon,
      stateManager: undefined,
      evm: customEVM,
      // blockchain: shardeumBlock,
    })
  } else {
    // EVM = VM.create({ common: evmCommon, stateManager: undefined, blockchain: shardeumBlock })
  }

  // console.log('EVM_common', JSON.stringify(EVM._common, null, 4))

  //todo need to evict old data
  ////transactionStateMap = new Map<string, TransactionState>()

  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  shardeumStateTXMap = new Map<string, ShardeumState>()
  // a map of txID or ethcallID to shardeumState, todo need to evict old data
  //shardeumStateCallMap = new Map<string, ShardeumState>()

  //shardeumStatePool = []

  //todo need to evict old data
  shardusAddressToEVMAccountInfo = new Map<string, EVMAccountInfo>()

  debugAppdata = new Map<string, unknown>()
}
