import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey); // Service role allows bypass RLS for this upload

export async function POST(req: Request) {
  try {
    const { sessionId, audioData } = await req.json();
    if (!sessionId || !audioData) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // Verify if session exists
    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select('id')
      .eq('session_token', sessionId)
      .single();
      
    if (fetchError || !consultation) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 404 });
    }

    const base64Part = audioData.includes(',') ? audioData.split(',')[1] : audioData;
    const buffer = Buffer.from(base64Part, 'base64');
    const fileName = `${consultation.id}/mobile_backup_${Date.now()}.webm`;

    const { data, error } = await supabase.storage
      .from('consultations')
      .upload(fileName, buffer, { contentType: 'audio/webm', upsert: true });

    if (error) {
      throw error;
    }

    // Update consultation_records with the uploaded URL
    const { data: recordData, error: recordError } = await supabase
      .from('consultation_records')
      .upsert({
        consultation_id: consultation.id,
        audio_mobile_url: fileName
      }, { onConflict: 'consultation_id' });

    return NextResponse.json({ success: true, fileName });
  } catch (error: any) {
    console.error('Erro no upload mobile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
