/**
 * Utility functions for validating chain IDs
 */

/**
 * Validates if a chain ID is a valid Ethereum chain ID
 * 
 * @param chainId The chain ID to validate
 * @returns True if the chain ID is valid, false otherwise
 */
export function isValidChainId(chainId: any): boolean {
  // Check if chainId is defined
  if (chainId === undefined || chainId === null) {
    return false;
  }

  // Convert to string if it's not already
  const chainIdStr = typeof chainId === 'string' ? chainId : String(chainId);
  
  // Check if it's a valid number string
  if (!/^\d+$/.test(chainIdStr)) {
    return false;
  }

  // Check if it's in a reasonable range
  const chainIdNum = Number(chainIdStr);
  
  // EIP-155 specifies that chain IDs should be positive integers
  // 0 is reserved, so we check if it's greater than 0
  if (chainIdNum <= 0 || !Number.isInteger(chainIdNum)) {
    return false;
  }

  // Arbitrary large number check to avoid absurdly large chain IDs
  // The largest known chain ID as of now is much smaller than this
  if (chainIdNum > 2147483647) { // 2^31 - 1, max safe integer that works everywhere
    return false;
  }

  return true;
}

/**
 * Gets the chain ID from a transaction object
 * 
 * @param tx The transaction object
 * @param defaultChainId Optional default chain ID to use if not found in transaction
 * @returns The chain ID as a number, or undefined if not found/invalid
 */
export function getChainId(tx: any, defaultChainId?: number): number | undefined {
  if (!tx) {
    return defaultChainId;
  }

  // Try to get chainId from tx
  const chainId = tx.chainId;

  if (!isValidChainId(chainId)) {
    return defaultChainId;
  }

  return Number(chainId);
}

/**
 * Validates if a transaction's chain ID matches the expected chain ID
 * 
 * @param tx The transaction object
 * @param expectedChainId The expected chain ID
 * @returns True if the chain IDs match, false otherwise
 */
export function validateTxChainId(tx: any, expectedChainId: number): boolean {
  if (!tx || !isValidChainId(expectedChainId)) {
    return false;
  }

  const txChainId = getChainId(tx);
  
  if (txChainId === undefined) {
    return false;
  }

  return txChainId === expectedChainId;
} 