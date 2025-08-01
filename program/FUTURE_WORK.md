# Future Work

## Continuous Integration
- **CI to publish clients** - Automate client publishing pipeline
- **CI implement test coverage tools** - Reports on coverage to find places that aren't tested enough.

## Validation
- **Mint validation on init_config** - Validate mint parameters during config initialization (merchant operator config)
- **Config/payment validation** - Add x_days_to_close in config struct to prevent premature closure of payment accounts before indexing
- **Payment close updates** - Update close logic to only close on !paid status

## Error Handling
- **Better errors** - Improve error messages and codes where appropriate

## Code Generation
- **Codama support** - Add policy/currency support in config deserialization

## Testing
- **More sad path tests** - Expand negative test scenarios
- **Test coverage improvements** - Increase overall test coverage
