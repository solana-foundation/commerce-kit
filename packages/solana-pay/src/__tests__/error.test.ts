import { describe, it, expect } from 'vitest'
import { CreateTransferError } from '../error'

describe('Error Classes', () => {
  describe('CreateTransferError', () => {
    it('should create error with message', () => {
      const message = 'Transfer creation failed'
      const error = new CreateTransferError(message)
      
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(CreateTransferError)
      expect(error.message).toBe(message)
      expect(error.name).toBe('CreateTransferError')
    })

    it('should create error without message', () => {
      const error = new CreateTransferError()
      
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(CreateTransferError)
      expect(error.name).toBe('CreateTransferError')
      expect(error.message).toBe('')
    })

    it('should have correct error name', () => {
      const error = new CreateTransferError('test message')
      expect(error.name).toBe('CreateTransferError')
    })

    it('should be catchable as Error', () => {
      const error = new CreateTransferError('test')
      
      try {
        throw error
      } catch (caught) {
        expect(caught).toBeInstanceOf(Error)
        expect(caught).toBeInstanceOf(CreateTransferError)
        expect(caught.name).toBe('CreateTransferError')
      }
    })

    it('should be throwable and catchable', () => {
      const testMessage = 'sender not found'
      
      expect(() => {
        throw new CreateTransferError(testMessage)
      }).toThrow(CreateTransferError)
      
      expect(() => {
        throw new CreateTransferError(testMessage)
      }).toThrow(testMessage)
    })

    it('should maintain stack trace', () => {
      const error = new CreateTransferError('test error')
      
      expect(error.stack).toBeDefined()
      expect(typeof error.stack).toBe('string')
      expect(error.stack).toContain('CreateTransferError')
    })

    it('should work with instanceof checks', () => {
      const error = new CreateTransferError('test')
      
      expect(error instanceof Error).toBe(true)
      expect(error instanceof CreateTransferError).toBe(true)
      expect(error instanceof TypeError).toBe(false)
      expect(error instanceof RangeError).toBe(false)
    })

    it('should handle long error messages', () => {
      const longMessage = 'A'.repeat(1000) + ' - very long error message'
      const error = new CreateTransferError(longMessage)
      
      expect(error.message).toBe(longMessage)
      expect(error.message.length).toBe(longMessage.length)
    })

    it('should handle special characters in messages', () => {
      const specialMessage = 'Error: @#$%^&*()_+-={}[]|\\:";\'<>?,./ 🚨💥'
      const error = new CreateTransferError(specialMessage)
      
      expect(error.message).toBe(specialMessage)
      expect(error.name).toBe('CreateTransferError')
    })

    it('should handle unicode characters in messages', () => {
      const unicodeMessage = '转账错误: Ошибка перевода'
      const error = new CreateTransferError(unicodeMessage)
      
      expect(error.message).toBe(unicodeMessage)
    })

    it('should be serializable to JSON', () => {
      const error = new CreateTransferError('test error')
      
      // Errors typically don't serialize well by default, but name and message should be accessible
      const serialized = {
        name: error.name,
        message: error.message
      }
      
      expect(JSON.stringify(serialized)).toBe('{"name":"CreateTransferError","message":"test error"}')
    })

    it('should be usable in error handling patterns', () => {
      function throwCreateTransferError() {
        throw new CreateTransferError('sender not found')
      }

      // Should be catchable specifically
      try {
        throwCreateTransferError()
      } catch (error) {
        if (error instanceof CreateTransferError) {
          expect(error.message).toBe('sender not found')
        } else {
          throw new Error('Should have caught CreateTransferError')
        }
      }
    })

    it('should work with Promise rejections', async () => {
      const errorPromise = Promise.reject(new CreateTransferError('async error'))
      
      await expect(errorPromise).rejects.toThrow(CreateTransferError)
      await expect(errorPromise).rejects.toThrow('async error')
    })

    it('should differentiate from other Error types', () => {
      const createTransferError = new CreateTransferError('transfer error')
      const standardError = new Error('standard error')
      const typeError = new TypeError('type error')
      
      expect(createTransferError instanceof CreateTransferError).toBe(true)
      expect(standardError instanceof CreateTransferError).toBe(false)
      expect(typeError instanceof CreateTransferError).toBe(false)
      
      expect(createTransferError.name).toBe('CreateTransferError')
      expect(standardError.name).toBe('Error')
      expect(typeError.name).toBe('TypeError')
    })

    it('should be extendable', () => {
      class CustomCreateTransferError extends CreateTransferError {
        code: string
        
        constructor(message: string, code: string) {
          super(message)
          this.code = code
          this.name = 'CustomCreateTransferError'
        }
      }
      
      const customError = new CustomCreateTransferError('custom error', 'CUSTOM_001')
      
      expect(customError).toBeInstanceOf(Error)
      expect(customError).toBeInstanceOf(CreateTransferError)
      expect(customError).toBeInstanceOf(CustomCreateTransferError)
      expect(customError.message).toBe('custom error')
      expect(customError.code).toBe('CUSTOM_001')
      expect(customError.name).toBe('CustomCreateTransferError')
    })
  })

  describe('Error Usage Patterns', () => {
    it('should work in async/await error handling', async () => {
      async function failingFunction() {
        throw new CreateTransferError('async failure')
      }

      try {
        await failingFunction()
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(CreateTransferError)
        expect(error.message).toBe('async failure')
      }
    })

    it('should work with multiple error instances', () => {
      const errors = [
        new CreateTransferError('error 1'),
        new CreateTransferError('error 2'),
        new CreateTransferError('error 3')
      ]
      
      errors.forEach((error, index) => {
        expect(error).toBeInstanceOf(CreateTransferError)
        expect(error.message).toBe(`error ${index + 1}`)
        expect(error.name).toBe('CreateTransferError')
      })
    })

    it('should maintain correct prototype chain', () => {
      const error = new CreateTransferError('test')
      
      expect(Object.getPrototypeOf(error)).toBe(CreateTransferError.prototype)
      expect(Object.getPrototypeOf(CreateTransferError.prototype)).toBe(Error.prototype)
    })
  })
})
