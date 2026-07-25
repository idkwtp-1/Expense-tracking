-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  merchant TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  wallet_id TEXT,
  foreign_amount NUMERIC,
  foreign_currency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  foreign_currency TEXT NOT NULL,
  total_foreign_funded NUMERIC NOT NULL DEFAULT 0,
  remaining_foreign NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Spends table
CREATE TABLE IF NOT EXISTS public.wallet_spends (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  foreign_amount NUMERIC NOT NULL,
  note TEXT,
  category_tag TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Limits table
CREATE TABLE IF NOT EXISTS public.budget_limits (
  category_id TEXT PRIMARY KEY,
  limit_amount NUMERIC NOT NULL
);

-- Enable Row Level Security (RLS) policies for public key
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access wallets" ON public.wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access wallet_spends" ON public.wallet_spends FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access budget_limits" ON public.budget_limits FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for instant phone <-> desktop sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_spends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_limits;
