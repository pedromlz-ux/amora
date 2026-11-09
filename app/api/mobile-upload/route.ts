import { NextResponse } from 'next/server';
import { getServiceSupabase, isNonEmptyString, requestIsTooLarge } from '../../lib/server/security';

const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
};

function normalizeAudioMimeType(value: unknown) {
  const mimeType = typeof value === 'string' ? value.split(';')[0].toLowerCase() : '';
  return AUDIO_EXTENSIONS[mimeType] ? mimeType : null;
}

export async function POST(req: Request) {
  try {
    if (requestIsTooLarge(req, 12 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Áudio excede o limite de 12 MB.' }, { status: 413 });
    }

    const { sessionId, audioData, audioMimeType } = await req.json();
    const mimeType = normalizeAudioMimeType(audioMimeType);
    if (!isNonEmptyString(sessionId, 64) || !isNonEmptyString(audioData, 11 * 1024 * 1024) || !mimeType) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify if session exists
    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select('id')
      .eq('session_token', sessionId)
      .gt('session_expires_at', new Date().toISOString())
      .eq('status', 'in_progress')
      .single();
      
    if (fetchError || !consultation) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 404 });
    }

    const base64Part = audioData.includes(',') ? audioData.split(',')[1] : audioData;
    const buffer = Buffer.from(base64Part, 'base64');
    if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Áudio inválido ou muito grande.' }, { status: 400 });
    }
    const fileName = `${consultation.id}/mobile_backup_${Date.now()}.${AUDIO_EXTENSIONS[mimeType]}`;

    const { data, error } = await supabase.storage
      .from('consultations')
      .upload(fileName, buffer, { contentType: mimeType, upsert: true });

    if (error) {
      throw error;
    }

    // Update consultation_records with the uploaded URL
    const { error: recordError } = await supabase
      .from('consultation_records')
      .upsert({
        consultation_id: consultation.id,
        audio_mobile_url: fileName
      }, { onConflict: 'consultation_id' });

    if (recordError) throw recordError;

    return NextResponse.json({ success: true, fileName });
  } catch (error: any) {
    console.error('Erro no upload mobile:', error);
    return NextResponse.json({ error: 'Erro interno no upload do áudio.' }, { status: 500 });
  }
}
