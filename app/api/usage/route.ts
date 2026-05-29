import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role for querying user_usage bypassing RLS, since we verify the token manually

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const { data: usageData } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const plan = usageData?.plan || 'free';
    const count = usageData?.questions_count || 0;
    
    let limit = 30;
    if (plan === 'ultra') limit = 200;
    else if (plan === 'premium') limit = 300;

    const percentage = Math.min(100, Math.round((count / limit) * 100));

    return NextResponse.json({
      plan: plan,
      questions_count: count,
      limit: limit,
      percentage: percentage
    });

  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
