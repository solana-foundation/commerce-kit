'use client'

import { z } from 'zod'

/**
 * Schema validation utilities inspired by AI SDK's use-object pattern.
 * Provides type-safe validation and parsing for Solana account data.
 */

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
        transformed.data = new Uint8Array(Buffer.from(transformed.data[0], 'base64'))
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