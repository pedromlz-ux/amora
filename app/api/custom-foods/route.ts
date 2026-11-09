import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar service_role key em API routes para garantir acesso caso precise, ou verificar token.
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { description, energy_kcal, carbohydrate_g, protein_g, lipid_g } = body;

    if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

    const { data, error } = await supabase.from('custom_foods').insert({
      user_id: user.id,
      description,
      energy_kcal: energy_kcal || 0,
      carbohydrate_g: carbohydrate_g || 0,
      protein_g: protein_g || 0,
      lipid_g: lipid_g || 0
    }).select().single();

    if (error) {
      console.error('Error saving custom food:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    let dbQuery = supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (query.length >= 2) {
      dbQuery = dbQuery.ilike('description', `%${query}%`);
    }

    const { data, error } = await dbQuery.limit(50);

    if (error) {
      console.error('Error fetching custom foods:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
