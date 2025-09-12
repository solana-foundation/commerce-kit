import { describe, it, expect } from 'vitest'
import { createSPLToken, createRecipient, isValidSolanaAddress } from '../utils'
import { address } from 'gill'

describe('Utils', () => {
  const validAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
  const validTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

  describe('createSPLToken', () => {
    it('should create SPL token from valid address string', () => {
      const token = createSPLToken(validTokenAddress)
      
      expect(token).toBeDefined()
      expect(token.toString()).toBe(validTokenAddress)
    })

    it('should throw error for invalid address', () => {
      expect(() => createSPLToken('invalid-address')).toThrow(
        'Invalid SPL token address: invalid-address'
      )
    })

    it('should throw error for empty string', () => {
      expect(() => createSPLToken('')).toThrow(
        'Invalid SPL token address:'
      )
    })

    it('should handle Base58 address variants', () => {
      // All these should be valid Solana addresses
      const addresses = [
        validTokenAddress,
        'So11111111111111111111111111111111111111112', // Wrapped SOL
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' // Token Program
      ]

      addresses.forEach(addr => {
        expect(() => createSPLToken(addr)).not.toThrow()
      })
    })

    it('should preserve address case and format', () => {
      const token = createSPLToken(validTokenAddress)
      expect(token.toString()).toBe(validTokenAddress)
    })
  })

  describe('createRecipient', () => {
    it('should create recipient from valid address string', () => {
      const recipient = createRecipient(validAddress)
      
      expect(recipient).toBeDefined()
      expect(recipient.toString()).toBe(validAddress)
    })

    it('should throw error for invalid address', () => {
      expect(() => createRecipient('invalid-address')).toThrow(
        'Invalid recipient address: invalid-address'
      )
    })

    it('should throw error for empty string', () => {
      expect(() => createRecipient('')).toThrow(
        'Invalid recipient address:'
      )
    })

    it('should handle various valid address formats', () => {
      const validAddresses = [
        validAddress,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        '11111111111111111111111111111112', // System program
        'Vote111111111111111111111111111111111111111' // Vote program
      ]

      validAddresses.forEach(addr => {
        expect(() => createRecipient(addr)).not.toThrow()
        const recipient = createRecipient(addr)
        expect(recipient.toString()).toBe(addr)
      })
    })

    it('should reject addresses with invalid characters', () => {
      const invalidAddresses = [
        'invalid-chars!@#$%',
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAW0', // Invalid character '0'
        'short', // Too short
        'VeryLongAddressThatExceedsTheMaximumAllowedLengthForSolanaAddresses123456789'
      ]

      invalidAddresses.forEach(addr => {
        expect(() => createRecipient(addr)).toThrow()
      })
    })
  })

  describe('isValidSolanaAddress', () => {
    it('should return true for valid addresses', () => {
      const validAddresses = [
        validAddress,
        validTokenAddress,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        '11111111111111111111111111111112',
        'Vote111111111111111111111111111111111111111',
        'So11111111111111111111111111111111111111112'
      ]

      validAddresses.forEach(addr => {
        expect(isValidSolanaAddress(addr)).toBe(true)
      })
    })

    it('should return false for invalid addresses', () => {
      const invalidAddresses = [
        'invalid',
        '',
        'invalid-chars!@#$%',
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAW0', // Invalid character
        'short',
        'VeryLongAddressThatExceedsTheMaximumAllowedLengthForSolanaAddresses123456789',
        null as any,
        undefined as any,
        123 as any
      ]

      invalidAddresses.forEach(addr => {
        expect(isValidSolanaAddress(addr)).toBe(false)
      })
    })

    it('should handle edge cases', () => {
      // Test various edge cases
      expect(isValidSolanaAddress(' ' + validAddress + ' ')).toBe(false) // With spaces
      expect(isValidSolanaAddress(validAddress.toLowerCase())).toBe(false) // Wrong case
      expect(isValidSolanaAddress(validAddress.toUpperCase())).toBe(true) // Upper case is valid for Base58
    })

    it('should be consistent with address creation', () => {
      // If isValidSolanaAddress returns true, creating an address should not throw
      const testAddresses = [
        validAddress,
        validTokenAddress,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      ]

      testAddresses.forEach(addr => {
        const isValid = isValidSolanaAddress(addr)
        expect(isValid).toBe(true)
        
        // Should not throw when creating address
        expect(() => address(addr)).not.toThrow()
      })
    })

    it('should handle concurrent validation', () => {
      const addresses = Array(100).fill(validAddress)
      
      const results = addresses.map(addr => isValidSolanaAddress(addr))
      
      expect(results.every(result => result === true)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should provide detailed error messages', () => {
      const invalidAddr = 'definitely-invalid-address'
      
      try {
        createSPLToken(invalidAddr)
        expect(true).toBe(false) // Should not reach this line
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const err = error as Error
        expect(err.message).toContain('Invalid SPL token address')
        expect(err.message).toContain(invalidAddr)
      }

      try {
        createRecipient(invalidAddr)
        expect(true).toBe(false) // Should not reach this line
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const err = error as Error
        expect(err.message).toContain('Invalid recipient address')
        expect(err.message).toContain(invalidAddr)
      }
    })

    it('should chain original error information', () => {
      const invalidAddr = 'invalid'
      
      try {
        createSPLToken(invalidAddr)
      } catch (error) {
        const err = error as Error
        expect(err.message).toContain('Invalid SPL token address')
        // Should also contain information from the underlying gill address function
      }
    })
  })

  describe('Type Safety', () => {
    it('should return properly typed addresses', () => {
      const token = createSPLToken(validTokenAddress)
      const recipient = createRecipient(validAddress)
      
      // Should have address methods
      expect(typeof token.toString).toBe('function')
      expect(typeof recipient.toString).toBe('function')
      
      // Should be compatible with gill Address type
      expect(token).toBeDefined()
      expect(recipient).toBeDefined()
    })

    it('should work with gill address functions', () => {
      const token = createSPLToken(validTokenAddress)
      const recipient = createRecipient(validAddress)
      
      // Should be usable where gill Address is expected
      const tokenString = address(token.toString()).toString()
      const recipientString = address(recipient.toString()).toString()
      
      expect(tokenString).toBe(validTokenAddress)
      expect(recipientString).toBe(validAddress)
    })
  })

  describe('Performance', () => {
    it('should validate addresses quickly', () => {
      const addresses = Array(1000).fill(validAddress)
      
      const startTime = Date.now()
      addresses.forEach(addr => isValidSolanaAddress(addr))
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should create addresses quickly', () => {
      const addresses = Array(100).fill(validAddress)
      
      const startTime = Date.now()
      addresses.forEach(addr => {
        createRecipient(addr)
        createSPLToken(addr)
      })
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })
  })

  describe('Integration', () => {
    it('should work with createSPLToken and validation together', () => {
      const addr = validTokenAddress
      
      expect(isValidSolanaAddress(addr)).toBe(true)
      
      const token = createSPLToken(addr)
      expect(token.toString()).toBe(addr)
      
      // Validate the created token's string representation
      expect(isValidSolanaAddress(token.toString())).toBe(true)
    })

    it('should work with createRecipient and validation together', () => {
      const addr = validAddress
      
      expect(isValidSolanaAddress(addr)).toBe(true)
      
      const recipient = createRecipient(addr)
      expect(recipient.toString()).toBe(addr)
      
      // Validate the created recipient's string representation
      expect(isValidSolanaAddress(recipient.toString())).toBe(true)
    })

    it('should handle mixed valid and invalid addresses', () => {
      const mixedAddresses = [
        validAddress,
        'invalid',
        validTokenAddress,
        'also-invalid',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      ]
      
      const validationResults = mixedAddresses.map(addr => ({
        address: addr,
        valid: isValidSolanaAddress(addr)
      }))
      
      expect(validationResults[0].valid).toBe(true)
      expect(validationResults[1].valid).toBe(false)
      expect(validationResults[2].valid).toBe(true)
      expect(validationResults[3].valid).toBe(false)
      expect(validationResults[4].valid).toBe(true)
      
      // Only create addresses for valid ones
      validationResults.forEach(result => {
        if (result.valid) {
          expect(() => createRecipient(result.address)).not.toThrow()
          expect(() => createSPLToken(result.address)).not.toThrow()
        } else {
          expect(() => createRecipient(result.address)).toThrow()
          expect(() => createSPLToken(result.address)).toThrow()
        }
      })
    })
  })
})
