# BRIEFING — 2026-07-07T22:47:00Z

## Mission

Examine layout and design widescreen desktop layout upgrade with static/collapsible sidebar.

## 🔒 My Identity

- Archetype: Layout Explorer
- Roles: Layout Exploration Agent
- Working directory: d:\Personal Projects\Expense trackinig\.agents\explorer_m1_1
- Original parent: f3e71341-0906-47a0-8e0b-90212cd53f2e
- Milestone: Layout Upgrade (M1)

## 🔒 Key Constraints

- Read-only investigation — do NOT implement
- Must remove BottomTabBar and any maxWidth: 430 constraints
- Upgrade to responsive desktop layout (1024px to 1920px)

## Current Parent

- Conversation ID: f3e71341-0906-47a0-8e0b-90212cd53f2e
- Updated: not yet

## Investigation State

- **Explored paths**:
  - `src/components/expense/MobileShell.tsx`
  - `src/routes/__root.tsx`
  - `src/components/expense/BottomTabBar.tsx`
  - `src/components/expense/TopBar.tsx`
  - `src/routes/index.tsx`
  - `src/routes/transactions.tsx`
  - `src/routes/budget.tsx`
  - `src/routes/analytics.tsx`
  - `src/routes/settings.tsx`
  - `src/components/ui/sidebar.tsx`
  - `src/components/expense/QuickAddSheet.tsx`
  - `src/components/expense/CurrencyConverterSheet.tsx`
  - `src/hooks/use-mobile.tsx`
  - `src/styles.css`
- **Key findings**:
  - `MobileShell.tsx` currently wraps all route contents, providing sheets context and rendering the `BottomTabBar` and `FAB`.
  - The project uses Tailwind CSS v4 with Vite; theme definitions are located in `src/styles.css`.
  - No hardcoded `maxWidth: 430` constraint exists, but `BottomTabBar` has `min(94vw, 360px)` and `MobileShell` has `max-w-5xl`.
  - A pre-installed shadcn `Sidebar` component is available in `src/components/ui/sidebar.tsx` which is perfect for the upgrade.
  - The quick add and converter sheets are fixed bottom drawers on mobile and need media queries to render as centered modal dialogs on desktop.
- **Unexplored areas**: None.

## Key Decisions Made

- Recommend renaming `MobileShell.tsx` to `AppShell.tsx`.
- Wrap the app in `SidebarProvider` and insert `Sidebar` on the left.
- Reposition FAB (Quick Add) and currency converter as sidebar triggers on desktop.
- Keep the `useSheets` hook and context provider active in `AppShell.tsx` to prevent breaking child pages that trigger them.
- Apply media queries to bottom sheets to transform them into standard centered dialogs on screens `>= 768px` or `>= 1024px`.

## Artifact Index

- d:\Personal Projects\Expense trackinig\.agents\explorer_m1_1\ORIGINAL_REQUEST.md — Original request document
- d:\Personal Projects\Expense trackinig\.agents\explorer_m1_1\progress.md — Liveness progress heartbeat file
