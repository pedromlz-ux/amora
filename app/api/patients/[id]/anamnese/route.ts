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

// GET /api/patients/[id]/anamnese
export async function GET(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;

  const { data, error } = await supabase
    .from('patient_anamnese')
    .select('*')
    .eq('patient_id', id)
    .eq('nutritionist_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || {});
}

// POST /api/patients/[id]/anamnese — upsert
export async function POST(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json();

  // Check if anamnese already exists
  const { data: existing } = await supabase
    .from('patient_anamnese')
    .select('id')
    .eq('patient_id', id)
    .eq('nutritionist_id', user.id)
    .maybeSingle();

  let result;
  if (existing?.id) {
    result = await supabase
      .from('patient_anamnese')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('patient_anamnese')
      .insert({ ...body, patient_id: id, nutritionist_id: user.id })
      .select()
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data);
}
