const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://gexddwphsxjesdekqaft.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C4qCylQQy67cZIttpp_ipA_RoRgnq7b";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanMockData() {
  console.log('Cleaning mock data from Supabase...');
  
  // 1. Delete test wallets
  const { data: wallets } = await supabase.from('wallets').select('*');
  let deletedWallets = 0;
  if (wallets) {
    for (const w of wallets) {
      if (w.name.includes('Test Wallet') || w.name === 'EUR Wallet' || w.name === 'JPY Wallet') {
        await supabase.from('wallets').delete().eq('id', w.id);
        deletedWallets++;
      }
    }
  }

  // 2. Delete test transactions (the ones starting with "Conversion" or specific amounts)
  const { data: txs } = await supabase.from('transactions').select('*');
  let deletedTxs = 0;
  if (txs) {
    for (const tx of txs) {
      if (
        tx.merchant.includes('Conversion') ||
        tx.merchant.includes('Test') ||
        tx.merchant === 'Deposit'
      ) {
        await supabase.from('transactions').delete().eq('id', tx.id);
        deletedTxs++;
      }
    }
  }

  // 3. Delete test spends
  const { data: spends } = await supabase.from('wallet_spends').select('*');
  let deletedSpends = 0;
  if (spends) {
    for (const spend of spends) {
      if (spend.note?.includes('Test') || spend.note?.includes('Conversion')) {
        await supabase.from('wallet_spends').delete().eq('id', spend.id);
        deletedSpends++;
      }
    }
  }

  console.log(`Deleted ${deletedWallets} wallets, ${deletedTxs} transactions, ${deletedSpends} wallet spends.`);
}

cleanMockData();
