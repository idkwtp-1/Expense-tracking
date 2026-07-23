# Project: Expense Tracker UI Redesign - Part 1 ONLY

## Architecture

- **Shell**: The top-level layout wrapper (`MobileShell.tsx` in `__root.tsx`) will be upgraded to a dual-column desktop container layout.
- **Sidebar**: A sidebar navigation will be embedded on the left, rendering links for routing (`/`, `/transactions`, `/budget`, `/analytics`, `/settings`).
- **Dashboard**: The main route (`/`) will utilize a CSS Grid "Bento Box" style containing the core components: Net Balance, Safe to Spend, Budget Health, Stats, Recent Transactions, and Bills.
- **State Management**: Shared React state and queries (via TanStack React Query and the ExpenseProvider store).

## Milestones

| #   | Name                     | Scope                                                                                                  | Dependencies | Status  |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------ | ------- |
| 1   | Exploration & Analysis   | Audit layout constraints, existing tests, and design requirements                                      | None         | DONE    |
| 2   | Desktop Layout & Sidebar | Modify/replace `MobileShell.tsx`, build desktop sidebar with smooth transitions, remove bottom tab-bar | M1           | PLANNED |
| 3   | Bento Grid Dashboard     | Rewrite `src/routes/index.tsx` using responsive CSS Grid Bento layouts                                 | M2           | PLANNED |
| 4   | Verification & Auditing  | Run E2E tests, visual/accessibility audits, and Forensic Auditor verification                          | M2, M3       | PLANNED |

## Interface Contracts

### AppShell ↔ Navigation

- AppShell exposes a sidebar with interactive navigational Links.
- Uses TanStack React Router `Link` component for route transitions.
- Styled using active state tracking via CSS/Tailwind classes.
