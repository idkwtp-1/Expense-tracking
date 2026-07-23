# Part 1 Execution Plan: Core Layout, Sidebar & Bento Grid Redesign (Part 1 ONLY)

This plan outlines the steps to upgrade the Expense Tracker app from its mobile layout to a widescreen desktop layout with a sidebar navigation and a Bento Box grid dashboard.

## Architecture & Layout System

1.  **Main App Shell (`MobileShell.tsx`)**:
    - Upgrade the layout to a dual-column design:
      - **Left Column (Sidebar)**: Fixed width (e.g., `w-64` or `w-72`), static vertical nav bar. Contains logo, links to all routes, quick action triggers, and active visual states.
      - **Right Column (Content)**: Scrollable container (`flex-1 h-screen overflow-y-auto`) to render pages (`<Outlet />`).
    - Remove bottom tab-bar navigation entirely.
    - Remove any mobile max-width constraints.

2.  **Dashboard Bento Grid (`index.tsx`)**:
    - Redesign using CSS Grid with glassmorphism styled cards.
    - Layout configuration for desktop (1024px to 1920px):
      - _Net Balance Hero_: Column-span 2 (large key metric).
      - _Safe to Spend Card_: Column-span 1.
      - _Budget Health & Stat Pills_: Column-span 1 or integrated into a widget.
      - _Recent Transactions_: Column-span 2.
      - _Bills List_: Column-span 1.
    - Apply glassmorphism styles: `backdrop-filter: blur(12px)`, translucent card background (e.g., `rgba(255, 255, 255, 0.03)` or `var(--surface-raised)` with transparency), subtle borders (`var(--border-subtle)`), and deep violet accents.

## Milestones & Tasks

### Milestone 1: Layout & Shell Rewrite

- **Target Files**: `src/components/expense/MobileShell.tsx`, `src/routes/__root.tsx`
- **Tasks**:
  1.  Remove `BottomTabBar` and any bottom padding constraints from `MobileShell.tsx`.
  2.  Rewrite `MobileShell.tsx` to export a desktop-ready grid/flex container.
  3.  Create a Sidebar Navigation with links to Home, Transactions, Budget, Analytics, and Settings.
  4.  Add smooth hover and transition effects on sidebar navigation items.
  5.  Ensure focus rings and keyboard accessibility (`focus-visible:ring-2`) are fully styled.

### Milestone 2: Bento Grid Dashboard

- **Target Files**: `src/routes/index.tsx`
- **Tasks**:
  1.  Convert the sequential vertical layout of the dashboard into a structured Bento Box grid.
  2.  Ensure responsiveness across viewport sizes (1024px up to 1920px).
  3.  Apply design guidelines: tabular numbers for values, correct ellipsis, and responsive padding.

### Milestone 3: Verification & Auditing

- **Tasks**:
  1.  Run local compilation & linting.
  2.  Execute Playwright tests (`npm run test:e2e`).
  3.  Run Forensic Auditor checks.
