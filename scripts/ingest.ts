import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Usando require para evitar conflitos de TS/ESM com pacotes CommonJS
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Silenciar avisos ruidosos de TrueType fonts internos do pdf.js
const origLog = console.log;
console.log = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning: TT:')) return;
  origLog(...args);
};

// Load environment variables manually since we might run this via tsx outside Next.js
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error("ERRO: Variáveis de ambiente faltando no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const DOCS_DIR = path.join(process.cwd(), 'documentos_treinamento');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to chunk text
function chunkText(text: string, maxTokens = 1000) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if (currentChunk.length + p.length > maxTokens * 4) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += p + '\n\n';
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

async function processFile(filePath: string) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  let text = '';

  // Ignorar arquivos de sistema como .DS_Store
  if (fileName.startsWith('.') || fileName.startsWith('~$')) return;

  try {
    // 1. Verificar quais chunks deste arquivo já foram salvos no Supabase
    const { data: existingChunks, error: checkError } = await supabase
      .from('documents')
      .select('metadata')
      .eq('metadata->>file', fileName);

    if (checkError) {
      console.warn(`⚠️ Aviso ao verificar duplicatas para ${fileName}:`, checkError.message);
    }

    const savedChunkNumbers = new Set<number>(
      (existingChunks || [])
        .map((doc: any) => Number(doc.metadata?.chunk))
        .filter((n: number) => !isNaN(n) && n > 0)
    );

    // Extrair texto do arquivo
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.txt' || ext === '.md' || ext === '.csv') {
      text = fs.readFileSync(filePath, 'utf-8');
    } else {
      console.log(`⏭️ Ignorando ${fileName}: Formato não suportado.`);
      return;
    }

    if (!text.trim()) return;

    const chunks = chunkText(text);

    // Se todos os chunks já estiverem no banco, pula o arquivo inteiro
    if (chunks.length > 0 && savedChunkNumbers.size >= chunks.length) {
      console.log(`⏭️ Pula ${fileName}: todos os ${chunks.length} chunks já estão salvos.`);
      return;
    }

    if (savedChunkNumbers.size > 0) {
      console.log(`🔄 Retomando ${fileName}: ${savedChunkNumbers.size}/${chunks.length} chunks já salvos. Inserindo restantes...`);
    } else {
      console.log(`📄 Processando ${fileName}: ${chunks.length} chunks.`);
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunkNumber = i + 1;
      if (savedChunkNumbers.has(chunkNumber)) {
        continue; // Já inserido anteriormente
      }

      const chunk = chunks[i];
      if (!chunk || !chunk.trim()) {
        console.log(`[Pulo] Chunk vazio em ${fileName} na posição ${chunkNumber}`);
        continue;
      }

      // Generate embedding using Gemini with robust retry logic
      let response: any;
      let retries = 5;
      let delay = 15000;
      while (retries > 0) {
        try {
          response = await ai.models.embedContent({
            model: 'gemini-embedding-2',
            contents: chunk,
            config: { outputDimensionality: 768 }
          });
          break;
        } catch (e: any) {
          const errMsg = e?.message || JSON.stringify(e);
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || JSON.stringify(e).includes('429')) {
            console.log(`⏳ [Rate Limit Gemini] Atingido para ${fileName} chunk ${chunkNumber}. Aguardando ${Math.round(delay/1000)}s...`);
            await sleep(delay);
            retries--;
            delay = Math.min(delay * 2, 60000);
          } else {
            throw e;
          }
        }
      }

      if (!response || !response.embeddings || !response.embeddings[0]) {
        throw new Error(`Falha ao gerar embedding para chunk ${chunkNumber} de ${fileName} após várias tentativas.`);
      }

      const embedding = response.embeddings[0].values;

      // Insert into Supabase com retry logic
      let insertSuccess = false;
      let insertRetries = 3;
      let insertDelay = 2000;

      while (insertRetries > 0 && !insertSuccess) {
        try {
          const { error: insertError } = await supabase.from('documents').insert({
            content: chunk.replace(/\u0000/g, ''),
            metadata: {
              file: fileName,
              chunk: chunkNumber,
              totalChunks: chunks.length,
              path: filePath.replace(DOCS_DIR, '')
            },
            embedding: embedding
          });

          if (insertError) {
            throw insertError;
          }
          insertSuccess = true;
        } catch (dbErr: any) {
          insertRetries--;
          console.warn(`⚠️ Falha ao salvar chunk ${chunkNumber} de ${fileName} no Supabase: ${dbErr.message || dbErr}. Tentativas restantes: ${insertRetries}`);
          if (insertRetries > 0) {
            await sleep(insertDelay);
            insertDelay *= 2;
          } else {
            console.error(`❌ Erro definitivo ao salvar chunk ${chunkNumber} de ${fileName}. Interrompendo arquivo para evitar dados incompletos.`);
            return;
          }
        }
      }

      // Intervalo base para respeitar limite da API do Gemini (Free Tier: 15 RPM ~ 1 req/4s)
      const baseDelay = Number(process.env.RATE_LIMIT_DELAY_MS) || 3000;
      await sleep(baseDelay);
    }
    console.log(`✅ Concluído: ${fileName}`);
  } catch (err: any) {
    console.error(`❌ Erro processando ${fileName}:`, err.message || err);
  }
}

// Helper to recursively find files in a directory
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

async function preflightCheck(): Promise<boolean> {
  console.log("🔍 Verificando status dos serviços...");

  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';

  // 1. Testar Supabase
  try {
    const { error } = await supabase.from('documents').select('id').limit(1);
    if (error) {
      const msg = error.message || JSON.stringify(error);
      if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('Failed to fetch')) {
        console.error("\n❌ ERRO DE CONEXÃO COM O SUPABASE:");
        console.error("Não foi possível conectar ao endpoint do Supabase.");
        console.error("Motivo principal: O projeto está PAUSADO no Supabase (projetos no plano Free pausam após inatividade).");
        if (projectRef) {
          console.error(`\n👉 Acesse o painel para reativar o projeto:`);
          console.error(`   https://supabase.com/dashboard/project/${projectRef}`);
          console.error(`   Clique no botão "Restore Project" para acordar o banco de dados.\n`);
        }
        return false;
      }
      console.error("\n❌ ERRO NA VERIFICAÇÃO DO SUPABASE:", error.message);
      if (error.message.includes('Invalid API key') || error.message.includes('JWT') || error.message.includes('Unauthorized')) {
        console.error("A chave SUPABASE_SERVICE_ROLE_KEY no .env.local é inválida ou expirou.");
        console.error("Certifique-se de usar a chave 'service_role' (JWT que inicia com 'eyJ...') do Supabase Dashboard > Project Settings > API.\n");
      }
      return false;
    } else {
      console.log("✅ Supabase: Conectado com sucesso!");
    }
  } catch (err: any) {
    console.error("\n❌ ERRO AO CONECTAR COM SUPABASE:", err.message || err);
    if (projectRef) {
      console.error(`👉 Verifique se o projeto está ativo em: https://supabase.com/dashboard/project/${projectRef}\n`);
    }
    return false;
  }

  // 2. Testar Gemini API
  try {
    await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: "ping",
      config: { outputDimensionality: 768 }
    });
    console.log("✅ Gemini API: Conectado com sucesso!");
  } catch (err: any) {
    console.error("\n❌ ERRO NA API DO GEMINI:", err.message || err);
    return false;
  }

  return true;
}

async function main() {
  const isHealthy = await preflightCheck();
  if (!isHealthy) {
    console.error("⛔ Ingestão abortada porque um dos serviços não está acessível.");
    process.exit(1);
  }

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR);
    console.log(`A pasta ${DOCS_DIR} foi criada. Coloque seus arquivos nela e rode o script novamente.`);
    return;
  }

  const allFiles = getAllFiles(DOCS_DIR);
  if (allFiles.length === 0) {
    console.log(`A pasta ${DOCS_DIR} está vazia. Adicione PDFs ou arquivos TXT.`);
    return;
  }

  console.log(`\n📚 Encontrados ${allFiles.length} arquivos. Iniciando ingestão com segurança...`);
  for (const filePath of allFiles) {
    await processFile(filePath);
  }
  console.log("\n🎉 Ingestão completa com sucesso!");
}

main();
