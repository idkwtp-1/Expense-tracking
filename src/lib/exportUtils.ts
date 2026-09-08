import type { Transaction, BackupPayload } from "./types";

/**
 * Escapes a cell value according to RFC 4180 CSV standard.
 */
export function escapeCsv(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates and triggers browser download for transactions CSV.
 */
export function exportTransactionsCsv(transactions: Transaction[]) {
  const headers = [
    "id",
    "merchant",
    "categoryId",
    "amount",
    "date",
    "time",
    "wallet_id",
    "foreign_amount",
    "foreign_currency",
  ];

  const rows = transactions.map((t) => [
    escapeCsv(t.id),
    escapeCsv(t.merchant),
    escapeCsv(t.categoryId),
    escapeCsv(t.amount),
    escapeCsv(t.date),
    escapeCsv(t.time),
    escapeCsv(t.wallet_id),
    escapeCsv(t.foreign_amount),
    escapeCsv(t.foreign_currency),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const todayStr = new Date().toISOString().split("T")[0];
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `slplayer-transactions-${todayStr}.csv`);
}

/**
 * Generates and triggers browser download for full app backup JSON.
 */
export function exportBackupJson(payload: BackupPayload) {
  const jsonStr = JSON.stringify(payload, null, 2);
  const todayStr = new Date().toISOString().split("T")[0];
  const blob = new Blob([jsonStr], { type: "application/json" });
  triggerDownload(blob, `slplayer-backup-${todayStr}.json`);
}

/**
 * Helper to download any Blob as a file in the browser.
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
