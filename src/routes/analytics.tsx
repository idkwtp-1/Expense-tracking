import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { TopBar } from "@/components/expense/TopBar";
import { Card } from "@/components/expense/primitives";
import { useExpense } from "@/lib/store";
import { isSameMonth, parseISO, format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { CATEGORIES, categoryById, formatMoneyShort } from "@/lib/types";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "SLPlayer — Analytics" },
      { name: "description", content: "Insights and spending analytics." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { transactions, currentMonth, privacyMode } = useExpense();
  const [period, setPeriod] = useState<"Week" | "Month" | "Year">("Month");

  // Helper parsers and check functions
  const isSameMonthSafe = (dateStr: string, currentMonth: Date) => {
    try {
      const txDate = parseISO(dateStr);
      return isSameMonth(txDate, currentMonth);
    } catch {
      return false;
    }
  };

  const parseHour = (timeStr: string): number => {
    try {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return 12;
      let hour = parseInt(match[1]);
      const isPm = match[3] && match[3].toUpperCase() === "PM";
      const isAm = match[3] && match[3].toUpperCase() === "AM";
      if (isPm && hour < 12) hour += 12;
      if (isAm && hour === 12) hour = 0;
      return hour;
    } catch {
      return 12;
    }
  };

  // Selected date ranges based on period
  const startOfCurrentWeek = useMemo(() => startOfWeek(currentMonth, { weekStartsOn: 1 }), [currentMonth]);
  const endOfCurrentWeek = useMemo(() => endOfWeek(currentMonth, { weekStartsOn: 1 }), [currentMonth]);

  const daysOfWeek = useMemo(() => {
    return eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });
  }, [startOfCurrentWeek, endOfCurrentWeek]);

  // Summary Card Totals
  const { spent, earned, saved } = useMemo(() => {
    let list = [];
    if (period === "Week") {
      // entire current week
      list = transactions.filter((t) => {
        try {
          const d = parseISO(t.date);
          return d >= startOfCurrentWeek && d <= endOfCurrentWeek;
        } catch {
          return false;
        }
      });
    } else if (period === "Month") {
      // selected month
      list = transactions.filter((t) => isSameMonthSafe(t.date, currentMonth));
    } else {
      // current year
      list = transactions.filter((t) => {
        try {
          return parseISO(t.date).getFullYear() === currentMonth.getFullYear();
        } catch {
          return false;
        }
      });
    }

    const earn = list.filter((t) => t.categoryId === "income").reduce((s, t) => s + t.amount, 0);
    const spend = list.filter((t) => t.categoryId !== "income" && t.categoryId !== "travel").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { spent: spend, earned: earn, saved: earn - spend };
  }, [transactions, currentMonth, period, startOfCurrentWeek, endOfCurrentWeek]);

  // Donut chart (by category) - always scoped to current selected month for cleanliness
  const DONUT = useMemo(() => {
    const monthTxs = transactions.filter((t) => isSameMonthSafe(t.date, currentMonth));
    return CATEGORIES.filter((c) => c.id !== "income" && c.id !== "travel") // hide travel/exchange from categories donut (since it's a transfer)
      .map((c) => {
        const value = monthTxs
          .filter((t) => t.categoryId === c.id)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return {
          name: c.name,
          value,
          color: c.color,
        };
      })
      .filter((d) => d.value > 0);
  }, [transactions, currentMonth]);

  const DONUT_TOTAL = useMemo(() => {
    return DONUT.reduce((sum, d) => sum + d.value, 0);
  }, [DONUT]);

  // Main Bar Chart data
  const mainChartData = useMemo(() => {
    if (period === "Week") {
      return daysOfWeek.map((d) => {
        const dayStr = format(d, "yyyy-MM-dd");
        const dayTxs = transactions.filter((t) => t.date === dayStr);
        const inc = dayTxs.filter((t) => t.categoryId === "income").reduce((s, t) => s + t.amount, 0);
        const exp = dayTxs.filter((t) => t.categoryId !== "income" && t.categoryId !== "travel").reduce((s, t) => s + Math.abs(t.amount), 0);
        return {
          label: format(d, "EEE"), // Mon, Tue...
          income: inc,
          expenses: exp,
        };
      });
    }

    if (period === "Month") {
      const totalDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const weekRanges = [
        { label: "W1 (1-7)", start: 1, end: 7 },
        { label: "W2 (8-14)", start: 8, end: 14 },
        { label: "W3 (15-21)", start: 15, end: 21 },
        { label: "W4 (22-28)", start: 22, end: 28 },
      ];
      if (totalDays > 28) {
        weekRanges.push({ label: `W5 (29-${totalDays})`, start: 29, end: totalDays });
      }

      return weekRanges.map((wRange) => {
        const weekTxs = transactions.filter((t) => {
          try {
            const d = parseISO(t.date);
            if (d.getFullYear() !== currentMonth.getFullYear() || d.getMonth() !== currentMonth.getMonth()) return false;
            return d.getDate() >= wRange.start && d.getDate() <= wRange.end;
          } catch {
            return false;
          }
        });
        const inc = weekTxs.filter((t) => t.categoryId === "income").reduce((s, t) => s + t.amount, 0);
        const exp = weekTxs.filter((t) => t.categoryId !== "income" && t.categoryId !== "travel").reduce((s, t) => s + Math.abs(t.amount), 0);
        return {
          label: wRange.label,
          income: inc,
          expenses: exp,
        };
      });
    }

    // Year - 12 months
    const list = [];
    for (let m = 0; m < 12; m++) {
      const dt = new Date(currentMonth.getFullYear(), m, 1);
      const mTxs = transactions.filter((t) => {
        try {
          const d = parseISO(t.date);
          return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === m;
        } catch {
          return false;
        }
      });
      const inc = mTxs.filter((t) => t.categoryId === "income").reduce((s, t) => s + t.amount, 0);
      const exp = mTxs.filter((t) => t.categoryId !== "income" && t.categoryId !== "travel").reduce((s, t) => s + Math.abs(t.amount), 0);
      list.push({
        label: format(dt, "MMM"),
        income: inc,
        expenses: exp,
      });
    }
    return list;
  }, [transactions, currentMonth, period, daysOfWeek]);

  // Secondary line chart data: Daily cumulative line or cash flow line
  const secondaryChartData = useMemo(() => {
    if (period === "Week") {
      const dayStr = format(currentMonth, "yyyy-MM-dd");
      const dayExpenses = transactions.filter((t) => t.date === dayStr && t.categoryId !== "income" && t.categoryId !== "travel");

      const cumulativePoints = [];
      let accumulated = 0;
      for (let h = 0; h < 24; h++) {
        const hourLabel = h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
        const hourCost = dayExpenses
          .filter((t) => parseHour(t.time) === h)
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        accumulated += hourCost;
        cumulativePoints.push({
          label: hourLabel,
          amount: accumulated,
        });
      }
      return cumulativePoints;
    }

    // Cash flow trends - maps to same list as main bar chart data
    return mainChartData.map((d) => ({
      label: d.label,
      income: d.income,
      expenses: d.expenses,
    }));
  }, [transactions, currentMonth, period, mainChartData]);

  // Top Merchants list - dynamically filtered by period
  const TOP_MERCHANTS = useMemo(() => {
    let list = [];
    if (period === "Week") {
      list = transactions.filter((t) => {
        try {
          const d = parseISO(t.date);
          return d >= startOfCurrentWeek && d <= endOfCurrentWeek;
        } catch {
          return false;
        }
      });
    } else if (period === "Month") {
      list = transactions.filter((t) => isSameMonthSafe(t.date, currentMonth));
    } else {
      list = transactions.filter((t) => {
        try {
          return parseISO(t.date).getFullYear() === currentMonth.getFullYear();
        } catch {
          return false;
        }
      });
    }

    const merchantMap: Record<string, number> = {};
    list
      .filter((t) => t.categoryId !== "income" && t.categoryId !== "travel") // ignore travel and income
      .forEach((t) => {
        merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + Math.abs(t.amount);
      });

    return Object.entries(merchantMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, currentMonth, period, startOfCurrentWeek, endOfCurrentWeek]);

  const maxMerchant = TOP_MERCHANTS.length > 0 ? Math.max(...TOP_MERCHANTS.map((m) => m.amount)) : 1;

  return (
    <div style={{ animation: "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
      <TopBar />
      <h1 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Analytics
      </h1>

      {/* Period switcher */}
      <div
        className="relative flex p-1 rounded-full mb-5"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {(["Week", "Month", "Year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 h-9 rounded-full text-xs font-semibold transition-all active:scale-[0.96] cursor-pointer"
            style={{
              backgroundColor: period === p ? "var(--accent-violet)" : "transparent",
              color: period === p ? "#fff" : "var(--text-secondary)",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Summary row */}
      <Card className="p-4 mb-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            {
              label: "Spent",
              value: privacyMode ? "$•••" : formatMoneyShort(spent),
              color: "var(--red)",
            },
            {
              label: "Earned",
              value: privacyMode ? "$•••" : formatMoneyShort(earned),
              color: "var(--green)",
            },
            {
              label: "Saved",
              value: privacyMode ? "$•••" : formatMoneyShort(saved),
              color: "var(--accent-violet)",
            },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </div>
              <div
                className="font-mono font-medium"
                style={{
                  fontSize: 20,
                  color: s.color,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Donut */}
      <Card className="p-4 mb-5">
        <div className="text-[12px] mb-3 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          By category
        </div>
        {DONUT.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            No category metrics for {format(currentMonth, "MMMM yyyy")}.
          </div>
        ) : (
          <>
            <div style={{ width: "100%", height: 200 }} className="relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={DONUT}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={88}
                    stroke="var(--bg)"
                    strokeWidth={2}
                    paddingAngle={2}
                    animationDuration={600}
                  >
                    {DONUT.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => [
                      privacyMode
                        ? "$•••"
                        : `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Spent",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 12,
                      color: "var(--text-primary)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Total
                  </div>
                  <div className="font-mono font-semibold" style={{ fontSize: 20, color: "var(--text-primary)" }}>
                    {privacyMode
                      ? "$•••"
                      : `$${DONUT_TOTAL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-3">
              {DONUT.map((d) => (
                <div key={d.name} className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[12px] truncate flex-1" style={{ color: "var(--text-secondary)" }}>
                    {d.name}
                  </span>
                  <span className="font-mono text-[12px]" style={{ color: "var(--text-primary)" }}>
                    {privacyMode
                      ? "$•••"
                      : `$${d.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Main Bar Chart */}
      <Card className="p-4 mb-5">
        <div className="text-[12px] mb-3 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Monthly trend
        </div>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={mainChartData} barCategoryGap="20%">
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "var(--accent-muted)" }}
                formatter={(value: unknown) => [
                  privacyMode
                    ? "$•••"
                    : `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                ]}
                contentStyle={{
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="income" fill="var(--green)" radius={[4, 4, 0, 0]} animationDuration={600} />
              <Bar dataKey="expenses" fill="var(--accent-violet)" radius={[4, 4, 0, 0]} animationDuration={600} animationBegin={100} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top merchants */}
      <Card className="p-4 mb-5">
        <div className="text-[12px] mb-3 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Top merchants
        </div>
        {TOP_MERCHANTS.length === 0 ? (
          <div className="p-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            No spending records for this period.
          </div>
        ) : (
          <div className="space-y-3">
            {TOP_MERCHANTS.map((m, i) => (
              <div key={m.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)", width: 14 }}>
                      {i + 1}
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                      {m.name}
                    </span>
                  </div>
                  <span className="font-mono text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {privacyMode ? "$•••" : `$${m.amount.toFixed(2)}`}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden ml-5" style={{ backgroundColor: "var(--border-subtle)" }}>
                  <div
                    style={{
                      width: `${(m.amount / maxMerchant) * 100}%`,
                      backgroundColor: "var(--accent-violet)",
                      height: "100%",
                      transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Secondary Line Chart */}
      <Card className="p-4 mb-5">
        <div className="text-[12px] mb-3 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Cash flow
        </div>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={secondaryChartData}>
              <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: unknown) => [
                  privacyMode
                    ? "$•••"
                    : `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                ]}
                contentStyle={{
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              {period === "Week" ? (
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--accent-violet)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                />
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="var(--green)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--green)" }}
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--accent-violet)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--accent-violet)" }}
                    animationDuration={800}
                    animationBegin={100}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
