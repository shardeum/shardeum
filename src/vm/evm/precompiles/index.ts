import { Address } from 'ethereumjs-util'
import Common from '@ethereumjs/common'
import { PrecompileInput, PrecompileFunc } from './types'
import { default as p1 } from './01-ecrecover'
import { default as p2 } from './02-sha256'
import { default as p3 } from './03-ripemd160'
import { default as p4 } from './04-identity'
import { default as p5 } from './05-modexp'
import { default as p6 } from './06-ecadd'
import { default as p7 } from './07-ecmul'
import { default as p8 } from './08-ecpairing'
import { default as p9 } from './09-blake2f'
import { default as pa } from './0a-bls12-g1add'
import { default as pb } from './0b-bls12-g1mul'
import { default as pc } from './0c-bls12-g1multiexp'
import { default as pd } from './0d-bls12-g2add'
import { default as pe } from './0e-bls12-g2mul'
import { default as pf } from './0f-bls12-g2multiexp'
import { default as p10 } from './10-bls12-pairing'
import { default as p11 } from './11-bls12-map-fp-to-g1'
import { default as p12 } from './12-bls12-map-fp2-to-g2'

interface Precompiles {
  [key: string]: PrecompileFunc
}

interface PrecompileAvailability {
  [key: string]: PrecompileAvailabilityCheckType
}

type PrecompileAvailabilityCheckType =
  | PrecompileAvailabilityCheckTypeHardfork
  | PrecompileAvailabilityCheckTypeEIP

enum PrecompileAvailabilityCheck {
  EIP,
  Hardfork,
}

interface PrecompileAvailabilityCheckTypeHardfork {
  type: PrecompileAvailabilityCheck.Hardfork
  param: string
}

interface PrecompileAvailabilityCheckTypeEIP {
  type: PrecompileAvailabilityCheck.EIP
  param: number
}

const ripemdPrecompileAddress = '0000000000000000000000000000000000000003'
const precompiles: Precompiles = {
  '0000000000000000000000000000000000000001': p1,
  '0000000000000000000000000000000000000002': p2,
  [ripemdPrecompileAddress]: p3,
  '0000000000000000000000000000000000000004': p4,
  '0000000000000000000000000000000000000005': p5,
  '0000000000000000000000000000000000000006': p6,
  '0000000000000000000000000000000000000007': p7,
  '0000000000000000000000000000000000000008': p8,
  '0000000000000000000000000000000000000009': p9,
  '000000000000000000000000000000000000000a': pa,
  '000000000000000000000000000000000000000b': pb,
  '000000000000000000000000000000000000000c': pc,
  '000000000000000000000000000000000000000d': pd,
  '000000000000000000000000000000000000000e': pe,
  '000000000000000000000000000000000000000f': pf,
  '0000000000000000000000000000000000000010': p10,
  '0000000000000000000000000000000000000011': p11,
  '0000000000000000000000000000000000000012': p12,
}

const precompileAvailability: PrecompileAvailability = {
  '0000000000000000000000000000000000000001': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'chainstart',
  },
  '0000000000000000000000000000000000000002': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'chainstart',
  },
  [ripemdPrecompileAddress]: {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'chainstart',
  },
  '0000000000000000000000000000000000000004': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'chainstart',
  },
  '0000000000000000000000000000000000000005': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'byzantium',
  },
  '0000000000000000000000000000000000000006': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'byzantium',
  },
  '0000000000000000000000000000000000000007': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'byzantium',
  },
  '0000000000000000000000000000000000000008': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'byzantium',
  },
  '0000000000000000000000000000000000000009': {
    type: PrecompileAvailabilityCheck.Hardfork,
    param: 'istanbul',
  },
  '000000000000000000000000000000000000000a': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '000000000000000000000000000000000000000b': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '000000000000000000000000000000000000000c': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '000000000000000000000000000000000000000d': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '000000000000000000000000000000000000000f': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '000000000000000000000000000000000000000e': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '0000000000000000000000000000000000000010': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '0000000000000000000000000000000000000011': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
  '0000000000000000000000000000000000000012': {
    type: PrecompileAvailabilityCheck.EIP,
    param: 2537,
  },
}

function getPrecompile(address: Address, common: Common): PrecompileFunc {
  const addr = address.buf.toString('hex')
  if (precompiles[addr]) {
    const availability = precompileAvailability[addr]
    if (
      (availability.type == PrecompileAvailabilityCheck.Hardfork &&
        common.gteHardfork(availability.param)) ||
      (availability.type == PrecompileAvailabilityCheck.EIP &&
        common.eips().includes(availability.param))
    ) {
      return precompiles[addr]
    }
  }
  return precompiles['']
}

function getActivePrecompiles(common: Common): Address[] {
  const activePrecompiles: Address[] = []
  for (const addressString in precompiles) {
    const address = new Address(Buffer.from(addressString, 'hex'))
    if (getPrecompile(address, common)) {
      activePrecompiles.push(address)
    }
  }
  return activePrecompiles
}

export {
  precompiles,
  getPrecompile,
  PrecompileFunc,
  PrecompileInput,
  ripemdPrecompileAddress,
  getActivePrecompiles,
}
