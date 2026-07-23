# Handoff Report: Milestone 3 (Global State & Privacy Mode)

This handoff report summarizes the read-only investigation and design findings for implementing global state management and Privacy Mode in the SLPlayer Personal Expense Tracker.

## 1. Observation

During code inspection, the following details were directly observed:

1. **Target Types**: `src/lib/types.ts` defines `Transaction`, `Budget`, and `Bill` types. It also contains hardcoded helper functions like `formatMoney` and `formatMoneyShort` (lines 46–65).
2. **Disconnected & Empty States**:
   - `src/routes/index.tsx` declares empty arrays: `const TRANSACTIONS: Transaction[] = [];` (line 9) and `const BILLS: Bill[] = [];` (line 10). It displays hardcoded elements such as a Net Balance hero and a Safe to Spend banner.
   - `src/routes/transactions.tsx` declares an empty array: `const TRANSACTIONS: Transaction[] = [];` (line 9).
   - `src/routes/budget.tsx` declares an empty array: `const BUDGETS: any[] = [];` (line 7).
   - `src/routes/analytics.tsx` declares empty arrays: `const MONTHLY_TREND: any[] = [];` (line 18) and `const DONUT: any[] = [];` (line 32). It lists hardcoded summary text: `Spent: "$1,952"`, `Earned: "$3,200"`, `Saved: "$1,248"` (lines 73–75).
3. **Local Setting State**: `src/routes/settings.tsx` defines a local state hook `const [privacy, setPrivacy] = useState(false);` (line 31) to toggle Privacy Mode, and sets accent color in `localStorage` inside a local `useEffect` (lines 42–49).
4. **Shared Amount Component**: `src/components/expense/primitives.tsx` exposes the `<Amount />` component (lines 119–153) which formats numbers into positive and negative currency strings (e.g., `+$1,234.56` or `−$1,234.56`).
5. **App Entry Point Wrapper**: `src/routes/__root.tsx` renders `<MobileShell>` inside the root React component `RootComponent` (lines 118–139).
6. **Package Dependencies**: `package.json` includes `date-fns` version `^4.1.0` (line 50), which is available for month comparison logic.

---

## 2. Logic Chain

1. **State Centralization**: Because multiple routes (`index.tsx`, `transactions.tsx`, `budget.tsx`, `analytics.tsx`) require synchronized access to transactions, budgets, bills, settings, and navigation state, declaring them inside local route components results in desynchronization. Creating a React Context store in `src/lib/store.tsx` solves this by housing all state variables and action dispatchers in a single, top-level React provider.
2. **Mock Data Alignment**: The existing screens contain mock numbers. To prevent visual regression on first load, the default context state must load mock data that resolves to:
   - **Net Balance**: $+\$1,248.00$
   - **Income**: $\$3,200.00$
   - **Expenses**: $\$1,952.00$
   - **Safe to Spend**: $\$847.50$
   - **Budget Health**: $85\%$ used (total limits = $\$2,300.00$, total spent = $\$1,952.00$).
   - This alignment is achieved by constructing a list of $14$ transactions, $6$ budget limits, and $3$ upcoming bills whose sums match these exact equations (detailed in `analysis.md`).
3. **State Normalization**: Storing computed fields (like `spent` in budgets) inside state introduces synchrony bugs when transactions are modified. We resolve this by storing only transaction details and budget limits in state, and using `useMemo` in the store to compute budget spent amounts dynamically.
4. **Real-time Persistence**: Implementing lazy initialization in `useState` checks `localStorage` first, falling back to mock defaults. Writing to `localStorage` in each mutator function ensures instant session persistence.
5. **Privacy Masking**: Adapting `<Amount />` to consume the store's `privacyMode` property allows us to return `$•••` dynamically.
6. **Masking Bypass Caveat**: However, since Net Balance and Safe to Spend callouts render raw string variables using `<CountUp />` instead of the `<Amount />` component, adapting `<Amount />` alone is insufficient. We must wrap these call sites in conditional checks checking the global `privacyMode` flag.

---

## 3. Caveats

- **Read-Only Scoping**: No source code was modified during this investigation. All plans must be executed by the implementer.
- **Third-Party Libraries**: The design relies on `date-fns` for month checks. If the build environment lacks proper package resolution, standard native JS `Date` comparison can be substituted as a zero-dependency fallback.

---

## 4. Conclusion

- **Store Creation**: A React Context store must be created at `src/lib/store.tsx` using the complete blueprint in `analysis.md`.
- **Root Setup**: Wrap the `<MobileShell>` in `src/routes/__root.tsx` with `<ExpenseProvider>`.
- **Route Syncing**: Refactor the page components in `src/routes/` to import `useExpense()` and remove local state declarations.
- **Privacy Masking**: Adapt `<Amount />` in `src/components/expense/primitives.tsx` and refactor raw financial texts in dashboard and budget pages to support the `$•••` mask under `privacyMode === true`.

---

## 5. Verification Method

To verify the implementation once executed by the implementer:

1. **Compilation**: Run `npm run build` to confirm there are no syntax or type errors in the new store or modified components.
2. **Linting**: Run `npm run lint` to verify compliance with styling rules and check for unused imports.
3. **Visual Regression**:
   - Open `/settings` and toggle Privacy Mode to **ON**.
   - Navigate to `/` (Home/Dashboard). Confirm that:
     - Income and Expense values display `$•••`.
     - Net Balance Hero displays `$•••` (verifies the `<CountUp />` bypass fix).
     - Safe to Spend Callout displays `$•••`.
     - Transaction list items display `$•••`.
   - Go to `/transactions`. Verify all transaction rows show `$•••`.
   - Go to `/budget`. Verify spent and remaining amounts are masked (e.g. `$•••` of `$600` or `$•••` remaining).
