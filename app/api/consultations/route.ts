import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getServiceSupabase, requestIsTooLarge } from '../../lib/server/security';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    if (requestIsTooLarge(request, 16 * 1024)) {
      return NextResponse.json({ error: 'Solicitação excede o limite permitido.' }, { status: 413 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    const { patientId } = await request.json();
    if (typeof patientId !== 'string' || !UUID_PATTERN.test(patientId)) {
      return NextResponse.json({ error: 'Paciente inválido.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('nutritionist_id', user.id)
      .maybeSingle();
    if (patientError) throw patientError;
    if (!patient) return NextResponse.json({ error: 'Paciente não encontrado.' }, { status: 404 });

    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({ patient_id: patient.id, user_id: user.id })
      .select('id, created_at')
      .single();
    if (consultationError) throw consultationError;

    return NextResponse.json({ consultation }, { status: 201 });
  } catch (error) {
    console.error('Unable to create consultation', error);
    return NextResponse.json({ error: 'Não foi possível iniciar a consulta. Tente novamente.' }, { status: 500 });
  }
}
