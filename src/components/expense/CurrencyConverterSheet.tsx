import { useState, useMemo, useEffect } from "react";
import { ArrowDownUp } from "lucide-react";
import { RATES } from "@/lib/types";
import { useExpense } from "@/lib/store";
import { Sheet, SheetHeader } from "./Sheet";

export function CurrencyConverterSheet({
  open,
  onClose,
  defaultTo,
}: {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
}) {
  const { allRates, customRates, wallets, convertWallet } = useExpense();
  
  // Available currencies to convert FROM are those in active wallets
  const activeWallets = useMemo(() => wallets.filter(w => w.status === "active"), [wallets]);
  const availableSourceCurrencies = useMemo(() => Array.from(new Set(activeWallets.map(w => w.foreign_currency))), [activeWallets]);
  
  const [from, setFrom] = useState(availableSourceCurrencies[0] || "CAD");
  const [to, setTo] = useState(defaultTo || "USD");
  const [amount, setAmount] = useState("");
  const [manualRate, setManualRate] = useState("");
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    if (open && defaultTo) {
      setTo(defaultTo);
      if (from === defaultTo) {
        const other = availableSourceCurrencies.find(c => c !== defaultTo);
        if (other) setFrom(other);
      }
    }
  }, [open, defaultTo]);

  const value = parseFloat(amount) || 0;
  const defaultRate = ((allRates[to] || 1) / (allRates[from] || 1)).toFixed(4);
  const activeRate = parseFloat(manualRate) || parseFloat(defaultRate) || 1;
  const converted = value * activeRate;

  const handleFromChange = (newFrom: string) => {
    setFrom(newFrom);
    setManualRate("");
  };

  const handleToChange = (newTo: string) => {
    setTo(newTo);
    setManualRate("");
  };

  const swap = () => {
    if (!availableSourceCurrencies.includes(to)) return; // Can't swap if 'to' is not in active wallets
    setSpin((s) => s + 180);
    setFrom(to);
    setTo(from);
    setManualRate("");
  };

  const handleConvert = () => {
    if (value <= 0) return;
    convertWallet(from, to, value, activeRate);
    setAmount("");
    setManualRate("");
    onClose();
  };

  const allCustomKeys = Object.keys(customRates);

  if (availableSourceCurrencies.length === 0) {
    return (
      <Sheet open={open} onClose={onClose}>
        <SheetHeader title="Wallet Converter" onClose={onClose} />
        <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          You have no active wallets to convert from. Add some income first!
        </div>
      </Sheet>
    );
  }

  // Ensure selected 'from' is valid
  if (!availableSourceCurrencies.includes(from) && availableSourceCurrencies.length > 0) {
    setFrom(availableSourceCurrencies[0]);
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Wallet Converter" onClose={onClose} />

      <div className="space-y-4">
        <CurrencyRow
          label="From (Active Wallets)"
          currency={from}
          onCurrencyChange={handleFromChange}
          value={amount}
          onValueChange={setAmount}
          editable
          availableCurrencies={availableSourceCurrencies}
          allCustomKeys={allCustomKeys}
        />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            disabled={!availableSourceCurrencies.includes(to)}
            className="grid place-items-center rounded-full active:scale-[0.94] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet disabled:opacity-50"
            style={{ width: 40, height: 40, backgroundColor: "var(--accent-muted)", color: "var(--accent-violet)" }}
            aria-label="Swap currencies"
          >
            <ArrowDownUp
              size={18}
              style={{ transform: `rotate(${spin}deg)`, transition: "transform 360ms cubic-bezier(0.16,1,0.3,1)" }}
            />
          </button>
        </div>

        {/* Manual Rate Input */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between gap-3"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex-1">
            <div className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
              Custom Exchange Rate (1 {from} = ? {to})
            </div>
            <input
              value={manualRate}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                const parts = cleaned.split(".");
                const formatted = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
                setManualRate(formatted);
              }}
              className="bg-transparent outline-none w-full font-mono font-medium text-lg"
              style={{ color: "var(--text-primary)" }}
              placeholder={defaultRate}
              aria-label="Exchange Rate"
            />
          </div>
        </div>

        <CurrencyRow
          label="To (Target Wallet)"
          currency={to}
          onCurrencyChange={handleToChange}
          value={converted.toFixed(2)}
          editable={false}
          availableCurrencies={Object.keys(allRates)}
          allCustomKeys={allCustomKeys}
        />

        <div className="text-[12px] text-center pt-1" style={{ color: "var(--text-muted)" }}>
          1 {from} = {activeRate.toFixed(4)} {to}
        </div>

        <button
          type="button"
          onClick={handleConvert}
          disabled={value <= 0 || from === to}
          className="w-full rounded-2xl font-semibold text-white active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet disabled:opacity-50 disabled:active:scale-100"
          style={{ height: 48, backgroundColor: "var(--accent-violet)", fontSize: 14, marginTop: 16 }}
        >
          Convert & Transfer
        </button>

        <div className="flex gap-2 justify-center pt-2 flex-wrap items-center">
          {Object.keys(RATES).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleToChange(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium active:scale-[0.94] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
              style={{
                backgroundColor: to === c ? "var(--accent-violet)" : "var(--surface)",
                color: to === c ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
              aria-label={`Set target currency to ${c}`}
            >
              {c}
            </button>
          ))}
          {allCustomKeys.length > 0 && (
            <>
              <div className="w-px h-4 bg-[var(--border-subtle)] mx-1 shrink-0" />
              {allCustomKeys.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleToChange(c)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium active:scale-[0.94] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
                  style={{
                    backgroundColor: to === c ? "var(--accent-violet)" : "var(--surface)",
                    color: to === c ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  aria-label={`Set target currency to ${c}`}
                >
                  {c}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function CurrencyRow({
  label,
  currency,
  onCurrencyChange,
  value,
  onValueChange,
  editable,
  availableCurrencies,
  allCustomKeys,
}: {
  label: string;
  currency: string;
  onCurrencyChange: (v: string) => void;
  value: string;
  onValueChange?: (v: string) => void;
  editable: boolean;
  availableCurrencies: string[];
  allCustomKeys: string[];
}) {
  const mainCurrencies = availableCurrencies.filter(c => !allCustomKeys.includes(c));
  const customCurrencies = availableCurrencies.filter(c => allCustomKeys.includes(c));

  return (
    <div
      className="rounded-2xl p-4 flex items-center justify-between gap-3"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </div>
        {editable ? (
          <input
            value={value}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.]/g, "");
              const parts = cleaned.split(".");
              const formatted = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
              onValueChange?.(formatted);
            }}
            placeholder="0"
            inputMode="decimal"
            className="bg-transparent outline-none w-full font-mono font-medium"
            style={{ fontSize: 28, color: "var(--text-primary)" }}
          />
        ) : (
          <div className="font-mono font-medium" style={{ fontSize: 28, color: "var(--text-primary)" }}>
            {value}
          </div>
        )}
      </div>
      <select
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="px-3 py-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
        style={{
          backgroundColor: "var(--surface-raised)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {mainCurrencies.length > 0 && (
          <optgroup label="Main Currencies">
            {mainCurrencies.map((c) => (
              <option key={c} value={c} style={{ backgroundColor: "#1a1a24", color: "#ffffff" }}>{c}</option>
            ))}
          </optgroup>
        )}
        {customCurrencies.length > 0 && (
          <optgroup label="Custom Currencies">
            {customCurrencies.map((c) => (
              <option key={c} value={c} style={{ backgroundColor: "#1a1a24", color: "#ffffff" }}>{c}</option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
