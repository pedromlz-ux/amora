import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { isNonEmptyString, requestIsTooLarge } from '../../lib/server/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export const maxDuration = 300; 

export async function POST(req: Request) {
  try {
    if (requestIsTooLarge(req, 256 * 1024)) {
      return NextResponse.json({ error: 'Solicitação excede o limite permitido.' }, { status: 413 });
    }
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const { transcription = '', notes = '', patientData, patientId, currentConsultationId, type = 'structured' } = await req.json();
    const isEvolution = type === 'evolution';
    if ((!isEvolution && !isNonEmptyString(transcription, 80_000)) ||
      (isEvolution && (typeof transcription !== 'string' || transcription.length > 80_000 || typeof notes !== 'string' || notes.length > 10_000))) {
      return NextResponse.json({ error: "Transcrição ausente." }, { status: 400 });
    }

    let prompt = '';
    
    if (isEvolution) {
      if (typeof patientId !== 'string' || typeof currentConsultationId !== 'string') {
        return NextResponse.json({ error: 'Dados da consulta inválidos.' }, { status: 400 });
      }

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .eq('nutritionist_id', user.id)
        .maybeSingle();
      if (patientError) throw patientError;
      if (!patient) return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });

      const { data: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('id, created_at, consultation_records(raw_transcription, additional_notes, structured_report)')
        .eq('patient_id', patient.id)
        .eq('user_id', user.id)
        .neq('id', currentConsultationId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (consultationsError) throw consultationsError;

      const previous = (consultations || [])
        .filter((consultation: any) => Array.isArray(consultation.consultation_records) && consultation.consultation_records.length > 0)
        .slice(0, 2);
      if (previous.length === 0) {
        return NextResponse.json({ error: 'Não há consultas anteriores salvas para analisar.' }, { status: 400 });
      }

      const previousContext = previous.map((consultation: any, index: number) => {
        const record = consultation.consultation_records[0];
        const report = typeof record.structured_report === 'string' ? record.structured_report : JSON.stringify(record.structured_report || '');
        return `CONSULTA ANTERIOR ${index + 1} (${consultation.created_at}):\nRelatório: ${report.slice(0, 12_000)}\nTranscrição: ${(record.raw_transcription || '').slice(0, 12_000)}\nObservações: ${(record.additional_notes || '').slice(0, 4_000)}`;
      }).join('\n\n---\n\n');

      prompt = `Você é uma nutricionista clínica analisando a evolução longitudinal de um paciente. Compare as duas consultas anteriores abaixo com o atendimento atual. Em markdown, responda somente com: 1. Evoluções positivas; 2. Pontos que persistem ou pioraram; 3. Comparação de sintomas, hábitos e adesão; 4. Pontos para investigar na consulta atual; 5. Sugestão de continuidade de conduta. Seja factual, não invente dados e deixe explícito quando não houver informação suficiente.

${previousContext}

ATENDIMENTO ATUAL:
Transcrição: ${transcription || 'Ainda não preenchida.'}
Observações: ${notes || 'Ainda não preenchidas.'}
Dados clínicos: Alergias: ${patientData?.allergies || 'N/A'}; Doenças crônicas: ${patientData?.chronic_diseases || 'N/A'}.`;
    } else if (type === 'synthetic') {
      prompt = `Abaixo está a transcrição de uma consulta nutricional/médica, juntamente com algumas observações do profissional e dados do paciente.
Gere um "Relatório IA Sintético", que é um resumo executivo direto ao ponto (em formato markdown) contendo apenas: 
- Queixa principal
- Resumo da conduta
- Pontos de alerta

Transcrição:
${transcription}

Observações do profissional:
${notes || 'Nenhuma.'}

Dados do Paciente:
CPF: ${patientData?.cpf || 'N/A'}
Alergias: ${patientData?.allergies || 'N/A'}
Doenças Crônicas: ${patientData?.chronic_diseases || 'N/A'}
`;
    } else {
      prompt = `Abaixo está a transcrição de uma consulta nutricional/médica, juntamente com observações do profissional e dados do paciente.
Gere uma "Transcrição Estruturada IA" (em formato markdown) detalhada, dividida em seções médicas/nutricionais profissionais. 
Use a seguinte estrutura de tópicos (se aplicável, omita se não tiver dados):
1. **Queixa Principal e Histórico (HDA)**
2. **Avaliação Clínica / Sintomas**
3. **Hábitos de Vida (Sono, Intestino, Atividade Física)**
4. **Histórico Alimentar**
5. **Hipóteses Diagnósticas / Avaliação**
6. **Conduta Adotada / Plano Alimentar**

Transcrição:
${transcription}

Observações do profissional:
${notes || 'Nenhuma.'}

Dados do Paciente:
CPF: ${patientData?.cpf || 'N/A'}
Alergias: ${patientData?.allergies || 'N/A'}
Doenças Crônicas: ${patientData?.chronic_diseases || 'N/A'}
`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
      config: {
        temperature: 0.3,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    return NextResponse.json({ report: responseText });

  } catch (error: any) {
    console.error('Erro na estruturação da consulta:', error);
    return NextResponse.json({ error: 'Erro interno ao estruturar a consulta.' }, { status: 500 });
  }
}
