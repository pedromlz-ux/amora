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
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: "Não autorizado. Faça login." }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    // Rate Limit Enforcement
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const plan = usageData?.plan || 'free';
    const count = usageData?.questions_count || 0;
    
    let limit = 30;
    if (plan === 'admin') limit = Infinity;
    else if (plan === 'ultra') limit = 200;
    else if (plan === 'premium') limit = 300;

    if (count >= limit) {
      return NextResponse.json({ 
        error: `Você atingiu o limite de ${limit} perguntas do plano ${plan}. Faça upgrade para continuar.` 
      }, { status: 403 });
    }

    // Increment count before heavy processing
    if (usageData) {
      await supabase.from('user_usage').update({ questions_count: count + 1 }).eq('user_id', user.id);
    } else if (!usageData) {
      await supabase.from('user_usage').insert({ user_id: user.id, plan: 'free', questions_count: 1 });
    }

    const { messages } = await req.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;

    // 1. Gerar o embedding da pergunta do usuário
    const embedResponse = await ai.models.embedContent({
      model: 'gemini-embedding-2',
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
    


    // 3. Montar o contexto para a Amora
    let contextString = "";
    if (documents && documents.length > 0) {
      contextString = documents.map((doc: any) => `[Fonte: ${doc.metadata.file}]: ${doc.content}`).join('\n\n');
    }

    const systemInstruction = `Você é a Amora, uma assistente de IA premium focada em nutrição, genômica e saúde.
Sua missão é responder às dúvidas do usuário da forma mais completa, científica e prestativa possível.

DIRETRIZES DE RESPOSTA:
1. Priorize sempre as informações contidas no CONTEXTO INTERNO fornecido abaixo, que representa a base de conhecimento oficial da Amora (estudos clínicos, polimorfismos, diretrizes de conduta, tabelas, etc.).
2. Caso o usuário pergunte por conceitos básicos ou gerais (ex: "o que é néfron?", "o que é polimorfismo?") e a definição exata ou o conceito básico não esteja totalmente detalhado no CONTEXTO INTERNO, você DEVE utilizar o seu próprio conhecimento médico/científico geral para fornecer uma definição concisa e clara sobre o assunto.
3. Em seguida, conecte e complemente essa definição básica de forma orgânica com os detalhes científicos, estudos clínicos e informações específicas que estão presentes no CONTEXTO INTERNO (ex: explicando os tipos de néfrons do contexto ou a sua localização renal).
4. Mantenha sempre a identidade acolhedora da Amora, sendo científica, embasada, empática e altamente profissional. Evite recusar respostas a termos básicos; complemente e enriqueça as definições científicas utilizando a memória local.

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
