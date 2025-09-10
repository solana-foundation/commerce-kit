'use client'

import { z } from 'zod'

/**
 * Schema validation utilities inspired by AI SDK's use-object pattern.
 * Provides type-safe validation and parsing for Solana account data.
 */

// ===== UTILITIES =====

/**
 * Browser-compatible base64 decode that handles both regular and URL-safe base64
 * @param base64String The base64 string to decode
 * @returns Uint8Array containing the decoded bytes
 */
function decodeBase64(base64String: string): Uint8Array {
  // Convert URL-safe base64 to regular base64
  const regularBase64 = base64String
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64String.length + ((4 - (base64String.length % 4)) % 4), '=')

  // Use browser's built-in atob and convert to Uint8Array
  const binaryString = globalThis.atob(regularBase64)
  return new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i))
}

// ===== TYPES =====

export type Schema<T = any> = z.ZodType<T>

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: ValidationError
}

export interface ValidationError extends Error {
  name: 'ValidationError'
  issues: z.ZodIssue[]
}

export interface SchemaValidationCallbacks<T> {
  /** Called when validation succeeds */
  onValidationSuccess?: (data: T) => void
  /** Called when validation fails */
  onValidationError?: (error: ValidationError) => void
}

// ===== CORE VALIDATION FUNCTIONS =====

/**
 * Safely validate data against a Zod schema.
 * Inspired by AI SDK's safeValidateTypes pattern.
 */
export function safeValidate<T>(
  data: unknown,
  schema: Schema<T>
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      }
    } else {
      const validationError: ValidationError = new Error(
        `Schema validation failed: ${result.error.issues.map(i => i.message).join(', ')}`
      ) as ValidationError
      validationError.name = 'ValidationError'
      validationError.issues = result.error.issues
      
      return {
        success: false,
        error: validationError,
      }
    }
  } catch (error) {
    const validationError: ValidationError = new Error(
      `Schema validation error: ${error instanceof Error ? error.message : String(error)}`
    ) as ValidationError
    validationError.name = 'ValidationError'
    validationError.issues = []
    
    return {
      success: false,
      error: validationError,
    }
  }
}

/**
 * Validate data and throw on failure.
 * Use this when you want to fail fast on invalid data.
 */
export function validateOrThrow<T>(data: unknown, schema: Schema<T>): T {
  const result = safeValidate(data, schema)
  
  if (result.success) {
    return result.data!
  } else {
    throw result.error
  }
}

/**
 * Create a validator function from a schema.
 * Useful for creating reusable validators.
 */
export function createValidator<T>(schema: Schema<T>) {
  return {
    safe: (data: unknown) => safeValidate(data, schema),
    strict: (data: unknown) => validateOrThrow(data, schema),
    schema,
  }
}

// ===== COMMON SOLANA SCHEMAS =====

/**
 * Pre-built Zod schemas for common Solana data structures.
 * These can be used directly or extended for custom use cases.
 */

/** Base58 address schema */
export const AddressSchema = z.string().regex(
  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  'Invalid Solana address format'
)

/** Bigint amount schema (for lamports, token amounts, etc.) */
export const BigIntAmountSchema = z.union([
  z.bigint(),
  z.string().transform((val) => BigInt(val)),
  z.number().transform((val) => BigInt(val)),
])

/**
 * Validates and normalizes amount input string for token transfers.
 * Handles decimal inputs and converts them to base units using token decimals.
 */
export interface ValidateAmountOptions {
  /** Token decimals (defaults to 9 for standard SPL tokens) */
  decimals?: number
  /** Whether to allow decimal inputs (defaults to true) */
  allowDecimals?: boolean
}

export interface ValidatedAmountResult {
  /** The validated amount as BigInt in base units */
  amount: bigint
  /** The original input string (trimmed) */
  originalInput: string
  /** Whether the input contained decimals */
  hadDecimals: boolean
}

/**
 * Validates and normalizes an amount input string for token transfers.
 * 
 * @param input - The amount input (string or number)
 * @param options - Validation options
 * @returns Validated amount result
 * @throws Error with user-friendly message if validation fails
 */
export function validateAndNormalizeAmount(
  input: string | number | undefined | null,
  options: ValidateAmountOptions = {}
): ValidatedAmountResult {
  const { decimals = 9, allowDecimals = true } = options

  // Check for empty/null input
  if (input === undefined || input === null || input === '') {
    throw new Error('Amount is required')
  }

  // Convert to string and trim
  const trimmedInput = String(input).trim()

  if (trimmedInput === '') {
    throw new Error('Amount cannot be empty')
  }

  // Validate basic format: optional +/-, digits, and at most one decimal point
  const amountRegex = /^[+\-]?(\d+\.?\d*|\.\d+)$/
  if (!amountRegex.test(trimmedInput)) {
    throw new Error('Invalid amount format. Please enter a valid number')
  }

  // Check for negative amounts
  if (trimmedInput.startsWith('-')) {
    throw new Error('Amount cannot be negative')
  }

  // Remove optional leading +
  const cleanInput = trimmedInput.startsWith('+') ? trimmedInput.slice(1) : trimmedInput

  // Check if input has decimals
  const hasDecimal = cleanInput.includes('.')
  
  if (hasDecimal && !allowDecimals) {
    throw new Error('Decimal amounts are not allowed')
  }

  try {
    let amountBigInt: bigint

    if (hasDecimal) {
      // Parse decimal input
      const [integerPart = '0', fractionalPart = ''] = cleanInput.split('.')
      
      // Validate decimal places don't exceed token decimals
      if (fractionalPart.length > decimals) {
        throw new Error(`Too many decimal places. Maximum ${decimals} decimal places allowed`)
      }

      // Convert to base units: multiply by 10^decimals
      const paddedFractional = fractionalPart.padEnd(decimals, '0')
      const fullIntegerString = integerPart + paddedFractional

      // Remove leading zeros but keep at least one digit
      const normalizedInteger = fullIntegerString.replace(/^0+/, '') || '0'
      
      amountBigInt = BigInt(normalizedInteger)
    } else {
      // Integer input - multiply by 10^decimals to get base units
      amountBigInt = BigInt(cleanInput) * (10n ** BigInt(decimals))
    }

    // Check for zero amount
    if (amountBigInt === 0n) {
      throw new Error('Amount must be greater than zero')
    }

    return {
      amount: amountBigInt,
      originalInput: trimmedInput,
      hadDecimals: hasDecimal
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot convert')) {
      throw new Error('Invalid number format')
    }
    throw error
  }
}

/** Basic account info schema */
export const AccountInfoSchema = z.object({
  address: AddressSchema,
  lamports: BigIntAmountSchema,
  owner: AddressSchema,
  executable: z.boolean(),
  rentEpoch: z.number(),
  data: z.union([z.instanceof(Uint8Array), z.null()]),
  space: z.number(),
})

/** Token account info schema */
export const TokenAccountSchema = z.object({
  address: AddressSchema,
  mint: AddressSchema,
  owner: AddressSchema,
  amount: BigIntAmountSchema,
  decimals: z.number(),
  uiAmount: z.number(),
  uiAmountString: z.string(),
  state: z.enum(['initialized', 'uninitialized', 'frozen']),
  isNative: z.boolean(),
  closeAuthority: AddressSchema.nullable().optional(),
  delegate: AddressSchema.nullable().optional(),
  delegatedAmount: BigIntAmountSchema.optional(),
  lamports: BigIntAmountSchema,
  rentEpoch: z.number(),
})

/** Mint account schema */
export const MintAccountSchema = z.object({
  mintAuthority: z.union([
    z.object({ __option: z.literal('Some'), value: AddressSchema }),
    z.object({ __option: z.literal('None') }),
  ]).nullable(),
  supply: BigIntAmountSchema,
  decimals: z.number(),
  isInitialized: z.boolean(),
  freezeAuthority: z.union([
    z.object({ __option: z.literal('Some'), value: AddressSchema }),
    z.object({ __option: z.literal('None') }),
  ]).nullable(),
})

// ===== HELPER FUNCTIONS =====

/**
 * Helper to transform raw RPC account data for validation.
 * Handles common data transformations before schema validation.
 */
export function prepareAccountDataForValidation(rawData: any): any {
  if (!rawData) return null
  
  // Handle common RPC response patterns
  if (typeof rawData === 'object') {
    const transformed = { ...rawData }
    
    // Convert string numbers to BigInt where appropriate
    if (typeof transformed.lamports === 'string') {
      transformed.lamports = BigInt(transformed.lamports)
    }
    
    if (typeof transformed.amount === 'string') {
      transformed.amount = BigInt(transformed.amount)
    }
    
    if (typeof transformed.supply === 'string') {
      transformed.supply = BigInt(transformed.supply)
    }
    
    // Handle nested transformations
    if (transformed.data && Array.isArray(transformed.data) && transformed.data.length > 0) {
      // Convert base64 data to Uint8Array if needed
      if (typeof transformed.data[0] === 'string') {
        transformed.data = decodeBase64(transformed.data[0])
      }
    }
    
    return transformed
  }
  
  return rawData
}

/**
 * Create a schema-enhanced callback that validates data before calling the original callback.
 */
export function createValidatedCallback<T>(
  originalCallback: ((data: T) => void) | undefined,
  schema: Schema<T>
): (data: unknown) => void {
  return (data: unknown) => {
    if (!originalCallback) return
    
    const result = safeValidate(data, schema)
    if (result.success) {
      originalCallback(result.data!)
    } else {
      console.warn('Callback data validation failed:', result.error?.message)
    }
  }
}