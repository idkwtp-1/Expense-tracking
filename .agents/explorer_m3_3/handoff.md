# Handoff Report — Milestone 3: Global State & Privacy Mode

This handoff report summarizes the read-only exploration and analysis of the global state store and privacy mode implementation for the SLPlayer Personal Expense Tracker.

---

## 1. Observation

Direct code and metadata inspection yielded the following observations:

1. **Global State Context Requirements**:
   - `d:\Personal Projects\Expense trackinig\.agents\sub_orch_impl\SCOPE.md` lines 17-36 defines the global state store contract:
     ```markdown
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
     ```

2. **Target File `Amount` Component**:
   - `src/components/expense/primitives.tsx` lines 119-153 defines the `Amount` component:
     ```tsx
     export function Amount({
       value,
       size = 18,
       sign = false,
       color,
       className = "",
     }: {
       value: number;
       size?: number;
       sign?: boolean;
       color?: string;
       className?: string;
     }) {
       const abs = Math.abs(value).toLocaleString("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
       });
       const prefix = sign
         ? value > 0
           ? "+$"
           : value < 0
             ? "−$"
             : "$"
         : value < 0
           ? "−$"
           : "$";
       const resolved =
         color ??
         (value > 0 && sign
           ? "var(--green)"
           : value < 0
             ? "var(--red)"
             : "var(--text-primary)");
       return (
         <span
           className={`font-mono font-medium ${className}`}
           style={{ fontSize: size, color: resolved, lineHeight: 1.1 }}
         >
           {prefix}
           {abs}
         </span>
       );
     }
     ```

3. **Current Fragmented Local State & Root Wrapping**:
   - Local state is used for theme colors and settings, as observed in `src/routes/settings.tsx` lines 31-40:
     ```tsx
     const [privacy, setPrivacy] = useState(false);
     // ...
     const [accent, setAccent] = useState(() => {
       if (typeof window !== "undefined") {
         return localStorage.getItem("slplayer-accent") || "#7C3AED";
       }
       return "#7C3AED";
     });
     ```
   - The main entry point in `src/routes/__root.tsx` renders the layout shell directly without global providers wrapped (lines 132-137):
     ```tsx
     return (
       <QueryClientProvider client={queryClient}>
         <MobileShell>
           <Outlet />
         </MobileShell>
       </QueryClientProvider>
     );
     ```

---

## 2. Logic Chain

1. **Global Store implementation (`src/lib/store.tsx`)**:
   - Since multiple separate views (Dashboard, Transactions list, Budget pages, Settings) need to read and write common settings and transactions, we should establish a React Context provider `ExpenseProvider` inside a new file `src/lib/store.tsx`.
   - The provider should wrap the application tree inside `RootComponent` in `src/routes/__root.tsx` to make states accessible to all layout components and page routes.
   - For proper state management and performance:
     - Load existing records from `localStorage` on init, falling back to predefined mock arrays if empty.
     - Automatically write state updates (transactions, budgets, privacyMode, accentColor) to `localStorage` using React `useEffect` hooks.
     - Compute the budget `spent` values dynamically using transaction lists filtered by month and category to avoid data-drift and stale counts.

2. **Amount Primitive adaptation (`src/components/expense/primitives.tsx`)**:
   - The `Amount` primitive component must import `useExpense()` from the newly created store.
   - If `privacyMode` is retrieved as `true`, the component should immediately render `$•••` in place of the formatted currency value, masking sensitive figures while preserving style attributes (like `size` and `className`).

---

## 3. Caveats

- **Bypassing the `Amount` Component**:
  Several pages display numeric currency values directly via string interpolation or through third-party libraries (e.g. `CountUp` in the dashboard hero card in `src/routes/index.tsx`, limit/spent fractions in `src/routes/budget.tsx`, and table cells in `src/routes/analytics.tsx`) without utilizing the `Amount` primitive. These values will not be obscured by adapting the `Amount` component.
  - _Resolution_: The developer working on subsequent milestones must either refactor those views to use the `Amount` component or import `useExpense` into those pages to condition raw numeric displays.
- **Month Navigation Logic**:
  When filtering transactions by month, standardizing timezone-independent string splitting (`dateStr.split('-')`) is highly recommended over `new Date()` parsing to prevent off-by-one errors caused by local timezone offsets.

---

## 4. Conclusion

Milestone 3 should be implemented by creating a state store in `src/lib/store.tsx` providing data synchronization and `localStorage` persistence, wrapping the app root layout in the provider, and modifying the `Amount` component to selectively mask figures. The detailed design and code snippets are recorded in `d:\Personal Projects\Expense trackinig\.agents\explorer_m3_3\analysis.md`.

---

## 5. Verification Method

To verify the implementation of the global state and privacy mode:

1. **Compilation Check**:
   Run the following commands in the workspace root to verify that the store and component changes compile with TypeScript and build correctly:
   ```powershell
   npm run lint
   npm run build
   ```
2. **Behavioral Audit**:
   - Inspect local storage keys (`slplayer-transactions`, `slplayer-budgets`, `slplayer-privacy`, `slplayer-accent`) inside developer tools to confirm correct initial seeding and ongoing mutation updates.
   - Toggle Privacy Mode on the `/settings` page and navigate to `/` and `/transactions` to verify that transaction amounts rendered via `Amount` display as `$•••` instead of their currency figures.
