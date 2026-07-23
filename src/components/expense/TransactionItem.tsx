import { Transaction, categoryById } from "@/lib/types";
import { Amount, CategoryIcon } from "./primitives";
import { Camera, Paperclip } from "lucide-react";

export function TransactionItem({
  tx,
  index = 0,
  onClick,
  onCameraClick,
}: {
  tx: Transaction;
  index?: number;
  onClick?: (tx: Transaction) => void;
  onCameraClick?: (tx: Transaction, e: React.MouseEvent) => void;
}) {
  const cat = categoryById(tx.categoryId);
  const hasReceipts = tx.receipt_urls && tx.receipt_urls.length > 0;
  const receiptCount = tx.receipt_urls?.length || 0;

  return (
    <div
      onClick={() => onClick?.(tx)}
      className={`flex items-center gap-3 py-3 px-1 opacity-0 ${onClick ? "cursor-pointer hover:bg-white/[0.02] rounded-xl transition-colors" : ""}`}
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
        <div className="flex items-center gap-2">
          <span
            className="text-[14px] font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {tx.merchant}
          </span>
          {hasReceipts && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                color: "#4ADE80",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
              title={`${receiptCount} attached receipt(s)`}
            >
              <Paperclip size={10} />
              {receiptCount}
            </span>
          )}
        </div>
        <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {cat.name}
        </div>
      </div>

      {/* Camera Icon Action Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCameraClick ? onCameraClick(tx, e) : onClick?.(tx);
        }}
        className="p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer shrink-0"
        title="Scan & Attach Receipt"
      >
        <Camera size={16} />
      </button>

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
  onItemClick,
  onCameraClick,
}: {
  items: Transaction[];
  startIndex?: number;
  onItemClick?: (tx: Transaction) => void;
  onCameraClick?: (tx: Transaction, e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex flex-col">
      {items.map((tx, i) => (
        <div key={tx.id}>
          <TransactionItem
            tx={tx}
            index={startIndex + i}
            onClick={onItemClick}
            onCameraClick={onCameraClick}
          />
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
