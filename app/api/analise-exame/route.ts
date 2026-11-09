import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { isNonEmptyString, requestIsTooLarge } from '../../lib/server/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export async function POST(req: Request) {
  try {
    if (requestIsTooLarge(req, 8 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Arquivo excede o limite de 8 MB.' }, { status: 413 });
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

    const { fileData, fileName, fileType } = await req.json();
    if (!isNonEmptyString(fileData, 7 * 1024 * 1024) || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(fileType)) {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    // Split base64 prefix if exists
    const base64Part = fileData.includes(',') ? fileData.split(',')[1] : fileData;

    const prompt = `Analise a imagem/documento anexado que representa um laudo de exame laboratorial (sangue, urina, etc.) ou um exame de bioimpedância.
Extraia as informações reais presentes no laudo e gere:
1. Um resumo curto e objetivo (summary) de até 80 caracteres contendo a principal descoberta (ex: "Massa muscular adequada e gordura ideal" ou "Glicose dentro da meta e Colesterol limítrofe").
2. Um detalhamento (details) completo, científico e humanizado sobre as métricas identificadas no exame (como massa magra, gordura, água corporal se for bioimpedância; ou glicemia, colesterol, triglicerídeos, insulina, HOMA se for exame de sangue). Se for bioimpedância, fale explicitamente sobre a massa muscular e gordura corporal. Se for exame laboratorial, descreva as taxas. Seja fiel APENAS ao que está escrito na imagem. Não invente dados de outros exames (por exemplo, se for bioimpedância, NÃO fale sobre LDL ou perfil lipídico).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: fileType,
            data: base64Part
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING" },
            details: { type: "STRING" }
          },
          required: ["summary", "details"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    const result = JSON.parse(responseText);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Erro na análise de exame:', error);
    return NextResponse.json({ error: 'Erro interno ao analisar o exame.' }, { status: 500 });
  }
}
