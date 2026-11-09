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

    const { fileData, fileType } = await req.json();
    if (!isNonEmptyString(fileData, 7 * 1024 * 1024) || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType)) {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    // Split base64 prefix if exists
    const base64Part = fileData.includes(',') ? fileData.split(',')[1] : fileData;

    const prompt = `Analise a imagem anexada que representa um laudo ou tela de exame de Bioimpedância (BIA) (Ex: InBody, Tanita, etc.).
Extraia os dados de composição corporal presentes na imagem e mapeie para os campos correspondentes do JSON abaixo.
Se algum valor não for encontrado ou não estiver na imagem, retorne null para ele.
Extraia apenas o que você puder ler de forma confiável na imagem.

Campos esperados:
- weight_kg: Peso total em kg (número)
- body_fat_pct: Percentual de gordura corporal (%) (número)
- fat_mass_kg: Massa de gordura/massa gorda em kg (número)
- lean_mass_kg: Massa magra/isenta de gordura total em kg (número)
- muscle_mass_kg: Massa muscular/esquelética em kg (número)
- total_body_water_pct: Percentual ou quantidade de água corporal total (se for em Litros, tente converter para percentual baseado no peso, senão forneça o valor legível em % se houver) (número)
- icw_l: Água intracelular em litros (número)
- ecw_l: Água extracelular em litros (número)
- bmr_kcal: Taxa Metabólica Basal / TMB em kcal (inteiro)
- visceral_fat_level: Nível de gordura visceral (inteiro)
- bone_mass_kg: Massa óssea/mineral em kg (número)
- phase_angle: Ângulo de fase em graus (número)
- device: Nome ou marca do equipamento legível na imagem (InBody 270, Tanita, etc.) (string)
- notes: Uma breve observação ou resumo explicativo sobre os dados identificados neste exame (string)`;

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
            weight_kg: { type: "NUMBER" },
            body_fat_pct: { type: "NUMBER" },
            fat_mass_kg: { type: "NUMBER" },
            lean_mass_kg: { type: "NUMBER" },
            muscle_mass_kg: { type: "NUMBER" },
            total_body_water_pct: { type: "NUMBER" },
            icw_l: { type: "NUMBER" },
            ecw_l: { type: "NUMBER" },
            bmr_kcal: { type: "INTEGER" },
            visceral_fat_level: { type: "INTEGER" },
            bone_mass_kg: { type: "NUMBER" },
            phase_angle: { type: "NUMBER" },
            device: { type: "STRING" },
            notes: { type: "STRING" }
          }
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
    console.error('Erro na análise de BIA:', error);
    return NextResponse.json({ error: 'Erro interno ao analisar a bioimpedância.' }, { status: 500 });
  }
}
