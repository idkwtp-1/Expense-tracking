import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Transaction, Budget, Bill, Wallet, WalletSpend, RATES, BackupPayload } from "./types";
import { isSameMonth, parseISO } from "date-fns";
import { supabase } from "./supabase";
import * as syncQueue from "./syncQueue";

export interface ExpenseContextType {
  transactions: Transaction[];
  budgets: Budget[];
  budgetLimits: { categoryId: string; limit: number }[];
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
  addTransaction: (tx: Omit<Transaction, "id" | "time">) => string;
  deleteTransaction: (id: string) => void;
  updateBudget: (categoryId: string, limit: number) => void;
  importData: (data: BackupPayload) => Promise<void>;
  uploadReceipts: (transactionId: string, blobs: Blob[]) => Promise<string[]>;
  deleteReceipt: (transactionId: string, urlToDelete: string) => Promise<void>;
  getStorageUsage: () => Promise<number>;
  setPrivacyMode: (on: boolean) => void;
  setAccentColor: (color: string) => void;
  setCurrentMonth: (date: Date) => void;
  setQuickAddOpen: (open: boolean) => void;
  setConverterOpen: (open: boolean) => void;
  resetApp: () => Promise<void>;
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

  // Initial Load: Supabase is the primary source, localStorage is offline fallback only.
  // Non-transactional settings (accent, privacy, month) still load from localStorage immediately.
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load settings immediately from localStorage (these are purely local preferences)
      const savedMonth = localStorage.getItem("slplayer-current-month");
      if (savedMonth) _setCurrentMonth(new Date(savedMonth));

      const savedPrivacy = localStorage.getItem("slplayer-privacy");
      if (savedPrivacy) _setPrivacyMode(JSON.parse(savedPrivacy));

      const savedAccent = localStorage.getItem("slplayer-accent");
      if (savedAccent) _setAccentColor(savedAccent);

      const savedRates = localStorage.getItem("slplayer-custom-rates");
      if (savedRates) setCustomRates(JSON.parse(savedRates));

      const savedBudgets = localStorage.getItem("slplayer-budgets");
      if (savedBudgets) setBudgetLimits(JSON.parse(savedBudgets));

      setIsLoaded(true);

      // --- Supabase Cloud Fetch & Realtime Sync ---
      // Supabase is ALWAYS the source of truth. We always overwrite local state,
      // even if the result is empty — this is what makes real-time deletions work.
      const fetchSupabaseData = async () => {
        try {
          const [txRes, walletRes, spendRes, budgetRes] = await Promise.all([
            supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
            supabase.from("wallets").select("*").order("created_at", { ascending: false }),
            supabase.from("wallet_spends").select("*").order("created_at", { ascending: false }),
            supabase.from("budget_limits").select("*"),
          ]);

          // Always set from Supabase — even empty arrays clear stale local data
          if (!txRes.error) {
            const mappedTx: Transaction[] = (txRes.data ?? []).map((row) => ({
              id: row.id,
              merchant: row.merchant,
              categoryId: row.category_id,
              amount: parseFloat(row.amount),
              date: row.date,
              time: row.time || "",
              wallet_id: row.wallet_id || undefined,
              foreign_amount: row.foreign_amount ? parseFloat(row.foreign_amount) : undefined,
              foreign_currency: row.foreign_currency || undefined,
              receipt_urls: row.receipt_urls || [],
            }));
            setTransactions(mappedTx);
          }

          if (!walletRes.error) {
            const mappedWallets: Wallet[] = (walletRes.data ?? []).map((row) => ({
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

          if (!spendRes.error) {
            const mappedSpends: WalletSpend[] = (spendRes.data ?? []).map((row) => ({
              id: row.id,
              wallet_id: row.wallet_id,
              foreign_amount: parseFloat(row.foreign_amount),
              note: row.note || "",
              category_tag: row.category_tag || undefined,
              date: row.date,
            }));
            setWalletSpends(mappedSpends);
          }

          if (!budgetRes.error && budgetRes.data && budgetRes.data.length > 0) {
            // Budget limits intentionally keep local defaults if Supabase has none
            const mappedBudgets = budgetRes.data.map((row) => ({
              categoryId: row.category_id,
              limit: parseFloat(row.limit_amount),
            }));
            setBudgetLimits(mappedBudgets);
          }
        } catch (err) {
          // Supabase is unreachable — fall back to localStorage as offline cache
          console.warn("Supabase fetch failed, using localStorage fallback:", err);
          const savedTx = localStorage.getItem("slplayer-transactions");
          if (savedTx) try { setTransactions(JSON.parse(savedTx)); } catch(e) {}
          const savedWallets = localStorage.getItem("slplayer-wallets");
          if (savedWallets) try { setWallets(JSON.parse(savedWallets)); } catch(e) {}
          const savedSpends = localStorage.getItem("slplayer-wallet-spends");
          if (savedSpends) try { setWalletSpends(JSON.parse(savedSpends)); } catch(e) {}
        }
      };

      syncQueue.startOnlineWatcher();
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

  // Settings only — these are local preferences, not cloud data
  useEffect(() => {
    if (isLoaded) localStorage.setItem("slplayer-custom-rates", JSON.stringify(customRates));
  }, [customRates, isLoaded]);

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

  // Helper: upsert a single row to Supabase, queue offline if it fails
  const upsertRow = (table: string, row: object, id: string) => {
    supabase.from(table).upsert(row).then((res) => {
      if (res.error) throw res.error;
    }).catch(() => {
      syncQueue.enqueue(table, "upsert", row, id);
    });
  };

  const addTransaction = (tx: Omit<Transaction, "id" | "time">) => {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let walletId = tx.wallet_id;
    const nowStr = new Date().toISOString();

    // If it's a foreign currency transaction and no wallet_id is provided,
    // find or auto-create a wallet for that currency
    if (tx.foreign_currency && tx.foreign_currency !== "CAD" && !walletId) {
      const activeWallet = wallets.find(w => w.foreign_currency === tx.foreign_currency && w.status === "active");

      if (activeWallet) {
        walletId = activeWallet.id;
        const amountDiff = tx.amount;
        const updatedWallet = {
          ...activeWallet,
          total_foreign_funded: amountDiff > 0 ? activeWallet.total_foreign_funded + amountDiff : activeWallet.total_foreign_funded,
          remaining_foreign: activeWallet.remaining_foreign + amountDiff,
          updated_at: nowStr,
        };
        setWallets((prev) => prev.map((w) => w.id === activeWallet.id ? updatedWallet : w));
        upsertRow("wallets", { id: updatedWallet.id, name: updatedWallet.name, foreign_currency: updatedWallet.foreign_currency, total_foreign_funded: updatedWallet.total_foreign_funded, remaining_foreign: updatedWallet.remaining_foreign, status: updatedWallet.status, created_at: updatedWallet.created_at, updated_at: updatedWallet.updated_at }, updatedWallet.id);
      } else {
        const newWalletId = `wallet-${Math.random().toString(36).substring(2, 9)}`;
        const initialAmount = Math.abs(tx.amount);
        const newWallet: Wallet = {
          id: newWalletId,
          name: tx.foreign_currency,
          foreign_currency: tx.foreign_currency,
          total_foreign_funded: tx.amount > 0 ? initialAmount : 0,
          remaining_foreign: tx.amount,
          status: "active",
          created_at: nowStr,
          updated_at: nowStr,
        };
        setWallets((prev) => [newWallet, ...prev]);
        upsertRow("wallets", { id: newWallet.id, name: newWallet.name, foreign_currency: newWallet.foreign_currency, total_foreign_funded: newWallet.total_foreign_funded, remaining_foreign: newWallet.remaining_foreign, status: newWallet.status, created_at: newWallet.created_at, updated_at: newWallet.updated_at }, newWallet.id);
        walletId = newWalletId;
      }
    }

    const newTx: Transaction = {
      ...tx,
      wallet_id: walletId,
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      time: timeStr,
      receipt_urls: tx.receipt_urls || [],
    };
    setTransactions((prev) => [newTx, ...prev]);
    upsertRow("transactions", { id: newTx.id, merchant: newTx.merchant, category_id: newTx.categoryId, amount: newTx.amount, date: newTx.date, time: newTx.time, wallet_id: newTx.wallet_id || null, foreign_amount: newTx.foreign_amount || null, foreign_currency: newTx.foreign_currency || null, receipt_urls: newTx.receipt_urls || [] }, newTx.id);
    return newTx.id;
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx && tx.wallet_id) {
      const nowStr = new Date().toISOString();
      if (tx.categoryId === "travel") {
        setWallets((prev) =>
          prev.map((w) => {
            if (w.id !== tx.wallet_id) return w;
            const updated = { ...w, total_foreign_funded: Math.max(0, w.total_foreign_funded - (tx.foreign_amount || 0)), remaining_foreign: w.remaining_foreign - (tx.foreign_amount || 0), updated_at: nowStr };
            upsertRow("wallets", { id: updated.id, name: updated.name, foreign_currency: updated.foreign_currency, total_foreign_funded: updated.total_foreign_funded, remaining_foreign: updated.remaining_foreign, status: updated.status, created_at: updated.created_at, updated_at: updated.updated_at }, updated.id);
            return updated;
          })
        );
      } else {
        setWallets((prev) =>
          prev.map((w) => {
            if (w.id !== tx.wallet_id) return w;
            const amountDiff = tx.amount;
            const updated = { ...w, total_foreign_funded: amountDiff > 0 ? Math.max(0, w.total_foreign_funded - amountDiff) : w.total_foreign_funded, remaining_foreign: w.remaining_foreign - amountDiff, updated_at: nowStr };
            upsertRow("wallets", { id: updated.id, name: updated.name, foreign_currency: updated.foreign_currency, total_foreign_funded: updated.total_foreign_funded, remaining_foreign: updated.remaining_foreign, status: updated.status, created_at: updated.created_at, updated_at: updated.updated_at }, updated.id);
            return updated;
          })
        );
      }
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    supabase.from("transactions").delete().eq("id", id).then((res) => {
      if (res.error) throw res.error;
    }).catch(() => {
      syncQueue.enqueue("transactions", "delete", null, id);
    });
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
    upsertRow("wallets", { id: newWallet.id, name: newWallet.name, foreign_currency: newWallet.foreign_currency, total_foreign_funded: newWallet.total_foreign_funded, remaining_foreign: newWallet.remaining_foreign, status: newWallet.status, created_at: newWallet.created_at, updated_at: newWallet.updated_at }, newWallet.id);

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
    const nowStr = new Date().toISOString();
    const updatedWallet = { ...wallet, total_foreign_funded: wallet.total_foreign_funded + foreignAmount, remaining_foreign: wallet.remaining_foreign + foreignAmount, updated_at: nowStr };
    setWallets((prev) => prev.map((w) => w.id !== walletId ? w : updatedWallet));
    upsertRow("wallets", { id: updatedWallet.id, name: updatedWallet.name, foreign_currency: updatedWallet.foreign_currency, total_foreign_funded: updatedWallet.total_foreign_funded, remaining_foreign: updatedWallet.remaining_foreign, status: updatedWallet.status, created_at: updatedWallet.created_at, updated_at: updatedWallet.updated_at }, updatedWallet.id);

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
    const nowStr = new Date().toISOString();
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, status: "archived" as const, updated_at: nowStr };
        upsertRow("wallets", { id: updated.id, name: updated.name, foreign_currency: updated.foreign_currency, total_foreign_funded: updated.total_foreign_funded, remaining_foreign: updated.remaining_foreign, status: updated.status, created_at: updated.created_at, updated_at: updated.updated_at }, updated.id);
        return updated;
      })
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
    supabase.from("wallet_spends").delete().eq("wallet_id", id).then((res) => {
      if (res.error) throw res.error;
      supabase.from("wallets").delete().eq("id", id).then((res2) => {
        if (res2.error) throw res2.error;
      }).catch(() => syncQueue.enqueue("wallets", "delete", null, id));
    }).catch(() => {
      syncQueue.enqueue("wallet_spends", "delete", null, id);
      syncQueue.enqueue("wallets", "delete", null, id);
    });
  };

  const convertWallet = (sourceCurrency: string, targetCurrency: string, amount: number, rate: number) => {
    const activeSourceWallet = wallets.find(w => w.foreign_currency === sourceCurrency && w.status === "active");
    if (!activeSourceWallet) return;

    const targetAmount = amount * rate;
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const nowStr = new Date().toISOString();
    const dateStr = nowStr.split("T")[0];

    const updatedSource = { ...activeSourceWallet, remaining_foreign: activeSourceWallet.remaining_foreign - amount, updated_at: nowStr };
    setWallets((prev) => prev.map((w) => w.id === activeSourceWallet.id ? updatedSource : w));
    upsertRow("wallets", { id: updatedSource.id, name: updatedSource.name, foreign_currency: updatedSource.foreign_currency, total_foreign_funded: updatedSource.total_foreign_funded, remaining_foreign: updatedSource.remaining_foreign, status: updatedSource.status, created_at: updatedSource.created_at, updated_at: updatedSource.updated_at }, updatedSource.id);

    const expenseTx: Transaction = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      merchant: `Conversion to ${targetCurrency}`,
      categoryId: "other",
      amount: -amount,
      date: dateStr,
      time: timeStr,
      wallet_id: activeSourceWallet.id,
      foreign_amount: amount,
      foreign_currency: sourceCurrency,
    };

    let targetWalletId: string | undefined;
    const activeTargetWallet = wallets.find(w => w.foreign_currency === targetCurrency && w.status === "active");

    if (activeTargetWallet) {
      targetWalletId = activeTargetWallet.id;
      const updatedTarget = { ...activeTargetWallet, total_foreign_funded: activeTargetWallet.total_foreign_funded + targetAmount, remaining_foreign: activeTargetWallet.remaining_foreign + targetAmount, updated_at: nowStr };
      setWallets((prev) => prev.map((w) => w.id === activeTargetWallet.id ? updatedTarget : w));
      upsertRow("wallets", { id: updatedTarget.id, name: updatedTarget.name, foreign_currency: updatedTarget.foreign_currency, total_foreign_funded: updatedTarget.total_foreign_funded, remaining_foreign: updatedTarget.remaining_foreign, status: updatedTarget.status, created_at: updatedTarget.created_at, updated_at: updatedTarget.updated_at }, updatedTarget.id);
    } else {
      targetWalletId = `wallet-${Math.random().toString(36).substring(2, 9)}`;
      const newWallet: Wallet = { id: targetWalletId, name: targetCurrency, foreign_currency: targetCurrency, total_foreign_funded: targetAmount, remaining_foreign: targetAmount, status: "active", created_at: nowStr, updated_at: nowStr };
      setWallets((prev) => [newWallet, ...prev]);
      upsertRow("wallets", { id: newWallet.id, name: newWallet.name, foreign_currency: newWallet.foreign_currency, total_foreign_funded: newWallet.total_foreign_funded, remaining_foreign: newWallet.remaining_foreign, status: newWallet.status, created_at: newWallet.created_at, updated_at: newWallet.updated_at }, newWallet.id);
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
    upsertRow("transactions", { id: expenseTx.id, merchant: expenseTx.merchant, category_id: expenseTx.categoryId, amount: expenseTx.amount, date: expenseTx.date, time: expenseTx.time, wallet_id: expenseTx.wallet_id || null, foreign_amount: expenseTx.foreign_amount || null, foreign_currency: expenseTx.foreign_currency || null }, expenseTx.id);
    upsertRow("transactions", { id: incomeTx.id, merchant: incomeTx.merchant, category_id: incomeTx.categoryId, amount: incomeTx.amount, date: incomeTx.date, time: incomeTx.time, wallet_id: incomeTx.wallet_id || null, foreign_amount: incomeTx.foreign_amount || null, foreign_currency: incomeTx.foreign_currency || null }, incomeTx.id);
  };

  const logSpend = (walletId: string, foreignAmount: number, note: string, categoryTag: string, date: string) => {
    const newSpendId = `spend-${Math.random().toString(36).substring(2, 9)}`;
    const nowStr = new Date().toISOString();
    const newSpend: WalletSpend = { id: newSpendId, wallet_id: walletId, foreign_amount: foreignAmount, note, category_tag: categoryTag, date };
    setWalletSpends((prev) => [newSpend, ...prev]);
    upsertRow("wallet_spends", { id: newSpend.id, wallet_id: newSpend.wallet_id, foreign_amount: newSpend.foreign_amount, note: newSpend.note, category_tag: newSpend.category_tag || null, date: newSpend.date }, newSpend.id);

    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== walletId) return w;
        const updated = { ...w, remaining_foreign: w.remaining_foreign - foreignAmount, updated_at: nowStr };
        upsertRow("wallets", { id: updated.id, name: updated.name, foreign_currency: updated.foreign_currency, total_foreign_funded: updated.total_foreign_funded, remaining_foreign: updated.remaining_foreign, status: updated.status, created_at: updated.created_at, updated_at: updated.updated_at }, updated.id);
        return updated;
      })
    );
  };

  const editSpend = (id: string, newForeignAmount: number, newNote: string, newCategoryTag: string, newDate: string) => {
    const spend = walletSpends.find((s) => s.id === id);
    if (!spend) return;
    const delta = newForeignAmount - spend.foreign_amount;
    const nowStr = new Date().toISOString();
    const updatedSpend = { ...spend, foreign_amount: newForeignAmount, note: newNote, category_tag: newCategoryTag, date: newDate };
    setWalletSpends((prev) => prev.map((s) => s.id === id ? updatedSpend : s));
    upsertRow("wallet_spends", { id: updatedSpend.id, wallet_id: updatedSpend.wallet_id, foreign_amount: updatedSpend.foreign_amount, note: updatedSpend.note, category_tag: updatedSpend.category_tag || null, date: updatedSpend.date }, updatedSpend.id);

    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== spend.wallet_id) return w;
        const updated = { ...w, remaining_foreign: w.remaining_foreign - delta, updated_at: nowStr };
        upsertRow("wallets", { id: updated.id, name: updated.name, foreign_currency: updated.foreign_currency, total_foreign_funded: updated.total_foreign_funded, remaining_foreign: updated.remaining_foreign, status: updated.status, created_at: updated.created_at, updated_at: updated.updated_at }, updated.id);
        return updated;
      })
    );
  };

  const deleteSpend = (id: string) => {
    const spend = walletSpends.find((s) => s.id === id);
    if (!spend) return;
    const nowStr = new Date().toISOString();
    setWalletSpends((prev) => prev.filter((s) => s.id !== id));
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== spend.wallet_id) return w;
        const updated = { ...w, remaining_foreign: w.remaining_foreign + spend.foreign_amount, updated_at: nowStr };
        upsertRow("wallets", { id: updated.id, name: updated.name, foreign_currency: updated.foreign_currency, total_foreign_funded: updated.total_foreign_funded, remaining_foreign: updated.remaining_foreign, status: updated.status, created_at: updated.created_at, updated_at: updated.updated_at }, updated.id);
        return updated;
      })
    );
    supabase.from("wallet_spends").delete().eq("id", id).then((res) => {
      if (res.error) throw res.error;
    }).catch(() => syncQueue.enqueue("wallet_spends", "delete", null, id));
  };

  const updateBudget = (categoryId: string, limit: number) => {
    setBudgetLimits((prev) => {
      const exists = prev.some((b) => b.categoryId === categoryId);
      const next = exists
        ? prev.map((b) => b.categoryId === categoryId ? { ...b, limit } : b)
        : [...prev, { categoryId, limit }];
      upsertRow("budget_limits", { category_id: categoryId, limit_amount: limit }, categoryId);
      return next;
    });
  };

  const importData = async (data: BackupPayload) => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid backup payload: Must be an object.");
    }

    const { transactions = [], wallets = [], walletSpends = [], budgetLimits = [] } = data;

    if (
      !Array.isArray(transactions) ||
      !Array.isArray(wallets) ||
      !Array.isArray(walletSpends) ||
      !Array.isArray(budgetLimits)
    ) {
      throw new Error("Invalid backup payload format: Data arrays are missing or malformed.");
    }

    // Validate payload entries
    for (const t of transactions) {
      if (!t.id || typeof t.merchant !== "string" || typeof t.amount !== "number" || !t.date) {
        throw new Error("Invalid transaction entry in backup payload.");
      }
    }
    for (const w of wallets) {
      if (!w.id || typeof w.name !== "string" || typeof w.foreign_currency !== "string") {
        throw new Error("Invalid wallet entry in backup payload.");
      }
    }
    for (const s of walletSpends) {
      if (!s.id || !s.wallet_id || typeof s.foreign_amount !== "number" || !s.date) {
        throw new Error("Invalid wallet spend entry in backup payload.");
      }
    }
    for (const b of budgetLimits) {
      if (!b.categoryId || typeof b.limit !== "number") {
        throw new Error("Invalid budget limit entry in backup payload.");
      }
    }

    // Bulk upsert into Supabase tables (wallets first for FK dependencies)
    if (wallets.length > 0) {
      const walletRows = wallets.map((w) => ({
        id: w.id,
        name: w.name,
        foreign_currency: w.foreign_currency,
        total_foreign_funded: w.total_foreign_funded,
        remaining_foreign: w.remaining_foreign,
        status: w.status,
        created_at: w.created_at || new Date().toISOString(),
        updated_at: w.updated_at || new Date().toISOString(),
      }));
      const { error } = await supabase.from("wallets").upsert(walletRows);
      if (error) console.warn("Supabase wallets import warning:", error);
    }

    if (transactions.length > 0) {
      const txRows = transactions.map((t) => ({
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
      const { error } = await supabase.from("transactions").upsert(txRows);
      if (error) console.warn("Supabase transactions import warning:", error);
    }

    if (walletSpends.length > 0) {
      const spendRows = walletSpends.map((s) => ({
        id: s.id,
        wallet_id: s.wallet_id,
        foreign_amount: s.foreign_amount,
        note: s.note || "",
        category_tag: s.category_tag || null,
        date: s.date,
      }));
      const { error } = await supabase.from("wallet_spends").upsert(spendRows);
      if (error) console.warn("Supabase wallet_spends import warning:", error);
    }

    if (budgetLimits.length > 0) {
      const budgetRows = budgetLimits.map((b) => ({
        category_id: b.categoryId,
        limit_amount: b.limit,
      }));
      const { error } = await supabase.from("budget_limits").upsert(budgetRows);
      if (error) console.warn("Supabase budget_limits import warning:", error);
    }

    // Update local state by merging upserted items
    if (transactions.length > 0) {
      setTransactions((prev) => {
        const map = new Map(prev.map((t) => [t.id, t]));
        for (const t of transactions) map.set(t.id, t);
        return Array.from(map.values()).sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
      });
    }

    if (wallets.length > 0) {
      setWallets((prev) => {
        const map = new Map(prev.map((w) => [w.id, w]));
        for (const w of wallets) map.set(w.id, w);
        return Array.from(map.values());
      });
    }

    if (walletSpends.length > 0) {
      setWalletSpends((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        for (const s of walletSpends) map.set(s.id, s);
        return Array.from(map.values());
      });
    }

    if (budgetLimits.length > 0) {
      setBudgetLimits((prev) => {
        const map = new Map(prev.map((b) => [b.categoryId, b]));
        for (const b of budgetLimits) map.set(b.categoryId, b);
        return Array.from(map.values());
      });
    }
  };

  const resetApp = async () => {
    // 1. Wipe Supabase — wallet_spends first (FK), then wallets, then rest
    await supabase.from("wallet_spends").delete().neq("id", "__never__");
    await supabase.from("wallets").delete().neq("id", "__never__");
    await supabase.from("transactions").delete().neq("id", "__never__");
    await supabase.from("budget_limits").delete().neq("category_id", "__never__");

    // 2. Wipe every slplayer-* key from localStorage
    Object.keys(localStorage)
      .filter((k) => k.startsWith("slplayer-"))
      .forEach((k) => localStorage.removeItem(k));

    // 3. Reset React state to factory defaults
    setTransactions([]);
    setWallets([]);
    setWalletSpends([]);
    setBudgetLimits(DEFAULT_BUDGET_LIMITS);
    setCustomRates({});

    // 4. Force a hard reload to kill websocket listeners and ensure clean slate
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
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

  const uploadReceipts = async (transactionId: string, blobs: Blob[]): Promise<string[]> => {
    if (!blobs || blobs.length === 0) return [];
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id || "anonymous";
      const uploadedUrls: string[] = [];

      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i];
        const filePath = `${userId}/${transactionId}/${i}_${Date.now()}.jpg`;

        const { error: uploadErr } = await supabase.storage
          .from("receipts")
          .upload(filePath, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadErr) {
          console.error("Error uploading receipt:", uploadErr);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      if (uploadedUrls.length === 0) return [];

      let updatedTxUrls: string[] = [];

      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== transactionId) return t;
          const currentUrls = t.receipt_urls || [];
          updatedTxUrls = [...currentUrls, ...uploadedUrls];
          return { ...t, receipt_urls: updatedTxUrls };
        })
      );

      await supabase
        .from("transactions")
        .update({ receipt_urls: updatedTxUrls })
        .eq("id", transactionId);

      return uploadedUrls;
    } catch (err) {
      console.error("uploadReceipts failed:", err);
      return [];
    }
  };

  const deleteReceipt = async (transactionId: string, urlToDelete: string): Promise<void> => {
    try {
      let filePath = "";
      if (urlToDelete.includes("/receipts/")) {
        filePath = decodeURIComponent(urlToDelete.split("/receipts/")[1]);
      }

      if (filePath) {
        await supabase.storage.from("receipts").remove([filePath]);
      }

      let updatedUrls: string[] = [];

      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== transactionId) return t;
          const currentUrls = t.receipt_urls || [];
          updatedUrls = currentUrls.filter((u) => u !== urlToDelete);
          return { ...t, receipt_urls: updatedUrls };
        })
      );

      await supabase
        .from("transactions")
        .update({ receipt_urls: updatedUrls })
        .eq("id", transactionId);
    } catch (err) {
      console.error("deleteReceipt failed:", err);
    }
  };

  const getStorageUsage = async (): Promise<number> => {
    try {
      const listAllFiles = async (folderPath: string = ""): Promise<number> => {
        let totalBytes = 0;
        const { data, error } = await supabase.storage.from("receipts").list(folderPath, {
          limit: 1000,
        });

        if (error || !data) return 0;

        for (const item of data) {
          if (!item.id || item.id === null || (!item.metadata && !item.size)) {
            const subPath = folderPath ? `${folderPath}/${item.name}` : item.name;
            totalBytes += await listAllFiles(subPath);
          } else {
            const size = item.metadata?.size || item.size || 0;
            totalBytes += size;
          }
        }
        return totalBytes;
      };

      const totalBytes = await listAllFiles("");
      const mb = totalBytes / (1024 * 1024);
      return Math.round(mb * 100) / 100;
    } catch (err) {
      console.error("getStorageUsage failed:", err);
      return 0;
    }
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
        budgetLimits,
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
        importData,
        uploadReceipts,
        deleteReceipt,
        getStorageUsage,
        setPrivacyMode,
        setAccentColor,
        setCurrentMonth,
        setQuickAddOpen,
        setConverterOpen,
        resetApp,
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
