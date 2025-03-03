/**
 * This file contains the configuration settings specific to multisig key management.
 * It defines the trusted addresses that can modify the multisig key list and
 * the minimum number of signatures required for key management operations.
 */

// Selected trusted subset of multisig keys for key management operations
export const DEFAULT_KEY_MANAGER_ADDRESSES = [
  '0x002D3a2BfE09E3E29b6d38d58CaaD16EEe4C9BC5',
  '0x80aF8E195B56aCC3b4ec8e2C99EC38957258635a',
  '0x7Efbb31431ac7C405E8eEba99531fF1254fCA3B6',
  '0xCc74bf387F6C102b5a7F828796C57A6D2D19Cb00',
  '0x4ed5C053BF2dA5F694b322EA93dce949F3276B85',
]

// Minimum number of signatures required for key management operations
export const DEFAULT_KEY_MANAGEMENT_MIN_SIGNATURES = 3