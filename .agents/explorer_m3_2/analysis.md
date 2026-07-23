# Analysis: Milestone 3 — Global State & Privacy Mode

## Summary

Detailed technical design for implementing the global React Context store in `src/lib/store.tsx` and adapting the `Amount` component in `src/components/expense/primitives.tsx` to support privacy mode masking (`$•••`).

---

## 1. Target Files & Proposed Design

### A. Global State Store: `src/lib/store.tsx`

The global state store will be created using standard React Context and TypeScript. It manages central application data, settings, and navigation overlay states.

#### Code Proposal: `src/lib/store.tsx`

```tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Transaction, Budget, Bill } from "./types";

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

// Initial Mock Data
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    merchant: "Starbucks",
    categoryId: "coffee",
    amount: -6.5,
    date: "2025-11-12",
    time: "08:30",
  },
  {
    id: "t2",
    merchant: "Whole Foods",
    categoryId: "groceries",
    amount: -84.2,
    date: "2025-11-12",
    time: "12:15",
  },
  {
    id: "t3",
    merchant: "Paycheck",
    categoryId: "income",
    amount: 3200.0,
    date: "2025-11-10",
    time: "09:00",
  },
  {
    id: "t4",
    merchant: "Netflix",
    categoryId: "subs",
    amount: -19.99,
    date: "2025-11-08",
    time: "04:00",
  },
  {
    id: "t5",
    merchant: "Gas Station",
    categoryId: "transport",
    amount: -45.0,
    date: "2025-11-07",
    time: "17:30",
  },
  {
    id: "t6",
    merchant: "Ramen Diner",
    categoryId: "food",
    amount: -28.5,
    date: "2025-11-12",
    time: "19:45",
  },
  {
    id: "t7",
    merchant: "Pharmacy",
    categoryId: "health",
    amount: -15.4,
    date: "2025-11-09",
    time: "11:20",
  },
  {
    id: "t8",
    merchant: "Steam Game",
    categoryId: "entertainment",
    amount: -59.99,
    date: "2025-11-06",
    time: "21:10",
  },
];

const MOCK_BUDGETS: Budget[] = [
  { categoryId: "food", spent: 0, limit: 300 },
  { categoryId: "groceries", spent: 0, limit: 400 },
  { categoryId: "coffee", spent: 0, limit: 50 },
  { categoryId: "subs", spent: 0, limit: 100 },
  { categoryId: "transport", spent: 0, limit: 150 },
  { categoryId: "health", spent: 0, limit: 100 },
  { categoryId: "entertainment", spent: 0, limit: 150 },
  { categoryId: "housing", spent: 0, limit: 1500 },
];

const MOCK_BILLS: Bill[] = [
  { id: "b1", name: "Rent", amount: 1200.0, dueDay: 1, dueLabel: "Nov 1" },
  {
    id: "b2",
    name: "Spotify Premium",
    amount: 15.99,
    dueDay: 5,
    dueLabel: "Nov 5",
  },
  {
    id: "b3",
    name: "Internet Service",
    amount: 75.0,
    dueDay: 15,
    dueLabel: "Nov 15",
  },
  {
    id: "b4",
    name: "Electricity",
    amount: 110.0,
    dueDay: 22,
    dueLabel: "Nov 22",
  },
];

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-transactions");
      if (saved) return JSON.parse(saved);
    }
    return MOCK_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-budgets");
      if (saved) return JSON.parse(saved);
    }
    return MOCK_BUDGETS;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-bills");
      if (saved) return JSON.parse(saved);
    }
    return MOCK_BILLS;
  });

  const [currentMonth, setCurrentMonthState] = useState<Date>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-current-month");
      if (saved) return new Date(saved);
    }
    return new Date(2025, 10, 1); // Default to November 2025
  });

  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("slplayer-privacy-mode");
      if (saved) return JSON.parse(saved);
    }
    return false;
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("slplayer-accent") || "#7C3AED";
    }
    return "#7C3AED";
  });

  // Dialog overlay visibility states (volatile; not persisted)
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("slplayer-transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("slplayer-budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("slplayer-bills", JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem("slplayer-current-month", currentMonth.toISOString());
  }, [currentMonth]);

  useEffect(() => {
    localStorage.setItem("slplayer-privacy-mode", JSON.stringify(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    localStorage.setItem("slplayer-accent", accentColor);

    // Apply accent custom CSS variables to document root dynamically
    document.documentElement.style.setProperty("--accent-violet", accentColor);
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    document.documentElement.style.setProperty(
      "--accent-muted",
      `rgba(${r}, ${g}, ${b}, 0.12)`,
    );
  }, [accentColor]);

  // Dynamic budget spent calculations based on transaction records in current month
  const derivedBudgets = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-indexed

    return budgets.map((b) => {
      const spent = transactions
        .filter((t) => {
          if (t.categoryId !== b.categoryId || t.amount >= 0) return false;
          // Parse date formatted as YYYY-MM-DD in a timezone-safe manner
          const parts = t.date.split("-");
          if (parts.length !== 3) return false;
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1; // 1-indexed to 0-indexed
          return y === year && m === month;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return { ...b, spent };
    });
  }, [budgets, transactions, currentMonth]);

  const addTransaction = (tx: Omit<Transaction, "id" | "time">) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateBudget = (categoryId: string, limit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b)),
    );
  };

  const setCurrentMonth = (date: Date) => {
    setCurrentMonthState(date);
  };

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        budgets: derivedBudgets,
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
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error("useExpense must be used within an ExpenseProvider");
  }
  return context;
};
```

---

### B. Adapting `Amount` Component: `src/components/expense/primitives.tsx`

To integrate privacy mode, we import `useExpense` in `primitives.tsx` and mask the value if `privacyMode` is active.

#### Proposed Change

```tsx
// Before (lines 119-153 in src/components/expense/primitives.tsx)
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

// After (using useExpense hook to conditionally mask)
import { useExpense } from "@/lib/store";

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
  const { privacyMode } = useExpense();
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

### C. Context Registration: `src/routes/__root.tsx`

To make the global context available across the application, the `ExpenseProvider` will wrap the layout inside `RootComponent`.

#### Proposed Placement

```tsx
import { ExpenseProvider } from "../lib/store";

// ... Inside RootComponent ...
function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ExpenseProvider>
        <MobileShell>
          <Outlet />
        </MobileShell>
      </ExpenseProvider>
    </QueryClientProvider>
  );
}
```

---

## 2. State Management Lifecycle & Design Rationale

1. **Timezone-Safe Budgeting**:
   Standard JS date parsing (`new Date("YYYY-MM-DD")`) parses strings as UTC and can shift the date to the previous/next day depending on local system offset. Parsing string dates via custom regex/split ensures transaction records are always cataloged in the exact calendar month intended by the user, maintaining budget and analytics accuracy.

2. **Decoupled Persistent vs. Volatile State**:
   Data tables (transactions, bills, budgets) and core settings (privacy, accent) are persisted to `localStorage` on update. Dialog states (`quickAddOpen`, `converterOpen`) are volatile, preventing annoying user experience loops (e.g. modal popping open on reload).

3. **Accent Theme Standardization**:
   Theme settings are consolidated in the global store provider `useEffect` block. This prevents duplication and ensures color custom properties (`--accent-violet` and `--accent-muted`) are dynamically generated from hex codes and applied to the DOM root in real-time.
