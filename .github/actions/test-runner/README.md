# Test Runner Action

A reusable GitHub Action for running various types of tests across different environments.

## Usage

### Basic Unit Tests

```yaml
- name: Run unit tests
  uses: ./.github/actions/test-runner
  with:
    test_type: unit
    environment: development
    collect_coverage: true
```

### E2E Tests

```yaml
- name: Run E2E tests
  uses: ./.github/actions/test-runner
  with:
    test_type: e2e
    environment: staging
    app_url: https://staging.example.com
    timeout_minutes: 20
```

### Smoke Tests

```yaml
- name: Run smoke tests
  uses: ./.github/actions/test-runner
  with:
    test_type: smoke
    environment: production
    app_url: https://production.example.com
```

## Inputs

| Input               | Description                                          | Required | Default     |
| ------------------- | ---------------------------------------------------- | -------- | ----------- |
| `test_type`         | Type of tests to run (unit, e2e, smoke)              | Yes      | -           |
| `environment`       | Target environment                                   | No       | development |
| `app_url`           | Application URL for E2E tests                        | No       | -           |
| `fail_fast`         | Stop on first test failure (ignored for unit tests)  | No       | false       |
| `collect_coverage`  | Collect test coverage reports                        | No       | true        |
| `timeout_minutes`   | Test execution timeout                               | No       | 10          |
| `working_directory` | Working directory for execution                      | No       | .           |

## Outputs

| Output            | Description                            |
| ----------------- | -------------------------------------- |
| `test_results`    | JSON summary of test results           |
| `test_passed`     | Whether all tests passed (true/false)  |
| `coverage_report` | Path to coverage report (if generated) |
| `test_duration`   | Test execution duration in seconds     |

## Test Types

### Unit Tests

- Runs `npm run test:unit`
- Includes coverage collection
- Fast feedback for development

### E2E Tests

- Runs `npm run test:e2e -- --project=chromium` (add `e2e_grep` to filter, e.g. `@read-only`)
- Fails the step when Playwright fails; stderr is not discarded
- Requires Playwright setup
- Tests full user journeys

### Smoke Tests

- Basic HTTP connectivity checks
- Health endpoint verification
- Minimal functionality validation

## Artifacts

The action automatically collects and organizes test artifacts:

- `test-results/` - JSON result files
- `coverage/` - Coverage reports (if enabled)
- `playwright-report/` - E2E test reports
- `jest-results/` - Jest test outputs

## Error Handling

- Unit tests always fail the step when the suite fails, regardless of
  `fail_fast` — the caller decides whether to forgive that (see the
  fail-on-test-failures gate in `deploy.yml`)
- Integration and E2E tests continue on failure by default (`fail_fast: false`)
- Detailed error logging and result collection
- JSON output for programmatic processing
- Timeout protection for long-running tests

## Dependencies

The action expects the following npm scripts in `package.json`:

- `test:unit` - Unit tests
- `test:e2e` - E2E tests

For E2E tests, Playwright must be configured and browsers will be installed automatically.
