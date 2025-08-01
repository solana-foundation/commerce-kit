# TS Client TestSetup

install surfpool if you haven't already: https://docs.surfpool.run/


```bash
cd clients/typescript
bun install
```

# Run tests

## Unit Tests
```bash
bun test:unit
```

## Integration Tests

```bash
bun test:integration
```
Note: this will start a local validator using surfpool and run the tests.


# Other Commands

```bash
bun fetch-mints
```

This will fetch the usdc and usdt mints from the network and save them to the `tests/setup/mints` directory.
