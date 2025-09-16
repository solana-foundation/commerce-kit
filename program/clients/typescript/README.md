# TS Client TestSetup

install surfpool if you haven't already: https://docs.surfpool.run/


```bash
cd clients/typescript
pnpm install
```

# Run tests

## Unit Tests
```bash
pnpm test:unit
```

## Integration Tests

```bash
pnpm test:integration
```
Note: this will start a local validator using surfpool and run the tests.


# Other Commands 

```bash
pnpm fetch-mints
```

This will fetch the usdc and usdt mints from the network and save them to the `tests/setup/mints` directory.
