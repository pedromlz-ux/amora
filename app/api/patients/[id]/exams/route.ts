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

// GET — list all exams for a patient
export async function GET(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;

  const { data, error } = await supabase
    .from('patient_exams')
    .select('*')
    .eq('patient_id', id)
    .eq('nutritionist_id', user.id)
    .order('exam_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — save exam metadata after uploading file to Storage
export async function POST(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json();
  const { file_name, file_url, exam_date, exam_type, notes } = body;

  if (!file_name || !file_url) {
    return NextResponse.json({ error: 'file_name e file_url são obrigatórios' }, { status: 400 });
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', id)
    .eq('nutritionist_id', user.id)
    .maybeSingle();
  if (!patient) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });

  const { data, error } = await supabase
    .from('patient_exams')
    .insert({ patient_id: id, nutritionist_id: user.id, file_name, file_url, exam_date, exam_type, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — remove exam record and optionally the file from storage
export async function DELETE(req: Request, context: { params: any }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');

  if (!examId) return NextResponse.json({ error: 'examId obrigatório' }, { status: 400 });

  // Get file path to delete from storage
  const { data: exam } = await supabase
    .from('patient_exams')
    .select('file_url')
    .eq('id', examId)
    .eq('nutritionist_id', user.id)
    .single();

  if (exam?.file_url) {
    // Extract path from URL for storage deletion
    const path = exam.file_url.split('/patient-exams/')[1];
    if (path) await supabase.storage.from('patient-exams').remove([path]);
  }

  const { error } = await supabase
    .from('patient_exams')
    .delete()
    .eq('id', examId)
    .eq('nutritionist_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
