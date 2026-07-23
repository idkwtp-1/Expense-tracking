# Scope: UI Redesign & Guidelines Compliance Track

## Architecture

- **Global State (`src/lib/store.tsx`)**: Central React Context and `useExpense()` hook. Holds data (transactions, budgets, bills, settings) and UI states (currentMonth, privacyMode, accentColor, dialog open states). Automatically saves state modifications to `localStorage`.
- **Layout & Shell (`src/components/expense/MobileShell.tsx` and `Sidebar.tsx`)**: Replaces mobile layout with desktop-friendly sidebar navigation + main content viewport.
- **Pages / Routes (`src/routes/`)**: Consume global context to display synchronized data.
- **Overlay Dialogs (`src/components/expense/QuickAddDialog.tsx` & `CurrencyConverterDialog.tsx`)**: Built on Radix/Shadcn Dialog primitive.

## Milestones

| #   | Name                                              | Scope                                                                                                                                                                                       | Dependencies | Status      | Conversation ID                                                                                                                                                           |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Milestone 3: Global State & Privacy Mode          | Implement `src/lib/store.tsx` store & hook, integrate Privacy Mode logic in `src/components/expense/primitives.tsx`                                                                         | None         | IN_PROGRESS | Explorers: 12702a2f-515a-44eb-8991-0136758b60f8, d669e390-10e6-4a8c-984e-4ef371800688, 9a1beaea-4ef9-401b-b7ad-1a0ed6f474c4; Worker: c6452f88-9766-4140-b04b-3dc8f9ae1b8c |
| 2   | Milestone 4: Desktop Layout & Bento Box Dashboard | Update styles (`src/styles.css`), implement `Sidebar.tsx`, refactor `MobileShell.tsx` for desktop layout, Bento Box dashboard in `index.tsx`, rebuild bottom sheets into overlay dialogs    | M1           | PLANNED     | TBD                                                                                                                                                                       |
| 3   | Milestone 5: Page Redesign & Vercel Guidelines    | Redesign transactions, budget, analytics, settings to use global state, apply focus-visible rings, aria-labels, tabular-nums, replace `...` with `…`, remove emojis, verify `npm run build` | M1, M2       | PLANNED     | TBD                                                                                                                                                                       |

## Interface Contracts

### Global State Store (`src/lib/store.tsx`)

- Type definitions: `Transaction`, `Budget`, `Bill` exported from `src/lib/types.ts`
- Hook: `useExpense()` returning `ExpenseContextType`
- Interface properties:
  - `transactions: Transaction[]`
  - `budgets: Budget[]`
  - `bills: Bill[]`
  - `currentMonth: Date`
  - `privacyMode: boolean`
  - `accentColor: string`
  - `quickAddOpen: boolean`
  - `converterOpen: boolean`
  - `addTransaction: (tx: Omit<Transaction, "id" | "time">) => void`
  - `deleteTransaction: (id: string) => void`
  - `updateBudget: (categoryId: string, limit: number) => void`
  - `setPrivacyMode: (on: boolean) => void`
  - `setAccentColor: (color: string) => void`
  - `setCurrentMonth: (date: Date) => void`
  - `setQuickAddOpen: (open: boolean) => void`
  - `setConverterOpen: (open: boolean) => void`

### Layout Architecture

- `MobileShell` accepts `children: ReactNode` and renders `Sidebar` on left (`w-64`) and content viewport on right (`flex-1 h-full overflow-y-auto`).
