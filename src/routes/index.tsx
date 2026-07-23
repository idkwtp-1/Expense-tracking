import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar, MonthSelector } from "@/components/expense/TopBar";
import { TransactionList } from "@/components/expense/TransactionItem";
import { TransactionDetailSheet } from "@/components/transaction/TransactionDetailSheet";
import { Transaction } from "@/lib/types";
import { ProgressBar, Amount } from "@/components/expense/primitives";
import { useExpense } from "@/lib/store";
import { useSheets } from "@/components/expense/MobileShell";
import { isSameMonth, parseISO, format } from "date-fns";
import { ComponentType } from "react";
import CountUpModule from "react-countup";
import {
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Zap,
  Calendar,
  LayoutGrid,
  ArrowUpRight,
} from "lucide-react";

const CountUp =
  (
    CountUpModule as unknown as {
      default: ComponentType<{
        end: number;
        duration?: number;
        decimals?: number;
        separator?: string;
      }>;
    }
  ).default ?? CountUpModule;

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "SLPlayer — Dashboard" },
        { name: "description", content: "Personal expense tracker dashboard." },
      ],
    }),
    component: Dashboard,
  }
);

function Dashboard() {
  const { transactions, budgets, bills, currentMonth, privacyMode } =
    useExpense();
  const { openQuickAdd, openConverter } = useSheets();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const isSameMonthSafe = (dateStr: string, month: Date) => {
    try {
      return isSameMonth(parseISO(dateStr), month);
    } catch {
      return false;
    }
  };

  const currentMonthTxs = transactions.filter((t) =>
    isSameMonthSafe(t.date, currentMonth),
  );

  const NET_INCOME = currentMonthTxs
    .filter((t) => t.categoryId === "income" && (!t.foreign_currency || t.foreign_currency === "CAD"))
    .reduce((sum, t) => sum + t.amount, 0);

  const NET_EXPENSES = currentMonthTxs
    .filter((t) => t.categoryId !== "income" && (!t.foreign_currency || t.foreign_currency === "CAD"))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const NET_BALANCE = NET_INCOME - NET_EXPENSES;

  const totalLimits = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remainingBudget = totalLimits - totalSpent;

  const upcomingBills = bills
    .filter((b) => b.dueDay >= currentMonth.getDate())
    .reduce((sum, b) => sum + b.amount, 0);

  const SAFE_TO_SPEND = NET_BALANCE - remainingBudget - upcomingBills;

  const budgetUsed = totalLimits > 0 ? totalSpent / totalLimits : 0;
  const recent = currentMonthTxs.slice(0, 5);
  const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length;
  const billsDueCount = bills.filter(
    (b) => b.dueDay >= currentMonth.getDate(),
  ).length;

  const isEmpty = currentMonthTxs.length === 0;
  const monthLabel = format(currentMonth, "MMMM");

  return (
    <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
      <TopBar />
      <MonthSelector />


      {/* ── Net Balance Card ────────────────── */}
      <div
        className="rounded-2xl p-6 mb-5 relative overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(40px) saturate(220%)",
          WebkitBackdropFilter: "blur(40px) saturate(220%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Subtle interior glare light */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)",
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: "rgba(255, 255, 255, 0.45)" }}
            >
              Net Balance · {monthLabel}
            </p>
            <div
              className="font-mono font-bold"
              style={{
                fontSize: 44,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "#FFFFFF",
              }}
            >
              {privacyMode ? (
                "$•••••"
              ) : isEmpty ? (
                <span className="text-[26px] font-sans font-medium text-white/50">
                  No data
                </span>
              ) : (
                <>
                  {NET_BALANCE >= 0 ? "+" : "−"}$
                  <CountUp
                    end={Math.abs(NET_BALANCE)}
                    duration={1.2}
                    decimals={2}
                    separator=","
                  />
                </>
              )}
            </div>

            {/* Income / Expense Stats */}
            <div className="flex gap-6 mt-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-full grid place-items-center"
                  style={{ backgroundColor: "rgba(48,209,88,0.12)" }}
                >
                  <TrendingUp size={11} color="var(--green)" />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Income</p>
                  <Amount value={NET_INCOME} size={13} sign color="var(--green)" />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-full grid place-items-center"
                  style={{ backgroundColor: "rgba(255,69,58,0.12)" }}
                >
                  <TrendingDown size={11} color="var(--red)" />
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Expenses</p>
                  <Amount value={-NET_EXPENSES} size={13} sign color="var(--red)" />
                </div>
              </div>
            </div>
          </div>

          {/* Safe to Spend Box */}
          <div
            className="rounded-xl p-4 flex flex-col justify-between"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: "rgba(255, 255, 255, 0.45)" }}
              >
                Safe to Spend
              </p>
              <div
                className="font-mono font-bold"
                style={{
                  fontSize: 24,
                  letterSpacing: "-0.02em",
                  color: isEmpty ? "rgba(255,255,255,0.4)" : "#ffffff",
                }}
              >
                {privacyMode ? "$•••" : isEmpty ? "—" : (
                  <>
                    {SAFE_TO_SPEND < 0 ? "−" : ""}$
                    <CountUp
                      end={Math.abs(SAFE_TO_SPEND)}
                      duration={1.2}
                      decimals={2}
                      separator=","
                    />
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] mt-4" style={{ color: "var(--text-muted)" }}>
              After bills &amp; budgets
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat Pills Row ──────────────────────────────── */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
        {currentMonthTxs.length > 0 && (
          <StatBadge icon={<LayoutGrid size={11} />} color="rgba(255,255,255,0.7)">
            {currentMonthTxs.length} transactions
          </StatBadge>
        )}
        <StatBadge icon={<span style={{ color: "var(--red)", fontSize: 8 }}>●</span>} color="var(--red)">
          {overBudgetCount} over budget
        </StatBadge>
        <StatBadge icon={<Calendar size={11} />} color="var(--amber)">
          {billsDueCount} bills due
        </StatBadge>
      </div>

      {/* ── Layout Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Budget Health */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[12px] font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Budget Health
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {Math.round(budgetUsed * 100)}% of limits used
                  </p>
                </div>
                <div
                  className="text-[12px] font-mono font-medium px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  ${totalSpent.toFixed(0)} / ${totalLimits.toFixed(0)}
                </div>
              </div>
              <ProgressBar value={budgetUsed} height={5} />

              {/* Category Mini progress */}
              {totalSpent > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {budgets
                    .filter((b) => b.spent > 0)
                    .slice(0, 6)
                    .map((b) => {
                      const pct = b.limit > 0 ? b.spent / b.limit : 0;
                      return (
                        <div key={b.categoryId}
                          className="rounded-xl p-2.5"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.015)",
                            border: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <p className="text-[10px] font-medium capitalize mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {b.categoryId}
                          </p>
                          <ProgressBar value={pct} height={3} />
                          <p className="text-[10px] font-mono mt-1.5" style={{ color: "var(--text-secondary)" }}>
                            ${b.spent.toFixed(0)} / ${b.limit}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}

              {isEmpty && (
                <p className="text-center text-[11px] mt-4 py-1" style={{ color: "var(--text-muted)" }}>
                  Add expenses to track budget health
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Actions & Bills */}
        <div className="flex flex-col gap-4">
          <GlassCard>
            <div className="p-4 flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Quick Actions
              </p>
              <button
                type="button"
                onClick={openQuickAdd}
                aria-label="Add transaction"
                className="w-full flex items-center justify-center gap-2 rounded-xl font-medium text-[13px] text-white py-2.5 transition-all duration-300 active:scale-[0.985]"
                style={{
                  background: "linear-gradient(180deg, #007AFF 0%, #0066D6 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 4px 15px rgba(10, 132, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                }}
              >
                <Plus size={15} />
                <span>Add transaction</span>
              </button>
              <button
                type="button"
                onClick={openConverter}
                aria-label="Convert currency"
                className="w-full flex items-center justify-center gap-2 rounded-xl font-medium text-[13px] py-2.5 transition-all duration-300 active:scale-[0.985] border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  color: "rgba(255, 255, 255, 0.75)",
                }}
              >
                <ArrowLeftRight size={14} />
                <span>Convert currency</span>
              </button>
            </div>
          </GlassCard>

          {/* Bills box */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <p className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                Bills
              </p>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                This month
              </span>
            </div>
            <GlassCard>
              <div className="py-1">
                {bills.length === 0 ? (
                  <div className="p-5 text-center">
                    <Zap size={16} style={{ color: "var(--text-muted)", margin: "0 auto 6px" }} />
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      No upcoming bills
                    </p>
                  </div>
                ) : (
                  bills.map((b, i) => {
                    const daysAway = b.dueDay - currentMonth.getDate();
                    const dotColor =
                      daysAway < 3
                        ? "var(--red)"
                        : daysAway < 7
                        ? "var(--amber)"
                        : "var(--text-muted)";
                    return (
                      <div key={b.id}>
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: dotColor }}
                            />
                            <span className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>
                              {b.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <Amount value={b.amount} size={13} color="var(--text-primary)" />
                            <p className="text-[10px] mt-0.5" style={{ color: dotColor }}>
                              Due {b.dueLabel}
                            </p>
                          </div>
                        </div>
                        {i < bills.length - 1 && (
                          <div className="mx-4 h-px" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Recent Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <p className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              Recent
            </p>
            <Link
              to="/transactions"
              className="flex items-center gap-0.5 text-[11px] font-medium transition-colors"
              style={{ color: "var(--accent-violet)" }}
            >
              See all <ArrowUpRight size={12} />
            </Link>
          </div>
          <GlassCard>
            {recent.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full grid place-items-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Plus size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                    No recent transactions.
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Add a transaction to get started
                  </p>
                </div>
                <button
                  onClick={openQuickAdd}
                  className="mt-1 px-4 py-1.5 rounded-xl text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  Add transaction
                </button>
              </div>
            ) : (
              <div className="px-3">
                <TransactionList
                  items={recent}
                  onItemClick={(t) => setSelectedTx(t)}
                  onCameraClick={(t) => setSelectedTx(t)}
                />
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <TransactionDetailSheet
        transaction={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

/* ── Base Glass Card helper ──────────────────────── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(35px) saturate(210%)",
        WebkitBackdropFilter: "blur(35px) saturate(210%)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      }}
    >
      {children}
    </div>
  );
}

function StatBadge({
  children,
  icon,
  color,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.035)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        color: color ?? "rgba(255, 255, 255, 0.65)",
      }}
    >
      {icon && <span style={{ color }}>{icon}</span>}
      {children}
    </div>
  );
}
