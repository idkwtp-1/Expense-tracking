import { useState } from "react";
import { CATEGORIES } from "@/lib/types";
import { Calendar, Pencil, Delete } from "lucide-react";
import { useExpense } from "@/lib/store";
import { AmountInput } from "./AmountInput";
import { Sheet, SheetHeader } from "./Sheet";

export function QuickAddSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addTransaction, allRates, customRates } = useExpense();
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("CAD");
  const [selectedCat, setSelectedCat] = useState<string>("food");
  const [note, setNote] = useState("");

  const allCustomKeys = Object.keys(customRates);

  const handleSave = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    
    addTransaction({
      merchant: note.trim() || (mode === "income" ? "Deposit" : "Miscellaneous"),
      categoryId: mode === "income" ? "income" : selectedCat,
      amount: mode === "income" ? val : -val,
      date: new Date().toISOString().split("T")[0],
      foreign_amount: currency !== "CAD" ? val : undefined,
      foreign_currency: currency !== "CAD" ? currency : undefined,
    });
    setAmount("0");
    setNote("");
    setCurrency("CAD");
    onClose();
  };

  const press = (v: string) => {
    setAmount((prev) => {
      if (v === "⌫") return prev.length > 1 ? prev.slice(0, -1) : "0";
      if (v === ".") return prev.includes(".") ? prev : prev + ".";
      if (prev === "0") return v;
      return prev + v;
    });
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Add Transaction" onClose={onClose} />

      <div className="flex flex-col space-y-4">
        <SegmentedToggle value={mode} onChange={setMode} />

        <div className="flex flex-col items-center justify-center py-2">
          <div className="text-[12px] mb-1 flex items-center justify-center gap-2 w-full px-4" style={{ color: "var(--text-muted)" }}>
            <span className="flex-1 text-right">{mode === "expense" ? "Expense Amount" : "Income Amount"}</span>
            <div className="w-px h-3 bg-[var(--border-subtle)]" />
            <div className="flex-1 text-left">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-medium text-[var(--accent-violet)]"
                aria-label="Transaction Currency"
              >
                <optgroup label="Main Currencies">
                  <option value="CAD" style={{ backgroundColor: "#1a1a24", color: "#ffffff" }}>CAD</option>
                  {Object.keys(allRates).filter(c => c !== "CAD" && !allCustomKeys.includes(c)).map((c) => (
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
          </div>
          <AmountInput
            value={amount}
            onChange={setAmount}
            autoFocus={open}
            prefix={mode === "income" ? (currency === "CAD" ? "+$" : "+") : (currency === "CAD" ? "$" : "")}
            suffix={currency === "CAD" ? "" : ` ${currency}`}
            style={{
              fontSize: 40,
              color: mode === "income" ? "var(--green)" : "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          />
        </div>

        {mode === "expense" && (
          <div>
            <div className="text-[11px] mb-2" style={{ color: "var(--text-muted)" }}>
              Category
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
              {CATEGORIES.filter((c) => c.id !== "income" && c.id !== "travel").map((c) => {
                const active = selectedCat === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCat(c.id)}
                    className="flex flex-col items-center gap-1.5 shrink-0 active:scale-[0.94] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet rounded-lg"
                    style={{ width: 64 }}
                    aria-label={`Select ${c.name} category`}
                  >
                    <div
                      className="grid place-items-center rounded-full"
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: `${c.color}22`,
                        fontSize: 22,
                        boxShadow: active ? `0 0 0 2px var(--accent-violet)` : "none",
                      }}
                    >
                      {c.emoji}
                    </div>
                    <div
                      className="text-[10px] truncate w-full text-center"
                      style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}
                    >
                      {c.name.split(" ")[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === "income" && currency !== "CAD" && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px]"
            style={{ backgroundColor: "rgba(48,209,88,0.08)", color: "var(--green)", border: "1px solid rgba(48,209,88,0.2)" }}
          >
            <span>💰</span>
            <span>
              Income in <strong>{currency}</strong> will automatically appear in your{" "}
              <strong>Wallets</strong> section.
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className="h-11 rounded-2xl active:scale-[0.95] transition-transform grid place-items-center text-lg font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontFamily: k === "⌫" ? "inherit" : "var(--font-mono)",
              }}
              aria-label={k === "⌫" ? "Backspace" : undefined}
            >
              {k === "⌫" ? <Delete size={18} /> : k}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
            style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent-violet)" }}
            aria-label="Transaction date: Today"
          >
            <Calendar size={14} /> Today
          </button>
          <div
            className="flex-1 flex items-center gap-2 px-3 h-10 rounded-xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <Pencil size={14} style={{ color: "var(--text-muted)" }} />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
              placeholder="Add note..."
              style={{ color: "var(--text-primary)" }}
              aria-label="Add transaction note"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl font-semibold text-white active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
          style={{ height: 48, backgroundColor: "var(--accent-violet)", fontSize: 14 }}
        >
          Save {mode === "income" ? "Income" : "Expense"}
        </button>
      </div>
    </Sheet>
  );
}

function SegmentedToggle({
  value,
  onChange,
}: {
  value: "expense" | "income";
  onChange: (v: "expense" | "income") => void;
}) {
  return (
    <div
      className="relative flex p-1 rounded-full"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="absolute top-1 bottom-1 rounded-full"
        style={{
          width: "calc(50% - 4px)",
          left: value === "expense" ? 4 : "calc(50%)",
          backgroundColor: "var(--accent-violet)",
          transition: "left 240ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
      {(["expense", "income"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="relative flex-1 h-9 rounded-full text-sm font-medium capitalize cursor-pointer"
          style={{ color: value === v ? "#fff" : "var(--text-secondary)", transition: "color 200ms ease" }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
