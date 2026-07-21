import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  Check,
  Lock,
  Fingerprint,
  Bell,
  CalendarClock,
  FileDown,
  Database,
  HardDrive,
  Github,
  Plus,
  Trash2,
} from "lucide-react";
import { TopBar } from "@/components/expense/TopBar";
import { Card } from "@/components/expense/primitives";
import { useExpense } from "@/lib/store";

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
    privacyMode,
    setPrivacyMode,
    accentColor,
    setAccentColor,
    customRates,
    addCustomCurrency,
    deleteCustomCurrency,
  } = useExpense();
  const [alerts, setAlerts] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [digest, setDigest] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newRate, setNewRate] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    const code = newCode.trim().toUpperCase();
    const rate = parseFloat(newRate);
    if (code.length !== 3) {
      setError("Currency code must be exactly 3 characters.");
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      setError("Rate must be a positive number.");
      return;
    }
    const mainCurrencies = ["CAD", "USD", "EUR", "KGS", "CNY", "TRY", "GBP", "JPY"];
    if (mainCurrencies.includes(code)) {
      setError(`"${code}" is already a main currency.`);
      return;
    }
    addCustomCurrency(code, rate);
    setNewCode("");
    setNewRate("");
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

      <Group label="Security">
        <Card className="overflow-hidden">
          <Row label="Change PIN" icon={<Lock size={15} />} chevron />
          <Divider />
          <Row
            label="Biometric"
            icon={<Fingerprint size={15} />}
            caption="Coming soon"
          >
            <Toggle on={false} disabled onChange={() => {}} />
          </Row>
        </Card>
      </Group>

      <Group label="Notifications">
        <Card className="overflow-hidden">
          <Row label="Budget Alerts" icon={<Bell size={15} />}>
            <Toggle on={alerts} onChange={() => setAlerts(!alerts)} />
          </Row>
          <Divider />
          <Row label="Bill Reminders" icon={<CalendarClock size={15} />}>
            <Toggle on={reminders} onChange={() => setReminders(!reminders)} />
          </Row>
          <Divider />
          <Row label="Weekly Digest">
            <Toggle on={digest} onChange={() => setDigest(!digest)} />
          </Row>
        </Card>
      </Group>

      <Group label="Data">
        <Card className="overflow-hidden">
          <Row label="Export CSV" icon={<FileDown size={15} />} chevron />
          <Divider />
          <Row label="Export JSON" icon={<FileDown size={15} />} chevron />
          <Divider />
          <Row label="Import Backup" icon={<Database size={15} />} chevron />
          <Divider />
          <Row label="Receipt Storage" icon={<HardDrive size={15} />} chevron>
            <span
              className="font-mono text-[12px] mr-1"
              style={{ color: "var(--text-muted)" }}
            >
              142 MB
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

      <Group label="Currencies">
        <Card className="p-4">
          <div
            className="text-[13px] font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Custom Currencies
          </div>

          <div className="space-y-2 mb-4">
            {Object.keys(customRates).length === 0 ? (
              <div className="text-xs py-1" style={{ color: "var(--text-muted)" }}>
                No custom currencies added yet.
              </div>
            ) : (
              Object.entries(customRates).map(([code, rate]) => (
                <div
                  key={code}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {code}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      1 CAD = {rate} {code}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteCustomCurrency(code)}
                    className="p-1 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer"
                    style={{ color: "var(--red)" }}
                    aria-label={`Delete ${code}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Code (e.g. AED)"
              value={newCode}
              onChange={(e) =>
                setNewCode(e.target.value.toUpperCase().slice(0, 3))
              }
              className="px-3 h-10 rounded-xl text-sm font-medium outline-none bg-[var(--surface-raised)] border border-[var(--border-subtle)] w-28 uppercase"
              style={{ color: "var(--text-primary)" }}
            />
            <input
              type="text"
              placeholder="Rate vs CAD (e.g. 2.7)"
              value={newRate}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                setNewRate(cleaned);
              }}
              className="flex-1 px-3 h-10 rounded-xl text-sm font-medium outline-none bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={handleAdd}
              className="flex items-center justify-center p-2.5 h-10 rounded-xl text-white hover:opacity-90 active:scale-[0.96] transition-transform cursor-pointer"
              style={{ backgroundColor: "var(--accent-violet)" }}
              aria-label="Add custom currency"
            >
              <Plus size={16} />
            </button>
          </div>
          {error && (
            <div className="text-[11px] mt-1.5" style={{ color: "var(--red)" }}>
              {error}
            </div>
          )}
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
          <Divider />
          <Row label="GitHub" icon={<Github size={15} />} chevron />
        </Card>
      </Group>
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
