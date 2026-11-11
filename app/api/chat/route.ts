import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedUser, getServiceSupabase, isNonEmptyString, requestIsTooLarge } from '../../lib/server/security';

const geminiApiKey = process.env.GEMINI_API_KEY!;

const ai = new GoogleGenAI({ apiKey: geminiApiKey });
const MAX_STORED_MESSAGES = 120;
const MAX_MODEL_CONTEXT_MESSAGES = 40;

/**
 * Os documentos são contexto privado da Amora. Mesmo com a instrução ao modelo,
 * removemos eventuais citações que possam escapar na resposta final.
 */
function removeInternalSources(text: string) {
  return text
    .replace(/\s*\[(?:fonte|source|refer[eê]ncia)\s*:\s*[^\]\r\n]+\]/gi, '')
    .replace(/\s*\((?:fonte|source|refer[eê]ncia)\s*:\s*[^)\r\n]+\)/gi, '')
    .replace(/^\s*(?:[-*•]\s*)?(?:fonte|source|refer[eê]ncia)(?:s)?\s*(?:utilizada)?\s*:\s*.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function consumeChatQuotaWithCompatibilityFallback(supabase: ReturnType<typeof getServiceSupabase>, userId: string) {
  const { data, error } = await supabase.rpc('consume_chat_quota', { p_user_id: userId });
  const quota = Array.isArray(data) ? data[0] : data;
  if (!error && quota) return quota;

  // Compatibilidade temporária para bancos que ainda executam a versão antiga
  // da função SQL, cuja coluna de retorno "questions_count" é ambígua.
  if (!/questions_count.*ambiguous|column reference.*ambiguous/i.test(error?.message || '')) {
    throw error || new Error('Falha ao verificar limite de uso.');
  }

  const { data: usage, error: usageError } = await supabase
    .from('user_usage')
    .select('plan, questions_count')
    .eq('user_id', userId)
    .maybeSingle();
  if (usageError) throw usageError;

  const plan = usage?.plan || 'free';
  const questionLimit = plan === 'admin' ? null : plan === 'ultra' ? 200 : plan === 'premium' ? 300 : 30;
  const questionsCount = usage?.questions_count || 0;
  if (questionLimit !== null && questionsCount >= questionLimit) {
    return { allowed: false, plan, question_limit: questionLimit };
  }

  const { error: updateError } = await supabase.from('user_usage').upsert({
    user_id: userId,
    plan,
    questions_count: questionsCount + 1,
  }, { onConflict: 'user_id' });
  if (updateError) throw updateError;
  return { allowed: true, plan, question_limit: questionLimit };
}

export async function POST(req: Request) {
  try {
    if (requestIsTooLarge(req, 6 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Solicitação excede o limite permitido.' }, { status: 413 });
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado. Faça login." }, { status: 401 });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_STORED_MESSAGES || !messages.every((message) =>
      isNonEmptyString(message?.content, 4_000) &&
      (!message.inlineData || (
        typeof message.inlineData.data === 'string' && message.inlineData.data.length <= 4 * 1024 * 1024 &&
        ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(message.inlineData.mimeType)
      ))
    )) {
      return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const quota = await consumeChatQuotaWithCompatibilityFallback(supabase, user.id);
    if (!quota.allowed) {
      return NextResponse.json({
        error: `Você atingiu o limite de ${quota.question_limit} perguntas do plano ${quota.plan}. Faça upgrade para continuar.`,
      }, { status: 403 });
    }

    const lastMessage = messages[messages.length - 1].content;
    // A conversa inteira continua salva no prontuário do chat, mas enviamos ao
    // modelo apenas a janela recente para impedir que uma conversa longa pare
    // de aceitar mensagens por excesso de contexto ou de payload.
    const recentMessages = messages.slice(-MAX_MODEL_CONTEXT_MESSAGES);

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
      // Não enviamos nomes de arquivos ao modelo: eles são metadados internos e
      // não devem aparecer para quem está conversando com a Amora.
      contextString = documents.map((doc: any) => doc.content).join('\n\n');
    }

    const systemInstruction = `Você é a Amora, uma assistente de IA premium focada em nutrição, genômica e saúde.
Sua missão é responder às dúvidas do usuário da forma mais completa, científica e prestativa possível.

DIRETRIZES DE RESPOSTA:
1. Priorize sempre as informações contidas no CONTEXTO INTERNO fornecido abaixo, que representa a base de conhecimento oficial da Amora (estudos clínicos, polimorfismos, diretrizes de conduta, tabelas, etc.).
2. Caso o usuário pergunte por conceitos básicos ou gerais (ex: "o que é néfron?", "o que é polimorfismo?") e a definição exata ou o conceito básico não esteja totalmente detalhado no CONTEXTO INTERNO, você DEVE utilizar o seu próprio conhecimento médico/científico geral para fornecer uma definição concisa e clara sobre o assunto.
3. Em seguida, conecte e complemente essa definição básica de forma orgânica com os detalhes científicos, estudos clínicos e informações específicas que estão presentes no CONTEXTO INTERNO (ex: explicando os tipos de néfrons do contexto ou a sua localização renal).
4. Mantenha sempre a identidade acolhedora da Amora, sendo científica, embasada, empática e altamente profissional. Evite recusar respostas a termos básicos; complemente e enriqueça as definições científicas utilizando a memória local.
5. O CONTEXTO INTERNO é confidencial. Nunca mencione, cite, liste ou revele fontes, nomes de arquivos, aulas, documentos, bases de conhecimento, referências internas ou trechos como “Fonte: ...”. Apenas apresente a resposta de forma natural e direta.

CONTEXTO INTERNO DA BASE DE CONHECIMENTO (Memória da Amora):
---
${contextString || "Nenhuma informação relevante encontrada na memória local para esta pergunta."}
---
`;

    // 4. Transformar o histórico para o formato do Gemini
    const contents = recentMessages.map((m: any) => {
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
          let pendingText = '';
          for await (const chunk of responseStream) {
            if (chunk.text) {
              pendingText += chunk.text;

              // Mantém a última linha em memória para que uma citação nunca seja
              // exibida pela metade quando o Gemini separa o texto em chunks.
              const lastNewLine = pendingText.lastIndexOf('\n');
              if (lastNewLine !== -1) {
                const completeLines = pendingText.slice(0, lastNewLine + 1);
                pendingText = pendingText.slice(lastNewLine + 1);
                const cleanText = removeInternalSources(completeLines);
                if (cleanText) controller.enqueue(new TextEncoder().encode(`${cleanText}\n`));
              }
            }
          }
          const cleanText = removeInternalSources(pendingText);
          if (cleanText) controller.enqueue(new TextEncoder().encode(cleanText));
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
