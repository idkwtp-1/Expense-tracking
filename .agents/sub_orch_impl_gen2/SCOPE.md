# Scope: UI Redesign & Guidelines Compliance Track

## Architecture

- **Global State (`src/lib/store.tsx`)**: Already implemented. holds data (transactions, budgets, bills, settings) and UI states (currentMonth, privacyMode, accentColor, dialog open states). Automatically saves state modifications to `localStorage`.
- **Layout & Shell (`src/components/expense/MobileShell.tsx` and `Sidebar.tsx`)**: Replaces mobile layout with desktop-friendly sidebar navigation + main content viewport.
- **Pages / Routes (`src/routes/`)**: Consume global context to display synchronized data in Bento box design.
- **Overlay Dialogs (`src/components/expense/QuickAddDialog.tsx` & `CurrencyConverterDialog.tsx`)**: Built on Radix/Shadcn Dialog primitive to replace bottom drawer/sheets.

## Milestones

| #   | Name                                              | Scope                                                                                                                                                                                       | Dependencies | Status      | Conversation ID |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | --------------- |
| 1   | Milestone 4: Desktop Layout & Bento Box Dashboard | Implement `Sidebar.tsx`, refactor layout for desktop layout, Bento Box dashboard in `index.tsx`, rebuild bottom sheets into overlay dialogs                                                 | None         | IN_PROGRESS | TBD             |
| 2   | Milestone 5: Page Redesign & Vercel Guidelines    | Redesign transactions, budget, analytics, settings to use global state, apply focus-visible rings, aria-labels, tabular-nums, replace `...` with `…`, remove emojis, verify `npm run build` | M4           | PLANNED     | TBD             |

## Interface Contracts

### Layout Architecture

- Navigation sidebar on the left (`w-64`), main page content viewport on the right (`flex-1 h-full overflow-y-auto`).
