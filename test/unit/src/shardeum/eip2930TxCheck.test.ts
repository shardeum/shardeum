import { AccessListEIP2930Transaction } from "@ethereumjs/tx";

function txCheck(transaction): { status: boolean, reason: string } {
  const isEIP2930 = true
  const ShardeumFlags = {
    accessListSizeLimit: 5
  }

  if (isEIP2930) {
    const eip2930Tx = (transaction as AccessListEIP2930Transaction)

    const tooManyAddresses = eip2930Tx.AccessListJSON?.length > ShardeumFlags.accessListSizeLimit;
    if (tooManyAddresses) {
      return { 
        status: false, 
        reason: `EIP2930 tx blocked for having > ${ShardeumFlags.accessListSizeLimit} addresses in accessList`
      }
    }

    const tooManyStorageKeys = eip2930Tx.AccessListJSON?.some((accessListItem) => accessListItem.storageKeys?.length > ShardeumFlags.accessListSizeLimit)
    if (tooManyStorageKeys) {
      return { 
        status: false, 
        reason: `EIP2930 tx blocked for having > ${ShardeumFlags.accessListSizeLimit} storage keys for at least one address`
      }
    }
  }

  return {
    status: true,
    reason: ''
  }
}

describe('EIP-2930 Tx Check', () => {
  test('should pass if access list length or storage keys per address < 6', () => {
    const tx = {
      AccessListJSON: [
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        }
      ]
    }

    const txResult = txCheck(tx)
    expect(txResult.status).toBe(true)
  })

  test('should fail if access list length is > 5', () => {
    const tx = {
      AccessListJSON: [
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
      ]
    }

    const txResult = txCheck(tx)
    expect(txResult.status).toBe(false)
  })

  test('should fail if storage keys length is > 5', () => {
    const tx = {
      AccessListJSON: [
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000', '0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
        {
          address: '0x0000000000000',
          storageKeys: ['0x0000000000000', '0x0000000000000', '0x0000000000000', '0x0000000000000']
        },
      ]
    }

    const txResult = txCheck(tx)
    expect(txResult.status).toBe(false)
  })

  test('should pass if accessListJSON is undefined', () => {
    const tx = {
      AccessListJSON: undefined
    }

    const txResult = txCheck(tx)
    expect(txResult.status).toBe(true)
  })

  test('should pass if accessListJSON is an empty array', () => {
    const tx = {
      AccessListJSON: []
    };
  
    const txResult = txCheck(tx);
    expect(txResult.status).toBe(true);
  });
  
  test('should pass if transaction does not have AccessListJSON property', () => {
    const tx = {}; // No AccessListJSON
  
    const txResult = txCheck(tx);
    expect(txResult.status).toBe(true);
  });
  
  test('should pass if storageKeys is missing or undefined for an address', () => {
    const tx = {
      AccessListJSON: [
        { address: '0x0000000000000' }, // No storageKeys
        { address: '0x0000000000000', storageKeys: undefined }
      ]
    };
  
    const txResult = txCheck(tx);
    expect(txResult.status).toBe(true);
  });
  
  test('should pass if access list contains exactly 5 addresses', () => {
    const tx = {
      AccessListJSON: [
        { address: '0x0000000000000', storageKeys: [] },
        { address: '0x0000000000000', storageKeys: [] },
        { address: '0x0000000000000', storageKeys: [] },
        { address: '0x0000000000000', storageKeys: [] },
        { address: '0x0000000000000', storageKeys: [] }
      ]
    };
  
    const txResult = txCheck(tx);
    expect(txResult.status).toBe(true);
  });
  
  test('should pass if storageKeys contains exactly 5 keys for an address', () => {
    const tx = {
      AccessListJSON: [
        { address: '0x0000000000000', storageKeys: ['0x1', '0x2', '0x3', '0x4', '0x5'] }
      ]
    };
  
    const txResult = txCheck(tx);
    expect(txResult.status).toBe(true);
  });
})
