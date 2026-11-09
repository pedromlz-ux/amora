import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser(req: Request) {
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

// GET /api/patients/[id]
export async function GET(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('nutritionist_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/patients/[id]
export async function PATCH(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json();
  const allowedFields = ['name', 'email', 'phone', 'birth_date', 'gender', 'objective', 'substitution_score'];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualização.' }, { status: 400 });
  }
  if (typeof updates.name === 'string') updates.name = updates.name.trim();
  if (updates.name === '') return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const { data, error } = await supabase
    .from('patients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('nutritionist_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/patients/[id]
export async function DELETE(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)
    .eq('nutritionist_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
