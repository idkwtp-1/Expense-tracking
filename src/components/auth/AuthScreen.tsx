import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, ArrowRight, ShieldCheck, UserPlus, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
      } else {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) throw signUpErr;

        if (signUpData.session) {
          setSuccess("Account created successfully! Logging you in...");
        } else {
          setSuccess("Account created! Check your email if confirmation is required, or sign in now.");
          setMode("signin");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#09090b" }}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--accent-violet, #7C3AED) 0%, transparent 70%)" }}
      />

      <div
        className="w-full max-w-md rounded-3xl p-7 relative z-10"
        style={{
          background: "rgba(24, 24, 27, 0.75)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-3 grid place-items-center"
            style={{
              background: "rgba(124, 58, 237, 0.15)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              color: "var(--accent-violet, #7C3AED)",
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SLPlayer Wallet</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted, #a1a1aa)" }}>
            Personal Expense &amp; Multi-Currency Tracker
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          className="flex p-1 rounded-2xl mb-6"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
        >
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "signin"
                ? "bg-[var(--accent-violet,#7C3AED)] text-white shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LogIn size={14} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-[var(--accent-violet,#7C3AED)] text-white shadow-lg"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserPlus size={14} />
            Create Account
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div
            className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-xs"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#f87171" }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-xs"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.25)", color: "#4ade80" }}
          >
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5 text-zinc-400">
              Email Address
            </label>
            <div
              className="flex items-center px-3.5 h-11 rounded-xl"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <Mail size={16} className="text-zinc-500 mr-2.5 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5 text-zinc-400">
              Password
            </label>
            <div
              className="flex items-center px-3.5 h-11 rounded-xl"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <Lock size={16} className="text-zinc-500 mr-2.5 shrink-0" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.985] disabled:opacity-50"
            style={{
              backgroundColor: "var(--accent-violet, #7C3AED)",
              boxShadow: "0 4px 20px rgba(124, 58, 237, 0.35)",
            }}
          >
            {loading ? (
              <span
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-zinc-500">
            Protected by Supabase Row Level Security &amp; End-to-End Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
