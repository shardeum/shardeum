import axios from 'axios'
import { NetworkAccount, WrappedAccount } from '../shardeumTypes'
import { Archiver } from '@shardeum-foundation/lib-archiver-discovery/dist/src/types'
import { ShardeumFlags } from '../shardeumFlags'

export interface NetworkAccountResponse {
  networkAccount: {
    data: NetworkAccount
  }
}

export interface NetworkAccountHashResponse {
  networkAccountHash: string
  sign: {
    owner: string
    sig: string
  }
}

export interface NetworkAccountDependencies {
  getFinalArchiverList: () => Archiver[]
  getRandom: (list: Archiver[], count: number) => Archiver[]
  verify: (obj: unknown, expectedPk?: string) => boolean
  ShardeumFlags: Pick<ShardeumFlags, 'VerboseLogs' | 'enableArchiverNetworkAccountValidation'>
  WrappedEVMAccountFunctions: {
    accountSpecificHash: (account: NetworkAccount) => string
  }
  nestedCountersInstance: {
    countEvent: (event: string, message: string) => void
  }
  findMajorityResult: (values: { hash: string, archiver: Archiver }[], getHash: (v: { hash: string, archiver: Archiver }) => string
  ) => { hash: string, archiver: Archiver } | null
  safeStringify: (value: unknown) => string
}

export const buildFetchNetworkAccountFromArchiver = ({
  getFinalArchiverList,
  getRandom,
  verify,
  ShardeumFlags,
  WrappedEVMAccountFunctions,
  nestedCountersInstance,
  findMajorityResult,
  safeStringify
}: NetworkAccountDependencies) => {
  return async function fetchNetworkAccountFromArchiver(): Promise<WrappedAccount> {
    //make a trustless query which will check 3 random archivers and call the endpoint with hash=true
    let archiverList = getFinalArchiverList()
    archiverList = getRandom(archiverList, archiverList.length >= 3 ? 3 : archiverList.length)
    const values: {
      hash: string
      archiver: Archiver
    }[] = []
    for (const archiver of archiverList) {
      const archiverUrl = `http://${archiver.ip}:${archiver.port}/get-network-account?hash=true`
      try {
        const res = await axios.get<{
          networkAccountHash: string
          sign: {
            owner: string
            sig: string
          }
        }>(archiverUrl)
        if (!res.data) {
          /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'failure: did not get network account from archiver private key. Use default configs.')
          throw new Error(`fetchNetworkAccountFromArchiver() from pk:${archiver.publicKey} returned null`)
        }
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`[fetchNetworkAccountFromArchiver] data: ${JSON.stringify(res.data)}`)
        const isFromArchiver = archiver.publicKey === res.data.sign.owner
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`[fetchNetworkAccountFromArchiver] isFronArchiver: ${isFromArchiver}`)
        if (!isFromArchiver) {
          throw new Error(`The response signature is not the same from archiver pk:${archiver.publicKey}`)
        }
        const isResponseVerified = verify(res.data, archiver.publicKey)
        /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`[fetchNetworkAccountFromArchiver] isResponseVerified: ${isResponseVerified}`)
        if (!isResponseVerified) {
          throw new Error(`The response signature is not the same from archiver pk:${archiver.publicKey}`)
        }
        values.push({
          hash: res.data.networkAccountHash as string,
          archiver,
        })
      } catch (ex) {
        //dont let one bad archiver crash us !
        /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', `error: ${ex?.message}`)
        console.error(
          `[fetchNetworkAccountFromArchiver] ERROR retrieving/processing data from archiver ${archiverUrl}: `,
          ex
        )
      }
    }

    //make sure there was a majority winner for the hash
    const majorityValue = findMajorityResult(values, (v) => v.hash)
    /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`[fetchNetworkAccountFromArchiver] majorityValue: ${safeStringify(majorityValue)}`)
    if (!majorityValue) {
      /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'failure: no majority found for archivers get-network-account result. Use default configs.')
      throw new Error(`no majority found for archivers get-network-account result `)
    }
    const url = `http://${majorityValue.archiver.ip}:${majorityValue.archiver.port}/get-network-account?hash=false`
    try {
      const res = await axios.get<{ networkAccount: WrappedAccount }>(url)
      /* prettier-ignore */ if (ShardeumFlags.VerboseLogs) console.log(`[fetchNetworkAccountFromArchiver] data: ${safeStringify(res?.data)}`)
      if (!res.data) {
        /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', 'failure: did not get network account from archiver private key, returned null. Use default configs.')
        throw new Error(
          `get-network-account from archiver pk:${majorityValue.archiver.publicKey} returned null`
        )
      }

      if (ShardeumFlags.enableArchiverNetworkAccountValidation) {
        // basic validation of the data to make sure we wont get unexpected errors
        if (!res.data.networkAccount || !res.data.networkAccount.data || !res.data.networkAccount.data.hash) {
          throw new Error(
            `get-network-account from archiver pk:${
              majorityValue.archiver.publicKey
            } returned malformed data: ${safeStringify(res.data)}`
          )
        }

        nestedCountersInstance.countEvent(
          'network-config-operation',
          'success: got network account from winning archiver'
        )

        // verify the 'winning' archiver's signature of the network account matches that of the response body signature
        const isResponseVerified = verify(res.data, majorityValue.archiver.publicKey)
        if (!isResponseVerified) {
          nestedCountersInstance.countEvent(
            'network-config-operation',
            'failure: The response signature is not the same from archiver pk:${majorityValue.archiver.publicKey}'
          )
          throw new Error(
            `The response signature is not the same from archiver pk:${majorityValue.archiver.publicKey}`
          )
        }

        // verify that the hash was not spoofed by the archiver, rehash the network account and compare
        const rehashedNetworkAccount = WrappedEVMAccountFunctions.accountSpecificHash(
          res.data.networkAccount.data
        )
        if (rehashedNetworkAccount !== majorityValue.hash) {
          nestedCountersInstance.countEvent(
            'network-config-operation',
            'failure: The rehashed network account is not the same as the majority hash'
          )
          throw new Error(
            `The rehashed network account is not the same as the majority hash. rehashed: ${rehashedNetworkAccount}, majority: ${majorityValue.hash}`
          )
        }
      }

      return res.data.networkAccount as WrappedAccount
    } catch (ex) {
      console.error(
        `[fetchNetworkAccountFromArchiver] ERROR retrieving/processing data from archiver ${url}: `,
        ex
      )
      /* prettier-ignore */ nestedCountersInstance.countEvent('network-config-operation', `error: ${ex?.message}`)
      throw new Error(`Not able to fetch get-network-account result from archiver `)
    }
  }
}
