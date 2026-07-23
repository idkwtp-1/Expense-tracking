const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://gexddwphsxjesdekqaft.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C4qCylQQy67cZIttpp_ipA_RoRgnq7b";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function nukeAll() {
  console.log('=== NUCLEAR CLEAN: Deleting ALL data from all tables ===\n');

  // 1. Delete all wallet_spends first (FK constraint)
  const { error: e1, count: c1 } = await supabase.from('wallet_spends').delete().neq('id', '___never___');
  console.log(`wallet_spends deleted. Error: ${e1 ? e1.message : 'none'}`);

  // 2. Delete all wallets
  const { error: e2 } = await supabase.from('wallets').delete().neq('id', '___never___');
  console.log(`wallets deleted. Error: ${e2 ? e2.message : 'none'}`);

  // 3. Delete all transactions
  const { error: e3 } = await supabase.from('transactions').delete().neq('id', '___never___');
  console.log(`transactions deleted. Error: ${e3 ? e3.message : 'none'}`);

  // Verify everything is gone
  const { data: txs } = await supabase.from('transactions').select('id');
  const { data: wallets } = await supabase.from('wallets').select('id');
  const { data: spends } = await supabase.from('wallet_spends').select('id');

  console.log(`\n=== VERIFICATION ===`);
  console.log(`Transactions remaining: ${txs?.length ?? 'error'}`);
  console.log(`Wallets remaining: ${wallets?.length ?? 'error'}`);
  console.log(`Wallet spends remaining: ${spends?.length ?? 'error'}`);
  console.log('\nDone. All tables are clean.');
}

nukeAll();
