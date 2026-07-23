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
  receipt_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing tables
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_urls TEXT[];

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

-- Enable Row Level Security (RLS) policies for authenticated users
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

-- Clean up old public access policies
DROP POLICY IF EXISTS "Allow public access transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public access wallets" ON public.wallets;
DROP POLICY IF EXISTS "Allow public access wallet_spends" ON public.wallet_spends;
DROP POLICY IF EXISTS "Allow public access budget_limits" ON public.budget_limits;

-- Create authenticated policies (resolves Supabase RLS Policy Always True warnings)
CREATE POLICY "Allow authenticated transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated wallets" ON public.wallets FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated wallet_spends" ON public.wallet_spends FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated budget_limits" ON public.budget_limits FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);


