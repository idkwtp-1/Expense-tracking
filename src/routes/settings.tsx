import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Check,
  FileDown,
  Database,
  HardDrive,
  RotateCcw,
  AlertTriangle,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { TopBar } from "@/components/expense/TopBar";
import { Card } from "@/components/expense/primitives";
import { useExpense } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { BackupPayload } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "SLPlayer — Settings" },
      { name: "description", content: "App preferences and data." },
    ],
  }),
  component: SettingsPage,
});

const ACCENTS = [
  "#7C3AED",
  "#22C55E",
  "#EAB308",
  "#EF4444",
  "#3B82F6",
  "#EC4899",
];

function SettingsPage() {
  const {
    transactions,
    wallets,
    walletSpends,
    budgetLimits,
    importData,
    getStorageUsage,
    privacyMode,
    setPrivacyMode,
    accentColor,
    setAccentColor,
    resetApp,
  } = useExpense();

  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [storageSize, setStorageSize] = useState<string>("0 MB");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email || "Authenticated User");
    });
    getStorageUsage().then((mb) => {
      if (mb < 0.1) {
        setStorageSize(`${(mb * 1024).toFixed(0)} KB`);
      } else {
        setStorageSize(`${mb.toFixed(2)} MB`);
      }
    });
  }, [getStorageUsage]);

  const handleExportCsv = () => {
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

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `slplayer-transactions-${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload: BackupPayload = {
      transactions,
      wallets,
      walletSpends,
      budgetLimits,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const todayStr = new Date().toISOString().split("T")[0];
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `slplayer-backup-${todayStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      alert("Backup imported successfully!");
    } catch (err: any) {
      console.error("Import error:", err);
      alert(`Import failed: ${err?.message || "Invalid JSON or payload structure"}`);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div>
      <TopBar />
      <h1
        className="text-xl font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Settings
      </h1>

      <Group label="Account">
        <Card className="overflow-hidden">
          <Row label="Email" icon={<User size={15} />}>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {userEmail || "Loading..."}
            </span>
          </Row>
          <Divider />
          <Row label="Security Status" icon={<ShieldCheck size={15} />}>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Protected with RLS
            </span>
          </Row>
          <Divider />
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center justify-between px-4 py-3.5 min-h-[52px] cursor-pointer active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="grid place-items-center rounded-lg shrink-0"
                style={{ width: 28, height: 28, backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444" }}
              >
                <LogOut size={14} />
              </div>
              <div className="text-[14px]" style={{ color: "#EF4444" }}>Sign Out</div>
            </div>
            <ChevronRight size={16} style={{ color: "#EF4444", opacity: 0.6 }} />
          </button>
        </Card>
      </Group>

      <Group label="General">
        <Card className="overflow-hidden">
          <Row label="Base Currency">
            <Pill>CAD</Pill>
          </Row>
          <Divider />
          <Row label="Privacy Mode">
            <Toggle
              on={privacyMode}
              onChange={() => setPrivacyMode(!privacyMode)}
            />
          </Row>
        </Card>
      </Group>

      <Group label="Data">
        <Card className="overflow-hidden">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full text-left cursor-pointer active:opacity-70 transition-opacity"
          >
            <Row label="Export CSV" icon={<FileDown size={15} />} chevron />
          </button>
          <Divider />
          <button
            type="button"
            onClick={handleExportJson}
            className="w-full text-left cursor-pointer active:opacity-70 transition-opacity"
          >
            <Row label="Export JSON" icon={<FileDown size={15} />} chevron />
          </button>
          <Divider />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left cursor-pointer active:opacity-70 transition-opacity"
          >
            <Row label="Import Backup" icon={<Database size={15} />} chevron />
          </button>
          <Divider />
          <Row label="Receipt Storage" icon={<HardDrive size={15} />} chevron>
            <span
              className="font-mono text-[12px] mr-1"
              style={{ color: "var(--text-muted)" }}
            >
              {storageSize}
            </span>
          </Row>
        </Card>
      </Group>

      <Group label="Appearance">
        <Card className="p-4">
          <div
            className="text-[13px] mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Accent color
          </div>
          <div className="flex gap-3">
            {ACCENTS.map((c) => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                className="grid place-items-center rounded-full active:scale-[0.94] transition-transform"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: c,
                  boxShadow:
                    accentColor === c
                      ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}`
                      : "none",
                }}
              >
                {accentColor === c && <Check size={14} color="#fff" />}
              </button>
            ))}
          </div>
        </Card>
      </Group>


      <Group label="About">
        <Card className="overflow-hidden">
          <Row label="Version">
            <span
              className="font-mono text-[12px]"
              style={{ color: "var(--text-muted)" }}
            >
              1.0.0
            </span>
          </Row>

        </Card>
      </Group>

      <Group label="Danger Zone">
        <Card className="overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
          <button
            type="button"
            id="reset-app-btn"
            onClick={() => setResetConfirm(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 min-h-[52px] cursor-pointer active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="grid place-items-center rounded-lg shrink-0"
                style={{ width: 28, height: 28, backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444" }}
              >
                <RotateCcw size={14} />
              </div>
              <div className="text-left">
                <div className="text-[14px]" style={{ color: "#EF4444" }}>Reset App</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Permanently delete all data and start fresh</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "#EF4444", opacity: 0.6 }} />
          </button>
        </Card>
      </Group>

      {resetConfirm && (
        <ResetConfirmModal
          resetting={resetting}
          onCancel={() => setResetConfirm(false)}
          onConfirm={async () => {
            setResetting(true);
            await resetApp();
            setResetting(false);
            setResetConfirm(false);
          }}
        />
      )}
    </div>
  );
}

function ResetConfirmModal({
  resetting,
  onCancel,
  onConfirm,
}: {
  resetting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "rgba(20,20,28,0.95)",
          border: "1px solid rgba(239,68,68,0.3)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="grid place-items-center rounded-full shrink-0"
            style={{ width: 40, height: 40, backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444" }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>Reset App?</div>
            <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>This cannot be undone</div>
          </div>
        </div>

        <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          This will permanently delete <strong style={{ color: "var(--text-primary)" }}>all transactions, wallets, budgets, and settings</strong> from both this device and the cloud. You will start completely fresh.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={resetting}
            className="flex-1 h-11 rounded-xl text-[14px] font-medium cursor-pointer transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-reset-btn"
            onClick={onConfirm}
            disabled={resetting}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold text-white cursor-pointer transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#EF4444" }}
          >
            {resetting ? (
              <>
                <span
                  className="inline-block rounded-full border-2 border-white/30 border-t-white"
                  style={{ width: 14, height: 14, animation: "spin 0.7s linear infinite" }}
                />
                Resetting…
              </>
            ) : (
              "Yes, reset everything"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div
        className="text-[11px] uppercase tracking-wider mb-2 px-2"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  icon,
  caption,
  chevron,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  caption?: string;
  chevron?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 min-h-[52px]">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div
            className="grid place-items-center rounded-lg shrink-0"
            style={{
              width: 28,
              height: 28,
              backgroundColor: "var(--surface-raised)",
              color: "var(--text-secondary)",
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[14px]" style={{ color: "var(--text-primary)" }}>
            {label}
          </div>
          {caption && (
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {caption}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {children}
        {chevron && (
          <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
        )}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-px ml-4"
      style={{ backgroundColor: "var(--border-subtle)" }}
    />
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[12px] font-medium"
      style={{
        backgroundColor: "var(--accent-muted)",
        color: "var(--accent-violet)",
      }}
    >
      {children}
    </span>
  );
}

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className="relative rounded-full transition-colors"
      style={{
        width: 40,
        height: 24,
        backgroundColor: on ? "var(--accent-violet)" : "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        opacity: disabled ? 0.5 : 1,
      }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 rounded-full bg-white"
        style={{
          width: 18,
          height: 18,
          left: on ? 18 : 2,
          transition: "left 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </button>
  );
}
