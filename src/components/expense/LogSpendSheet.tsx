import { useState, useEffect } from "react";
import { useExpense } from "@/lib/store";
import { CATEGORIES, WalletSpend } from "@/lib/types";
import { Calendar, Pencil, Delete } from "lucide-react";
import { AmountInput } from "./AmountInput";
import { Sheet, SheetHeader } from "./Sheet";

export function LogSpendSheet({
  open,
  onClose,
  walletId,
  currency,
  spendToEdit,
}: {
  open: boolean;
  onClose: () => void;
  walletId: string;
  currency: string;
  spendToEdit?: WalletSpend | null;
}) {
  const { logSpend, editSpend } = useExpense();
  const [amount, setAmount] = useState("0");
  const [selectedCat, setSelectedCat] = useState<string>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (open) {
      if (spendToEdit) {
        setAmount(spendToEdit.foreign_amount.toString());
        setSelectedCat(spendToEdit.category_tag || "other");
        setNote(spendToEdit.note);
        setDate(spendToEdit.date);
      } else {
        setAmount("0");
        setSelectedCat("food");
        setNote("");
        setDate(new Date().toISOString().split("T")[0]);
      }
    }
  }, [open, spendToEdit]);

  const handleSave = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    if (spendToEdit) {
      editSpend(spendToEdit.id, val, note.trim() || "Spend", selectedCat, date);
    } else {
      logSpend(walletId, val, note.trim() || "Spend", selectedCat, date);
    }
    setAmount("0");
    setNote("");
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
      <SheetHeader title={spendToEdit ? "Edit Spend Entry" : "Log Spend Entry"} onClose={onClose} />

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col items-center justify-center py-2">
          <div className="text-[12px] mb-1" style={{ color: "var(--text-muted)" }}>
            Amount in {currency}
          </div>
          <AmountInput
            value={amount}
            onChange={setAmount}
            autoFocus={open}
            suffix={currency}
            style={{ fontSize: 40, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          />
        </div>

        <div>
          <div className="text-[11px] mb-2" style={{ color: "var(--text-muted)" }}>
            Category Tag
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none cursor-grab active:cursor-grabbing">
            {CATEGORIES.filter((c) => c.id !== "income").map((c) => {
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
            >
              {k === "⌫" ? <Delete size={18} /> : k}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <Calendar size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent outline-none text-xs w-28 cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <div
            className="flex-1 flex items-center gap-2 px-3 h-10 rounded-xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <Pencil size={14} style={{ color: "var(--text-muted)" }} />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
              placeholder="Add spend note..."
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl font-semibold text-white active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
          style={{ height: 48, backgroundColor: "var(--accent-violet)", fontSize: 14 }}
        >
          Save Spend Entry
        </button>
      </div>
    </Sheet>
  );
}
