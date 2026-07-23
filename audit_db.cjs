const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://gexddwphsxjesdekqaft.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C4qCylQQy67cZIttpp_ipA_RoRgnq7b";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function audit() {
  console.log('\n=== TRANSACTIONS ===');
  const { data: txs } = await supabase.from('transactions').select('*');
  console.log(JSON.stringify(txs, null, 2));

  console.log('\n=== WALLETS ===');
  const { data: wallets } = await supabase.from('wallets').select('*');
  console.log(JSON.stringify(wallets, null, 2));

  console.log('\n=== WALLET_SPENDS ===');
  const { data: spends } = await supabase.from('wallet_spends').select('*');
  console.log(JSON.stringify(spends, null, 2));

  console.log('\n=== BUDGET_LIMITS ===');
  const { data: budgets } = await supabase.from('budget_limits').select('*');
  console.log(JSON.stringify(budgets, null, 2));
}

audit();
