import React, { useState } from "react";
import { Transaction, categoryById, formatMoney } from "@/lib/types";
import { useExpense } from "@/lib/store";
import { ReceiptScanner } from "@/components/receipt/ReceiptScanner";
import { Sheet, SheetHeader } from "@/components/expense/Sheet";
import { Camera, Trash2, ZoomIn, Plus, Calendar, Clock, Tag, CreditCard, X, Receipt } from "lucide-react";

export interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailSheet({ transaction, open, onClose }: TransactionDetailSheetProps) {
  const { deleteTransaction, deleteReceipt, uploadReceipts } = useExpense();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [inspectUrl, setInspectUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingReceipt, setIsDeletingReceipt] = useState<string | null>(null);

  if (!transaction) return null;

  const cat = categoryById(transaction.categoryId);
  const receipts = transaction.receipt_urls || [];

  const handleScannerConfirm = async (blobs: Blob[]) => {
    if (!blobs || blobs.length === 0) return;
    setIsUploading(true);
    try {
      await uploadReceipts(transaction.id, blobs);
    } catch (err) {
      console.error("Failed to upload receipts:", err);
    } finally {
      setIsUploading(false);
      setScannerOpen(false);
    }
  };

  const handleDeleteReceipt = async (url: string) => {
    setIsDeletingReceipt(url);
    try {
      await deleteReceipt(transaction.id, url);
    } catch (err) {
      console.error("Failed to delete receipt:", err);
    } finally {
      setIsDeletingReceipt(null);
    }
  };

  const handleDeleteTransaction = () => {
    if (confirm(`Are you sure you want to delete "${transaction.merchant}"?`)) {
      deleteTransaction(transaction.id);
      onClose();
    }
  };

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <SheetHeader title="Transaction Details" onClose={onClose} />

        <div className="flex flex-col space-y-6 pt-1 pb-4">
          {/* Main Transaction Header Card */}
          <div
            className="p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl grid place-items-center text-2xl shrink-0"
                  style={{ backgroundColor: `${cat.color}22`, border: `1px solid ${cat.color}44` }}
                >
                  {cat.emoji}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate tracking-tight">
                    {transaction.merchant}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <Tag size={12} style={{ color: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount display */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-baseline justify-between">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                Amount
              </span>
              <div className="text-right">
                <div
                  className="text-2xl font-bold font-mono"
                  style={{
                    color: transaction.amount > 0 ? "var(--green)" : "var(--text-primary)",
                  }}
                >
                  {formatMoney(transaction.amount, { sign: true })}
                </div>
                {transaction.foreign_amount && transaction.foreign_currency && (
                  <div className="text-xs font-mono text-zinc-400 mt-0.5">
                    ({transaction.foreign_amount} {transaction.foreign_currency})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Metadata List */}
          <div
            className="rounded-2xl overflow-hidden divide-y divide-white/5"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar size={14} /> Date
              </div>
              <span className="font-medium text-white">{transaction.date}</span>
            </div>
            {transaction.time && (
              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock size={14} /> Time
                </div>
                <span className="font-medium text-white">{transaction.time}</span>
              </div>
            )}
            {transaction.wallet_id && (
              <div className="flex items-center justify-between px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <CreditCard size={14} /> Wallet ID
                </div>
                <span className="font-mono text-zinc-300">{transaction.wallet_id}</span>
              </div>
            )}
          </div>

          {/* Full Receipts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-emerald-400" />
                <h4 className="text-sm font-semibold text-white tracking-tight">
                  Attached Receipts ({receipts.length})
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera size={14} />
                    <span>Add Receipt</span>
                  </>
                )}
              </button>
            </div>

            {receipts.length === 0 ? (
              <div
                type="button"
                onClick={() => setScannerOpen(true)}
                className="p-6 rounded-2xl text-center border border-dashed border-white/15 bg-white/[0.015] hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                <Camera size={28} className="mx-auto mb-2 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                <p className="text-xs font-medium text-zinc-300">No receipts attached</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Tap here to scan &amp; attach receipt documents
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {receipts.map((url, idx) => (
                  <div
                    key={url}
                    className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-white/10 bg-black/40 group"
                  >
                    <img
                      src={url}
                      alt={`Receipt ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectUrl(url)}
                        className="w-7 h-7 rounded-lg bg-black/60 text-white grid place-items-center backdrop-blur-md hover:bg-black cursor-pointer"
                        title="Inspect receipt"
                      >
                        <ZoomIn size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReceipt(url)}
                        disabled={isDeletingReceipt === url}
                        className="w-7 h-7 rounded-lg bg-red-500/80 text-white grid place-items-center backdrop-blur-md hover:bg-red-600 cursor-pointer disabled:opacity-50"
                        title="Delete receipt"
                      >
                        {isDeletingReceipt === url ? (
                          <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-300">
                      Receipt #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Transaction Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDeleteTransaction}
              className="w-full py-3 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} /> Delete Transaction
            </button>
          </div>
        </div>
      </Sheet>

      {/* Camera Receipt Scanner Modal */}
      <ReceiptScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleScannerConfirm}
      />

      {/* High-res Receipt Lightbox Inspect Modal */}
      {inspectUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setInspectUrl(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={inspectUrl}
              alt="High resolution receipt preview"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setInspectUrl(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-zinc-800 text-white grid place-items-center border border-white/20 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
