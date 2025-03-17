import { DevSecurityLevel, ShardusTypes } from '@shardeum-foundation/core'
import config from '../../config'
import { logFlags, shardusConfig } from '../..'
import { getFinalArchiverList } from '@shardeum-foundation/lib-archiver-discovery'
import { getRandom } from '../../utils'
import { verifyMultiSigs } from '../helpers'
import { Archiver } from '@shardeum-foundation/lib-archiver-discovery/dist/src/types'
import { Address } from '@ethereumjs/util'
import { customAxios } from '../../utils/customHttpFunctions'

export interface Ticket {
  address: string
}

export interface TicketType {
  type: string
  data: Ticket[]
  sign: ShardusTypes.Sign[]
}

export enum TicketTypes {
  SILVER = 'silver'
}

const ticketTypeMap = new Map<string, TicketType>()

export function updateTicketMapAndScheduleNextUpdate(): void {
  updateTicketMap().catch((error) => {
    console.error(`[tickets][updateTicketMapAndScheduleNextUpdate] ERROR:`, error)
  }).finally(() => {
    scheduleUpdateTicketMap()
  })
}

export function scheduleUpdateTicketMap(): void {
  const delayInMs = config.server.features.tickets.updateTicketListTimeInMs || config.server.p2p.cycleDuration * 1000
  /* prettier-ignore */ if (logFlags.debug) console.log(JSON.stringify({script: 'tickets',method: 'scheduleUpdateTicketMap',data: { delayInMs },}))
  setTimeout(() => {
    updateTicketMapAndScheduleNextUpdate()
  }, delayInMs)
}

function getArchiverToRetrieveTicketType(): Archiver {
  const archiverList = getFinalArchiverList()
  if (archiverList.length > 0) {
    return getRandom(archiverList, 1)[0]
  }
  return undefined
}

async function getTicketTypesFromArchiver(archiver: Archiver): Promise<TicketType[]> {
  try {
    const url = `http://${archiver.ip}:${archiver.port}/tickets`
    const res = await customAxios().get(url)
    if (res.status >= 200 && res.status < 300) {
      return res.data
    }
  } catch (error){
    console.error(`[tickets][getTicketTypesFromArchiver] Error getting ticket list`, error)
  }
  return []
}

export function clearTicketMap(): void {
  ticketTypeMap.clear()
}

export async function updateTicketMap(): Promise<void> {
  const archiver: Archiver = getArchiverToRetrieveTicketType()
  /* prettier-ignore */ if (logFlags.debug) console.log(JSON.stringify({script: 'tickets',method: 'updateTicketMap',data: { archiver: archiver },}))
  if (archiver){
    const ticketTypes: TicketType[] = await getTicketTypesFromArchiver(archiver)

    const devPublicKeys = shardusConfig?.debug?.multisigKeys || {}
    const requiredSigs = Math.max(3, shardusConfig?.debug?.minMultiSigRequiredForGlobalTxs || 1)

    ticketTypes.forEach((ticketType: TicketType, i: number) => {
      const { sign, ...ticketTypeWithoutSign } = ticketType
      /* prettier-ignore */ if (logFlags.debug) console.log(JSON.stringify({script: 'tickets',method: 'updateTicketMap',data: { sign, ticketTypeWithoutSign, devPublicKeys, requiredSigs },}))
      const isValidSig = verifyMultiSigs(
        ticketTypeWithoutSign,
        sign,
        devPublicKeys,
        requiredSigs,
        DevSecurityLevel.High
      )
      /* prettier-ignore */ if (logFlags.debug) console.log(JSON.stringify({script: 'tickets',method: 'updateTicketMap',data: { index: i, ticketType, isValidSig },}))
      if (isValidSig) {
        console.log(`[tickets][updateTicketMap] ticket type ${ticketType.type} added to ticket map`)
        ticketTypeMap.set(ticketType.type, ticketType)
      } else {
        console.warn(`[tickets][updateTicketMap] Invalid signature for ticket ${JSON.stringify(ticketType)}`)
      }
    })
  } else {
    console.warn(`[tickets][updateTicketMap] No archivers found`)
  }
}

export function getTicketsByType(type: string): Ticket[] {
  if (ticketTypeMap.has(type)) {
    return ticketTypeMap.get(type).data
  }
  return []
}

export function doesTransactionSenderHaveTicketType({ticketType, senderAddress}: { ticketType:TicketTypes, senderAddress:Address }): {
  success: boolean
  reason: string
  enabled: boolean
} {
  const result: { success:boolean, reason:string, enabled:boolean } = { success: false, reason: '', enabled: false }
  /* prettier-ignore */ if (logFlags.debug) console.log(`[ticket-master][doesNominatorHaveTicketType] ticketType: ${ticketType}, senderAddress: ${senderAddress}`)
  // Check if Silver Tickets feature is enabled in the shardus configuration
  /* prettier-ignore */ if (logFlags.debug) console.log(`[ticket-master][doesNominatorHaveTicketType] shardusConfig: ${JSON.stringify(shardusConfig)}`)
  const ticketTypes = shardusConfig?.features?.tickets?.ticketTypes || []
  /* prettier-ignore */ if (logFlags.debug) console.log(`[ticket-master][doesNominatorHaveTicketType] ticketTypes: ${JSON.stringify(ticketTypes)}`)
  const isSilverTicketsEnabled = ticketTypes?.find((tt) => tt.type === ticketType)?.enabled
  /* prettier-ignore */ if (logFlags.debug) console.log(`[ticket-master][doesNominatorHaveTicketType] isSilverTicketsEnabled: ${isSilverTicketsEnabled}`)
  result.enabled = isSilverTicketsEnabled
  if (isSilverTicketsEnabled) {
    let silverTicketForNominee: Ticket | undefined
    // Retrieve all Silver Tickets using the TicketManager
    const silverTickets: Ticket[] = getTicketsByType(ticketType)
    /* prettier-ignore */ if (logFlags.debug) console.log(`[ticket-master][doesNominatorHaveTicketType] silverTickets: ${JSON.stringify(silverTickets)}`)
    if (silverTickets.length > 0) {
      // Look for a Silver Ticket that matches the nominee's address (case-insensitive comparison)
      silverTicketForNominee = silverTickets.find((ticket) => {
        try {
          return senderAddress.equals(Address.fromString(ticket.address))
        } catch (e) {
          console.error(
            `[ticket-master][doesNominatorHaveTicketType] Error while checking silver ticket address ${ticket.address}`,
            e
          )
        }
        return false
      })
      /* prettier-ignore */ if (logFlags.debug) console.log(`[ticket-master][doesNominatorHaveTicketType] silverTicketForNominee: ${JSON.stringify(silverTicketForNominee)}`)
      // If no matching Silver Ticket is found for the nominee, return a failure response
      if (!silverTicketForNominee) {
        result.reason = 'Nominee does not have a Silver Ticket'
      } else {
        result.success = true
      }
    } else {
      // If no Silver Tickets are found at all, return a failure response
      result.reason = 'No Silver Tickets found'
    }
  } else {
    result.reason = 'Silver Tickets feature is not enabled'
  }
  return result
}
