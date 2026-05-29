import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Usando require para evitar conflitos de TS/ESM com pacotes CommonJS
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

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
  const chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if (currentChunk.length + p.length > maxTokens * 4) {
      chunks.push(currentChunk.trim());
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
      console.log(`Ignorando ${fileName}: Formato não suportado.`);
      return;
    }

    if (!text.trim()) return;

    const chunks = chunkText(text);
    console.log(`Processando ${fileName}: ${chunks.length} chunks.`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding using Gemini with robust retry logic
      let response;
      let retries = 5;
      let delay = 15000; // 15 seconds initial wait
      while (retries > 0) {
        try {
          response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: chunk,
            config: { outputDimensionality: 768 }
          });
          break;
        } catch (e: any) {
          const errMsg = e.message || '';
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || JSON.stringify(e).includes('429')) {
            console.log(`[Rate Limit] Atingido para ${fileName} chunk ${i+1}. Aguardando ${delay}ms e tentando novamente...`);
            await sleep(delay);
            retries--;
            delay *= 2; // Exponential backoff
          } else {
            throw e;
          }
        }
      }

      if (!response) {
        throw new Error(`Falha ao gerar embedding para chunk ${i+1} de ${fileName} após várias tentativas.`);
      }
      
      const embedding = response.embeddings[0].values;

      // Insert into Supabase
      const { error } = await supabase.from('documents').insert({
        content: chunk.replace(/\u0000/g, ''),
        metadata: { file: fileName, chunk: i + 1, totalChunks: chunks.length, path: filePath.replace(DOCS_DIR, '') },
        embedding: embedding
      });

      if (error) {
        console.error(`Erro ao inserir chunk ${i} de ${fileName}:`, error.message);
      }

      // Adicionar delay base de 4 segundos (15 RPM max)
      await sleep(4000);
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

async function main() {
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

  console.log(`Encontrados ${allFiles.length} arquivos/pastas. Iniciando ingestão...`);
  for (const filePath of allFiles) {
    await processFile(filePath);
  }
  console.log("Ingestão completa!");
}

main();
