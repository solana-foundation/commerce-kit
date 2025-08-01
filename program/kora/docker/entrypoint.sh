#!/bin/bash

# Kora Node Docker Entrypoint Script
# Handles both RPC server and CLI modes with dynamic configuration

set -e

# Default config file location
CONFIG_FILE="${KORA_CONFIG_PATH:-/app/config/kora.toml}"

# Function to build common args for both RPC and CLI
build_common_args() {
    local args=()

    # Add RPC URL if provided
    if [ -n "$RPC_URL" ]; then
        args+=(--rpc-url "$RPC_URL")
    fi

    # Add config file if it exists
    if [ -f "$CONFIG_FILE" ]; then
        args+=(--config "$CONFIG_FILE")
    fi

    # Add private key (memory signer)
    if [ -n "$KORA_PRIVATE_KEY" ]; then
        args+=(--private-key "$KORA_PRIVATE_KEY")
    fi

    # Skip signer loading if requested
    if [ "$SKIP_SIGNER" = "true" ]; then
        args+=(--no-load-signer)
    fi

    # Turnkey signer configuration
    if [ "$WITH_TURNKEY_SIGNER" = "true" ]; then
        args+=(--with-turnkey-signer)

        if [ -n "$TURNKEY_API_PUBLIC_KEY" ]; then
            args+=(--turnkey-api-public-key "$TURNKEY_API_PUBLIC_KEY")
        fi

        if [ -n "$TURNKEY_API_PRIVATE_KEY" ]; then
            args+=(--turnkey-api-private-key "$TURNKEY_API_PRIVATE_KEY")
        fi

        if [ -n "$TURNKEY_ORGANIZATION_ID" ]; then
            args+=(--turnkey-organization-id "$TURNKEY_ORGANIZATION_ID")
        fi

        if [ -n "$TURNKEY_PRIVATE_KEY_ID" ]; then
            args+=(--turnkey-private-key-id "$TURNKEY_PRIVATE_KEY_ID")
        fi

        if [ -n "$TURNKEY_PUBLIC_KEY" ]; then
            args+=(--turnkey-public-key "$TURNKEY_PUBLIC_KEY")
        fi
    fi

    # Privy signer configuration
    if [ "$WITH_PRIVY_SIGNER" = "true" ]; then
        args+=(--with-privy-signer)

        if [ -n "$PRIVY_APP_ID" ]; then
            args+=(--privy-app-id "$PRIVY_APP_ID")
        fi

        if [ -n "$PRIVY_APP_SECRET" ]; then
            args+=(--privy-app-secret "$PRIVY_APP_SECRET")
        fi

        if [ -n "$PRIVY_WALLET_ID" ]; then
            args+=(--privy-wallet-id "$PRIVY_WALLET_ID")
        fi
    fi

    # Vault signer configuration
    if [ "$WITH_VAULT_SIGNER" = "true" ]; then
        args+=(--vault-signer)

        if [ -n "$VAULT_ADDR" ]; then
            args+=(--vault-addr "$VAULT_ADDR")
        fi

        if [ -n "$VAULT_TOKEN" ]; then
            args+=(--vault-token "$VAULT_TOKEN")
        fi

        if [ -n "$VAULT_KEY_NAME" ]; then
            args+=(--vault-key-name "$VAULT_KEY_NAME")
        fi

        if [ -n "$VAULT_PUBKEY" ]; then
            args+=(--vault-pubkey "$VAULT_PUBKEY")
        fi
    fi

    echo "${args[@]}"
}

# Function to run RPC server
run_server() {
    echo "Starting Kora RPC Server..."

    local args=()
    read -ra args <<< "$(build_common_args)"

    # Add RPC-specific arguments
    if [ -n "$PORT" ]; then
        args+=(--port "$PORT")
    fi

    if [ -n "$LOGGING_FORMAT" ]; then
        args+=(--logging-format "$LOGGING_FORMAT")
    fi

    if [ -n "$METRICS_ENDPOINT" ]; then
        args+=(--metrics-endpoint "$METRICS_ENDPOINT")
    fi

    exec kora-rpc "${args[@]}"
}

# Function to run CLI commands
run_cli() {
    echo "Running Kora CLI: $*"

    local args=()
    read -ra args <<< "$(build_common_args)"

    exec kora-cli "${args[@]}" "$@"
}

# Main execution logic
case "$1" in
    "server")
        run_server
        ;;
    "cli")
        shift
        run_cli "$@"
        ;;
    "sign")
        run_cli sign "$@"
        ;;
    "sign-and-send")
        run_cli sign-and-send "$@"
        ;;
    "estimate-fee")
        run_cli estimate-fee "$@"
        ;;
    "sign-if-paid")
        run_cli sign-if-paid "$@"
        ;;
    *)
        echo "Usage: $0 {server|cli|sign|sign-and-send|estimate-fee|sign-if-paid} [args...]"
        echo ""
        echo "Commands:"
        echo "  server              - Start RPC server (default)"
        echo "  cli [subcommand]    - Run CLI with subcommand"
        echo "  sign                - Direct sign command"
        echo "  sign-and-send       - Direct sign-and-send command"
        echo "  estimate-fee        - Direct estimate-fee command"
        echo "  sign-if-paid        - Direct sign-if-paid command"
        echo ""
        echo "Environment Variables:"
        echo "  RPC_URL             - Solana RPC endpoint"
        echo "  KORA_PRIVATE_KEY    - Private key for memory signer"
        echo "  KORA_CONFIG_PATH    - Path to kora.toml config file"
        echo "  PORT                - RPC server port (server mode only)"
        echo "  LOGGING_FORMAT      - Logging format: standard|json"
        echo "  METRICS_ENDPOINT    - Metrics endpoint URL"
        echo "  SKIP_SIGNER         - Set to 'true' to skip signer loading"
        echo ""
        echo "Signer Configuration:"
        echo "  WITH_TURNKEY_SIGNER=true + TURNKEY_* variables"
        echo "  WITH_PRIVY_SIGNER=true + PRIVY_* variables"
        echo "  WITH_VAULT_SIGNER=true + VAULT_* variables"
        exit 1
        ;;
esac
