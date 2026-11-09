import { NextResponse } from 'next/server';

import {
  getAuthenticatedUser,
  getPatientAccessToken,
  getServiceSupabase,
} from '../../../lib/server/security';

const PATIENT_PLAN_COLUMNS = `
  id, plan_name, patient_name, diet_notes, meals, macros, substitution_score,
  patients(substitution_score)
`;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = getServiceSupabase();
    const user = await getAuthenticatedUser(request);

    let query = supabase.from('diet_plans').select(PATIENT_PLAN_COLUMNS).eq('id', id);
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      const accessToken = getPatientAccessToken(request);
      if (!accessToken) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      query = query
        .eq('patient_access_token', accessToken)
        .gt('patient_access_expires_at', new Date().toISOString());
    }

    const { data, error } = await query.single();
    if (error || !data) return NextResponse.json({ error: 'Plano de dieta não encontrado' }, { status: 404 });

    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Erro ao buscar plano de dieta:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar plano.' }, { status: 500 });
  }
}
