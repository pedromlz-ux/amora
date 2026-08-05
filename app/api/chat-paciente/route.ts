import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service role to get the diet plan
const geminiApiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export async function POST(req: Request) {
  try {
    const { messages, dietPlanId } = await req.json();

    if (!dietPlanId) {
      return NextResponse.json({ error: "ID da dieta é obrigatório" }, { status: 400 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    // 1. Fetch the diet plan details
    const { data: dietPlan, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', dietPlanId)
      .single();

    if (error || !dietPlan) {
      console.error("Erro ao buscar dieta do paciente:", error);
      return NextResponse.json({ error: "Plano de dieta não encontrado" }, { status: 404 });
    }

    // 2. Format the diet plan details for the AI prompt
    const patientName = dietPlan.patient_name || 'Paciente';
    const planName = dietPlan.plan_name || 'Plano Alimentar';
    const dietNotes = dietPlan.diet_notes || 'Nenhuma observação geral.';
    const mealsList = dietPlan.meals || [];
    
    let mealsContext = '';
    mealsList.forEach((m: any, idx: number) => {
      mealsContext += `\n- Refeição ${idx + 1}: ${m.name || 'Sem nome'} (${m.time || 'Sem horário'})\n`;
      if (m.notes) mealsContext += `  Observações: ${m.notes}\n`;
      mealsContext += `  Alimentos:\n`;
      if (m.items && m.items.length > 0) {
        m.items.forEach((item: any) => {
          mealsContext += `    * ${item.description} - ${item.amount_g || item.amount || ''} ${item.unit || 'g'} (Kcal: ${item.energy_kcal || '-'}, Prot: ${item.protein_g || '-'}g, Carb: ${item.carbohydrate_g || '-'}g, Gordura: ${item.lipid_g || '-'}g)\n`;
        });
      } else {
        mealsContext += `    * Nenhum alimento adicionado ainda.\n`;
      }
    });

    const macrosContext = dietPlan.macros 
      ? `Carboidratos: ${dietPlan.macros.carb}%, Proteínas: ${dietPlan.macros.prot}%, Gorduras: ${dietPlan.macros.fat}%`
      : 'Não configurado';

    // 3. Build system instruction with full diet context
    const systemInstruction = `Você é a Amora, a assistente virtual inteligente da clínica Amora Genômica e Nutrição.
Sua missão é ajudar e orientar o(a) paciente ${patientName} tirando todas as dúvidas sobre o plano alimentar dele(a).

INFORMAÇÕES DO PACIENTE E DIETA:
- Paciente: ${patientName}
- Título do Plano: ${planName}
- Observações do Nutricionista: ${dietNotes}
- Divisão Geral de Macros: ${macrosContext}
- Refeições Planejadas:
${mealsContext}

DIRETRIZES DE ATENDIMENTO:
1. Responda de forma empática, profissional, prestativa e motivadora. Você representa o consultório de nutrição.
2. Dê respostas curtas, claras e práticas para o dia a dia do paciente.
3. Se o paciente perguntar sobre substituição de algum alimento (ex: trocar batata doce por arroz integral ou mandioca; trocar frango por peixe ou ovos), explique como fazer isso mantendo equivalência aproximada de carboidratos/proteínas e de porções. Seja prático!
4. Se o paciente perguntar sobre alimentos que não estão na dieta, oriente se é seguro consumir (com moderação) ou sugira alternativas equivalentes já presentes no plano.
5. Sempre lembre o paciente de que você é uma inteligência artificial e que ele também pode deixar uma mensagem na aba de contato para o nutricionista validar caso queira um ajuste definitivo no plano.
`;

    // 4. Transform history to Gemini format
    const contents = messages.map((m: any) => {
      const parts: any[] = [];
      if (m.content) parts.push({ text: m.content });
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    // 5. Call Gemini stream
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] }
      }
    });

    // 6. Return Streaming response
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
    console.error('API Route Error (Paciente):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
