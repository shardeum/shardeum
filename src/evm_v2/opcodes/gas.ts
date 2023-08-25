import { Hardfork } from '@ethereumjs/common'
import { Address, bigIntToBytes, setLengthLeft } from '@ethereumjs/util'

import { ERROR } from '../exceptions.js'

import { updateSstoreGasEIP1283 } from './EIP1283.js'
import { updateSstoreGasEIP2200 } from './EIP2200.js'
import { accessAddressEIP2929, accessStorageEIP2929 } from './EIP2929.js'
import {
  addresstoBytes,
  divCeil,
  maxCallGas,
  setLengthLeftStorage,
  subMemUsage,
  trap,
  updateSstoreGas,
} from './util.js'

import type { RunState } from '../interpreter.js'
import type { Common } from '@ethereumjs/common'

/**
 * This file returns the dynamic parts of opcodes which have dynamic gas
 * These are not pure functions: some edit the size of the memory
 * These functions are therefore not read-only
 */

// The dynamic gas handler methods take a runState and a gas BN
// The gas BN is necessary, since the base fee needs to be included,
// to calculate the max call gas for the call opcodes correctly.
export interface AsyncDynamicGasHandler {
  (runState: RunState, gas: bigint, common: Common): Promise<bigint>
}

export interface SyncDynamicGasHandler {
  (runState: RunState, gas: bigint, common: Common): bigint
}

export const dynamicGasHandlers: Map<number, AsyncDynamicGasHandler | SyncDynamicGasHandler> =
  new Map<number, AsyncDynamicGasHandler>([
    [
      /* EXP */
      0x0a,
      async function (runState, gas, common): Promise<bigint> {
        const [_base, exponent] = runState.stack.peek(2)
        if (exponent === BigInt(0)) {
          return gas
        }
        let byteLength = exponent.toString(2).length / 8
        if (byteLength > Math.trunc(byteLength)) {
          byteLength = Math.trunc(byteLength) + 1
        }
        if (byteLength < 1 || byteLength > 32) {
          trap(ERROR.OUT_OF_RANGE)
        }
        const expPricePerByte = common.param('gasPrices', 'expByte')
        gas += BigInt(byteLength) * expPricePerByte
        return gas
      },
    ],
    [
      /* KECCAK256 */
      0x20,
      async function (runState, gas, common): Promise<bigint> {
        const [offset, length] = runState.stack.peek(2)
        gas += subMemUsage(runState, offset, length, common)
        gas += common.param('gasPrices', 'keccak256Word') * divCeil(length, BigInt(32))
        return gas
      },
    ],
    [
      /* BALANCE */
      0x31,
      async function (runState, gas, common): Promise<bigint> {
        if (common.isActivatedEIP(2929) === true) {
          const addressBigInt = runState.stack.peek()[0]
          const address = new Address(addresstoBytes(addressBigInt))
          gas += accessAddressEIP2929(runState, address, common)
        }
        return gas
      },
    ],
    [
      /* CALLDATACOPY */
      0x37,
      async function (runState, gas, common): Promise<bigint> {
        const [memOffset, _dataOffset, dataLength] = runState.stack.peek(3)

        gas += subMemUsage(runState, memOffset, dataLength, common)
        if (dataLength !== BigInt(0)) {
          gas += common.param('gasPrices', 'copy') * divCeil(dataLength, BigInt(32))
        }
        return gas
      },
    ],
    [
      /* CODECOPY */
      0x39,
      async function (runState, gas, common): Promise<bigint> {
        const [memOffset, _codeOffset, dataLength] = runState.stack.peek(3)

        gas += subMemUsage(runState, memOffset, dataLength, common)
        if (dataLength !== BigInt(0)) {
          gas += common.param('gasPrices', 'copy') * divCeil(dataLength, BigInt(32))
        }
        return gas
      },
    ],
    [
      /* EXTCODESIZE */
      0x3b,
      async function (runState, gas, common): Promise<bigint> {
        if (common.isActivatedEIP(2929) === true) {
          const addressBigInt = runState.stack.peek()[0]
          const address = new Address(addresstoBytes(addressBigInt))
          gas += accessAddressEIP2929(runState, address, common)
        }
        return gas
      },
    ],
    [
      /* EXTCODECOPY */
      0x3c,
      async function (runState, gas, common): Promise<bigint> {
        const [addressBigInt, memOffset, _codeOffset, dataLength] = runState.stack.peek(4)

        gas += subMemUsage(runState, memOffset, dataLength, common)

        if (common.isActivatedEIP(2929) === true) {
          const address = new Address(addresstoBytes(addressBigInt))
          gas += accessAddressEIP2929(runState, address, common)
        }

        if (dataLength !== BigInt(0)) {
          gas += common.param('gasPrices', 'copy') * divCeil(dataLength, BigInt(32))
        }
        return gas
      },
    ],
    [
      /* RETURNDATACOPY */
      0x3e,
      async function (runState, gas, common): Promise<bigint> {
        const [memOffset, returnDataOffset, dataLength] = runState.stack.peek(3)

        if (returnDataOffset + dataLength > runState.interpreter.getReturnDataSize()) {
          trap(ERROR.OUT_OF_GAS)
        }

        gas += subMemUsage(runState, memOffset, dataLength, common)

        if (dataLength !== BigInt(0)) {
          gas += common.param('gasPrices', 'copy') * divCeil(dataLength, BigInt(32))
        }
        return gas
      },
    ],
    [
      /* EXTCODEHASH */
      0x3f,
      async function (runState, gas, common): Promise<bigint> {
        if (common.isActivatedEIP(2929) === true) {
          const addressBigInt = runState.stack.peek()[0]
          const address = new Address(addresstoBytes(addressBigInt))
          gas += accessAddressEIP2929(runState, address, common)
        }
        return gas
      },
    ],
    [
      /* MLOAD */
      0x51,
      async function (runState, gas, common): Promise<bigint> {
        const pos = runState.stack.peek()[0]
        gas += subMemUsage(runState, pos, BigInt(32), common)
        return gas
      },
    ],
    [
      /* MSTORE */
      0x52,
      async function (runState, gas, common): Promise<bigint> {
        const offset = runState.stack.peek()[0]
        gas += subMemUsage(runState, offset, BigInt(32), common)
        return gas
      },
    ],
    [
      /* MSTORE8 */
      0x53,
      async function (runState, gas, common): Promise<bigint> {
        const offset = runState.stack.peek()[0]
        gas += subMemUsage(runState, offset, BigInt(1), common)
        return gas
      },
    ],
    [
      /* SLOAD */
      0x54,
      async function (runState, gas, common): Promise<bigint> {
        const key = runState.stack.peek()[0]
        const keyBuf = setLengthLeft(bigIntToBytes(key), 32)

        if (common.isActivatedEIP(2929) === true) {
          gas += accessStorageEIP2929(runState, keyBuf, false, common)
        }
        return gas
      },
    ],
    [
      /* SSTORE */
      0x55,
      async function (runState, gas, common): Promise<bigint> {
        if (runState.interpreter.isStatic()) {
          trap(ERROR.STATIC_STATE_CHANGE)
        }
        const [key, val] = runState.stack.peek(2)

        const keyBytes = setLengthLeft(bigIntToBytes(key), 32)
        // NOTE: this should be the shortest representation
        let value
        if (val === BigInt(0)) {
          value = Uint8Array.from([])
        } else {
          value = bigIntToBytes(val)
        }

        const currentStorage = setLengthLeftStorage(
          await runState.interpreter.storageLoad(keyBytes)
        )
        const originalStorage = setLengthLeftStorage(
          await runState.interpreter.storageLoad(keyBytes, true)
        )
        if (common.hardfork() === Hardfork.Constantinople) {
          gas += updateSstoreGasEIP1283(
            runState,
            currentStorage,
            originalStorage,
            setLengthLeftStorage(value),
            common
          )
        } else if (common.gteHardfork(Hardfork.Istanbul)) {
          gas += updateSstoreGasEIP2200(
            runState,
            currentStorage,
            originalStorage,
            setLengthLeftStorage(value),
            keyBytes,
            common
          )
        } else {
          gas += updateSstoreGas(runState, currentStorage, setLengthLeftStorage(value), common)
        }

        if (common.isActivatedEIP(2929) === true) {
          // We have to do this after the Istanbul (EIP2200) checks.
          // Otherwise, we might run out of gas, due to "sentry check" of 2300 gas,
          // if we deduct extra gas first.
          gas += accessStorageEIP2929(runState, keyBytes, true, common)
        }
        return gas
      },
    ],
    [
      /* MCOPY */
      0x5e,
      async function (runState, gas, common): Promise<bigint> {
        const [dst, src, length] = runState.stack.peek(3)
        const wordsCopied = (length + BigInt(31)) / BigInt(32)
        gas += BigInt(3) * wordsCopied
        gas += subMemUsage(runState, src, length, common)
        gas += subMemUsage(runState, dst, length, common)
        return gas
      },
    ],
    [
      /* LOG */
      0xa0,
      async function (runState, gas, common): Promise<bigint> {
        if (runState.interpreter.isStatic()) {
          trap(ERROR.STATIC_STATE_CHANGE)
        }

        const [memOffset, memLength] = runState.stack.peek(2)

        const topicsCount = runState.opCode - 0xa0

        if (topicsCount < 0 || topicsCount > 4) {
          trap(ERROR.OUT_OF_RANGE)
        }

        gas += subMemUsage(runState, memOffset, memLength, common)
        gas +=
          common.param('gasPrices', 'logTopic') * BigInt(topicsCount) +
          memLength * common.param('gasPrices', 'logData')
        return gas
      },
    ],
    [
      /* CREATE */
      0xf0,
      async function (runState, gas, common): Promise<bigint> {
        if (runState.interpreter.isStatic()) {
          trap(ERROR.STATIC_STATE_CHANGE)
        }
        const [_value, offset, length] = runState.stack.peek(3)

        if (common.isActivatedEIP(2929) === true) {
          gas += accessAddressEIP2929(runState, runState.interpreter.getAddress(), common, false)
        }

        if (common.isActivatedEIP(3860) === true) {
          gas +=
            ((length + BigInt(31)) / BigInt(32)) * common.param('gasPrices', 'initCodeWordCost')
        }

        gas += subMemUsage(runState, offset, length, common)

        let gasLimit = BigInt(runState.interpreter.getGasLeft()) - gas
        gasLimit = maxCallGas(gasLimit, gasLimit, runState, common)

        runState.messageGasLimit = gasLimit
        return gas
      },
    ],
    [
      /* CALL */
      0xf1,
      async function (runState, gas, common): Promise<bigint> {
        const [currentGasLimit, toAddr, value, inOffset, inLength, outOffset, outLength] =
          runState.stack.peek(7)
        const toAddress = new Address(addresstoBytes(toAddr))

        if (runState.interpreter.isStatic() && value !== BigInt(0)) {
          trap(ERROR.STATIC_STATE_CHANGE)
        }
        gas += subMemUsage(runState, inOffset, inLength, common)
        gas += subMemUsage(runState, outOffset, outLength, common)
        if (common.isActivatedEIP(2929) === true) {
          gas += accessAddressEIP2929(runState, toAddress, common)
        }

        if (value !== BigInt(0)) {
          gas += common.param('gasPrices', 'callValueTransfer')
        }

        if (common.gteHardfork(Hardfork.SpuriousDragon)) {
          // We are at or after Spurious Dragon
          // Call new account gas: account is DEAD and we transfer nonzero value

          const account = await runState.stateManager.getAccount(toAddress)
          let deadAccount = false
          if (account === undefined || account.isEmpty()) {
            deadAccount = true
          }

          if (deadAccount && !(value === BigInt(0))) {
            gas += common.param('gasPrices', 'callNewAccount')
          }
        } else if ((await runState.stateManager.getAccount(toAddress)) === undefined) {
          // We are before Spurious Dragon and the account does not exist.
          // Call new account gas: account does not exist (it is not in the state trie, not even as an "empty" account)
          gas += common.param('gasPrices', 'callNewAccount')
        }

        let gasLimit = maxCallGas(
          currentGasLimit,
          runState.interpreter.getGasLeft() - gas,
          runState,
          common
        )
        // note that TangerineWhistle or later this cannot happen
        // (it could have ran out of gas prior to getting here though)
        if (gasLimit > runState.interpreter.getGasLeft() - gas) {
          trap(ERROR.OUT_OF_GAS)
        }

        if (gas > runState.interpreter.getGasLeft()) {
          trap(ERROR.OUT_OF_GAS)
        }

        if (value !== BigInt(0)) {
          const callStipend = common.param('gasPrices', 'callStipend')
          runState.interpreter.addStipend(callStipend)
          gasLimit += callStipend
        }

        runState.messageGasLimit = gasLimit
        return gas
      },
    ],
    [
      /* CALLCODE */
      0xf2,
      async function (runState, gas, common): Promise<bigint> {
        const [currentGasLimit, toAddr, value, inOffset, inLength, outOffset, outLength] =
          runState.stack.peek(7)

        gas += subMemUsage(runState, inOffset, inLength, common)
        gas += subMemUsage(runState, outOffset, outLength, common)

        if (common.isActivatedEIP(2929) === true) {
          const toAddress = new Address(addresstoBytes(toAddr))
          gas += accessAddressEIP2929(runState, toAddress, common)
        }

        if (value !== BigInt(0)) {
          gas += common.param('gasPrices', 'callValueTransfer')
        }
        let gasLimit = maxCallGas(
          currentGasLimit,
          runState.interpreter.getGasLeft() - gas,
          runState,
          common
        )
        // note that TangerineWhistle or later this cannot happen
        // (it could have ran out of gas prior to getting here though)
        if (gasLimit > runState.interpreter.getGasLeft() - gas) {
          trap(ERROR.OUT_OF_GAS)
        }
        if (value !== BigInt(0)) {
          const callStipend = common.param('gasPrices', 'callStipend')
          runState.interpreter.addStipend(callStipend)
          gasLimit += callStipend
        }

        runState.messageGasLimit = gasLimit
        return gas
      },
    ],
    [
      /* RETURN */
      0xf3,
      async function (runState, gas, common): Promise<bigint> {
        const [offset, length] = runState.stack.peek(2)
        gas += subMemUsage(runState, offset, length, common)
        return gas
      },
    ],
    [
      /* DELEGATECALL */
      0xf4,
      async function (runState, gas, common): Promise<bigint> {
        const [currentGasLimit, toAddr, inOffset, inLength, outOffset, outLength] =
          runState.stack.peek(6)

        gas += subMemUsage(runState, inOffset, inLength, common)
        gas += subMemUsage(runState, outOffset, outLength, common)

        if (common.isActivatedEIP(2929) === true) {
          const toAddress = new Address(addresstoBytes(toAddr))
          gas += accessAddressEIP2929(runState, toAddress, common)
        }

        const gasLimit = maxCallGas(
          currentGasLimit,
          runState.interpreter.getGasLeft() - gas,
          runState,
          common
        )
        // note that TangerineWhistle or later this cannot happen
        // (it could have ran out of gas prior to getting here though)
        if (gasLimit > runState.interpreter.getGasLeft() - gas) {
          trap(ERROR.OUT_OF_GAS)
        }

        runState.messageGasLimit = gasLimit
        return gas
      },
    ],
    [
      /* CREATE2 */
      0xf5,
      async function (runState, gas, common): Promise<bigint> {
        if (runState.interpreter.isStatic()) {
          trap(ERROR.STATIC_STATE_CHANGE)
        }

        const [_value, offset, length, _salt] = runState.stack.peek(4)

        gas += subMemUsage(runState, offset, length, common)

        if (common.isActivatedEIP(2929) === true) {
          gas += accessAddressEIP2929(runState, runState.interpreter.getAddress(), common, false)
        }

        if (common.isActivatedEIP(3860) === true) {
          gas +=
            ((length + BigInt(31)) / BigInt(32)) * common.param('gasPrices', 'initCodeWordCost')
        }

        gas += common.param('gasPrices', 'keccak256Word') * divCeil(length, BigInt(32))
        let gasLimit = runState.interpreter.getGasLeft() - gas
        gasLimit = maxCallGas(gasLimit, gasLimit, runState, common) // CREATE2 is only available after TangerineWhistle (Constantinople introduced this opcode)
        runState.messageGasLimit = gasLimit
        return gas
      },
    ],
    [
      /* AUTH */
      0xf6,
      async function (runState, gas, common): Promise<bigint> {
        const [_address, memOffset, memLength] = runState.stack.peek(3)
        gas += subMemUsage(runState, memOffset, memLength, common)
        return gas
      },
    ],
    [
      /* AUTHCALL */
      0xf7,
      async function (runState, gas, common): Promise<bigint> {
        if (runState.auth === undefined) {
          trap(ERROR.AUTHCALL_UNSET)
        }

        const [
          currentGasLimit,
          addr,
          value,
          valueExt,
          argsOffset,
          argsLength,
          retOffset,
          retLength,
        ] = runState.stack.peek(8)

        if (valueExt !== BigInt(0)) {
          trap(ERROR.AUTHCALL_NONZERO_VALUEEXT)
        }

        const toAddress = new Address(addresstoBytes(addr))

        gas += common.param('gasPrices', 'warmstorageread')

        gas += accessAddressEIP2929(runState, toAddress, common, true, true)

        gas += subMemUsage(runState, argsOffset, argsLength, common)
        gas += subMemUsage(runState, retOffset, retLength, common)

        if (value > BigInt(0)) {
          gas += common.param('gasPrices', 'authcallValueTransfer')
          const account = await runState.stateManager.getAccount(toAddress)
          if (!account) {
            gas += common.param('gasPrices', 'callNewAccount')
          }
        }

        let gasLimit = maxCallGas(
          runState.interpreter.getGasLeft() - gas,
          runState.interpreter.getGasLeft() - gas,
          runState,
          common
        )
        if (currentGasLimit !== BigInt(0)) {
          if (currentGasLimit > gasLimit) {
            trap(ERROR.OUT_OF_GAS)
          }
          gasLimit = currentGasLimit
        }

        runState.messageGasLimit = gasLimit
        return gas
      },
    ],
    [
      /* STATICCALL */
      0xfa,
      async function (runState, gas, common): Promise<bigint> {
        const [currentGasLimit, toAddr, inOffset, inLength, outOffset, outLength] =
          runState.stack.peek(6)

        gas += subMemUsage(runState, inOffset, inLength, common)
        gas += subMemUsage(runState, outOffset, outLength, common)

        if (common.isActivatedEIP(2929) === true) {
          const toAddress = new Address(addresstoBytes(toAddr))
          gas += accessAddressEIP2929(runState, toAddress, common)
        }

        const gasLimit = maxCallGas(
          currentGasLimit,
          runState.interpreter.getGasLeft() - gas,
          runState,
          common
        ) // we set TangerineWhistle or later to true here, as STATICCALL was available from Byzantium (which is after TangerineWhistle)

        runState.messageGasLimit = gasLimit
        return gas
      },
    ],
    [
      /* REVERT */
      0xfd,
      async function (runState, gas, common): Promise<bigint> {
        const [offset, length] = runState.stack.peek(2)
        gas += subMemUsage(runState, offset, length, common)
        return gas
      },
    ],
    [
      /* SELFDESTRUCT */
      0xff,
      async function (runState, gas, common): Promise<bigint> {
        if (runState.interpreter.isStatic()) {
          trap(ERROR.STATIC_STATE_CHANGE)
        }
        const selfdestructToaddressBigInt = runState.stack.peek()[0]

        const selfdestructToAddress = new Address(addresstoBytes(selfdestructToaddressBigInt))
        let deductGas = false
        if (common.gteHardfork(Hardfork.SpuriousDragon)) {
          // EIP-161: State Trie Clearing
          const balance = await runState.interpreter.getExternalBalance(
            runState.interpreter.getAddress()
          )
          if (balance > BigInt(0)) {
            // This technically checks if account is empty or non-existent
            const account = await runState.stateManager.getAccount(selfdestructToAddress)
            if (account === undefined || account.isEmpty()) {
              deductGas = true
            }
          }
        } else if (common.gteHardfork(Hardfork.TangerineWhistle)) {
          // EIP-150 (Tangerine Whistle) gas semantics
          const exists =
            (await runState.stateManager.getAccount(selfdestructToAddress)) !== undefined
          if (!exists) {
            deductGas = true
          }
        }
        if (deductGas) {
          gas += common.param('gasPrices', 'callNewAccount')
        }

        if (common.isActivatedEIP(2929) === true) {
          gas += accessAddressEIP2929(runState, selfdestructToAddress, common, true, true)
        }
        return gas
      },
    ],
  ])

// Set the range [0xa0, 0xa4] to the LOG handler
const logDynamicFunc = dynamicGasHandlers.get(0xa0)!
for (let i = 0xa1; i <= 0xa4; i++) {
  dynamicGasHandlers.set(i, logDynamicFunc)
}
