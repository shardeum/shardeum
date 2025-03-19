import {
  updateTicketMap,
  getTicketsByType,
  doesTransactionSenderHaveTicketType,
  TicketTypes, clearTicketMap,
} from '../../../../../src/setup/ticket-manager'  // Use correct path to your module
import axios from 'axios';
import { getFinalArchiverList } from '@shardeum-foundation/lib-archiver-discovery';
import { Address } from '@ethereumjs/util';
import {expect, jest} from '@jest/globals';
import { verifyMultiSigs } from '../../../../../src/setup/helpers';

jest.mock('axios');
jest.mock('@shardeum-foundation/lib-archiver-discovery');
jest.mock('../../../../../src/setup/helpers');

// Mock customAxios function
jest.mock('../../../../../src/utils/customHttpFunctions', () => ({
  customAxios: () => axios,
  customGot: jest.fn(),
}));

const mockedVerifyMultiSigs = jest.mocked(verifyMultiSigs);
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetFinalArchiverList = getFinalArchiverList as jest.Mocked<typeof getFinalArchiverList>;

jest.mock('../../../../../src', () => ({
  shardusConfig: {
    debug: {
      multisigKeys: {
        "0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76": 3
      },
      minMultiSigRequiredForGlobalTxs: 1
    },
    features: {
      tickets: {
        updateTicketListTimeInMs: 0,
        ticketTypes: [
          { type: 'silver', enabled: true }
        ]
      }
    }
  },
  logFlags: {
    debug: false,
  },
}))

const ticketTypeWithSilverTicket = { type: 'silver', data: [{"address": "0xd79eFA2f9bB9C780e4Ce05D6b8a15541915e4636"}], sign: [{"owner": "0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76","sig": "0xf3e7f8ccc763a8b832ad933b35bb181962d9d94316407e49142cd182d090559d66904856ea2811d44ee11c000678cf9d10134636cd8e4aaa26e78baca19a896f1c"}] }
const ticketTypeWithOutSilverTicket = { type: 'gold', data: [{"address": "0xd79eFA2f9bB9C780e4Ce05D6b8a15541915e4636"}], sign: [{"owner": "0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76","sig": "0xf0853b553af26db42f9167ed68a98f584d1128e130d1aa1709e737e2ab1da995065247d3346d27c4f56a4560a84f32c3c869db46a97bd5d7d48f935a972a0b081b"}] }
const ticketTypeWithSilverTicketAndInvalidSignature = { type: 'silver', data: [{"address": "0xd79eFA2f9bB9C780e4Ce05D6b8a15541915e4631"}], sign: [{"owner": "0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76","sig": "0xf0853b553af26db42f9167ed68a98f584d1128e130d1aa1709e737e2ab1da995065247d3346d27c4f56a4560a84f32c3c869db46a97bd5d7d48f935a972a0b081b"}] }

describe('Ticket Type Test Cases', () => {

  beforeEach(async () => {
    mockedVerifyMultiSigs.mockReturnValue(true);
    mockedGetFinalArchiverList.mockReturnValue([{ ip: '127.0.0.1', port: 3000, publicKey: '' }]);
    mockedAxios.get.mockResolvedValue({ status: 200, data: [{ ...ticketTypeWithSilverTicket }] })
    await updateTicketMap();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('updateTicketMap', () => {
    it('should fail to update ticketMap if signature is invalid', async () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
      mockedVerifyMultiSigs.mockReturnValue(false);
      mockedAxios.get.mockResolvedValue({ status: 200, data: [{ ...ticketTypeWithSilverTicketAndInvalidSignature }] });
      await updateTicketMap();
      const senderAddress = Address.fromString('0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76');
      const result = doesTransactionSenderHaveTicketType({
        ticketType: TicketTypes.SILVER,
        senderAddress
      });
      expect(result.success).toBe(false);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getTicketsByType', () => {
    it('should return empty array if no tickets of given type', () => {
      const result = getTicketsByType('nonexistent');
      expect(result).toEqual([]);
    });

    it('should return tickets if type exists in map', () => {
      const result = getTicketsByType('silver');
      expect(result.length).toEqual(1)
    });
  });

  describe('doesTransactionSenderHaveTicketType', () => {
    it('should return true if sender has a silver ticket', () => {
      const senderAddress = Address.fromString('0xd79eFA2f9bB9C780e4Ce05D6b8a15541915e4636');
      const result = doesTransactionSenderHaveTicketType({
        ticketType: TicketTypes.SILVER,
        senderAddress
      });
      expect(result.success).toBe(true);
    });

    it('should return false if no silver tickets found', async () => {
      clearTicketMap()
      mockedAxios.get.mockResolvedValue({ status: 200, data: [{ ...ticketTypeWithOutSilverTicket }] })
      await updateTicketMap();
      const senderAddress = Address.fromString('0xd79eFA2f9bB9C780e4Ce05D6b8a15541915e4636');
      const result = doesTransactionSenderHaveTicketType({
        ticketType: TicketTypes.SILVER,
        senderAddress
      });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('No Silver Tickets found');
    });

    it('should return false if sender does not have a silver ticket', () => {
      const senderAddress = Address.fromString('0x1e5e12568b7103E8B22cd680A6fa6256DD66ED76');
      const result = doesTransactionSenderHaveTicketType({
        ticketType: TicketTypes.SILVER,
        senderAddress
      });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Nominee does not have a Silver Ticket');
    });
  });
});
