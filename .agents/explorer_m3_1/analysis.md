# Milestone 3 Analysis: Global State & Privacy Mode

This document presents a comprehensive technical analysis and architectural blueprint for implementing **Milestone 3: Global State & Privacy Mode** in the SLPlayer Personal Expense Tracker. As a read-only explorer, these recommendations and code templates are designed for immediate implementation by the subsequent implementer.

---

## 1. Executive Summary

Milestone 3 transitions the application from a memory-only, disconnected state architecture to a unified, persistent global state store.
We design a **React Context Store** in `src/lib/store.tsx` with a custom hook `useExpense()`. This store centralizes core data models (`Transaction`, `Budget`, `Bill`), settings (`privacyMode`, `accentColor`, `currentMonth`), and UI states (`quickAddOpen`, `converterOpen`), ensuring changes are synchronized instantly and persisted across sessions via `localStorage`.

Additionally, we adapt the `<Amount />` primitive in `src/components/expense/primitives.tsx` to automatically mask sensitive currency figures under **Privacy Mode** with `$•••`. We also identify vital alignment opportunities to resolve outstanding bugs (BUG-03, BUG-04, BUG-05, BUG-06) across the codebase.

---

## 2. Target Files & Code Architecture

### 2.1 File Map & Dependency Graph

```
        [src/routes/__root.tsx]  (Injects ExpenseProvider)
                  |
         [src/lib/store.tsx]     (Creates Context & useExpense)
         /        |        \
        /         |         \
 [Types & Helpers]|     [State Components]
  - types.ts      |      - MobileShell.tsx
                  |      - TopBar.tsx
                  |      - QuickAddSheet.tsx
                  |      - CurrencyConverterSheet.tsx
                  |
          [View Pages]
           - index.tsx (Dashboard)
           - transactions.tsx
           - budget.tsx
           - analytics.tsx
           - settings.tsx
```

---

## 3. Type Structures (`src/lib/store.tsx`)

The global store requires a complete TypeScript contract exposing both raw state variables, derived/computed structures, and action dispatchers.

```typescript
import { Transaction, Budget, Bill } from "./types";

export interface ExpenseContextType {
  // Data States
  transactions: Transaction[];
  budgets: Budget[]; // budget limit with computed spent amount
  bills: Bill[];

  // UI & Configuration States
  currentMonth: Date;
  privacyMode: boolean;
  accentColor: string;
  quickAddOpen: boolean;
  converterOpen: boolean;

  // Actions / State Mutators
  addTransaction: (tx: Omit<Transaction, "id" | "time">) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (categoryId: string, limit: number) => void;
  setPrivacyMode: (on: boolean) => void;
  setAccentColor: (color: string) => void;
  setCurrentMonth: (date: Date) => void;
  setQuickAddOpen: (open: boolean) => void;
  setConverterOpen: (open: boolean) => void;
}
```

---

## 4. Recommended Mock Data (Mathematical Alignment)

The existing front-end pages contain specific hardcoded statistics (e.g. Spent: `$1,952.00`, Earned: `$3,200.00`, Saved: `$1,248.00`, Safe to Spend: `$847.50`, Budget Health: `85%`). To prevent visual jarring on first load, the default mock data is engineered to mathematically produce these exact numbers when filtered for **November 2025** (the active month of the mock calendar).

### 4.1 Mathematical Formulas

1. **Net Savings (Balance)**: $\text{Income } (\$3,200) - \text{Expenses } (\$1,952) = \$1,248.00$.
2. **Budget Health (Used %)**: $\frac{\text{Total Spent } (\$1,952)}{\text{Total Limits } (\$2,300)} \approx 84.87\% \rightarrow 85\% \text{ used}$.
3. **Safe to Spend**: $\text{Net Balance } (\$1,248.00) - \text{Remaining Budget } (\$348.00) - \text{Upcoming Bills } (\$52.50) = \$847.50$.
   - _Total Budget Limits_: $\$2,300$.
   - _Total Budget Spent_: $\$1,952$.
   - _Remaining Budget_: $\$2,300 - \$1,952 = \$348.00$.
   - _Unpaid Upcoming Bills_: $3$ bills totaling $\$52.50$.

### 4.2 Mock Data Definitions

```typescript
const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    merchant: "SLPlayer Corp",
    categoryId: "income",
    amount: 3200.0,
    date: "2025-11-01",
    time: "09:00 AM",
  },
  {
    id: "tx-2",
    merchant: "Apex Apartments",
    categoryId: "housing",
    amount: -800.0,
    date: "2025-11-01",
    time: "10:00 AM",
  },
  {
    id: "tx-3",
    merchant: "Whole Foods",
    categoryId: "groceries",
    amount: -200.0,
    date: "2025-11-08",
    time: "11:00 AM",
  },
  {
    id: "tx-4",
    merchant: "Walmart",
    categoryId: "groceries",
    amount: -180.0,
    date: "2025-11-04",
    time: "02:15 PM",
  },
  {
    id: "tx-5",
    merchant: "The Grill House",
    categoryId: "food",
    amount: -120.0,
    date: "2025-11-07",
    time: "07:30 PM",
  },
  {
    id: "tx-6",
    merchant: "Catering Services",
    categoryId: "food",
    amount: -245.0,
    date: "2025-11-12",
    time: "01:00 PM",
  },
  {
    id: "tx-7",
    merchant: "Sushi Dinner",
    categoryId: "food",
    amount: -85.0,
    date: "2025-11-09",
    time: "08:15 PM",
  },
  {
    id: "tx-8",
    merchant: "Train Pass",
    categoryId: "transport",
    amount: -80.0,
    date: "2025-11-10",
    time: "09:15 AM",
  },
  {
    id: "tx-9",
    merchant: "Shell Gas Station",
    categoryId: "transport",
    amount: -45.0,
    date: "2025-11-09",
    time: "04:45 PM",
  },
  {
    id: "tx-10",
    merchant: "Uber",
    categoryId: "transport",
    amount: -25.0,
    date: "2025-11-03",
    time: "06:30 PM",
  },
  {
    id: "tx-11",
    merchant: "Internet Bill",
    categoryId: "subs",
    amount: -75.0,
    date: "2025-11-10",
    time: "10:30 AM",
  },
  {
    id: "tx-12",
    merchant: "Netflix",
    categoryId: "subs",
    amount: -17.0,
    date: "2025-11-05",
    time: "08:00 AM",
  },
  {
    id: "tx-13",
    merchant: "Starbucks",
    categoryId: "coffee",
    amount: -6.5,
    date: "2025-11-06",
    time: "08:30 AM",
  },
  {
    id: "tx-14",
    merchant: "Local Cafe",
    categoryId: "coffee",
    amount: -73.5,
    date: "2025-11-11",
    time: "03:00 PM",
  },
];

const DEFAULT_BUDGET_LIMITS = [
  { categoryId: "housing", limit: 800 },
  { categoryId: "groceries", limit: 500 },
  { categoryId: "food", limit: 600 },
  { categoryId: "transport", limit: 200 },
  { categoryId: "subs", limit: 100 },
  { categoryId: "coffee", limit: 100 },
];

const DEFAULT_BILLS: Bill[] = [
  {
    id: "bill-1",
    name: "Spotify Duo",
    amount: 15.0,
    dueDay: 17,
    dueLabel: "Nov 17",
  },
  {
    id: "bill-2",
    name: "Gym Membership",
    amount: 22.5,
    dueDay: 22,
    dueLabel: "Nov 22",
  },
  {
    id: "bill-3",
    name: "iCloud Storage",
    amount: 15.0,
    dueDay: 24,
    dueLabel: "Nov 24",
  },
];
```

---

## 5. State Management Lifecycle & LocalStorage Sync

1. **Initialization**: On mount, each state slice checks `localStorage` using a lazy initializer function. If the key exists, it is parsed and loaded. Otherwise, the static default mock data is loaded.
2. **Synchronization**: State modifications (e.g. `addTransaction`, `setAccentColor`) trigger React state updates, which are immediately serialized back to `localStorage` (via React's state setter callbacks or `useEffect` triggers).
3. **Accent Theme Injection**: Changing `accentColor` must write to `localStorage` under `"slplayer-accent"` and immediately modify the CSS Custom Properties on `document.documentElement` to apply the theme in real-time.

---

## 6. Implementation Blueprints (Proposed Code)

### 6.1 Unified Global Store (`src/lib/store.tsx`)

This is the proposed implementation code for the store. It normalizes budget spent amounts, filters transactions by `currentMonth`, and formats currency.

```tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Transaction, Budget, Bill } from "./types";
import { isSameMonth, parseISO } from "date-fns";

export interface ExpenseContextType {
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  currentMonth: Date;
  privacyMode: boolean;
  accentColor: string;
  quickAddOpen: boolean;
  converterOpen: boolean;
  addTransaction: (tx: Omit<Transaction, "id" | "time">) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (categoryId: string, limit: number) => void;
  setPrivacyMode: (on: boolean) => void;
  setAccentColor: (color: string) => void;
  setCurrentMonth: (date: Date) => void;
  setQuickAddOpen: (open: boolean) => void;
  setConverterOpen: (open: boolean) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// --- Defaults ---
const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    merchant: "SLPlayer Corp",
    categoryId: "income",
    amount: 3200.0,
    date: "2025-11-01",
    time: "09:00 AM",
  },
  {
    id: "tx-2",
    merchant: "Apex Apartments",
    categoryId: "housing",
    amount: -800.0,
    date: "2025-11-01",
    time: "10:00 AM",
  },
  {
    id: "tx-3",
    merchant: "Whole Foods",
    categoryId: "groceries",
    amount: -200.0,
    date: "2025-11-08",
    time: "11:00 AM",
  },
  {
    id: "tx-4",
    merchant: "Walmart",
    categoryId: "groceries",
    amount: -180.0,
    date: "2025-11-04",
    time: "02:15 PM",
  },
  {
    id: "tx-5",
    merchant: "The Grill House",
    categoryId: "food",
    amount: -120.0,
    date: "2025-11-07",
    time: "07:30 PM",
  },
  {
    id: "tx-6",
    merchant: "Catering Services",
    categoryId: "food",
    amount: -245.0,
    date: "2025-11-12",
    time: "01:00 PM",
  },
  {
    id: "tx-7",
    merchant: "Sushi Dinner",
    categoryId: "food",
    amount: -85.0,
    date: "2025-11-09",
    time: "08:15 PM",
  },
  {
    id: "tx-8",
    merchant: "Train Pass",
    categoryId: "transport",
    amount: -80.0,
    date: "2025-11-10",
    time: "09:15 AM",
  },
  {
    id: "tx-9",
    merchant: "Shell Gas Station",
    categoryId: "transport",
    amount: -45.0,
    date: "2025-11-09",
    time: "04:45 PM",
  },
  {
    id: "tx-10",
    merchant: "Uber",
    categoryId: "transport",
    amount: -25.0,
    date: "2025-11-03",
    time: "06:30 PM",
  },
  {
    id: "tx-11",
    merchant: "Internet Bill",
    categoryId: "subs",
    amount: -75.0,
    date: "2025-11-10",
    time: "10:30 AM",
  },
  {
    id: "tx-12",
    merchant: "Netflix",
    categoryId: "subs",
    amount: -17.0,
    date: "2025-11-05",
    time: "08:00 AM",
  },
  {
    id: "tx-13",
    merchant: "Starbucks",
    categoryId: "coffee",
    amount: -6.5,
    date: "2025-11-06",
    time: "08:30 AM",
  },
  {
    id: "tx-14",
    merchant: "Local Cafe",
    categoryId: "coffee",
    amount: -73.5,
    date: "2025-11-11",
    time: "03:00 PM",
  },
];

const DEFAULT_BUDGET_LIMITS = [
  { categoryId: "housing", limit: 800 },
  { categoryId: "groceries", limit: 500 },
  { categoryId: "food", limit: 600 },
  { categoryId: "transport", limit: 200 },
  { categoryId: "subs", limit: 100 },
  { categoryId: "coffee", limit: 100 },
];

const DEFAULT_BILLS: Bill[] = [
  {
    id: "bill-1",
    name: "Spotify Duo",
    amount: 15.0,
    dueDay: 17,
    dueLabel: "Nov 17",
  },
  {
    id: "bill-2",
    name: "Gym Membership",
    amount: 22.5,
    dueDay: 22,
    dueLabel: "Nov 22",
  },
  {
    id: "bill-3",
    name: "iCloud Storage",
    amount: 15.0,
    dueDay: 24,
    dueLabel: "Nov 24",
  },
];

export function ExpenseProvider({ children }: { children: ReactNode }) {
  // Lazy Load State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-transactions");
      return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
    }
    return DEFAULT_TRANSACTIONS;
  });

  const [budgetLimits, setBudgetLimits] = useState<
    { categoryId: string; limit: number }[]
  >(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-budgets");
      return saved ? JSON.parse(saved) : DEFAULT_BUDGET_LIMITS;
    }
    return DEFAULT_BUDGET_LIMITS;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-bills");
      return saved ? JSON.parse(saved) : DEFAULT_BILLS;
    }
    return DEFAULT_BILLS;
  });

  const [currentMonth, _setCurrentMonth] = useState<Date>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-current-month");
      return saved ? new Date(saved) : new Date(2025, 10, 1); // Nov 2025 default
    }
    return new Date(2025, 10, 1);
  });

  const [privacyMode, _setPrivacyMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-privacy");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [accentColor, _setAccentColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("slplayer-accent") || "#7C3AED";
    }
    return "#7C3AED";
  });

  // Modal Dialog States
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);

  // --- Mutators ---
  const addTransaction = (tx: Omit<Transaction, "id" | "time">) => {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      time: timeStr,
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      localStorage.setItem("slplayer-transactions", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== id);
      localStorage.setItem("slplayer-transactions", JSON.stringify(updated));
      return updated;
    });
  };

  const updateBudget = (categoryId: string, limit: number) => {
    setBudgetLimits((prev) => {
      const exists = prev.some((b) => b.categoryId === categoryId);
      const updated = exists
        ? prev.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b))
        : [...prev, { categoryId, limit }];
      localStorage.setItem("slplayer-budgets", JSON.stringify(updated));
      return updated;
    });
  };

  const setPrivacyMode = (on: boolean) => {
    _setPrivacyMode(on);
    localStorage.setItem("slplayer-privacy", JSON.stringify(on));
  };

  const setAccentColor = (color: string) => {
    _setAccentColor(color);
    localStorage.setItem("slplayer-accent", color);

    // Inject accent styles
    document.documentElement.style.setProperty("--accent-violet", color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty(
      "--accent-muted",
      `rgba(${r}, ${g}, ${b}, 0.12)`,
    );
  };

  const setCurrentMonth = (date: Date) => {
    _setCurrentMonth(date);
    localStorage.setItem("slplayer-current-month", date.toISOString());
  };

  // --- Derived State (Memoized) ---
  const budgets = useMemo<Budget[]>(() => {
    return budgetLimits.map((b) => {
      const spent = transactions
        .filter((tx) => {
          if (tx.categoryId !== b.categoryId) return false;
          try {
            const txDate = parseISO(tx.date);
            return isSameMonth(txDate, currentMonth);
          } catch {
            return false;
          }
        })
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      return {
        categoryId: b.categoryId,
        spent,
        limit: b.limit,
      };
    });
  }, [transactions, budgetLimits, currentMonth]);

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        budgets,
        bills,
        currentMonth,
        privacyMode,
        accentColor,
        quickAddOpen,
        converterOpen,
        addTransaction,
        deleteTransaction,
        updateBudget,
        setPrivacyMode,
        setAccentColor,
        setCurrentMonth,
        setQuickAddOpen,
        setConverterOpen,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpense must be used within an ExpenseProvider");
  }
  return context;
}
```

### 6.2 Privacy Masking in `<Amount />` (`src/components/expense/primitives.tsx`)

This outlines the modified `Amount` component to integrate with the store context.

```tsx
import { ReactNode } from "react";
import { useExpense } from "@/lib/store"; // Import hook

// ... other components remain unchanged ...

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
  const { privacyMode } = useExpense(); // Read privacyMode

  // Resolve styles first to maintain visual structure
  const resolvedColor =
    color ??
    (value > 0 && sign
      ? "var(--green)"
      : value < 0
        ? "var(--red)"
        : "var(--text-primary)");

  if (privacyMode) {
    return (
      <span
        className={`font-mono font-medium ${className}`}
        style={{ fontSize: size, color: resolvedColor, lineHeight: 1.1 }}
      >
        $•••
      </span>
    );
  }

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

  return (
    <span
      className={`font-mono font-medium ${className}`}
      style={{ fontSize: size, color: resolvedColor, lineHeight: 1.1 }}
    >
      {prefix}
      {abs}
    </span>
  );
}
```

---

## 7. Critical Caveats & Implementation Edge Cases

While adapting the `<Amount />` component masks the majority of values, several components render raw values or use `CountUp` and will bypass `<Amount />`:

1. **Dashboard Net Balance (Hero Card)**:
   - Uses `CountUp` with `NET_BALANCE`.
   - _Fix Recommendation_: Wrap with a conditional rendering statement:
     ```tsx
     {privacyMode ? "$•••" : <span>+$<CountUp end={NET_BALANCE} ... /></span>}
     ```
2. **Dashboard Safe to Spend Callout**:
   - Uses `CountUp` with `SAFE_TO_SPEND`.
   - _Fix Recommendation_: Wrap with conditional check:
     ```tsx
     {privacyMode ? "$•••" : <span>$<CountUp end={SAFE_TO_SPEND} ... /></span>}
     ```
3. **Budget Header & Card Spans** (`budget.tsx`):
   - Inline formatting: `Spent $totalSpent of $totalLimit` and `Spent $spent of $limit`.
   - _Fix Recommendation_: Refactor these sections to use `<Amount />` or evaluate `privacyMode ? "$•••" : value` before string rendering.
4. **Analytics Summary Row & Charts** (`analytics.tsx`):
   - Values like `value: "$1,952"` in lists, and values inside `ResponsiveContainer` tooltips.
   - _Fix Recommendation_: Mask labels in the tooltip formatter when `privacyMode` is enabled.
5. **Vite Development Server Context**:
   - The developer should import `{ ExpenseProvider }` and wrap `MobileShell` in `src/routes/__root.tsx`.
   - In `MobileShell.tsx`, replace the localized `quickOpen` / `convOpen` state hooks and `useSheets()` context with the global context `useExpense()` controls.

---

## 8. Verification Strategy

Following code injection:

1. **Lint Check**: Run `npm run lint` to verify that there are no unused imports (e.g. `useExpense` or `date-fns` functions) or typing issues.
2. **Build Check**: Run `npm run build` to guarantee compilation success.
3. **Behavioral Checks**:
   - Turn **Privacy Mode** on in Settings, confirm Dashboard balance hero, bills, and recent list displays `$•••` mask.
   - Click month navigators on Dashboard, check month transitions and data updates correctly.
   - Change Theme Accent in settings, confirm theme color picker shifts globally in real-time.
