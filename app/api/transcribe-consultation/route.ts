import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  getAuthenticatedUser,
  getServiceSupabase,
  isNonEmptyString,
  requestIsTooLarge,
} from '../../lib/server/security';

const geminiApiKey = process.env.GEMINI_API_KEY!;

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Increase max duration for Vercel
export const maxDuration = 300; 

const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
]);

function normalizeAudioMimeType(value: unknown) {
  const mimeType = typeof value === 'string' ? value.split(';')[0].toLowerCase() : '';
  return SUPPORTED_AUDIO_MIME_TYPES.has(mimeType) ? mimeType : null;
}

function getStoredAudioMimeType(path: string, blobType?: string) {
  const blobMimeType = normalizeAudioMimeType(blobType);
  if (blobMimeType) return blobMimeType;
  if (/\.(m4a|mp4)$/i.test(path)) return 'audio/mp4';
  if (/\.mp3$/i.test(path)) return 'audio/mpeg';
  if (/\.wav$/i.test(path)) return 'audio/wav';
  if (/\.ogg$/i.test(path)) return 'audio/ogg';
  return 'audio/webm';
}

export async function POST(req: Request) {
  try {
    if (requestIsTooLarge(req, 12 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Áudio excede o limite de 12 MB.' }, { status: 413 });
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { fileData, fileType, consultationId } = await req.json();
    const normalizedFileType = normalizeAudioMimeType(fileType);
    if (!isNonEmptyString(fileData, 11 * 1024 * 1024) || !normalizedFileType) {
      return NextResponse.json({ error: "Dados de áudio ausentes." }, { status: 400 });
    }

    // Split base64 prefix se existir
    const base64Part = fileData.includes(',') ? fileData.split(',')[1] : fileData;

    let parts = [
      {
        inlineData: {
          mimeType: normalizedFileType,
          data: base64Part
        }
      }
    ];

    if (consultationId) {
      const supabase = getServiceSupabase();
      const { data: consultation } = await supabase
        .from('consultations')
        .select('id')
        .eq('id', consultationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!consultation) {
        return NextResponse.json({ error: 'Consulta não encontrada.' }, { status: 404 });
      }

      const { data: consultationRecord } = await supabase
        .from('consultation_records')
        .select('audio_mobile_url')
        .eq('consultation_id', consultationId)
        .single();

      if (consultationRecord && consultationRecord.audio_mobile_url) {
        const { data: fileBlob } = await supabase.storage
          .from('consultations')
          .download(consultationRecord.audio_mobile_url);
        
        if (fileBlob) {
          const arrayBuffer = await fileBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          parts.push({
            inlineData: {
              mimeType: getStoredAudioMimeType(consultationRecord.audio_mobile_url, fileBlob.type),
              data: buffer.toString('base64')
            }
          });
        }
      }
    }

    const prompt = `Ouça com atenção os áudios desta consulta médica/nutricional. 
Você pode estar recebendo até dois arquivos de áudio (um gravado do computador e outro do celular como backup). 
Eles contêm a mesma conversa. Use ambos para ter a melhor qualidade possível.
Por favor, transcreva a conversa de forma fiel e completa, diferenciando quem está falando. 
Use a marcação "Nutricionista:" para a voz do profissional que conduz a consulta e "Paciente:" para quem está respondendo.
Não resuma, apenas transcreva o diálogo.`;

    parts.push(prompt as any);

    // Para áudios curtos, inlineData funciona bem. 
    // Para áudios longos, o ideal seria usar o File API do Gemini (ai.files.upload), 
    // mas o inlineData suporta arquivos pequenos/médios em base64.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    return NextResponse.json({ transcription: responseText });

  } catch (error: any) {
    console.error('Erro na transcrição de áudio:', error);
    return NextResponse.json({ error: 'Erro interno ao transcrever o áudio.' }, { status: 500 });
  }
}
