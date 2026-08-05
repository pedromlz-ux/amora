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

// GET — list all anthropometry records for a patient
export async function GET(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;

  const { data, error } = await supabase
    .from('patient_anthropometry')
    .select('*')
    .eq('patient_id', id)
    .eq('nutritionist_id', user.id)
    .order('assessment_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — save a new anthropometry assessment
export async function POST(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json();

  // Auto-calculate IMC if weight and height provided
  let imc = body.imc;
  if (!imc && body.weight_kg && body.height_cm) {
    const h = body.height_cm / 100;
    imc = parseFloat((body.weight_kg / (h * h)).toFixed(2));
  }

  const { data, error } = await supabase
    .from('patient_anthropometry')
    .insert({ ...body, imc, patient_id: id, nutritionist_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
