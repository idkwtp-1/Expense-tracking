# Context — SLPlayer Premium Desktop Redesign & Verification

This document captures the current state, architecture context, and constraints of the SLPlayer Personal Expense Tracker.

## Codebase Architecture & Context

- **Framework**: TanStack Start TS (Vite + React + TypeScript).
- **Styling**: Tailwind CSS (v4) with custom themes in `src/styles.css`.
- **Routing**: `@tanstack/react-router`.
- **Current Layout (`src/components/expense/MobileShell.tsx`)**:
  - A mobile-centric layout with a maximum width of 5xl and centered container.
  - Interactive elements like `BottomTabBar` and floating action button (FAB) for mobile viewports.
  - Dialogs/drawers (`QuickAddSheet`, `CurrencyConverterSheet`) styled as slide-up mobile sheets (height: `88vh`, absolute bottom positioning).
- **Current Styling (`src/styles.css`)**:
  - Dark theme with background `#08080C` and solid surfaces (`#10101A`, `#16161F`).
  - Lacks the requested dark OLED (`#0A0A0A`), transparent glass surfaces (`rgba(255,255,255,0.03)`), and electric accents (`#38BDF8` / `#818CF8`).
- **Current State Management**:
  - Each route (`/`, `/transactions`, `/budget`, `/analytics`) imports and manages local static arrays (`TRANSACTIONS = []`, etc.), preventing synchronized data updates.
  - Settings page uses local React state instead of a shared store.
- **Accessibility & Vercel Guidelines**:
  - Missing proper `focus-visible:ring-2` focus rings.
  - Missing `aria-label` tags for icon-only buttons.
  - Straight quotes `"..."` used instead of curly double-quotes `“...”`.
  - Static ellipsis `...` used instead of correct symbol `…`.
  - Missing `tabular-nums` for columns displaying amounts.

## Subagent/Worker Context

- **Orchestration Track**: We coordinate two sub-orchestrators (`sub_orch_impl` and `sub_orch_e2e`).
- **UI Implementation**: `sub_orch_impl` is active. Currently, `worker_m3` is implementing the global state context (`src/lib/store.tsx`) and privacy mode.
- **E2E Testing**: `sub_orch_e2e` is active. Currently, `worker_m2_1` is implementing the Playwright test cases.

## Key Constraints

- Opaque-box testing (no internal imports from `src/` inside tests).
- Zero-tolerance on hardcoding or facade implementations.
- No direct source file edits by the top-level Orchestrator.
- Heartbeat and liveness checks must run regularly to prevent subagent hangs.
