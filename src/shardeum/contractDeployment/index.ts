/**
 * Contract Deployment Module
 * 
 * This module provides atomic deployment solution for contract deployment
 * to prevent race conditions where a contract account exists but its code doesn't.
 * 
 * Features:
 * 1. Atomic Deployment: Creates both contract and code accounts in a single batch
 * 2. Deployment Validation: Ensures both accounts exist before allowing transactions
 * 3. Race Condition Prevention: Eliminates timing windows during deployment
 */

export * from './atomicDeployment'
export * from './applyIntegration'

// Re-export commonly used functions
export { atomicContractDeployment, validateContractDeployment } from './atomicDeployment'
export { processContractDeployments } from './applyIntegration'