import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Increase max duration for Vercel
export const maxDuration = 300; 

export async function POST(req: Request) {
  try {
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
    if (!fileData) {
      return NextResponse.json({ error: "Dados de áudio ausentes." }, { status: 400 });
    }

    // Split base64 prefix se existir
    const base64Part = fileData.includes(',') ? fileData.split(',')[1] : fileData;

    const prompt = `Ouça com atenção o áudio desta consulta médica/nutricional. 
Por favor, transcreva o áudio de forma fiel e completa, diferenciando quem está falando. 
Use a marcação "Nutricionista:" para a voz do profissional que conduz a consulta e "Paciente:" para quem está respondendo.
Não resuma, apenas transcreva o diálogo.`;

    // Para áudios curtos, inlineData funciona bem. 
    // Para áudios longos, o ideal seria usar o File API do Gemini (ai.files.upload), 
    // mas o inlineData suporta arquivos pequenos/médios em base64.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: fileType || 'audio/webm',
            data: base64Part
          }
        },
        prompt
      ]
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    return NextResponse.json({ transcription: responseText });

  } catch (error: any) {
    console.error('Erro na transcrição de áudio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
