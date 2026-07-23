import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { TopBar } from "@/components/expense/TopBar";
import { Card, Amount } from "@/components/expense/primitives";
import { TransactionItem } from "@/components/expense/TransactionItem";
import { TransactionDetailSheet } from "@/components/transaction/TransactionDetailSheet";
import { categoryById, Transaction } from "@/lib/types";
import { useExpense } from "@/lib/store";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "SLPlayer — Transactions" },
      { name: "description", content: "Browse all your transactions." },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { transactions, currentMonth } = useExpense();
  const todayStr = useMemo(
    () => currentMonth.toISOString().split("T")[0],
    [currentMonth],
  );
  const [selected, setSelected] = useState(todayStr);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const DAYS = useMemo(() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentMonth);
      d.setDate(currentMonth.getDate() - i);
      const dow = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const key = d.toISOString().split("T")[0];
      list.push({
        dow,
        d: dayNum,
        key,
        today: i === 0,
      });
    }
    return list;
  }, [currentMonth]);

  const filtered = transactions.filter((t) =>
    t.merchant.toLowerCase().includes(query.toLowerCase()),
  );

  // group by date
  const groups = filtered.reduce<Record<string, typeof transactions>>(
    (acc, tx) => {
      (acc[tx.date] ||= []).push(tx);
      return acc;
    },
    {},
  );
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const dateLabel = (d: string) => {
    const yesterday = new Date(currentMonth);
    yesterday.setDate(currentMonth.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (d === todayStr)
      return `Today, ${currentMonth.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    if (d === yesterdayStr)
      return `Yesterday, ${yesterday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    try {
      const [year, month, day] = d.split("-").map(Number);
      const dt = new Date(year, month - 1, day);
      return dt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div>
      <TopBar />
      <h1
        className="text-xl font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Transactions
      </h1>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 h-11 rounded-2xl mb-4"
        style={{
          backgroundColor: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <Search size={16} style={{ color: "var(--text-muted)" }} />
        <input
          disabled={!mounted}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions..."
          className="bg-transparent outline-none w-full text-sm disabled:opacity-50"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Calendar strip */}
      <div className="flex justify-between mb-5 px-0.5">
        {DAYS.map((d) => {
          const has = transactions.some((t) => t.date === d.key);
          const cat = transactions.find((t) => t.date === d.key);
          const dotColor = cat
            ? categoryById(cat.categoryId).color
            : "transparent";
          const isSelected = selected === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setSelected(d.key)}
              className="flex flex-col items-center gap-1.5 active:scale-[0.94] transition-transform"
              style={{ width: 36 }}
            >
              <div
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {d.dow}
              </div>
              <div
                className="grid place-items-center rounded-full text-[14px] font-semibold"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: d.today
                    ? "var(--accent-violet)"
                    : "transparent",
                  color: d.today ? "#fff" : "var(--text-primary)",
                }}
              >
                {d.d}
              </div>
              <div className="h-1.5 flex items-center">
                {has ? (
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  height: 2,
                  width: 16,
                  backgroundColor: isSelected
                    ? "var(--accent-violet)"
                    : "transparent",
                  borderRadius: 999,
                  transition: "background-color 200ms ease",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Grouped list */}
      <div className="space-y-5">
        {dates.length === 0 ? (
          <div
            className="p-8 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No transactions found.
          </div>
        ) : (
          dates.map((d) => {
            const items = groups[d];
            const total = items.reduce((sum, t) => sum + t.amount, 0);
            return (
              <div key={d}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div
                    className="text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {dateLabel(d)}
                  </div>
                  <Amount
                    value={total}
                    sign
                    size={13}
                    color="var(--text-muted)"
                  />
                </div>
                <Card className="px-3">
                  {items.map((tx, i) => (
                    <div key={tx.id}>
                      <TransactionItem
                        tx={tx}
                        index={i}
                        onClick={(t) => setSelectedTx(t)}
                        onCameraClick={(t) => setSelectedTx(t)}
                      />
                      {i < items.length - 1 && (
                        <div
                          className="ml-12 h-px"
                          style={{ backgroundColor: "var(--border-subtle)" }}
                        />
                      )}
                    </div>
                  ))}
                </Card>
              </div>
            );
          })
        )}
      </div>

      {/* Transaction detail drawer & receipts viewer */}
      <TransactionDetailSheet
        transaction={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
