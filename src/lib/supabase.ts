import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gexddwphsxjesdekqaft.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_C4qCylQQy67cZIttpp_ipA_RoRgnq7b";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
