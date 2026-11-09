import { NextResponse } from 'next/server';

import {
  getAuthenticatedUser,
  getPatientAccessToken,
  getServiceSupabase,
  isNonEmptyString,
  requestIsTooLarge,
} from '../../../../lib/server/security';

type Access = { planId: string; role: 'nutri' | 'user' } | null;

async function getPlanAccess(request: Request, id: string): Promise<Access> {
  const supabase = getServiceSupabase();
  const user = await getAuthenticatedUser(request);

  if (user) {
    const { data } = await supabase
      .from('diet_plans')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    return data ? { planId: data.id, role: 'nutri' } : null;
  }

  const accessToken = getPatientAccessToken(request);
  if (!accessToken) return null;
  const { data } = await supabase
    .from('diet_plans')
    .select('id')
    .eq('id', id)
    .eq('patient_access_token', accessToken)
    .gt('patient_access_expires_at', new Date().toISOString())
    .maybeSingle();
  return data ? { planId: data.id, role: 'user' } : null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const access = await getPlanAccess(request, id);
    if (!access) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data, error } = await getServiceSupabase()
      .from('diet_plans')
      .select('patient_chat')
      .eq('id', access.planId)
      .single();
    if (error || !data) return NextResponse.json({ error: 'Plano de dieta não encontrado' }, { status: 404 });

    return NextResponse.json(data.patient_chat || [], { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Erro ao buscar chat do plano:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar mensagens.' }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (requestIsTooLarge(request, 32 * 1024)) {
      return NextResponse.json({ error: 'Mensagem excede o limite permitido.' }, { status: 413 });
    }

    const { id } = await context.params;
    const access = await getPlanAccess(request, id);
    if (!access) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    if (!isNonEmptyString(body?.message?.content, 2_000)) {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 });
    }

    const message = {
      role: access.role,
      content: body.message.content.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    const { data, error } = await getServiceSupabase().rpc('append_diet_plan_chat', {
      p_plan_id: access.planId,
      p_message: message,
    });
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro ao enviar mensagem do plano:', error);
    return NextResponse.json({ error: 'Erro interno ao enviar mensagem.' }, { status: 500 });
  }
}
