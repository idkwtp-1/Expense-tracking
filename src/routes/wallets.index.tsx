import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { TopBar } from "@/components/expense/TopBar";
import { Card, ProgressBar } from "@/components/expense/primitives";
import { useExpense } from "@/lib/store";
import { isSameMonth, parseISO } from "date-fns";
import { Plus, Coins, ChevronDown, ChevronRight, Archive } from "lucide-react";


export const Route = createFileRoute("/wallets/")({
  head: () => ({
    meta: [
      { title: "SLPlayer — Wallets" },
      { name: "description", content: "Manage your multi-currency cash holdings." },
    ],
  }),
  component: WalletsPage,
});

function WalletsPage() {
  const { wallets, transactions, currentMonth, privacyMode } = useExpense();

  const [showArchived, setShowArchived] = useState(false);

  const activeWallets = useMemo(() => wallets.filter((w) => w.status === "active"), [wallets]);
  const archivedWallets = useMemo(() => wallets.filter((w) => w.status === "archived"), [wallets]);

  // CAD balance calculation
  const isSameMonthSafe = (dateStr: string, month: Date) => {
    try {
      return isSameMonth(parseISO(dateStr), month);
    } catch {
      return false;
    }
  };
  const currentMonthTxs = transactions.filter((t) => isSameMonthSafe(t.date, currentMonth));
  const income = currentMonthTxs
    .filter((t) => t.categoryId === "income" && (!t.foreign_currency || t.foreign_currency === "CAD"))
    .reduce((s, t) => s + t.amount, 0);
  const expenses = currentMonthTxs
    .filter((t) => t.categoryId !== "income" && (!t.foreign_currency || t.foreign_currency === "CAD"))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const netSavings = income - expenses;

  // Group active foreign currency holdings
  const foreignHoldings = useMemo(() => {
    return activeWallets.reduce<Record<string, number>>((acc, w) => {
      acc[w.foreign_currency] = (acc[w.foreign_currency] || 0) + w.remaining_foreign;
      return acc;
    }, {});
  }, [activeWallets]);

  const formatAmt = (amt: number) => {
    return amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
      <TopBar />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Wallets
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            Manage your multi-currency cash holdings.
          </p>
        </div>
      </div>

      {/* ── Foreign Cash Holdings ────────────────── */}
      <Card className="p-4 mb-6">
        <div className="text-[12px] mb-3 uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
          Cash Holdings Summary
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Base Currency CAD */}
          <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent-violet)]">
                🇨🇦 CAD
              </span>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Base</span>
            </div>
            <div className="font-mono font-medium text-[16px]" style={{ color: "var(--text-primary)" }}>
              {privacyMode ? "$•••" : `$${netSavings.toFixed(2)}`}
            </div>
          </div>

          {/* Active foreign currencies */}
          {Object.entries(foreignHoldings).map(([curr, amt]) => {
            let flag = "🏳️";
            if (curr === "USD") flag = "🇺🇸";
            else if (curr === "EUR") flag = "🇪🇺";
            else if (curr === "KGS") flag = "🇰🇬";
            else if (curr === "CNY") flag = "🇨🇳";
            else if (curr === "TRY") flag = "🇹🇷";
            else if (curr === "GBP") flag = "🇬🇧";
            else if (curr === "JPY") flag = "🇯🇵";

            return (
              <div key={curr} className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[var(--surface-raised)] text-[var(--text-secondary)]">
                    {flag} {curr}
                  </span>
                </div>
                <div className="font-mono font-medium text-[16px]" style={{ color: "var(--text-primary)" }}>
                  {privacyMode ? "•••" : formatAmt(amt)} {curr}
                </div>
              </div>
            );
          })}

          {Object.keys(foreignHoldings).length === 0 && (
            <div className="col-span-3 flex items-center justify-center text-xs text-[var(--text-muted)] py-2">
              No active foreign cash holdings.
            </div>
          )}
        </div>
      </Card>

      {/* ── Active Wallets ────────────────── */}
      <div className="space-y-4">
        {activeWallets.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-3xl" style={{ color: "var(--text-muted)" }}>
            <Coins className="mx-auto mb-2 opacity-50" size={32} />
            <div className="text-sm">No active wallets yet.</div>
            <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Add foreign currency income to create a wallet automatically.
            </div>
          </div>
        ) : (
          activeWallets.map((w) => {
            const isOverdrawn = w.remaining_foreign < 0;
            const pct = w.total_foreign_funded > 0 ? w.remaining_foreign / w.total_foreign_funded : 0;
            const progressVal = Math.min(Math.max(pct, 0), 1);
            const status = isOverdrawn
              ? "var(--red)"
              : pct >= 0.8
                ? "var(--green)"
                : pct >= 0.2
                  ? "var(--accent-violet)"
                  : "var(--amber)";

            return (
              <Link key={w.id} to="/wallets/$walletId" params={{ walletId: w.id }} className="block">
                <Card className="p-4 active:scale-[0.99] transition-transform cursor-pointer hover:bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="grid place-items-center rounded-xl"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: isOverdrawn ? "rgba(239,68,68,0.12)" : "var(--accent-muted)",
                        color: isOverdrawn ? "var(--red)" : "var(--accent-violet)",
                      }}
                    >
                      <Coins size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {w.name}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Remaining:{" "}
                        <span className="font-mono font-medium" style={{ color: isOverdrawn ? "var(--red)" : "var(--text-secondary)" }}>
                          {privacyMode ? "•••" : formatAmt(w.remaining_foreign)} {w.foreign_currency}
                        </span>
                        {" · "}
                        Funded:{" "}
                        <span className="font-mono">
                          {privacyMode ? "•••" : formatAmt(w.total_foreign_funded)} {w.foreign_currency}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isOverdrawn && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-[var(--red)] uppercase tracking-wide">
                          Overdrawn
                        </span>
                      )}
                      <ChevronRight size={16} className="ml-auto mt-1" style={{ color: "var(--text-muted)" }} />
                    </div>
                  </div>
                  <ProgressBar value={progressVal} color={status} />
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* ── Archived Wallets ────────────────── */}
      {archivedWallets.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold px-2 mb-3 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-violet rounded"
            style={{ color: "var(--text-muted)" }}
          >
            {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Archived Wallets ({archivedWallets.length})
          </button>

          {showArchived && (
            <div className="space-y-3">
              {archivedWallets.map((w) => (
                <Link key={w.id} to="/wallets/$walletId" params={{ walletId: w.id }} className="block">
                  <Card className="p-3 opacity-60 active:scale-[0.99] transition-transform cursor-pointer hover:bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Archive size={14} style={{ color: "var(--text-muted)" }} />
                        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                          {w.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        {privacyMode ? "•••" : formatAmt(w.remaining_foreign)} {w.foreign_currency}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
