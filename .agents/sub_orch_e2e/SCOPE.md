# Scope: E2E Testing Track (Milestone 2)

## Architecture

- **E2E Test Runner**: Playwright
- **Target Host**: `http://localhost:5173/` (Vite dev server)
- **Directory Structure**:
  - `playwright.config.ts` (Playwright configuration at project root)
  - `tests/` (Folder containing E2E test files)
    - `dashboard.spec.ts` (Dashboard / Home page E2E tests)
    - `transactions.spec.ts` (Transactions page and search E2E tests)
    - `budget.spec.ts` (Budget page E2E tests)
    - `analytics.spec.ts` (Analytics page E2E tests)
    - `settings.spec.ts` (Settings page, theme persistence, toggles E2E tests)
    - `quick_add.spec.ts` (Quick Add overlay modal E2E tests)
    - `converter.spec.ts` (Currency Converter overlay modal E2E tests)
    - `scenarios.spec.ts` (Real-world user workflows and cross-feature combinations)
  - `TEST_INFRA.md` (Root documentation of E2E testing architecture)
  - `TEST_READY.md` (Signal of test suite completeness for E2E runner)

## Milestones

| #   | Name                         | Scope                                                              | Dependencies | Status                              |
| --- | ---------------------------- | ------------------------------------------------------------------ | ------------ | ----------------------------------- |
| 1   | Setup Testing Infrastructure | Add Playwright, create configurations, and define npm test scripts | None         | IN_PROGRESS (assigned: worker_m2_2) |
| 2   | Design Test Matrix           | Map out 82+ test cases for 7 features across Tiers 1-4             | M1           | DONE                                |
| 3   | Implement Playwright Specs   | Write Playwright tests for Tiers 1-4                               | M2           | IN_PROGRESS (assigned: worker_m2_2) |
| 4   | Run and Verify Tests         | Execute tests, resolve failures/flakiness, document results        | M3           | PLANNED                             |
| 5   | Document and Publish         | Create TEST_INFRA.md and TEST_READY.md                             | M4           | PLANNED                             |
| 6   | Project Handoff              | Write handoff.md and send completion message to parent             | M5           | PLANNED                             |

## Interface Contracts

### E2E Runner ↔ Web Application

- **Base URL**: `http://localhost:5173/`
- **Isolation**: All tests interact with the application solely through the DOM (using selectors, clicks, keypresses) without internal imports (opaque-box testing).
- **State Management**: Reset local state (`localStorage.clear()`) between test suites or individual tests where necessary to ensure independence.
