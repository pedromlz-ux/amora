import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  context: { params: any }
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar plano de dieta:', error);
      return NextResponse.json({ error: 'Plano de dieta não encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Erro no endpoint de buscar plano:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
