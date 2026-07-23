# Analysis Report — Milestone 3 (Global State & Privacy Mode)

This report provides a read-only investigation and design specification for implementing Milestone 3 of the SLPlayer Personal Expense Tracker.

---

## 1. Architectural Plan & Target Files

The global state and privacy mode require changes across three main areas of the codebase:

1. **`src/lib/store.tsx` (New File)**:
   - Establish the React Context provider (`ExpenseProvider`) and the custom consumer hook (`useExpense()`).
   - Define type structures and interfaces for the state.
   - Load, seed, and dynamically persist transactions, budgets, bills, settings, and UI states.

2. **`src/components/expense/primitives.tsx` (Modification)**:
   - Refactor the `Amount` component to consume privacy mode state from the global store.
   - Mask numeric values with `$•••` when `privacyMode` is active.

3. **`src/routes/__root.tsx` (Modification)**:
   - Import `ExpenseProvider` and wrap the application layout hierarchy (`MobileShell` and its children) to make the store accessible globally.

---

## 2. Recommended Imports

### In `src/lib/store.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from "react";
import { Transaction, Budget, Bill } from "./types";
```

### In `src/components/expense/primitives.tsx`

```typescript
import { useExpense } from "@/lib/store";
```

### In `src/routes/__root.tsx`

```typescript
import { ExpenseProvider } from "../lib/store";
```

---

## 3. Type Structures

The context store should adhere to the following contract derived from `SCOPE.md`.

```typescript
export interface ExpenseContextType {
  // Global Data States
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];

  // UI and Preferences States
  currentMonth: Date;
  privacyMode: boolean;
  accentColor: string;

  // Modal / Dialog UI States
  quickAddOpen: boolean;
  converterOpen: boolean;

  // State Mutators
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

## 4. State Management Lifecycle & Persistence

### A. Initialization & Seeding

To prevent flash-of-unstyled-content (FOUC) or empty states, the store states should be initialized using lazy initial state functions. If data exists in `localStorage`, it is loaded; otherwise, mock data is seeded:

1. **Transactions (`slplayer-transactions`)**:
   - Fallback mock data:
     ```typescript
     const mockTxs: Transaction[] = [
       {
         id: "tx1",
         merchant: "Walmart Supercenter",
         categoryId: "groceries",
         amount: 85.5,
         date: "2025-11-12",
         time: "11:45 AM",
       },
       {
         id: "tx2",
         merchant: "Starbucks Coffee",
         categoryId: "coffee",
         amount: 6.2,
         date: "2025-11-11",
         time: "08:15 AM",
       },
       {
         id: "tx3",
         merchant: "Netflix Premium",
         categoryId: "subs",
         amount: 15.99,
         date: "2025-11-08",
         time: "12:00 AM",
       },
       {
         id: "tx4",
         merchant: "Chevron Gas Station",
         categoryId: "transport",
         amount: 45.0,
         date: "2025-11-06",
         time: "03:40 PM",
       },
       {
         id: "tx5",
         merchant: "Direct Deposit Salary",
         categoryId: "income",
         amount: 3200.0,
         date: "2025-11-01",
         time: "09:00 AM",
       },
     ];
     ```
2. **Budgets (`slplayer-budgets`)**:
   - Fallback mock limits (excluding spent amount, which is computed dynamically):
     ```typescript
     const mockBudgets = [
       { categoryId: "food", limit: 400 },
       { categoryId: "groceries", limit: 300 },
       { categoryId: "coffee", limit: 50 },
       { categoryId: "subs", limit: 60 },
       { categoryId: "transport", limit: 150 },
       { categoryId: "health", limit: 100 },
       { categoryId: "housing", limit: 1200 },
       { categoryId: "entertainment", limit: 200 },
     ];
     ```
3. **Bills (Read-only / static initial data)**:
   - Initial seed list matching active invoices:
     ```typescript
     const mockBills: Bill[] = [
       {
         id: "b1",
         name: "Apartment Rent",
         amount: 1000.0,
         dueDay: 1,
         dueLabel: "Nov 1",
       },
       {
         id: "b2",
         name: "City Hydro Power",
         amount: 120.0,
         dueDay: 10,
         dueLabel: "Nov 10",
       },
       {
         id: "b3",
         name: "Spotify Family Plan",
         amount: 15.99,
         dueDay: 8,
         dueLabel: "Nov 8",
       },
     ];
     ```
4. **Accent Color (`slplayer-accent`)**:
   - Default: `#7C3AED`.
5. **Privacy Mode (`slplayer-privacy`)**:
   - Default: `false`.

### B. Reactive Computations (Anti-Data-Drift)

To prevent data-drift, the budget `spent` parameter should be calculated dynamically on-the-fly inside the store:

- Filter transactions where `categoryId` matches the budget's `categoryId` and the transaction date belongs to the `currentMonth`.
- Date matching is performed using string splits to bypass local system timezone differences:
  ```typescript
  const isSameMonth = (dateStr: string, currentMonth: Date) => {
    const [year, month] = dateStr.split("-").map(Number);
    return (
      year === currentMonth.getFullYear() &&
      month - 1 === currentMonth.getMonth()
    );
  };
  ```
- Expose the final `budgets` to the app with the computed `spent` values:
  ```typescript
  const computedBudgets = budgets.map((b) => {
    const spent = transactions
      .filter(
        (t) =>
          t.categoryId === b.categoryId && isSameMonth(t.date, currentMonth),
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...b, spent };
  });
  ```

### C. Persistent Side Effects

- Sync `transactions` and `budgets` states to `localStorage` whenever they mutate.
- Sync `privacyMode` to `localStorage` on change.
- When `accentColor` changes:
  1. Save to `localStorage`.
  2. Dynamically set `--accent-violet` on `document.documentElement.style`.
  3. Extract RGB hex values and set `--accent-muted` to `rgba(R, G, B, 0.12)` for modern translucent accents.

---

## 5. Design Proposals

### A. Proposed `src/lib/store.tsx` Implementation

```typescript
import React, { createContext, useContext, useState, useEffect } from "react";
import { Transaction, Budget, Bill } from "./types";

interface ExpenseContextType {
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

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error("useExpense must be used within ExpenseProvider");
  return context;
}

const isSameMonth = (dateStr: string, currentMonth: Date) => {
  const [year, month] = dateStr.split("-").map(Number);
  return year === currentMonth.getFullYear() && (month - 1) === currentMonth.getMonth();
};

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-transactions");
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: "tx1", merchant: "Walmart Supercenter", categoryId: "groceries", amount: 85.50, date: "2025-11-12", time: "11:45 AM" },
      { id: "tx2", merchant: "Starbucks Coffee", categoryId: "coffee", amount: 6.20, date: "2025-11-11", time: "08:15 AM" },
      { id: "tx3", merchant: "Netflix Premium", categoryId: "subs", amount: 15.99, date: "2025-11-08", time: "12:00 AM" },
      { id: "tx4", merchant: "Chevron Gas Station", categoryId: "transport", amount: 45.00, date: "2025-11-06", time: "03:40 PM" },
      { id: "tx5", merchant: "Direct Deposit Salary", categoryId: "income", amount: 3200.00, date: "2025-11-01", time: "09:00 AM" },
    ];
  });

  const [budgets, setBudgets] = useState<Omit<Budget, "spent">[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-budgets");
      if (saved) return JSON.parse(saved);
    }
    return [
      { categoryId: "food", limit: 400 },
      { categoryId: "groceries", limit: 300 },
      { categoryId: "coffee", limit: 50 },
      { categoryId: "subs", limit: 60 },
      { categoryId: "transport", limit: 150 },
      { categoryId: "health", limit: 100 },
      { categoryId: "housing", limit: 1200 },
      { categoryId: "entertainment", limit: 200 },
    ];
  });

  const [bills] = useState<Bill[]>([
    { id: "b1", name: "Apartment Rent", amount: 1000.00, dueDay: 1, dueLabel: "Nov 1" },
    { id: "b2", name: "City Hydro Power", amount: 120.00, dueDay: 10, dueLabel: "Nov 10" },
    { id: "b3", name: "Spotify Family Plan", amount: 15.99, dueDay: 8, dueLabel: "Nov 8" },
  ]);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 10, 12)); // default Nov 12, 2025
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("slplayer-privacy") === "true";
    }
    return false;
  });
  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("slplayer-accent") || "#7C3AED";
    }
    return "#7C3AED";
  });

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);

  // Sync state mutations to LocalStorage
  useEffect(() => {
    localStorage.setItem("slplayer-transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("slplayer-budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("slplayer-privacy", String(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    localStorage.setItem("slplayer-accent", accentColor);
    document.documentElement.style.setProperty("--accent-violet", accentColor);
    // Parse hex rgb channels for muted transparency background
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    document.documentElement.style.setProperty("--accent-muted", `rgba(${r}, ${g}, ${b}, 0.12)`);
  }, [accentColor]);

  // Operations
  const addTransaction = (tx: Omit<Transaction, "id" | "time">) => {
    const newTx: Transaction = {
      ...tx,
      id: "tx_" + Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateBudget = (categoryId: string, limit: number) => {
    setBudgets((prev) => prev.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b)));
  };

  // Compute budget spent on-the-fly
  const computedBudgets = budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.categoryId === b.categoryId && isSameMonth(t.date, currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...b, spent };
  });

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        budgets: computedBudgets,
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
```

### B. Proposed `Amount` primitive update in `src/components/expense/primitives.tsx`

```tsx
import { ReactNode } from "react";
import { useExpense } from "@/lib/store"; // <-- Recommended Import

// ... Other primitive exports (Card, CategoryIcon, StatPill, etc.)

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
  const { privacyMode } = useExpense(); // <-- Retrieve state from store

  const resolved =
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
        style={{ fontSize: size, color: resolved, lineHeight: 1.1 }}
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
      style={{ fontSize: size, color: resolved, lineHeight: 1.1 }}
    >
      {prefix}
      {abs}
    </span>
  );
}
```

---

## 6. Gap Analysis & Quality Constraints

The current task asks to adapt the `Amount` component in `src/components/expense/primitives.tsx`. While this obscures the transaction rows and bills list, there are several raw currency numeric calculations displayed directly in page routes:

1. **Dashboard (`src/routes/index.tsx`)**:
   - The primary balance hero counts up the balance using a React third-party library (`CountUp` module):
     ```tsx
     <CountUp end={NET_BALANCE} duration={1.1} decimals={2} separator="," />
     ```
     This does not use `Amount` and will bypass privacy mode. The implementer must add a conditional render check or wrapper here.
   - The "Safe to spend" widget similarly uses `CountUp` which will bypass privacy mode.

2. **Budget Page (`src/routes/budget.tsx`)**:
   - The page header interpolates raw text:
     ```tsx
     Spent <span className="font-mono">${totalSpent.toLocaleString()}</span> of{" "}
     <span className="font-mono">${totalLimit.toLocaleString()}</span>
     ```
   - Card headers interpolate spent vs limit text:
     ```tsx
     Spent <span className="font-mono" style={{ color: "var(--text-secondary)" }}>${b.spent}</span> of <span className="font-mono">${b.limit}</span>
     ```
     These will bypass privacy mode and need `privacyMode` checks.

3. **Analytics Page (`src/routes/analytics.tsx`)**:
   - The summary card displays hardcoded spending values:
     ```tsx
     { label: "Spent", value: "$1,952", color: "var(--red)" }
     ```
   - The donut chart center totals:
     ```tsx
     ${DONUT_TOTAL.toLocaleString()}
     ```
   - Top merchant list:
     ```tsx
     ${m.amount}
     ```
     These will all bypass privacy mode unless wrapped or conditioned.

**Recommendation**: The worker implementing Milestone 3 and subsequent milestones must either rewrite these sections to use the `Amount` primitive component, or import `useExpense` in each page and condition these raw numbers on `!privacyMode ? value : "$•••"`.
