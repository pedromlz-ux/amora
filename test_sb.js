const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDb() {
  const { data, error, count } = await sb.from('documents').select('id', { count: 'exact', head: true });
  console.log('Count:', count);
  console.log('Error:', error);
}

checkDb();
