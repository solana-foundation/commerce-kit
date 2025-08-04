# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Solana program using the Pinocchio framework for efficient program development. The project is structured as a Rust workspace with the following key components:

- `program/` - Main Solana program written in Rust using Pinocchio
- `clients/rust/` - Rust client library for interacting with the program
- `clients/typescript/` - TypeScript client (generated)
- `tests/integration-tests/` - Integration tests for the program
- `scripts/` - Build and code generation scripts

## Key Dependencies

The project uses Pinocchio framework components:
- `pinocchio` - Core framework
- `pinocchio-token` - Token program interactions
- `pinocchio-system` - System program interactions
- `pinocchio-associated-token-account` - ATA operations
- `shank` - IDL generation

## Development Commands

### Building the Program
```bash
cargo build --release
```

### Generating IDL
```bash
bun run generate-idl
# or directly: shank idl -r program -o idl
```

### Generating Clients
```bash
bun run generate-clients
# Uses ts-node to run scripts/generate-client.ts
```

### Running Tests
```bash
cargo test
# For integration tests specifically:
cd tests/integration-tests && cargo test
```

TypeScript client unit tests:

```bash
cd clients/typescript
bun run test:ci:unit
```

TypeScript client integration tests:

```bash
cd clients/typescript
bun run test:ci:integration
```


## Program Architecture

The Solana program follows standard structure:
- `lib.rs` - Main module declarations with program ID
- `entrypoint.rs` - Program entrypoint (excluded with no-entrypoint feature)
- `instructions.rs` - Instruction definitions (IDL feature only)
- `processor/` - Instruction processing logic
- `state/` - Account state definitions
- `error.rs` - Custom program errors
- `events.rs` - Program events
- `constants.rs` - Program constants

The program ID is declared as: `commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT.json`

## Features

- `no-entrypoint` - Excludes entrypoint for testing
- `idl` - Includes instruction definitions for IDL generation