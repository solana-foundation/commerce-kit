# Commerce Program

A Solana program built with the Pinocchio framework for efficient commerce operations.

## Installation

Install dependencies:
```bash
make install
```

## Building

Build the program:
```bash
make build
```

## Testing

Run integration tests (includes building and setting up dependencies):
```bash
make test-integration
```

Setup test dependencies only:
```bash
make setup-deps
```

## Cleaning

Clean build artifacts and dependencies:
```bash
make clean
```

## Development

The program uses the Pinocchio framework and follows standard Solana program structure:
- `program/src/` - Main program source code
- `tests/integration-tests/` - Integration tests
- `clients/` - Client libraries (Rust and TypeScript)