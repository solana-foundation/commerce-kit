.PHONY: setup-deps test test-all test-integration test-typescript test-typescript-integration build clean generate-idl generate-clients fmt deploy-devnet

# Install dependencies
install:
	bun install

# Generate IDL from Shank annotations
generate-idl:
	@echo "Generating IDL..."
	bun run generate-idl

# Generate clients from IDL using Codama
generate-clients: generate-idl
	@echo "Generating clients..."
	bun run generate-clients

# Build the program
build:
	cargo-build-sbf
	make generate-idl
	make generate-clients

# Build the program with devnet feature
build-devnet:
	cargo-build-sbf --features devnet
	make generate-idl
	make generate-clients

# Setup test dependencies using solana program download
setup-deps:
	@echo "Setting up test dependencies..."
	@mkdir -p tests/integration-tests/deps
	@echo "Downloading SPL Token program..."
	solana program dump TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA tests/integration-tests/deps/spl_token.so -u mainnet-beta
	@echo "Downloading SPL Associated Token Account program..."
	solana program dump ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL tests/integration-tests/deps/spl_associated_token_account.so -u mainnet-beta
	@echo "Dependencies downloaded successfully!"

# Run unit tests in program/
test:
	@echo "Running unit tests..."
	@cd program && cargo test

# Run integration tests (includes setup-deps and build)
test-integration: build setup-deps
	@echo "Running integration tests..."
	@cd tests/integration-tests && cargo test -- --nocapture

# Run TypeScript unit tests
test-typescript: build
	@echo "Running TypeScript unit tests..."
	@cd clients/typescript && bun run test:ci:unit

# Run TypeScript integration tests (requires local validator)
test-typescript-integration: build
	@echo "Running TypeScript integration tests..."
	@cd clients/typescript && bun run test:ci:integration

test-all: test test-integration test-typescript

# Run unit tests with coverage
test-coverage:
	@echo "Running unit tests with coverage..."
	@cd program && cargo llvm-cov --lib --tests --lcov --output-path ../coverage-unit.lcov
	@cd program && cargo llvm-cov --summary-only

# Run integration tests with coverage
test-integration-coverage: build setup-deps
	@echo "Running integration tests with coverage..."
	@cd tests/integration-tests && cargo llvm-cov --lcov --output-path ../../coverage-integration.lcov
	@cd tests/integration-tests && cargo llvm-cov --summary-only

# Run all tests with coverage
test-all-coverage: test-coverage test-integration-coverage
	@echo "All tests with coverage completed"

# Generate HTML coverage report
coverage-html:
	@echo "Generating HTML coverage report..."
	@cd program && cargo llvm-cov --html --output-dir ../coverage-html
	@echo "Coverage report generated at coverage-html/index.html"

# Format code and run clippy
fmt:
	cargo fmt --all
	@cd program && cargo clippy --fix --allow-dirty --all-targets -- -D warnings
	@cd tests/integration-tests && cargo clippy --fix --allow-dirty --all-targets -- -D warnings

# Deploy to devnet
deploy-devnet: build-devnet
	@echo "Deploying to devnet..."
	@if [ -z "$(DEPLOYER_KEY)" ]; then \
		echo "Error: DEPLOYER_KEY parameter is required. Usage: make deploy-devnet DEPLOYER_KEY=/path/to/deployer-keypair.json"; \
		exit 1; \
	fi
	solana program deploy target/deploy/commerce_program.so \
		--program-id target/deploy/commerce_program-keypair.json \
		--keypair $(DEPLOYER_KEY) \
		--url devnet

# Clean build artifacts
clean:
	cargo clean
	rm -rf tests/integration-tests/deps

## TypeScript SDK

test-ts-unit:
	cd clients/typescript && bun run test:unit

test-ts-integration:
	cd clients/typescript && bun run test:ci:integration

test-ts-all: test-ts-unit test-ts-integration