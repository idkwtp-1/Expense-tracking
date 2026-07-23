# Handoff Report: Milestone 3 — Global State & Privacy Mode

## 1. Observation

During inspection of the workspace, the following configurations and code segments were identified:

1. **Local and Unsynchronized State in Routes**:
   - `src/routes/index.tsx` (Lines 9-14) contains empty arrays/zeros for data bindings:
     ```typescript
     const TRANSACTIONS: Transaction[] = [];
     const BILLS: Bill[] = [];
     const NET_BALANCE = 0;
     const NET_INCOME = 0;
     const NET_EXPENSES = 0;
     const SAFE_TO_SPEND = 0;
     ```
   - `src/routes/transactions.tsx` (Line 9) holds:
     ```typescript
     const TRANSACTIONS: Transaction[] = [];
     ```
   - `src/routes/budget.tsx` (Line 7) holds:
     ```typescript
     const BUDGETS: any[] = [];
     ```
   - `src/routes/settings.tsx` (Lines 30-49) handles its own localized state for toggles and accent colors, syncing manually with `localStorage`:
     ```typescript
     const [privacy, setPrivacy] = useState(false);
     const [accent, setAccent] = useState(() => {
       if (typeof window !== "undefined") {
         return localStorage.getItem("slplayer-accent") || "#7C3AED";
       }
       return "#7C3AED";
     });
     ```

2. **Amount Component Logic**:
   - `src/components/expense/primitives.tsx` (Lines 119-153) outputs clean currency rendering but has no knowledge of privacy mode:
     ```tsx
     export function Amount({
       value,
       size = 18,
       sign = false,
       color,
       className = "",
     }: { ... }) {
       const abs = Math.abs(value).toLocaleString("en-US", { ... });
       const prefix = sign ? (value > 0 ? "+$" : value < 0 ? "−$" : "$") : value < 0 ? "−$" : "$";
       ...
       return (
         <span className={`font-mono font-medium ${className}`} ...>
           {prefix}
           {abs}
         </span>
       );
     }
     ```

3. **No Testing Frame**:
   - `package.json` contains no script tags matching `"test"`. Available scripts are:
     ```json
     "scripts": {
       "dev": "vite dev",
       "build": "vite build",
       "build:dev": "vite build --mode development",
       "preview": "vite preview",
       "lint": "eslint .",
       "format": "prettier --write ."
     }
     ```

---

## 2. Logic Chain

1. Since pages (`index.tsx`, `transactions.tsx`, `budget.tsx`, `analytics.tsx`) rely on local static constants (e.g. `TRANSACTIONS = []`), any additions made via the Quick Add modal or modifications in settings will not propagate to them.
2. Implementing a centralized React Context store in `src/lib/store.tsx` exposes a unified state provider and a custom `useExpense()` hook. This will satisfy the interface contract defined in `SCOPE.md`.
3. To resolve timezone bugs where `new Date("YYYY-MM-DD")` treats dates as UTC (shifting day/month calculations on local machines), the store's budget spent calculator must parse string dates by splitting them (`t.date.split("-")`).
4. To enable Privacy Mode masking without modifying every instance of currency rendering manually, we can adapt the reusable `<Amount />` primitive in `src/components/expense/primitives.tsx` to call `useExpense()`. When `privacyMode` is true, it overrides normal numeric output with `$•••`.
5. Because there is no existing test script, the verification steps will rely on compiling the bundle (`npm run build`) and verifying linting standards (`npm run lint`).

---

## 3. Caveats

- Since routes themselves are scheduled for redesign in Milestone 5, they have not been modified during this exploration phase. An implementation agent must wire up these routes (`src/routes/*.tsx`) to utilize `useExpense()` for dynamic page updates.
- The `Amount` adaptation is global. If some elements should skip privacy masking, they will require custom local checks or direct overrides.

---

## 4. Conclusion

We recommend:

1. Creating the central context store in `src/lib/store.tsx` following the type contract from `SCOPE.md`.
2. Integrating the `ExpenseProvider` within `src/routes/__root.tsx` to wrap the `MobileShell` content viewport.
3. Overriding currency displays in the `Amount` component in `src/components/expense/primitives.tsx` using `useExpense()`.

---

## 5. Verification Method

1. **Compilation Check**:
   Run the following commands in the workspace root to ensure no TypeScript or syntax compilation failures:
   ```powershell
   npm run build
   ```
2. **Linter & Formatting Validation**:
   Validate code compliance:
   ```powershell
   npm run lint
   ```
3. **Visual Regression**:
   Verify Privacy Mode behaves as expected by toggling it under Settings, navigating back to Home, and ensuring monetary values render as `$•••`.
