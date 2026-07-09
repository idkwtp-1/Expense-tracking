import { ArrowLeftRight, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useSheets } from "./MobileShell";
import { useExpense } from "@/lib/store";
import { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";

export function TopBar({ onBell }: { onBell?: () => void }) {
  const { openConverter } = useSheets();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Brand/Logo: only visible on mobile (hidden on desktop since sidebar has it) */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
            fontSize: 13,
            color: "#fff",
            fontWeight: 700,
          }}
        >
          S
        </div>
        <span
          className="font-bold text-[15px]"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          SLPlayer
        </span>
      </div>

      {/* Spacer to push notifications button to the right on desktop */}
      <div className="hidden lg:block" />

      <button
        disabled={!mounted}
        onClick={onBell ?? openConverter}
        className="grid place-items-center rounded-xl active:scale-[0.94] transition-all disabled:opacity-50 border cursor-pointer hover:bg-[rgba(255,255,255,0.05)]"
        style={{
          width: 36,
          height: 36,
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          borderColor: "rgba(255, 255, 255, 0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
        aria-label="Currency Converter"
      >
        <ArrowLeftRight size={15} style={{ color: "var(--text-secondary)" }} />
      </button>
    </div>
  );
}

export function MonthSelector() {
  const { currentMonth, setCurrentMonth } = useExpense();
  const label = format(currentMonth, "MMMM yyyy");

  return (
    <div className="flex items-center justify-between mb-6 px-1">
      <div className="flex items-center gap-2">
        <Calendar size={15} style={{ color: "var(--text-muted)" }} />
        <span
          className="font-semibold text-[15px]"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="grid place-items-center w-7 h-7 rounded-lg active:scale-[0.94] transition-all border"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderColor: "rgba(255,255,255,0.06)",
            color: "var(--text-secondary)",
          }}
          aria-label="Previous month"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="grid place-items-center w-7 h-7 rounded-lg active:scale-[0.94] transition-all border"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderColor: "rgba(255,255,255,0.06)",
            color: "var(--text-secondary)",
          }}
          aria-label="Next month"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
