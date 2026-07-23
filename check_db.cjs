const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://gexddwphsxjesdekqaft.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C4qCylQQy67cZIttpp_ipA_RoRgnq7b";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDb() {
  console.log('--- TRANSACTIONS IN SUPABASE ---');
  const { data: txs } = await supabase.from('transactions').select('*');
  console.log(JSON.stringify(txs, null, 2));
}

checkDb();
