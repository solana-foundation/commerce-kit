/**
 * Custom codecs for Commerce Kit that properly match Rust serialization
 * 
 * These codecs handle:
 * - Fixed-size PolicyData with 101-byte padding
 * - Count-based array sizing for policies and accepted currencies
 * - Simple enum discriminators (single byte)
 * - Proper field ordering to match Rust structs
 */


export * from './merchantOperatorConfig';