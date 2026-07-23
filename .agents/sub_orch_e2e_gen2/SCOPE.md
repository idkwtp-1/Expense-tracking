# Scope: E2E Testing Track (Milestone 2 - Gen 2)

## Architecture

- **E2E Test Runner**: Playwright
- **Target Host**: `http://localhost:5173/` (Vite dev server)
- **Directory Structure**:
  - `playwright.config.ts` (Playwright configuration at project root)
  - `tests/` (Folder containing E2E test files)
    - `specs/` (Spec files for separate pages/features)
      - `navigation.spec.ts` (App Shell & Sidebar)
      - `dashboard.spec.ts` (Dashboard / Home page Bento widgets)
      - `transactions.spec.ts` (Transactions search, delete, date headers)
      - `budget.spec.ts` (Budget limits & progress)
      - `analytics.spec.ts` (Analytics period selector & charts)
      - `quick-add.spec.ts` (Quick Add keypad & validation)
      - `converter.spec.ts` (Currency Converter rates & shortcuts)
      - `cross-feature.spec.ts` (Page integrations & state sync - T3-CF)
      - `scenarios.spec.ts` (User scenarios - T4-RW)
  - `TEST_INFRA.md` (Root documentation of E2E testing architecture)
  - `TEST_READY.md` (Signal of test suite completeness for E2E runner)

## Milestones

| #   | Name                         | Scope                                                              | Dependencies | Status                                  |
| --- | ---------------------------- | ------------------------------------------------------------------ | ------------ | --------------------------------------- |
| 1   | Setup Testing Infrastructure | Add Playwright, create configurations, and define npm test scripts | None         | IN_PROGRESS (assigned: worker_e2e_gen2) |
| 2   | Design Test Matrix           | Map out 82+ test cases for 7 features across Tiers 1-4             | M1           | DONE                                    |
| 3   | Implement Playwright Specs   | Write Playwright tests for Tiers 1-4 (totaling ~82 test cases)     | M2           | IN_PROGRESS (assigned: worker_e2e_gen2) |
| 4   | Run and Verify Tests         | Execute tests, resolve failures/flakiness, document results        | M3           | IN_PROGRESS (assigned: worker_e2e_gen2) |
| 5   | Document and Publish         | Create TEST_INFRA.md and TEST_READY.md                             | M4           | PLANNED                                 |
| 6   | Project Handoff              | Write handoff.md and send completion message to parent             | M5           | PLANNED                                 |

## Interface Contracts

### E2E Runner ↔ Web Application

- **Base URL**: `http://localhost:5173/`
- **Isolation**: All tests interact with the application solely through the DOM (using selectors, clicks, keypresses) without internal imports (opaque-box testing).
- **State Management**: Reset local state (`localStorage.clear()`) between test suites or individual tests where necessary to ensure independence.
