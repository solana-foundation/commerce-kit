#!/bin/bash

# Test script for Kora Docker + Commerce Program integration
set -e

echo "🚀 Starting Kora Docker + Commerce Program Integration Test"

# Auto-detect paths using git
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMERCE_DIR="$(cd "$SCRIPT_DIR/.." && git rev-parse --show-toplevel)"

# Always download Kora repository for demo
echo "🔄 Downloading Kora repository for demo..."
TEMP_KORA_DIR="/tmp/kora-demo-$(date +%s)"
git clone --depth 1 https://github.com/solana-foundation/kora.git "$TEMP_KORA_DIR"

# Copy Docker files from commerce project to downloaded repo
echo "📂 Copying Docker configuration files..."
cp "$SCRIPT_DIR/docker/Dockerfile.simple" "$TEMP_KORA_DIR/Dockerfile.simple" 2>/dev/null || {
    echo "⚠️  Dockerfile.simple not found in commerce project, using default"
}
cp "$SCRIPT_DIR/docker/.dockerignore" "$TEMP_KORA_DIR/.dockerignore" 2>/dev/null || {
    echo "⚠️  .dockerignore not found in commerce project, using default"
}
cp "$SCRIPT_DIR/docker/entrypoint.sh" "$TEMP_KORA_DIR/entrypoint.sh" 2>/dev/null || {
    echo "⚠️  entrypoint.sh not found in commerce project, using default"
}

KORA_DIR="$TEMP_KORA_DIR"
echo "✅ Downloaded Kora to temporary directory: $KORA_DIR"

# Configuration
KORA_TEST_DIR="$COMMERCE_DIR/kora"
KORA_PORT=8080
VALIDATOR_PORT=8899

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up test environment..."
    docker stop kora-test-server 2>/dev/null || true
    docker rm kora-test-server 2>/dev/null || true
    pkill -f "solana-test-validator" 2>/dev/null || true

    # Clean up temporary Kora directory if it was downloaded
    if [[ "$KORA_DIR" == /tmp/kora-demo-* ]]; then
        echo "🗑️  Removing temporary Kora directory..."
        rm -rf "$KORA_DIR"
    fi
    exit 0
}

trap cleanup EXIT

# Step 1: Build Kora Docker image (using simplified Dockerfile to avoid cargo-chef issues)
echo "📦 Building Kora Docker image..."
cd "$KORA_DIR"
docker build -f Dockerfile.simple -t kora-node:test .

# Step 2: Build commerce program first
echo "🏗️  Building commerce program..."
cd "$COMMERCE_DIR"
cargo build --release

# Step 3: Fetch mint accounts for USDC and USDT
echo "📥 Fetching mint accounts..."
mkdir -p tests/setup/mints
solana account EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v -um \
    --output-file tests/setup/mints/usdc.json --output json-compact || {
    echo "⚠️  Could not fetch USDC mint account, continuing without it"
}
solana account Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB -um \
    --output-file tests/setup/mints/usdt.json --output json-compact || {
    echo "⚠️  Could not fetch USDT mint account, continuing without it"
}

# Step 4: Start Solana test validator with mint accounts and commerce program
echo "⚡ Starting Solana test validator..."
VALIDATOR_ARGS="-r --rpc-port $VALIDATOR_PORT"

# Add mint accounts if they exist
if [ -f "tests/setup/mints/usdc.json" ]; then
    VALIDATOR_ARGS="$VALIDATOR_ARGS --account EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v tests/setup/mints/usdc.json"
fi
if [ -f "tests/setup/mints/usdt.json" ]; then
    VALIDATOR_ARGS="$VALIDATOR_ARGS --account Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB tests/setup/mints/usdt.json"
fi

# Add commerce program
VALIDATOR_ARGS="$VALIDATOR_ARGS --bpf-program commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT target/deploy/commerce_program.so"

solana-test-validator $VALIDATOR_ARGS --quiet &

# Wait for validator to be ready
echo "⏳ Waiting for test validator..."
sleep 5

# Step 5: Use existing Kora operator keypair
echo "🔑 Using Kora operator keypair..."
KORA_KEYPAIR_FILE="$KORA_TEST_DIR/keys/kora-operator.json"

if [ ! -f "$KORA_KEYPAIR_FILE" ]; then
    echo "❌ Kora operator keypair not found at $KORA_KEYPAIR_FILE"
    echo "Please create it with: solana-keygen new --outfile $KORA_KEYPAIR_FILE"
    exit 1
fi

TEST_KEYPAIR=$(cat "$KORA_KEYPAIR_FILE")
TEST_PUBKEY=$(solana-keygen pubkey "$KORA_KEYPAIR_FILE")

echo "  → Kora operator public key: $TEST_PUBKEY"

# Fund the Kora operator keypair
echo "  → Funding Kora operator with 10 SOL..."
solana airdrop 10 "$TEST_PUBKEY" \
    --url "http://127.0.0.1:$VALIDATOR_PORT" || true

# Step 6: Start Kora server in Docker
echo "🌐 Starting Kora RPC server..."
docker run -d \
    --name kora-test-server \
    -p "$KORA_PORT:$KORA_PORT" \
    -v "$KORA_TEST_DIR/test-kora.toml:/app/config/kora.toml:ro" \
    -e RUST_LOG=debug \
    -e RPC_URL="http://host.docker.internal:$VALIDATOR_PORT" \
    -e PORT="$KORA_PORT" \
    -e KORA_PRIVATE_KEY="$TEST_KEYPAIR" \
    -e KORA_CONFIG_PATH=/app/config/kora.toml \
    kora-node:test server

# Wait for Kora to start with proper health check loop
echo "⏳ Waiting for Kora server to start..."
sleep 3

# Wait for liveness endpoint to be ready (up to 30 seconds)
echo "  → Checking server readiness..."

# Check if container is running
if ! docker ps | grep -q "kora-test-server"; then
    echo "  ❌ Docker container is not running!"
    docker logs kora-test-server 2>/dev/null || echo "No logs available"
    exit 1
fi

# Step 7: Test Kora endpoints
echo "🧪 Testing Kora endpoints..."

# Test liveness endpoint with JSON-RPC
echo "  → Testing liveness endpoint..."
liveness_response=$(curl -s -X POST "http://localhost:$KORA_PORT" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"liveness","id":1}')

if echo "$liveness_response" | grep -q '"result":null'; then
    echo "  ✅ Liveness check passed"
else
    echo "❌ Liveness check failed: $liveness_response"
    docker logs kora-test-server
    exit 1
fi

# # Keep running for manual testing
read -p "Press Enter to stop the test environment..."
