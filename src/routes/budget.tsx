import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/expense/TopBar";
import {
  Card,
  CategoryIcon,
  ProgressBar,
} from "@/components/expense/primitives";
import { categoryById } from "@/lib/types";
import { Plus } from "lucide-react";
import { useExpense } from "@/lib/store";
import { isSameMonth, parseISO, format } from "date-fns";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "SLPlayer — Budget" },
      { name: "description", content: "Track your monthly category budgets." },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const { transactions, budgets, bills, currentMonth, privacyMode } =
    useExpense();

  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);

  // Calculate Safe to spend dynamically:
  const isSameMonthSafe = (dateStr: string, currentMonth: Date) => {
    try {
      const txDate = parseISO(dateStr);
      return isSameMonth(txDate, currentMonth);
    } catch {
      return false;
    }
  };
  const currentMonthTxs = transactions.filter((t) =>
    isSameMonthSafe(t.date, currentMonth),
  );
  const income = currentMonthTxs
    .filter((t) => t.categoryId === "income" && (!t.foreign_currency || t.foreign_currency === "CAD"))
    .reduce((s, t) => s + t.amount, 0);
  const expenses = currentMonthTxs
    .filter((t) => t.categoryId !== "income" && (!t.foreign_currency || t.foreign_currency === "CAD"))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const netSavings = income - expenses;
  const remainingBudget = totalLimit - totalSpent;

  const upcomingBills = bills
    .filter((b) => b.dueDay >= currentMonth.getDate())
    .reduce((sum, b) => sum + b.amount, 0);

  const SAFE_TO_SPEND = netSavings - remainingBudget - upcomingBills;

  return (
    <div>
      <TopBar />
      <div className="mb-4">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {format(currentMonth, "MMMM yyyy")}
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
          Spent{" "}
          <span className="font-mono">
            {privacyMode
              ? "$•••"
              : `$${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>{" "}
          of{" "}
          <span className="font-mono">
            {privacyMode
              ? "$•••"
              : `$${totalLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
        </p>
      </div>

      {/* Safe to spend banner */}
      <div
        className="rounded-2xl p-3 mb-6 relative overflow-hidden"
        style={{
          backgroundColor: "var(--accent-muted)",
          borderLeft: "3px solid var(--accent-violet)",
        }}
      >
        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Safe to spend
        </div>
        <div
          className="font-mono font-medium"
          style={{ fontSize: 22, color: "#fff", letterSpacing: "-0.02em" }}
        >
          {privacyMode ? "$•••" : `$${SAFE_TO_SPEND.toFixed(2)}`}
        </div>
      </div>

      <div className="space-y-3">
        {budgets.map((b, i) => {
          const cat = categoryById(b.categoryId);
          const pct = b.limit > 0 ? b.spent / b.limit : 0;
          const over = b.spent > b.limit;
          const remaining = b.limit - b.spent;
          const status = over
            ? "var(--red)"
            : pct >= 0.8
              ? "var(--amber)"
              : "var(--green)";
          return (
            <Card
              key={b.categoryId}
              className="p-4 opacity-0"
              style={{
                animation: `fade-in-up 320ms cubic-bezier(0.16,1,0.3,1) ${i * 40}ms forwards`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <CategoryIcon emoji={cat.emoji} color={cat.color} />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[14px] font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {cat.name}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Used{" "}
                    <span
                      className="font-mono"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {privacyMode ? "$•••" : `$${b.spent.toFixed(2)}`}
                    </span>{" "}
                    /{" "}
                    <span className="font-mono">
                      {privacyMode ? "$•••" : `$${b.limit.toFixed(2)}`}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="text-[11px]"
                    style={{ color: over ? "var(--red)" : "var(--text-muted)" }}
                  >
                    {over ? "Over by" : "Remaining"}
                  </div>
                  <div
                    className="font-mono font-medium text-[14px]"
                    style={{
                      color: over ? "var(--red)" : "var(--text-primary)",
                    }}
                  >
                    {privacyMode
                      ? "$•••"
                      : `$${Math.abs(remaining).toFixed(2)}`}
                  </div>
                </div>
              </div>
              <ProgressBar value={pct} color={status} />
            </Card>
          );
        })}
      </div>

      <button
        className="mt-6 mb-4 w-full flex items-center justify-center gap-2 rounded-2xl active:scale-[0.98] transition-transform border-dashed border-2 py-3 focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--accent-violet)",
          backgroundColor: "transparent",
        }}
      >
        <Plus size={16} /> Add budget
      </button>
    </div>
  );
}
