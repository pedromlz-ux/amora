import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Using service role key to bypass RLS for this backend query
const geminiApiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;

    // 1. Gerar o embedding da pergunta do usuário
    const embedResponse = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: lastMessage,
      config: { outputDimensionality: 768 }
    });
    
    const queryEmbedding = embedResponse.embeddings[0].values;

    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.4, // Configuração otimizada para Gemini
      match_count: 5 
    });

    if (error) {
      console.error("Erro na busca no Supabase:", error);
    }
    
    console.log("Documents found in Supabase:", documents?.length || 0);
    console.log("Supabase error (if any):", error);
    
    const fs = require('fs');
    fs.writeFileSync('/Users/pm/Novo Chat amora/supabase_debug.json', JSON.stringify({
        documentsLength: documents?.length || 0,
        error: error,
        queryEmbeddingLength: queryEmbedding?.length
    }, null, 2));

    // 3. Montar o contexto para a Amora
    let contextString = "";
    if (documents && documents.length > 0) {
      contextString = documents.map((doc: any) => `[Fonte: ${doc.metadata.file}]: ${doc.content}`).join('\n\n');
    }

    const systemInstruction = `Você é a Amora, uma assistente de IA premium focada em nutrição e genômica.
Sua missão é responder às perguntas do usuário usando EXCLUSIVAMENTE o contexto interno fornecido abaixo.
Se a resposta não estiver no contexto, diga gentilmente que você não possui essa informação na sua base de conhecimento atual.
Seja sempre profissional, embasada na ciência, empática e adote a identidade da Amora.

CONTEXTO INTERNO DA BASE DE CONHECIMENTO (Memória da Amora):
---
${contextString || "Nenhuma informação relevante encontrada na memória local para esta pergunta."}
---
`;

    // 4. Transformar o histórico para o formato do Gemini
    const contents = messages.map((m: any) => {
      const parts: any[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.inlineData) parts.push({ inlineData: m.inlineData });
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    // Inserimos a instrução de sistema na primeira mensagem (ou configuramos no modelo)
    // Usando Gemini 2.5 Flash apenas com a base local
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] }
      }
    });

    // 5. Retornar um Streaming de resposta para o frontend
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              const text = chunk.text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
