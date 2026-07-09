import { useState, useEffect } from "react";
import { useExpense } from "@/lib/store";
import { CURRENCIES } from "@/lib/types";
import { AmountInput } from "./AmountInput";
import { Sheet, SheetHeader } from "./Sheet";

export function NewWalletSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addWallet, customRates, allRates } = useExpense();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [sourceCurrency, setSourceCurrency] = useState("CAD");
  const [baseCost, setBaseCost] = useState("0");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [foreignAmount, setForeignAmount] = useState("0");
  const [activeField, setActiveField] = useState<"base" | "rate" | "foreign">("base");

  const getRateBetween = (fromCurr: string, toCurr: string): number => {
    const fromRate = allRates[fromCurr] || 1;
    const toRate = allRates[toCurr] || 1;
    return toRate / fromRate;
  };

  const formatCalculated = (val: number): string => {
    if (isNaN(val) || !isFinite(val) || val === 0) return "0";
    if (Number.isInteger(val)) return val.toString();
    const fixed = val.toFixed(4);
    return parseFloat(fixed).toString();
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setBaseCost("0");
      setForeignAmount("0");
      setActiveField("base");
      const defaultRate = getRateBetween(sourceCurrency, currency);
      setExchangeRate(formatCalculated(defaultRate));
    }
  }, [open]);

  // Update exchange rate when currencies change
  useEffect(() => {
    const defaultRate = getRateBetween(sourceCurrency, currency);
    const rateStr = formatCalculated(defaultRate);
    setExchangeRate(rateStr);
    const b = parseFloat(baseCost) || 0;
    if (b > 0) {
      setForeignAmount(formatCalculated(b * defaultRate));
    }
  }, [sourceCurrency, currency]);

  const handleFieldChange = (field: "base" | "rate" | "foreign", value: string) => {
    if (field === "base") {
      setBaseCost(value);
      const b = parseFloat(value) || 0;
      const r = parseFloat(exchangeRate) || 0;
      setForeignAmount(formatCalculated(b * r));
    } else if (field === "rate") {
      setExchangeRate(value);
      const b = parseFloat(baseCost) || 0;
      const r = parseFloat(value) || 0;
      setForeignAmount(formatCalculated(b * r));
    } else if (field === "foreign") {
      setForeignAmount(value);
      const f = parseFloat(value) || 0;
      const r = parseFloat(exchangeRate) || 0;
      if (r > 0) {
        setBaseCost(formatCalculated(f / r));
      } else {
        const b = parseFloat(baseCost) || 0;
        if (b > 0) {
          setExchangeRate(formatCalculated(f / b));
        }
      }
    }
  };

  const handleSave = () => {
    const fAmt = parseFloat(foreignAmount);
    const bCost = parseFloat(baseCost);
    if (!name.trim() || isNaN(fAmt) || fAmt <= 0 || isNaN(bCost) || bCost <= 0) return;
    addWallet(name.trim(), currency, fAmt, bCost, sourceCurrency);
    onClose();
  };

  const pressKey = (v: string) => {
    let currentVal = activeField === "base" ? baseCost : activeField === "rate" ? exchangeRate : foreignAmount;
    let newVal: string;
    if (v === "⌫") {
      newVal = currentVal.length > 1 ? currentVal.slice(0, -1) : "0";
    } else if (v === ".") {
      newVal = currentVal.includes(".") ? currentVal : currentVal + ".";
    } else {
      newVal = currentVal === "0" ? v : currentVal + v;
    }
    handleFieldChange(activeField, newVal);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  const allCustomKeys = Object.keys(customRates);

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="New Wallet" onClose={onClose} />

      <div className="flex flex-col space-y-4">
        {/* Wallet Name */}
        <div
          className="flex items-center gap-2 px-3 h-11 rounded-xl"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
            placeholder="Wallet Name (e.g. Turkey 2026)"
            style={{ color: "var(--text-primary)" }}
            aria-label="Wallet Name"
          />
        </div>

        {/* Currency Selectors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Source Currency</span>
            <select
              value={sourceCurrency}
              onChange={(e) => setSourceCurrency(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
              style={{
                backgroundColor: "var(--surface-raised)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <optgroup label="Main Currencies">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} style={{ backgroundColor: "#1a1a24", color: "#ffffff" }}>{c}</option>
                ))}
              </optgroup>
              {allCustomKeys.length > 0 && (
                <optgroup label="Custom Currencies">
                  {allCustomKeys.map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: "#1a1a24", color: "#ffffff" }}>{c}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Foreign Target Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
              style={{
                backgroundColor: "var(--surface-raised)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <optgroup label="Main Currencies">
                {CURRENCIES.filter((c) => c !== sourceCurrency).map((c) => (
                  <option key={c} value={c} style={{ backgroundColor: "#1a1a24", color: "#ffffff" }}>{c}</option>
                ))}
              </optgroup>
              {allCustomKeys.filter((c) => c !== sourceCurrency).length > 0 && (
                <optgroup label="Custom Currencies">
                  {allCustomKeys.filter((c) => c !== sourceCurrency).map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: "#1a1a24", color: "#ffffff" }}>{c}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Amount and Rate Inputs */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Base Cost */}
            <div
              onClick={() => setActiveField("base")}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
                activeField === "base" ? "border-[var(--accent-violet)] bg-white/5" : "border-[var(--border-subtle)] bg-[var(--surface)]"
              }`}
            >
              <span className="text-[11px] text-[var(--text-muted)] mb-1">Base Cost</span>
              <AmountInput
                value={baseCost}
                onChange={(val) => handleFieldChange("base", val)}
                onFocus={() => setActiveField("base")}
                suffix={sourceCurrency}
                style={{ fontSize: 18, color: "var(--text-primary)" }}
              />
            </div>

            {/* Exchange Rate */}
            <div
              onClick={() => setActiveField("rate")}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
                activeField === "rate" ? "border-[var(--accent-violet)] bg-white/5" : "border-[var(--border-subtle)] bg-[var(--surface)]"
              }`}
            >
              <span className="text-[11px] text-[var(--text-muted)] mb-1">Exchange Rate</span>
              <AmountInput
                value={exchangeRate}
                onChange={(val) => handleFieldChange("rate", val)}
                onFocus={() => setActiveField("rate")}
                suffix={`/${sourceCurrency}`}
                style={{ fontSize: 18, color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Foreign Target Amount */}
          <div
            onClick={() => setActiveField("foreign")}
            className={`p-3.5 rounded-2xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
              activeField === "foreign" ? "border-[var(--accent-violet)] bg-white/5" : "border-[var(--border-subtle)] bg-[var(--surface-raised)]"
            }`}
          >
            <span className="text-[11px] text-[var(--text-muted)] mb-1">Foreign Target Amount</span>
            <AmountInput
              value={foreignAmount}
              onChange={(val) => handleFieldChange("foreign", val)}
              onFocus={() => setActiveField("foreign")}
              suffix={currency}
              style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pressKey(k)}
              className="h-11 rounded-2xl active:scale-[0.95] transition-transform grid place-items-center text-lg font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontFamily: k === "⌫" ? "inherit" : "var(--font-mono)",
              }}
            >
              {k}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl font-semibold text-white active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
          style={{ height: 48, backgroundColor: "var(--accent-violet)", fontSize: 14 }}
        >
          Create Wallet
        </button>
      </div>
    </Sheet>
  );
}
