# Testing Guidelines

## Purpose

These guidelines define the testing principles for the TODO app to ensure quality, reliability, and maintainability across backend and frontend code.

## Core Principles

1. All tests must be isolated and independent.
2. Each test must set up its own data and must not rely on execution order or shared state from other tests.
3. Setup and teardown hooks are required where applicable so tests pass consistently across repeated runs.
4. All new features must include appropriate tests at the relevant level (unit, integration, and/or E2E).
5. Tests should be maintainable, readable, and aligned with best practices.

## Unit Tests

1. Use Jest to test individual functions and React components in isolation.
2. Unit test files must use the naming convention `*.test.js` or `*.test.ts`.
3. Backend unit tests must be placed in `packages/backend/__tests__/`.
4. Frontend unit tests must be placed in `packages/frontend/src/__tests__/`.
5. Unit test file names should match what they test (for example: `app.test.js` for `app.js`).

## Integration Tests

1. Use Jest + Supertest to test backend API endpoints with real HTTP requests.
2. Integration tests must be placed in `packages/backend/__tests__/integration/`.
3. Integration test files must use the naming convention `*.test.js` or `*.test.ts`.
4. Integration test file names should clearly describe the API area under test (for example: `todos-api.test.js`).

## End-to-End (E2E) Tests

1. Use Playwright (required framework) for complete UI workflow testing through browser automation.
2. E2E tests must be placed in `tests/e2e/`.
3. E2E test files must use the naming convention `*.spec.js` or `*.spec.ts`.
4. E2E test file names should reflect the user journey under test (for example: `todo-workflow.spec.js`).
5. Playwright tests must run using one browser only.
6. Playwright tests must follow the Page Object Model (POM) pattern for maintainability.
7. Limit E2E coverage to 5-8 critical user journeys, prioritizing happy paths and key edge cases over exhaustive permutations.

## Port Configuration for Testability and CI/CD

1. Always use environment variables with sensible defaults for port configuration.
2. Backend standard:

```js
const PORT = process.env.PORT || 3030;
```

3. Frontend standard:
   - React defaults to port `3000`.
   - The port can be overridden with the `PORT` environment variable.
4. This approach is required so CI/CD workflows can dynamically assign and detect ports.

## Quality Expectations

1. Test suites should be deterministic, stable, and suitable for local and CI execution.
2. Prefer clear assertions, minimal mocking at higher test levels, and reusable test utilities where appropriate.
3. Keep test scope focused: unit tests for isolated behavior, integration tests for API contracts, and E2E tests for critical user workflows.
