import { Address } from '@ethereumjs/util'

import type { PrecompileFunc } from './precompiles/index.js'

const defaults = {
  value: BigInt(0),
  caller: Address.zero(),
  data: new Uint8Array(0),
  depth: 0,
  isStatic: false,
  isCompiled: false,
  delegatecall: false,
  gasRefund: BigInt(0),
}

interface MessageOpts {
  to?: Address
  value?: bigint
  caller?: Address
  gasLimit: bigint
  data?: Uint8Array
  depth?: number
  code?: Uint8Array | PrecompileFunc
  codeAddress?: Address
  isStatic?: boolean
  isCompiled?: boolean
  salt?: Uint8Array
  /**
   * A set of addresses to selfdestruct, see {@link Message.selfdestruct}
   */
  selfdestruct?: Set<string>
  /**
   * Map of addresses which were created (used in EIP 6780)
   */
  createdAddresses?: Set<string>
  delegatecall?: boolean
  authcallOrigin?: Address
  gasRefund?: bigint
  versionedHashes?: Uint8Array[]
}

export class Message {
  to?: Address
  value: bigint
  caller: Address
  gasLimit: bigint
  data: Uint8Array
  depth: number
  code?: Uint8Array | PrecompileFunc
  _codeAddress?: Address
  isStatic: boolean
  isCompiled: boolean
  salt?: Uint8Array
  containerCode?: Uint8Array /** container code for EOF1 contracts - used by CODECOPY/CODESIZE */
  /**
   * Set of addresses to selfdestruct. Key is the unprefixed address.
   */
  selfdestruct?: Set<string>
  /**
   * Map of addresses which were created (used in EIP 6780)
   */
  createdAddresses?: Set<string>
  delegatecall: boolean
  /**
   * This is used to store the origin of the AUTHCALL,
   * the purpose is to figure out where `value` should be taken from (not from `caller`)
   */
  authcallOrigin?: Address
  gasRefund: bigint // Keeps track of the gasRefund at the start of the frame (used for journaling purposes)
  /**
   * List of versioned hashes if message is a blob transaction in the outer VM
   */
  versionedHashes?: Uint8Array[]

  constructor(opts: MessageOpts) {
    this.to = opts.to
    this.value = opts.value ?? defaults.value
    this.caller = opts.caller ?? defaults.caller
    this.gasLimit = opts.gasLimit
    this.data = opts.data ?? defaults.data
    this.depth = opts.depth ?? defaults.depth
    this.code = opts.code
    this._codeAddress = opts.codeAddress
    this.isStatic = opts.isStatic ?? defaults.isStatic
    this.isCompiled = opts.isCompiled ?? defaults.isCompiled
    this.salt = opts.salt
    this.selfdestruct = opts.selfdestruct
    this.createdAddresses = opts.createdAddresses
    this.delegatecall = opts.delegatecall ?? defaults.delegatecall
    this.authcallOrigin = opts.authcallOrigin
    this.gasRefund = opts.gasRefund ?? defaults.gasRefund
    this.versionedHashes = opts.versionedHashes
    if (this.value < 0) {
      throw new Error(`value field cannot be negative, received ${this.value}`)
    }
  }

  /**
   * Note: should only be called in instances where `_codeAddress` or `to` is defined.
   */
  get codeAddress(): Address {
    const codeAddress = this._codeAddress ?? this.to
    if (!codeAddress) {
      throw new Error('Missing codeAddress')
    }
    return codeAddress
  }
}

export type MessageWithTo = Message & Pick<Required<MessageOpts>, 'to'>
