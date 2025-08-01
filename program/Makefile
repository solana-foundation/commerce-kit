.PHONY: setup-deps test test-all test-integration build clean generate-idl generate-clients fmt

# Install dependencies
install:
	pnpm install

# Generate IDL from Shank annotations
generate-idl:
	@echo "Generating IDL..."
	pnpm run generate-idl

# Generate clients from IDL using Codama
generate-clients: generate-idl
	@echo "Generating clients..."
	pnpm run generate-clients

# Build the program
build:
	cargo-build-sbf
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

# Run all tests (unit + integration)
test-all: test test-integration

# Format code and run clippy
fmt:
	cargo fmt --all
	@cd program && cargo clippy --fix --allow-dirty --all-targets -- -D warnings
	@cd tests/integration-tests && cargo clippy --fix --allow-dirty --all-targets -- -D warnings

# Clean build artifacts
clean:
	cargo clean
	rm -rf tests/integration-tests/deps
