import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Receipt,
  Wallet,
  PieChart,
  Settings,
  Plus,
  ArrowLeftRight,
  Sparkles,
  Coins,
} from "lucide-react";
import { QuickAddSheet } from "./QuickAddSheet";
import { CurrencyConverterSheet } from "./CurrencyConverterSheet";

type SheetCtx = {
  openQuickAdd: () => void;
  openConverter: () => void;
};
const Ctx = createContext<SheetCtx>({
  openQuickAdd: () => {},
  openConverter: () => {},
});
export const useSheets = () => useContext(Ctx);

export function MobileShell({ children }: { children: ReactNode }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [convOpen, setConvOpen] = useState(false);

  return (
    <Ctx.Provider
      value={{
        openQuickAdd: () => setQuickOpen(true),
        openConverter: () => setConvOpen(true),
      }}
    >
      <div
        className="min-h-screen w-full relative flex flex-col lg:flex-row overflow-hidden"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {/* Dynamic slow-moving visionOS ambient mesh background */}
        <div
          className="pointer-events-none fixed w-full h-full overflow-hidden z-0"
          aria-hidden="true"
        >
          {/* Deep Indigo/Blue Orb */}
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "-10%",
              width: "60vw",
              height: "60vw",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(10,132,255,0.18) 0%, rgba(10,132,255,0) 70%)",
              filter: "blur(60px)",
              animation: "ambient-glow-1 25s ease-in-out infinite alternate",
            }}
          />
          {/* Magenta/Violet Orb for warm lighting */}
          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              right: "-10%",
              width: "55vw",
              height: "55vw",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0) 70%)",
              filter: "blur(70px)",
              animation: "ambient-glow-2 30s ease-in-out infinite alternate",
            }}
          />
          {/* Dark Teal Orb for contrast */}
          <div
            style={{
              position: "absolute",
              top: "30%",
              right: "15%",
              width: "45vw",
              height: "45vw",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(48,209,88,0.06) 0%, rgba(48,209,88,0) 70%)",
              filter: "blur(50px)",
              animation: "ambient-glow-3 20s ease-in-out infinite alternate-reverse",
            }}
          />
        </div>

        <QuickAddSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
        <CurrencyConverterSheet
          open={convOpen}
          onClose={() => setConvOpen(false)}
        />

        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Scrollable Main Content */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>
    </Ctx.Provider>
  );
}

function Sidebar() {
  const { openQuickAdd, openConverter } = useSheets();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { to: "/", label: "Home", Icon: Home },
    { to: "/transactions", label: "Transactions", Icon: Receipt },
    { to: "/budget", label: "Budget", Icon: Wallet },
    { to: "/wallets", label: "Wallets", Icon: Coins },
    { to: "/analytics", label: "Analytics", Icon: PieChart },
    { to: "/settings", label: "Settings", Icon: Settings },
  ] as const;

  return (
    <aside
      className="w-full lg:w-64 shrink-0 lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4 flex flex-col p-5 m-0 lg:m-4 lg:rounded-2xl z-20"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(40px) saturate(220%)",
        WebkitBackdropFilter: "blur(40px) saturate(220%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between lg:justify-start gap-3 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
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
            }}
          >
            <Sparkles size={14} color="#FFFFFF" />
          </div>
          <span
            className="font-semibold tracking-tight text-[15px]"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            SLPlayer
          </span>
        </div>

        {/* Mobile quick actions */}
        <div className="flex lg:hidden gap-2">
          <button
            type="button"
            onClick={openQuickAdd}
            aria-label="Quick add transaction"
            className="p-2 rounded-xl active:scale-[0.94] transition-all"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <Plus size={15} color="#fff" />
          </button>
          <button
            type="button"
            onClick={openConverter}
            aria-label="Wallet Converter"
            className="p-2 rounded-xl active:scale-[0.94] transition-all"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <ArrowLeftRight size={14} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
        {links.map(({ to, label, Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname.startsWith(to);
          const isTransactions = to === "/transactions";
          const displayLabel = isTransactions ? "Trans\u0430ctions" : label;
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ease-out shrink-0"
              style={
                active
                  ? {
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }
                  : {
                      color: "rgba(255, 255, 255, 0.55)",
                    }
              }
            >
              <Icon size={15} style={{ opacity: active ? 1 : 0.7 }} />
              <span>{displayLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar bottom action controls */}
      <div className="hidden lg:flex flex-col gap-2 mt-auto pt-6 border-t border-[rgba(255,255,255,0.06)]">
        <button
          type="button"
          disabled={!mounted}
          onClick={openQuickAdd}
          aria-label="Quick add"
          className="w-full flex items-center justify-center gap-2 rounded-xl font-medium text-[13px] text-white py-2.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
        >
          <Plus size={15} />
          <span>Quick add</span>
        </button>
        <button
          type="button"
          disabled={!mounted}
          onClick={openConverter}
          aria-label="Wallet Converter"
          className="w-full flex items-center justify-center gap-2 rounded-xl font-medium text-[13px] py-2.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          <ArrowLeftRight size={14} style={{ opacity: 0.7 }} />
          <span>Wallet Converter</span>
        </button>
      </div>
    </aside>
  );
}
