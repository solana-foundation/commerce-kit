/**
 * Minimal schema validation - only what we need
 */

export interface ValidationOptions {
  decimals?: number
  allowDecimals?: boolean
}

export interface ValidationResult {
  amount: bigint
  decimals: number
}

/**
 * Validates and normalizes amount to bigint with decimals support
 */
export function validateAndNormalizeAmount(
  amount: string | number | bigint, 
  options: ValidationOptions = {}
): ValidationResult {
  const { decimals = 9, allowDecimals = true } = options
  
  if (typeof amount === 'bigint') {
    return { amount, decimals }
  }
  
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 0) {
      throw new Error(`Invalid amount: ${amount}`)
    }
    // Convert to smallest units based on decimals
    const normalizedAmount = BigInt(Math.floor(parsed * Math.pow(10, decimals)))
    return { amount: normalizedAmount, decimals }
  }
  
  if (typeof amount === 'number') {
    if (isNaN(amount) || amount < 0 || !isFinite(amount)) {
      throw new Error(`Invalid amount: ${amount}`)
    }
    // Convert to smallest units based on decimals  
    const normalizedAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)))
    return { amount: normalizedAmount, decimals }
  }
  
  throw new Error(`Invalid amount type: ${typeof amount}`)
}
