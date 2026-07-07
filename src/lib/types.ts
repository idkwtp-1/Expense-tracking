export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", emoji: "🍔", color: "#F97316" },
  { id: "groceries", name: "Groceries", emoji: "🛒", color: "#22C55E" },
  { id: "income", name: "Income", emoji: "💰", color: "#22C55E" },
  { id: "coffee", name: "Coffee", emoji: "☕", color: "#A16207" },
  { id: "subs", name: "Subscriptions", emoji: "📺", color: "#EF4444" },
  { id: "transport", name: "Transport", emoji: "⛽", color: "#3B82F6" },
  { id: "health", name: "Health", emoji: "🏋️", color: "#14B8A6" },
  { id: "housing", name: "Housing", emoji: "🏠", color: "#7C3AED" },
  { id: "entertainment", name: "Entertainment", emoji: "🎮", color: "#EC4899" },
  { id: "travel", name: "Exchange / Transfer", emoji: "🪙", color: "#0EA5E9" },
  { id: "other", name: "Other", emoji: "🏷️", color: "#6B7280" },
];

export const categoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

export type Transaction = {
  id: string;
  merchant: string;
  categoryId: string;
  amount: number;
  date: string;
  time: string;
  wallet_id?: string;
  foreign_amount?: number;
  foreign_currency?: string;
};

export type Budget = {
  categoryId: string;
  spent: number;
  limit: number;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  dueLabel: string;
};

export type Wallet = {
  id: string;
  name: string;
  foreign_currency: string;
  total_foreign_funded: number;
  remaining_foreign: number;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

export type WalletSpend = {
  id: string;
  wallet_id: string;
  foreign_amount: number;
  note: string;
  category_tag?: string; // emoji/label for display only
  date: string;
};

export const RATES: Record<string, number> = {
  CAD: 1,
  USD: 0.74,
  EUR: 0.68,
  KGS: 64.5,
  CNY: 5.32,
  TRY: 24.3,
  GBP: 0.58,
  JPY: 108.5,
};

export const CURRENCIES = Object.keys(RATES);

export const formatMoney = (n: number, opts?: { sign?: boolean }) => {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (opts?.sign) {
    if (n > 0) return `+$${abs}`;
    if (n < 0) return `−$${abs}`;
    return `$${abs}`;
  }
  return n < 0 ? `−$${abs}` : `$${abs}`;
};

export const formatMoneyShort = (n: number) => {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return n < 0 ? `−$${abs}` : `$${abs}`;
};
