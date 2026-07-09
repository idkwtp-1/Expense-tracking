import { ReactNode } from "react";
import { useExpense } from "@/lib/store";

export function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ease-out ${
        interactive
          ? "hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] hover:-translate-y-0.5 active:scale-[0.99] active:bg-[rgba(255,255,255,0.02)]"
          : ""
      } ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(35px) saturate(210%)",
        WebkitBackdropFilter: "blur(35px) saturate(210%)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CategoryIcon({
  emoji,
  color,
  size = 36,
}: {
  emoji: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="grid place-items-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
        fontSize: size * 0.45,
        boxShadow: `0 2px 8px ${color}08`,
      }}
    >
      <span>{emoji}</span>
    </div>
  );
}

export function StatPill({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.035)",
        color: "rgba(255, 255, 255, 0.65)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2
        className="text-[14px] font-semibold tracking-tight"
        style={{ color: "rgba(255, 255, 255, 0.9)" }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Animated progress bar — fills from 0 to value on mount. */
export function ProgressBar({
  value, // 0..1
  height = 4,
  color,
}: {
  value: number;
  height?: number;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const fill =
    color ??
    (pct >= 100 ? "var(--red)" : pct >= 80 ? "var(--amber)" : "var(--green)");
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full overflow-hidden"
      style={{
        height,
        borderRadius: 999,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.04)",
      }}
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          backgroundColor: fill,
          borderRadius: 999,
          boxShadow: `0 0 10px ${fill}40`,
          transition: "width 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          animation: "grow-bar 800ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}

export function Amount({
  value,
  size = 18,
  sign = false,
  color,
  className = "",
  currency = "CAD",
}: {
  value: number;
  size?: number;
  sign?: boolean;
  color?: string;
  className?: string;
  currency?: string;
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
        {currency === "CAD" ? "$•••" : `••• ${currency}`}
      </span>
    );
  }

  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const signStr = sign
    ? value > 0
      ? "+"
      : value < 0
        ? "−"
        : ""
    : value < 0
      ? "−"
      : "";

  return (
    <span
      className={`font-mono font-medium ${className}`}
      style={{ fontSize: size, color: resolved, lineHeight: 1.1 }}
    >
      {signStr}
      {currency === "CAD" ? "$" : ""}
      {abs}
      {currency !== "CAD" ? ` ${currency}` : ""}
    </span>
  );
}
