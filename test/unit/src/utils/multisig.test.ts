import { isKeyChange, isMultisigKeyChangeDetailed, isDevKeyChangeDetailed, isKeyChangeDetailed } from '../../../../src/utils/multisig'
import { expect, describe, test } from '@jest/globals'
import { keyListAsLeveledKeys } from '../../../../src/utils/keyUtils'

const mockPermissions = {
  changeDevKeyList: ['0xDevAddress1', '0xDevAddress2'],
  changeMultiSigKeyList: ['0xMultiSigAddress1', '0xDevAddress1'],
  initiateSecureAccountTransfer: ['0xTestAddress1']
};

describe('multisig utility functions', () => {
  describe('isKeyChange', () => {
    test('should return { isKeyChange: false, permittedKeys: [] } when config is not a string', () => {
      const tx = { config: {} } as any
      const currentConfig = {}
      expect(isKeyChange(tx, currentConfig, mockPermissions)).toEqual({
        isKeyChange: false,
        permittedKeys: []
      })
    })

    test('should return { isKeyChange: false, permittedKeys: [] } when config is not valid JSON', () => {
      const tx = { config: '{invalid json' } as any
      const currentConfig = {}
      expect(isKeyChange(tx, currentConfig, mockPermissions)).toEqual({
        isKeyChange: false,
        permittedKeys: []
      })
    })

    test('should return { isKeyChange: false, permittedKeys: [] } when no keys are changing', () => {
      const currentConfig = {
        debug: {
          multisigKeys: {
            'key1': 2,
            'key2': 1
          },
          devKeys: {
            'key3': 2,
            'key4': 1
          }
        }
      }
      
      // Same keys in new config
      const tx = { 
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              'key1': 2,
              'key2': 1
            },
            devKeys: {
              'key3': 2,
              'key4': 1
            }
          }
        })
      } as any
      
      expect(isKeyChange(tx, currentConfig, mockPermissions)).toEqual({
        isKeyChange: false,
        permittedKeys: []
      })
    })

    test('should return multisig permitted keys when only multisig keys are changing', () => {
      const currentConfig = {
        debug: {
          multisigKeys: {
            'key1': 2,
            'key2': 1
          },
          devKeys: {
            'key3': 2,
            'key4': 1
          }
        }
      }
      
      // Changed multisig keys
      const tx = { 
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              'key1': 2,
              'key5': 1 // key5 instead of key2
            },
            devKeys: {
              'key3': 2,
              'key4': 1
            }
          }
        })
      } as any
      
      expect(isKeyChange(tx, currentConfig, mockPermissions)).toEqual({
        isKeyChange: true,
        permittedKeys: ['0xMultiSigAddress1', '0xDevAddress1']
      })
    })

    test('should return dev key permitted keys when only dev keys are changing', () => {
      const currentConfig = {
        debug: {
          multisigKeys: {
            'key1': 2,
            'key2': 1
          },
          devKeys: {
            'key3': 2,
            'key4': 1
          }
        }
      }
      
      // Changed dev keys
      const tx = { 
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              'key1': 2,
              'key2': 1
            },
            devKeys: {
              'key3': 2,
              'key5': 1 // key5 instead of key4
            }
          }
        })
      } as any
      
      expect(isKeyChange(tx, currentConfig, mockPermissions)).toEqual({
        isKeyChange: true,
        permittedKeys: ['0xDevAddress1', '0xDevAddress2']
      })
    })

    test('should return intersection of permitted keys when both key types are changing', () => {
      const currentConfig = {
        debug: {
          multisigKeys: {
            'key1': 2,
            'key2': 1
          },
          devKeys: {
            'key3': 2,
            'key4': 1
          }
        }
      }
      
      // Changed both key types
      const tx = { 
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              'key1': 2,
              'key5': 1 // key5 instead of key2
            },
            devKeys: {
              'key3': 2,
              'key6': 1 // key6 instead of key4
            }
          }
        })
      } as any
      
      expect(isKeyChange(tx, currentConfig, mockPermissions)).toEqual({
        isKeyChange: true,
        permittedKeys: ['0xDevAddress1'] // Intersection of both lists
      })
    })

    // Tests for nullish coalescing branches
    test('should handle missing changeMultiSigKeyList when multisig keys are changing', () => {
      const currentConfig = {
        debug: {
          multisigKeys: {
            'key1': 2,
            'key2': 1
          }
        }
      };
      
      // Changed multisig keys
      const tx = { 
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              'key1': 2,
              'key5': 1 // key5 instead of key2
            }
          }
        })
      } as any;
      
      // Use a mock with missing changeMultiSigKeyList
      const permissionsWithoutMultiSigList = {
        changeDevKeyList: ['0xDevAddress1', '0xDevAddress2'],
        initiateSecureAccountTransfer: ['0xTestAddress1']
      };
      
      // The function should use an empty array as fallback
      expect(isKeyChange(tx, currentConfig, permissionsWithoutMultiSigList)).toEqual({
        isKeyChange: true,
        permittedKeys: []
      });
    });

    test('should handle missing changeDevKeyList when dev keys are changing', () => {
      const currentConfig = {
        debug: {
          devKeys: {
            'key3': 2,
            'key4': 1
          }
        }
      };
      
      // Changed dev keys
      const tx = { 
        config: JSON.stringify({
          debug: {
            devKeys: {
              'key3': 2,
              'key5': 1 // key5 instead of key4
            }
          }
        })
      } as any;
      
      // Use a mock with missing changeDevKeyList
      const permissionsWithoutDevKeyList = {
        changeMultiSigKeyList: ['0xMultiSigAddress1', '0xDevAddress1'],
        initiateSecureAccountTransfer: ['0xTestAddress1']
      };
      
      // The function should use an empty array as fallback
      expect(isKeyChange(tx, currentConfig, permissionsWithoutDevKeyList)).toEqual({
        isKeyChange: true,
        permittedKeys: []
      });
    });

    test('should handle missing both key lists when both key types are changing', () => {
      const currentConfig = {
        debug: {
          multisigKeys: {
            'key1': 2,
            'key2': 1
          },
          devKeys: {
            'key3': 2,
            'key4': 1
          }
        }
      };
      
      // Changed both key types
      const tx = { 
        config: JSON.stringify({
          debug: {
            multisigKeys: {
              'key1': 2,
              'key5': 1 // key5 instead of key2
            },
            devKeys: {
              'key3': 2,
              'key6': 1 // key6 instead of key4
            }
          }
        })
      } as any;
      
      // Use a mock with missing both key lists
      const permissionsWithoutBothLists = {
        initiateSecureAccountTransfer: ['0xTestAddress1']
      };
      
      // The function should use empty arrays as fallback, resulting in empty intersection
      expect(isKeyChange(tx, currentConfig, permissionsWithoutBothLists)).toEqual({
        isKeyChange: true,
        permittedKeys: []
      });
    });
  })

  describe('isKeyChangeDetailed', () => {
    test('should return false when newConfig has no keys of specified type', () => {
      const oldConfig = {
        debug: {
          testKeys: {
            'key1': 2
          }
        }
      }
      
      const newConfig = {
        debug: {}
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(false)
    })

    test('should return false when newConfig.debug is null', () => {
      const oldConfig = {
        debug: {
          testKeys: {
            'key1': 2
          }
        }
      }
      
      const newConfig = { debug: null }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(false)
    })

    test('should return false when newConfig is null', () => {
      const oldConfig = {
        debug: {
          testKeys: {
            'key1': 2
          }
        }
      }
      
      const newConfig = null
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(false)
    })

    test('should return false when keys are identical', () => {
      const oldConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key2': 1
          }
        }
      }
      
      const newConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key2': 1
          }
        }
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(false)
    })

    test('should return true when number of keys is different', () => {
      const oldConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key2': 1
          }
        }
      }
      
      const newConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key2': 1,
            'key3': 1
          }
        }
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(true)
    })

    test('should return true when a key is removed', () => {
      const oldConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key2': 1
          }
        }
      }
      
      const newConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key3': 1 // key2 removed, key3 added
          }
        }
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(true)
    })

    test('should return true when a key\'s security level has changed', () => {
      const oldConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key2': 1
          }
        }
      }
      
      const newConfig = {
        debug: {
          testKeys: {
            'key1': 2,
            'key2': 2 // security level changed from 1 to 2
          }
        }
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(true)
    })

    test('should handle case when oldConfig has no keys of specified type', () => {
      const oldConfig = {
        debug: {}
      }
      
      const newConfig = {
        debug: {
          testKeys: {
            'key1': 2
          }
        }
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(true)
    })

    test('should handle case when oldConfig has no debug property', () => {
      const oldConfig = {}
      
      const newConfig = {
        debug: {
          testKeys: {
            'key1': 2
          }
        }
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(true)
    })

    test('should handle case when oldConfig is null', () => {
      const oldConfig = null
      
      const newConfig = {
        debug: {
          testKeys: {
            'key1': 2
          }
        }
      }
      
      expect(isKeyChangeDetailed(oldConfig, newConfig, 'testKeys')).toBe(true)
    })
  })

  describe('isMultisigKeyChangeDetailed', () => {
    test('should call isKeyChangeDetailed with multisigKeys', () => {
      const oldConfig = {
        debug: {
          multisigKeys: {
            'key1': 2
          }
        }
      }
      
      const newConfig = {
        debug: {
          multisigKeys: {
            'key2': 1
          }
        }
      }
      
      expect(isMultisigKeyChangeDetailed(oldConfig, newConfig)).toBe(true)
    })
  })

  describe('isDevKeyChangeDetailed', () => {
    test('should call isKeyChangeDetailed with devKeys', () => {
      const oldConfig = {
        debug: {
          devKeys: {
            'key1': 2
          }
        }
      }
      
      const newConfig = {
        debug: {
          devKeys: {
            'key2': 1
          }
        }
      }
      
      expect(isDevKeyChangeDetailed(oldConfig, newConfig)).toBe(true)
    })
  })

  describe('keyListAsLeveledKeys', () => {
    test('should convert empty array to empty object', () => {
      const keyList: string[] = []
      const securityLevel = 2
      
      expect(keyListAsLeveledKeys(keyList, securityLevel)).toEqual({})
    })

    test('should assign the same security level to all keys', () => {
      const keyList = ['key1', 'key2', 'key3']
      const securityLevel = 2
      
      const expected = {
        'key1': 2,
        'key2': 2,
        'key3': 2
      }
      
      expect(keyListAsLeveledKeys(keyList, securityLevel)).toEqual(expected)
    })

    test('should handle different security levels', () => {
      const keyList = ['key1', 'key2']
      const securityLevel = 1
      
      const expected = {
        'key1': 1,
        'key2': 1
      }
      
      expect(keyListAsLeveledKeys(keyList, securityLevel)).toEqual(expected)
    })
  })
}) 