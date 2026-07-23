const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://gexddwphsxjesdekqaft.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C4qCylQQy67cZIttpp_ipA_RoRgnq7b";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanSpecific() {
  console.log('Cleaning specific mock data...');
  const idsToDelete = [
    "tx-16ylqep", // Conversion from EUR (150 JPY)
    "tx-i7pclml", // Conversion to JPY (-100 EUR)
    "tx-cedgrqq", // Deposit (1000 EUR)
    "tx-q1uo7y0", // Conversion to JPY (-100 EUR)
  ];
  
  for (const id of idsToDelete) {
    await supabase.from('transactions').delete().eq('id', id);
  }
  
  console.log('Done!');
}

cleanSpecific();
