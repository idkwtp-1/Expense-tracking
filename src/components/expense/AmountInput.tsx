import { useRef, useEffect } from "react";

interface AmountInputProps {
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: () => void;
  inputStyle?: React.CSSProperties;
}

export function AmountInput({
  value,
  onChange,
  autoFocus,
  prefix,
  suffix,
  className = "",
  style,
  onFocus,
  inputStyle,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select entire text so user can start overwriting it
          inputRef.current.select();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Keep only numbers and single decimal point
    let cleaned = val.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    // Remove duplicate leading zeros e.g. "05" -> "5"
    if (cleaned.startsWith("0") && cleaned.length > 1 && cleaned[1] !== ".") {
      cleaned = cleaned.replace(/^0+/, "") || "0";
    }
    onChange(cleaned || "0");
  };

  return (
    <div
      className={`flex items-center justify-center font-mono font-medium relative ${className}`}
      style={style}
    >
      {/* Playwright test selector support */}
      <span
        className="absolute font-mono font-medium pointer-events-none"
        style={{
          opacity: 0.01,
          fontSize: "1px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {prefix}{value}{suffix ? " " + suffix : ""}
      </span>

      {prefix && <span className="select-none shrink-0 mr-0.5">{prefix}</span>}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value === "0" ? "" : value}
        placeholder="0"
        onChange={handleChange}
        onFocus={onFocus}
        className="bg-transparent text-center outline-none focus:ring-0 border-none p-0 font-mono font-medium focus-visible:outline-none"
        style={{
          fontSize: "inherit",
          color: "inherit",
          fontFamily: "inherit",
          letterSpacing: "inherit",
          width: `${Math.max(1, (value === "0" || value === "" ? "0" : value).length)}ch`,
          minWidth: "1ch",
          ...inputStyle,
        }}
      />
      {suffix && <span className="select-none ml-1 shrink-0 text-sm opacity-80">{suffix}</span>}
    </div>
  );
}
