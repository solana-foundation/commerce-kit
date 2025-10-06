# Contributing to Solana Commerce Kit

Thank you for your interest in contributing to Solana Commerce Kit. This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- pnpm 8 or higher

### Getting Started

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/commerce-kit.git
cd commerce-kit
```

2. Install dependencies:
```bash
pnpm install
```

3. Build all packages:
```bash
pnpm build
```

4. Run tests:
```bash
pnpm test
```

## Project Structure

```
commerce-kit/
├── packages/
│   ├── solana-commerce/    # Meta-package
│   ├── react/              # React components
│   ├── sdk/                # React hooks
│   ├── headless/           # Core logic
│   ├── connector/          # Wallet connection
│   └── solana-pay/         # Solana Pay protocol
└── ...
```

## Development Workflow

### Working on a Package

Navigate to the package directory and use the development scripts:

```bash
cd packages/sdk
pnpm dev          # Watch mode
pnpm test:watch   # Test watch mode
pnpm type-check   # Type checking
```

### Building

Build individual packages:
```bash
cd packages/sdk
pnpm build
```

Build all packages:
```bash
pnpm build
```

### Testing

Run tests for a specific package:
```bash
cd packages/sdk
pnpm test
```

Run all tests:
```bash
pnpm test
```

### Code Quality

Before submitting a PR, ensure:
- All tests pass: `pnpm test`
- Code is formatted: `pnpm lint` (if configured)
- Code builds: `pnpm build`

## Making Changes

### Creating a Pull Request

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "Description of changes"
```

3. Push to your fork:
```bash
git push origin feature/your-feature-name
```

4. Open a pull request on GitHub

### Commit Messages

Write clear, descriptive commit messages. 

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and composable

## Package Guidelines

### Adding New Features

When adding features:
1. Add tests that cover the new functionality
2. Update relevant README files
3. Ensure TypeScript types are accurate
4. Consider backward compatibility

### Breaking Changes

If proposing breaking changes:
1. Clearly document the rationale
2. Provide migration path in PR description
3. Update version appropriately (major version bump)

## Documentation

When adding or modifying features:
- Update package README with examples
- Add JSDoc comments to new APIs
- Include TypeScript type examples

## Testing

### Writing Tests

- Place tests in `__tests__` directories
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies appropriately
- Utilize the test style of the existing tests

Example:
```typescript
import { describe, it, expect } from 'vitest';

describe('functionName', () => {
  it('should handle valid input correctly', () => {
    // Test implementation
  });

  it('should throw error for invalid input', () => {
    // Test implementation
  });
});
```

## Questions and Help

- Open an issue for bug reports or feature requests
- Use discussions for questions about usage
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
