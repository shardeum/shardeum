import { DevSecurityLevel, Shardus } from '@shardus/core';
import { validateTxnFields } from '../../../../src/setup/validateTxnFields';
import { InternalTXType } from '../../../../src/shardeum/shardeumTypes';
import * as validateModule from '../../../../src/tx/changeConfig/validate';

// Mock the dependencies
jest.mock('@shardus/core');
jest.mock('../../../../src/tx/changeConfig/validate');
jest.mock('../../../../src/config', () => ({}));

describe('validateTxnFields for ChangeConfig transactions', () => {
  // Setup mocks
  const mockShardus = {
    getMultisigPublicKeys: jest.fn().mockReturnValue({
      'mockKey1': DevSecurityLevel.High,
      'mockKey2': DevSecurityLevel.High
    })
  } as unknown as Shardus;
  
  const mockDebugAppdata = new Map<string, unknown>();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call validateConfigChangeTx for ChangeConfig transactions', () => {
    // Mock validateConfigChangeTx to return success
    const mockValidateConfigChangeTx = jest.spyOn(validateModule, 'validateConfigChangeTx')
      .mockReturnValue({ result: 'pass', reason: 'valid' });

    // Create a mock ChangeConfig transaction
    const mockTransaction = {
      tx: {
        internalTXType: InternalTXType.ChangeConfig,
        isInternalTx: true,
        config: JSON.stringify({}),
        sign: [{ owner: 'mockKey1', sig: 'mockSignature' }]
      }
    };

    // Call validateTxnFields with the mock transaction
    const validator = validateTxnFields(mockShardus, mockDebugAppdata);
    const result = validator(mockTransaction, {});

    // Verify that validateConfigChangeTx was called with the correct arguments
    expect(mockValidateConfigChangeTx).toHaveBeenCalledWith(
      mockTransaction.tx,
      expect.anything(),
      expect.anything(),
      expect.any(Number),
      expect.anything()
    );

    // Verify the result is correct
    expect(result.success).toBe(true);
    expect(result.reason).toBe('valid');
  });

  test('should return failure if validateConfigChangeTx returns failure', () => {
    // Mock validateConfigChangeTx to return failure
    const mockValidateConfigChangeTx = jest.spyOn(validateModule, 'validateConfigChangeTx')
      .mockReturnValue({ result: 'fail', reason: 'Invalid config' });

    // Create a mock ChangeConfig transaction
    const mockTransaction = {
      tx: {
        internalTXType: InternalTXType.ChangeConfig,
        isInternalTx: true,
        config: JSON.stringify({}),
        sign: [{ owner: 'mockKey1', sig: 'mockSignature' }]
      }
    };

    // Call validateTxnFields with the mock transaction
    const validator = validateTxnFields(mockShardus, mockDebugAppdata);
    const result = validator(mockTransaction, {});

    // Verify the result is correct
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Invalid config');
  });

  test('should return failure if no signature is provided', () => {
    // Create a mock ChangeConfig transaction without a signature
    const mockTransaction = {
      tx: {
        internalTXType: InternalTXType.ChangeConfig,
        isInternalTx: true,
        config: JSON.stringify({}),
        sign: null
      }
    };

    // Call validateTxnFields with the mock transaction
    const validator = validateTxnFields(mockShardus, mockDebugAppdata);
    const result = validator(mockTransaction, {});

    // Verify the result is correct
    expect(result.success).toBe(false);
    expect(result.reason).toBe('No signature found');
  });
}); 