/**
 * Utility function for validating chain IDs
 */

const isHexString = /^0x[0-9a-fA-F]+$/
const maxSafeInteger = BigInt(2147483647)

/**
 * Validates if a chain ID is valid and matches an expected value
 *
 * @param givenChainId The chain ID to validate (must be a hex string with 0x prefix)
 * @param expectedChainId The expected chain ID to compare against
 * @returns True if the chain ID is valid and matches the expected value, false otherwise
 */
export function validateTxChainId(givenChainId: any, expectedChainId: number): boolean {
  // First check if the given chain ID is valid
  if (givenChainId === undefined || givenChainId === null) {
    return false
  }

  // make sure expectedChainId is an integer
  if (!Number.isInteger(expectedChainId)) {
    return false
  }

  // Only accept 0x-prefixed hex strings
  if (typeof givenChainId !== 'string' || !givenChainId.startsWith('0x')) {
    return false
  }

  // Validate it's a proper hex string
  if (!isHexString.test(givenChainId)) {
    return false
  }

  let chainIdBigInt: bigint

  try {
    // Convert the hex string to BigInt
    chainIdBigInt = BigInt(givenChainId)
  } catch (error) {
    return false // Conversion error
  }

  // EIP-155 specifies that chain IDs should be positive integers
  // 0 is reserved, so we check if it's greater than 0
  if (chainIdBigInt <= BigInt(0)) {
    return false
  }

  // Arbitrary large number check to avoid absurdly large chain IDs
  // The largest known chain ID as of now is much smaller than this
  if (chainIdBigInt > maxSafeInteger) {
    return false
  }

  // Check if expected chain ID is
  if (expectedChainId <= 0) {
    return false
  }

  // Compare the chain IDs - convert expected to BigInt for comparison
  return chainIdBigInt === BigInt(expectedChainId)
}
