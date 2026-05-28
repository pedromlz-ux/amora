import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: Variáveis de ambiente faltando no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Deletando todos os registros da tabela 'documents' no Supabase...");
  const { error } = await supabase
    .from('documents')
    .delete()
    .neq('id', -1);
    
  if (error) {
    console.error("Erro ao limpar a tabela:", error.message);
  } else {
    console.log("✅ Tabela 'documents' limpa com sucesso!");
  }
}

main();
