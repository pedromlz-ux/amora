import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service role key to bypass client RLS

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
      .select('patient_chat')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar chat da dieta:', error);
      return NextResponse.json({ error: 'Plano de dieta não encontrado' }, { status: 404 });
    }

    return NextResponse.json(data.patient_chat || []);
  } catch (err: any) {
    console.error('Erro no GET chat:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: any }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const { message } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    if (!message || !message.content) {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    // 1. Fetch current chat history
    const { data, error: fetchError } = await supabase
      .from('diet_plans')
      .select('patient_chat')
      .eq('id', id)
      .single();

    if (fetchError || !data) {
      console.error('Erro ao buscar chat para atualização:', fetchError);
      return NextResponse.json({ error: 'Plano de dieta não encontrado' }, { status: 404 });
    }

    const chatHistory = data.patient_chat || [];
    
    // 2. Append new message
    const formattedMessage = {
      role: message.role, // 'user' (patient) or 'nutri' (professional)
      content: message.content,
      time: message.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedChat = [...chatHistory, formattedMessage];

    // 3. Update database
    const { error: updateError } = await supabase
      .from('diet_plans')
      .update({ patient_chat: updatedChat })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updatedChat);
  } catch (err: any) {
    console.error('Erro no POST chat:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
