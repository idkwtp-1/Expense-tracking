import { Transaction, categoryById } from "@/lib/types";
import { Amount, CategoryIcon } from "./primitives";

export function TransactionItem({
  tx,
  index = 0,
}: {
  tx: Transaction;
  index?: number;
}) {
  const cat = categoryById(tx.categoryId);
  return (
    <div
      className="flex items-center gap-3 py-3 px-1 opacity-0"
      style={{
        animation: `fade-in-up 320ms cubic-bezier(0.16,1,0.3,1) ${index * 30}ms forwards`,
      }}
    >
      <div className="relative">
        <CategoryIcon emoji={cat.emoji} color={cat.color} />
        {tx.wallet_id && (
          <div
            className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
            style={{ width: 16, height: 16, fontSize: 9 }}
            title="Wallet Transaction"
          >
            🪙
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[14px] font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {tx.merchant}
        </div>
        <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {cat.name}
        </div>
      </div>
      <div className="text-right shrink-0">
        <Amount
          value={tx.amount}
          sign
          size={15}
          currency={tx.categoryId === "travel" ? "CAD" : (tx.foreign_currency || "CAD")}
        />
        <div
          className="text-[12px] mt-0.5 flex items-center justify-end gap-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          {tx.categoryId === "travel" && tx.foreign_amount && tx.foreign_currency ? (
            <span className="font-mono text-[10px] bg-[var(--surface-raised)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
              +{tx.foreign_amount} {tx.foreign_currency}
            </span>
          ) : null}
          <span>{tx.time}</span>
        </div>
      </div>
    </div>
  );
}

export function TransactionList({
  items,
  startIndex = 0,
}: {
  items: Transaction[];
  startIndex?: number;
}) {
  return (
    <div className="flex flex-col">
      {items.map((tx, i) => (
        <div key={tx.id}>
          <TransactionItem tx={tx} index={startIndex + i} />
          {i < items.length - 1 && (
            <div
              className="ml-12 h-px"
              style={{ backgroundColor: "var(--border-subtle)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
