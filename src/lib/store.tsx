import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Transaction, Budget, Bill, Wallet, WalletSpend, RATES } from "./types";
import { isSameMonth, parseISO } from "date-fns";
import { supabase } from "./supabase";

export interface ExpenseContextType {
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  currentMonth: Date;
  privacyMode: boolean;
  accentColor: string;
  quickAddOpen: boolean;
  converterOpen: boolean;
  wallets: Wallet[];
  walletSpends: WalletSpend[];
  customRates: Record<string, number>;
  allRates: Record<string, number>;
  allCurrencies: string[];
  addCustomCurrency: (code: string, rate: number) => void;
  deleteCustomCurrency: (code: string) => void;
  convertWallet: (sourceCurrency: string, targetCurrency: string, amount: number, rate: number) => void;
  addWallet: (name: string, foreignCurrency: string, foreignAmount: number, baseCost: number, sourceCurrency?: string) => void;
  topUpWallet: (walletId: string, foreignAmount: number, baseCost: number, sourceCurrency?: string) => void;
  archiveWallet: (id: string) => void;
  deleteWallet: (id: string) => void;
  logSpend: (walletId: string, foreignAmount: number, note: string, categoryTag: string, date: string) => void;
  editSpend: (id: string, newForeignAmount: number, newNote: string, newCategoryTag: string, newDate: string) => void;
  deleteSpend: (id: string) => void;
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

const DEFAULT_BUDGET_LIMITS = [
  { categoryId: "housing", limit: 0 },
  { categoryId: "groceries", limit: 0 },
  { categoryId: "food", limit: 0 },
  { categoryId: "transport", limit: 0 },
  { categoryId: "subs", limit: 0 },
  { categoryId: "coffee", limit: 0 },
  { categoryId: "travel", limit: 0 },
  { categoryId: "other", limit: 0 },
];

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<{ categoryId: string; limit: number }[]>(DEFAULT_BUDGET_LIMITS);
  const [bills] = useState<Bill[]>([]);
  const [currentMonth, _setCurrentMonth] = useState<Date>(new Date());
  const [privacyMode, _setPrivacyMode] = useState<boolean>(false);
  const [accentColor, _setAccentColor] = useState<string>("#0A84FF");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletSpends, setWalletSpends] = useState<WalletSpend[]>([]);
  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const allRates = useMemo<Record<string, number>>(() => {
    return { ...RATES, ...customRates };
  }, [customRates]);

  const allCurrencies = useMemo<string[]>(() => {
    return Object.keys(allRates);
  }, [allRates]);

  // Initial Load from LocalStorage & Supabase + Realtime Subscription
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTx = localStorage.getItem("slplayer-transactions");
      if (savedTx) setTransactions(JSON.parse(savedTx));

      const savedBudgets = localStorage.getItem("slplayer-budgets");
      if (savedBudgets) setBudgetLimits(JSON.parse(savedBudgets));

      const savedWallets = localStorage.getItem("slplayer-wallets");
      if (savedWallets) setWallets(JSON.parse(savedWallets));

      const savedSpends = localStorage.getItem("slplayer-wallet-spends");
      if (savedSpends) setWalletSpends(JSON.parse(savedSpends));

      const savedMonth = localStorage.getItem("slplayer-current-month");
      if (savedMonth) _setCurrentMonth(new Date(savedMonth));

      const savedPrivacy = localStorage.getItem("slplayer-privacy");
      if (savedPrivacy) _setPrivacyMode(JSON.parse(savedPrivacy));

      const savedAccent = localStorage.getItem("slplayer-accent");
      if (savedAccent) _setAccentColor(savedAccent);

      const savedRates = localStorage.getItem("slplayer-custom-rates");
      if (savedRates) setCustomRates(JSON.parse(savedRates));

      setIsLoaded(true);

      // --- Supabase Cloud Fetch & Realtime Sync ---
      const fetchSupabaseData = async () => {
        try {
          const [txRes, walletRes, spendRes, budgetRes] = await Promise.all([
            supabase.from("transactions").select("*").order("date", { ascending: false }),
            supabase.from("wallets").select("*"),
            supabase.from("wallet_spends").select("*"),
            supabase.from("budget_limits").select("*"),
          ]);

          if (txRes.data && txRes.data.length > 0) {
            const mappedTx: Transaction[] = txRes.data.map((row) => ({
              id: row.id,
              merchant: row.merchant,
              categoryId: row.category_id,
              amount: parseFloat(row.amount),
              date: row.date,
              time: row.time || "",
              wallet_id: row.wallet_id || undefined,
              foreign_amount: row.foreign_amount ? parseFloat(row.foreign_amount) : undefined,
              foreign_currency: row.foreign_currency || undefined,
            }));
            setTransactions(mappedTx);
          }

          if (walletRes.data && walletRes.data.length > 0) {
            const mappedWallets: Wallet[] = walletRes.data.map((row) => ({
              id: row.id,
              name: row.name,
              foreign_currency: row.foreign_currency,
              total_foreign_funded: parseFloat(row.total_foreign_funded),
              remaining_foreign: parseFloat(row.remaining_foreign),
              status: row.status as "active" | "archived",
              created_at: row.created_at,
              updated_at: row.updated_at,
            }));
            setWallets(mappedWallets);
          }

          if (spendRes.data && spendRes.data.length > 0) {
            const mappedSpends: WalletSpend[] = spendRes.data.map((row) => ({
              id: row.id,
              wallet_id: row.wallet_id,
              foreign_amount: parseFloat(row.foreign_amount),
              note: row.note || "",
              category_tag: row.category_tag || undefined,
              date: row.date,
            }));
            setWalletSpends(mappedSpends);
          }

          if (budgetRes.data && budgetRes.data.length > 0) {
            const mappedBudgets = budgetRes.data.map((row) => ({
              categoryId: row.category_id,
              limit: parseFloat(row.limit_amount),
            }));
            setBudgetLimits(mappedBudgets);
          }
        } catch (err) {
          console.warn("Supabase initial fetch warning:", err);
        }
      };

      fetchSupabaseData();

      // Realtime listener for cross-device sync (phone <-> desktop)
      const channel = supabase
        .channel("db-realtime-sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
          fetchSupabaseData();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, () => {
          fetchSupabaseData();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "wallet_spends" }, () => {
          fetchSupabaseData();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "budget_limits" }, () => {
          fetchSupabaseData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-custom-rates", JSON.stringify(customRates));
  }, [customRates, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-wallets", JSON.stringify(wallets));
  }, [wallets, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-wallet-spends", JSON.stringify(walletSpends));
  }, [walletSpends, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-transactions", JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-budgets", JSON.stringify(budgetLimits));
  }, [budgetLimits, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-bills", JSON.stringify(bills));
  }, [bills, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-current-month", currentMonth.toISOString());
  }, [currentMonth, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-privacy", JSON.stringify(privacyMode));
  }, [privacyMode, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-accent", accentColor);
    document.documentElement.style.setProperty("--accent-violet", accentColor);
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    document.documentElement.style.setProperty(
      "--accent-muted",
      `rgba(${r}, ${g}, ${b}, 0.12)`,
    );
  }, [accentColor, isLoaded]);

  // --- Supabase Cloud Sync Effects ---
  useEffect(() => {
    if (!isLoaded || transactions.length === 0) return;
    const dbPayload = transactions.map((t) => ({
      id: t.id,
      merchant: t.merchant,
      category_id: t.categoryId,
      amount: t.amount,
      date: t.date,
      time: t.time || "",
      wallet_id: t.wallet_id || null,
      foreign_amount: t.foreign_amount || null,
      foreign_currency: t.foreign_currency || null,
    }));
    supabase.from("transactions").upsert(dbPayload).then(() => {}).catch(() => {});
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded || wallets.length === 0) return;
    const dbPayload = wallets.map((w) => ({
      id: w.id,
      name: w.name,
      foreign_currency: w.foreign_currency,
      total_foreign_funded: w.total_foreign_funded,
      remaining_foreign: w.remaining_foreign,
      status: w.status,
      created_at: w.created_at,
      updated_at: w.updated_at,
    }));
    supabase.from("wallets").upsert(dbPayload).then(() => {}).catch(() => {});
  }, [wallets, isLoaded]);

  useEffect(() => {
    if (!isLoaded || walletSpends.length === 0) return;
    const dbPayload = walletSpends.map((s) => ({
      id: s.id,
      wallet_id: s.wallet_id,
      foreign_amount: s.foreign_amount,
      note: s.note || "",
      category_tag: s.category_tag || null,
      date: s.date,
    }));
    supabase.from("wallet_spends").upsert(dbPayload).then(() => {}).catch(() => {});
  }, [walletSpends, isLoaded]);

  useEffect(() => {
    if (!isLoaded || budgetLimits.length === 0) return;
    const dbPayload = budgetLimits.map((b) => ({
      category_id: b.categoryId,
      limit_amount: b.limit,
    }));
    supabase.from("budget_limits").upsert(dbPayload).then(() => {}).catch(() => {});
  }, [budgetLimits, isLoaded]);

  const addTransaction = (tx: Omit<Transaction, "id" | "time">) => {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let walletId = tx.wallet_id;
    
    // If it's a foreign currency transaction and no wallet_id is provided,
    // find or auto-create a wallet for that currency
    if (tx.foreign_currency && tx.foreign_currency !== "CAD" && !walletId) {
      const activeWallet = wallets.find(w => w.foreign_currency === tx.foreign_currency && w.status === "active");
      
      if (activeWallet) {
        // Link to existing wallet and update its balance
        walletId = activeWallet.id;
        setWallets((prev) =>
          prev.map((w) => {
            if (w.id !== activeWallet.id) return w;
            const amountDiff = tx.amount;
            return {
              ...w,
              total_foreign_funded: amountDiff > 0 ? w.total_foreign_funded + amountDiff : w.total_foreign_funded,
              remaining_foreign: w.remaining_foreign + amountDiff,
              updated_at: new Date().toISOString(),
            };
          })
        );
      } else {
        // Auto-create a new wallet for this currency
        const newWalletId = `wallet-${Math.random().toString(36).substring(2, 9)}`;
        const nowStr = new Date().toISOString();
        const initialAmount = Math.abs(tx.amount); // use absolute amount as initial balance
        const newWallet: Wallet = {
          id: newWalletId,
          name: tx.foreign_currency,
          foreign_currency: tx.foreign_currency,
          total_foreign_funded: tx.amount > 0 ? initialAmount : 0,
          remaining_foreign: tx.amount, // positive for income, negative for expense
          status: "active",
          created_at: nowStr,
          updated_at: nowStr,
        };
        setWallets((prev) => [newWallet, ...prev]);
        walletId = newWalletId;
      }
    }

    const newTx: Transaction = {
      ...tx,
      wallet_id: walletId,
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      time: timeStr,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx && tx.wallet_id) {
      if (tx.categoryId === "travel") {
        setWallets((prev) =>
          prev.map((w) => {
            if (w.id !== tx.wallet_id) return w;
            return {
              ...w,
              total_foreign_funded: Math.max(0, w.total_foreign_funded - (tx.foreign_amount || 0)),
              remaining_foreign: w.remaining_foreign - (tx.foreign_amount || 0),
              updated_at: new Date().toISOString(),
            };
          })
        );
      } else {
        // Quick Add transaction linked to wallet
        setWallets((prev) =>
          prev.map((w) => {
            if (w.id !== tx.wallet_id) return w;
            const amountDiff = tx.amount;
            return {
              ...w,
              total_foreign_funded: amountDiff > 0 ? Math.max(0, w.total_foreign_funded - amountDiff) : w.total_foreign_funded,
              remaining_foreign: w.remaining_foreign - amountDiff,
              updated_at: new Date().toISOString(),
            };
          })
        );
      }
    }
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    supabase.from("transactions").delete().eq("id", id).then(() => {}).catch(() => {});
  };

  const addCustomCurrency = (code: string, rate: number) => {
    setCustomRates((prev) => ({
      ...prev,
      [code.toUpperCase()]: rate,
    }));
  };

  const deleteCustomCurrency = (code: string) => {
    setCustomRates((prev) => {
      const copy = { ...prev };
      delete copy[code];
      return copy;
    });
  };

  const addWallet = (
    name: string,
    foreignCurrency: string,
    foreignAmount: number,
    baseCost: number,
    sourceCurrency: string = "CAD"
  ) => {
    const newWalletId = `wallet-${Math.random().toString(36).substring(2, 9)}`;
    const nowStr = new Date().toISOString();
    const newWallet: Wallet = {
      id: newWalletId,
      name,
      foreign_currency: foreignCurrency,
      total_foreign_funded: foreignAmount,
      remaining_foreign: foreignAmount,
      status: "active",
      created_at: nowStr,
      updated_at: nowStr,
    };
    setWallets((prev) => [newWallet, ...prev]);

    // Convert source currency baseCost to CAD equivalent for transaction recording
    const rate = allRates[sourceCurrency] || 1;
    const baseCostInCAD = baseCost / rate;

    addTransaction({
      merchant: name,
      categoryId: "travel",
      amount: -baseCostInCAD,
      date: new Date().toISOString().split("T")[0],
      wallet_id: newWalletId,
      foreign_amount: foreignAmount,
      foreign_currency: foreignCurrency,
    });
  };

  const topUpWallet = (
    walletId: string,
    foreignAmount: number,
    baseCost: number,
    sourceCurrency: string = "CAD"
  ) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return;
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== walletId) return w;
        return {
          ...w,
          total_foreign_funded: w.total_foreign_funded + foreignAmount,
          remaining_foreign: w.remaining_foreign + foreignAmount,
          updated_at: new Date().toISOString(),
        };
      })
    );

    // Convert source currency baseCost to CAD equivalent for transaction recording
    const rate = allRates[sourceCurrency] || 1;
    const baseCostInCAD = baseCost / rate;

    addTransaction({
      merchant: wallet.name,
      categoryId: "travel",
      amount: -baseCostInCAD,
      date: new Date().toISOString().split("T")[0],
      wallet_id: walletId,
      foreign_amount: foreignAmount,
      foreign_currency: wallet.foreign_currency,
    });
  };

  const archiveWallet = (id: string) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: "archived", updated_at: new Date().toISOString() } : w))
    );
  };

  const deleteWallet = (id: string) => {
    const hasLinked = transactions.some((t) => t.wallet_id === id);
    if (hasLinked) {
      alert("Cannot delete wallet with linked transactions. Archive it instead.");
      return;
    }
    setWallets((prev) => prev.filter((w) => w.id !== id));
    setWalletSpends((prev) => prev.filter((s) => s.wallet_id !== id));
  };

  const convertWallet = (sourceCurrency: string, targetCurrency: string, amount: number, rate: number) => {
    const activeSourceWallet = wallets.find(w => w.foreign_currency === sourceCurrency && w.status === "active");
    if (!activeSourceWallet) return;

    const targetAmount = amount * rate;
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const nowStr = new Date().toISOString();
    const dateStr = nowStr.split("T")[0];

    // Deduct from source wallet
    setWallets((prev) => prev.map((w) => {
      if (w.id === activeSourceWallet.id) {
        return {
          ...w,
          remaining_foreign: w.remaining_foreign - amount,
          updated_at: nowStr,
        };
      }
      return w;
    }));

    const expenseTx: Transaction = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      merchant: `Conversion to ${targetCurrency}`,
      categoryId: "other",
      amount: -amount, // We don't convert to CAD here because this is fully within foreign wallets, but we can set it to negative foreign amount.
      date: dateStr,
      time: timeStr,
      wallet_id: activeSourceWallet.id,
      foreign_amount: amount,
      foreign_currency: sourceCurrency,
    };

    // Add to target wallet
    let targetWalletId: string | undefined;
    const activeTargetWallet = wallets.find(w => w.foreign_currency === targetCurrency && w.status === "active");

    if (activeTargetWallet) {
      targetWalletId = activeTargetWallet.id;
      setWallets((prev) => prev.map((w) => {
        if (w.id === activeTargetWallet.id) {
          return {
            ...w,
            total_foreign_funded: w.total_foreign_funded + targetAmount,
            remaining_foreign: w.remaining_foreign + targetAmount,
            updated_at: nowStr,
          };
        }
        return w;
      }));
    } else {
      targetWalletId = `wallet-${Math.random().toString(36).substring(2, 9)}`;
      const newWallet: Wallet = {
        id: targetWalletId,
        name: targetCurrency,
        foreign_currency: targetCurrency,
        total_foreign_funded: targetAmount,
        remaining_foreign: targetAmount,
        status: "active",
        created_at: nowStr,
        updated_at: nowStr,
      };
      setWallets((prev) => [newWallet, ...prev]);
    }

    const incomeTx: Transaction = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      merchant: `Conversion from ${sourceCurrency}`,
      categoryId: "income",
      amount: targetAmount,
      date: dateStr,
      time: timeStr,
      wallet_id: targetWalletId,
      foreign_amount: targetAmount,
      foreign_currency: targetCurrency,
    };

    setTransactions((prev) => [incomeTx, expenseTx, ...prev]);
  };

  const logSpend = (walletId: string, foreignAmount: number, note: string, categoryTag: string, date: string) => {
    const newSpendId = `spend-${Math.random().toString(36).substring(2, 9)}`;
    const newSpend: WalletSpend = {
      id: newSpendId,
      wallet_id: walletId,
      foreign_amount: foreignAmount,
      note,
      category_tag: categoryTag,
      date,
    };
    setWalletSpends((prev) => [newSpend, ...prev]);
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== walletId) return w;
        return {
          ...w,
          remaining_foreign: w.remaining_foreign - foreignAmount,
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  const editSpend = (id: string, newForeignAmount: number, newNote: string, newCategoryTag: string, newDate: string) => {
    const spend = walletSpends.find((s) => s.id === id);
    if (!spend) return;
    const delta = newForeignAmount - spend.foreign_amount;
    setWalletSpends((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              foreign_amount: newForeignAmount,
              note: newNote,
              category_tag: newCategoryTag,
              date: newDate,
            }
          : s
      )
    );
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== spend.wallet_id) return w;
        return {
          ...w,
          remaining_foreign: w.remaining_foreign - delta,
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  const deleteSpend = (id: string) => {
    const spend = walletSpends.find((s) => s.id === id);
    if (!spend) return;
    setWalletSpends((prev) => prev.filter((s) => s.id !== id));
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== spend.wallet_id) return w;
        return {
          ...w,
          remaining_foreign: w.remaining_foreign + spend.foreign_amount,
          updated_at: new Date().toISOString(),
        };
      })
    );
    supabase.from("wallet_spends").delete().eq("id", id).then(() => {}).catch(() => {});
  };

  const updateBudget = (categoryId: string, limit: number) => {
    setBudgetLimits((prev) => {
      const exists = prev.some((b) => b.categoryId === categoryId);
      if (exists) {
        return prev.map((b) =>
          b.categoryId === categoryId ? { ...b, limit } : b,
        );
      }
      return [...prev, { categoryId, limit }];
    });
  };

  const setPrivacyMode = (on: boolean) => {
    _setPrivacyMode(on);
  };

  const setAccentColor = (color: string) => {
    _setAccentColor(color);
  };

  const setCurrentMonth = (date: Date) => {
    _setCurrentMonth(date);
  };

  const budgets = useMemo<Budget[]>(() => {
    return budgetLimits.map((b) => {
      const spent = transactions
        .filter((tx) => {
          if (tx.categoryId !== b.categoryId || tx.amount >= 0) return false;
          if (tx.foreign_currency && tx.foreign_currency !== "CAD") return false;
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
        wallets,
        walletSpends,
        customRates,
        allRates,
        allCurrencies,
        addCustomCurrency,
        deleteCustomCurrency,
        convertWallet,
        addWallet,
        topUpWallet,
        archiveWallet,
        deleteWallet,
        logSpend,
        editSpend,
        deleteSpend,
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
