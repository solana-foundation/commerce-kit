import { describe, it, expect } from 'vitest'
import { parseURL, ParseURLError } from '../parse-url'

describe('parseURL', () => {
  it('should parse a valid SOL transfer URL', () => {
    const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=0.01'
    const result = parseURL(url)
    
    expect(result.recipient).toBeDefined()
    expect(result.amount).toBe(10000000n) // 0.01 SOL in lamports
  })

  it('should parse a valid SPL token transfer URL', () => {
    const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1.5&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    const result = parseURL(url)
    
    expect(result.recipient).toBeDefined()
    expect(result.amount).toBe(1500000000n) // 1.5 in lamports
    expect(result.splToken).toBeDefined()
  })

  it('should throw error for invalid protocol', () => {
    const url = 'http://example.com'
    expect(() => parseURL(url)).toThrow(ParseURLError)
  })

  it('should throw error for invalid amount format', () => {
    const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=invalid'
    expect(() => parseURL(url)).toThrow(ParseURLError)
  })

  it('should throw error for too many decimal places', () => {
    const url = 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1.0123456789123'
    expect(() => parseURL(url)).toThrow(ParseURLError)
  })
})
