# Project: SLPlayer Personal Expense Tracker UI Redesign and Functional Verification

## Architecture

The application is a React + Vite + TypeScript frontend desktop app running under `pywebview`.

- Root layout: `src/routes/__root.tsx` wraps the routes in a layout shell.
- Routing: `@tanstack/react-router`.
- Component layout:
  - Sidebar: Modern desktop navigation.
  - Dashboard: Bento Box CSS Grid layout.
  - Glassmorphic panels/cards.
- Data Flow:
  - A shared state mechanism (React Context / custom hook) to manage and persist transactions, budgets, settings, and converter state.

## Code Layout

- `src/components/expense/`: Expense tracker UI components (Shell, Sidebar, sheets, list).
- `src/components/ui/`: Low-level UI primitives (shadcn components).
- `src/routes/`: TanStack Router pages (Home/Dashboard, Transactions, Budget, Analytics, Settings).
- `src/lib/`: Common utility functions, types, and error handling.

## Milestones

| #   | Name                           | Scope                                                                                                   | Dependencies | Status      |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| 1   | Exploration                    | Codebase analysis, verify layout components, structure details                                          | None         | DONE        |
| 2   | E2E Test Track                 | Formulate full E2E test plan & create tests (Tiers 1-4)                                                 | None         | IN_PROGRESS |
| 3   | Layout & Sidebar               | Overhaul navigation, replace BottomTabBar with left Desktop Sidebar                                     | M1           | IN_PROGRESS |
| 4   | Bento Box & Glassmorphic UI    | Redesign panels, dashboard Bento Box layout, colors, icons                                              | M3           | PLANNED     |
| 5   | Shared State & Features        | Shared transactions state, month navigation, privacy mode, focus trap, escape closes, Vercel guidelines | M4           | PLANNED     |
| 6   | E2E Integration & Verification | Run all tests, adversarial coverage (Tier 5), forensic audit                                            | M2, M5       | PLANNED     |

## Interface Contracts

### Shared Store Contract

- State: `transactions: Transaction[]`, `budgets: Budget[]`, `balance: number`, `income: number`, `expenses: number`, `safeToSpend: number`
- Actions: `addTransaction(tx: Omit<Transaction, 'id'>) => void`, `updateSettings(...) => void`
