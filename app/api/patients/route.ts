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

// GET /api/patients — list all patients for the logged-in nutritionist
export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('nutritionist_id', user.id)
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/patients — create a new patient
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dados do paciente inválidos' }, { status: 400 });
  }

  const { name, email, phone, birth_date, gender, objective, substitution_score } = body;

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }

  const patient = {
    nutritionist_id: user.id,
    name: name.trim(),
    email: typeof email === 'string' ? email.trim() || null : null,
    phone: typeof phone === 'string' ? phone.trim() || null : null,
    birth_date: typeof birth_date === 'string' && birth_date ? birth_date : null,
    gender: typeof gender === 'string' ? gender || null : null,
    objective: typeof objective === 'string' ? objective.trim() || null : null,
  };

  const score = typeof substitution_score === 'number'
    && Number.isInteger(substitution_score)
    && [60, 70, 80, 90].includes(substitution_score)
    ? substitution_score
    : 70;

  let { data, error } = await supabase
    .from('patients')
    .insert({ ...patient, substitution_score: score })
    .select()
    .single();

  // Sites ainda não migrados não têm a coluna. O cadastro continua funcionando
  // com o padrão de 70 até que a migration seja aplicada no banco.
  if (error && /substitution_score/i.test(error.message || '')) {
    ({ data, error } = await supabase
      .from('patients')
      .insert(patient)
      .select()
      .single());
  }

  if (error) {
    console.error('Unable to create patient', error);
    return NextResponse.json({ error: 'Não foi possível cadastrar o paciente. Tente novamente.' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
